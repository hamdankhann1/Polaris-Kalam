/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/categories
 * =========================================================================
 * 
 * Manages custom hotel room categories (e.g. 'Executive Suite', 'Deluxe Mountain View').
 * Persisted in MongoDB Atlas collection 'categories' with in-memory fallback.
 * Allows the hotel admin to create, list, and delete custom categories dynamically.
 */

import { MongoClient } from 'mongodb';
import {
  isStaffAuthorized,
  sanitizeInput,
  checkRateLimit,
  applySecurityHeaders
} from './_security.js';

let cachedClient = null;
let cachedDb = null;
let lastDbError = null;

// Fallback in-memory categories when MongoDB is not yet connected
let fallbackCategories = [];

function sanitizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return null;
  const uriMatch = rawUri.trim().match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/);
  let uri = uriMatch ? uriMatch[1] : rawUri.trim().replace(/^["']|["']$/g, '');

  // Strip accidental template angle brackets e.g. <username>:<password>
  uri = uri.replace(/^(mongodb(?:\+srv)?:\/\/)([^@]+)@/i, (match, proto, creds) => {
    const colonIdx = creds.indexOf(':');
    if (colonIdx === -1) return match;
    let user = creds.slice(0, colonIdx).replace(/^<|>$/g, '');
    let pass = creds.slice(colonIdx + 1).replace(/^<|>$/g, '');
    return `${proto}${user}:${pass}@`;
  });

  return uri;
}

export function getMongoConfig() {
  const candidates = [
    { name: 'MONGODB_URI', val: process.env.MONGODB_URI },
    { name: 'MONGO_URI', val: process.env.MONGO_URI },
    { name: 'MONGODB_URL', val: process.env.MONGODB_URL },
    { name: 'MONGO_URL', val: process.env.MONGO_URL },
    { name: 'DATABASE_URL', val: process.env.DATABASE_URL },
    { name: 'DATABASE_URI', val: process.env.DATABASE_URI },
    { name: 'MONGODB_CONNECTION_STRING', val: process.env.MONGODB_CONNECTION_STRING },
    { name: 'MONGODB_ATLAS_URI', val: process.env.MONGODB_ATLAS_URI },
    { name: 'VITE_MONGODB_URI', val: process.env.VITE_MONGODB_URI },
    { name: 'VITE_MONGO_URI', val: process.env.VITE_MONGO_URI }
  ];

  for (const c of candidates) {
    if (c.val && typeof c.val === 'string' && c.val.trim().length > 0) {
      const cleanUri = sanitizeMongoUri(c.val);
      return { uri: cleanUri, keyName: c.name, hasEnv: true };
    }
  }

  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === 'string' && (val.includes('mongodb+srv://') || val.includes('mongodb://'))) {
      const cleanUri = sanitizeMongoUri(val);
      if (cleanUri) {
        return { uri: cleanUri, keyName: key, hasEnv: true };
      }
    }
  }

  return { uri: null, keyName: null, hasEnv: false };
}

async function getDatabase() {
  const config = getMongoConfig();
  if (!config.hasEnv || !config.uri) {
    const hintMsg = config.hint ? ` (${config.hint})` : '';
    return { db: null, error: `No MongoDB URI found in environment variables${hintMsg}. Please add MONGODB_URI in Vercel.`, config };
  }

  // Reuse global singleton client promise if already connecting or connected
  if (global._mongoClientPromise) {
    try {
      const client = await global._mongoClientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME || 'polaris_hotel');
      return { db, error: null, config };
    } catch (e) {
      global._mongoClientPromise = null;
    }
  }

  try {
    const client = new MongoClient(config.uri, {
      maxPoolSize: 1, // Crucial for Serverless: exactly 1 socket per lambda instance
      minPoolSize: 0, // Drop connections when idle
      maxIdleTimeMS: 5000, // Close idle socket after 5s of inactivity
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      authSource: 'admin',
      retryWrites: true,
      retryReads: true
    });

    global._mongoClientPromise = client.connect().catch((connectErr) => {
      global._mongoClientPromise = null;
      throw connectErr;
    });

    const clientInst = await global._mongoClientPromise;
    const db = clientInst.db(process.env.MONGODB_DB_NAME || 'polaris_hotel');
    return { db, error: null, config };
  } catch (err) {
    global._mongoClientPromise = null;
    console.error('MongoDB connection error in /api/categories:', err);
    return { db: null, error: err.message, config };
  }
}

export default async function handler(req, res) {
  // Apply modern security headers
  applySecurityHeaders(res);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-staff-token, x-admin-hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting (150 requests per minute per IP)
  const rateCheck = checkRateLimit(req, 'categories_api', 150, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many requests to categories service. Retry in ${rateCheck.retryAfter} seconds.`
    });
  }

  const isStaff = isStaffAuthorized(req);

  try {
    const { db, error: dbError, config: mongoConfig } = await getDatabase();
    const categoriesCol = db ? db.collection('categories') : null;
    const roomsCol = db ? db.collection('rooms') : null;

    // Database index optimization - run once per serverless process lifecycle
    if (categoriesCol && !global._categoriesDbInitialized) {
      try {
        categoriesCol.createIndex({ id: 1 }, { unique: true }).catch(() => {});
        categoriesCol.createIndex({ name: 1 }).catch(() => {});
        global._categoriesDbInitialized = true;
      } catch (e) {}
    }

    // -----------------------------------------------------------------------
    // GET: Fetch all custom categories
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (categoriesCol) {
        const now = Date.now();

        // Micro-cache (3 seconds) to absorb concurrent traffic spikes
        if (global._cachedCategoriesData && (now - (global._cachedCategoriesTime || 0) < 3000)) {
          return res.status(200).json({
            success: true,
            data: global._cachedCategoriesData,
            source: 'mongodb-cache',
            dbConnected: true,
            envDetected: !!mongoConfig?.hasEnv
          });
        }

        let storedCategories = await categoriesCol.find({}).sort({ name: 1 }).toArray();

        // Initial one-time seeding only if collection is completely empty
        if (storedCategories.length === 0 && roomsCol) {
          try {
            const roomCategories = await roomsCol.distinct('category');
            const candidateNames = roomCategories
              .filter((n) => typeof n === 'string' && n.trim().length > 0 && !n.toLowerCase().startsWith('floor'));

            const toInsert = candidateNames.map((name) => ({
              id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              name: name.trim(),
              createdAt: new Date().toISOString()
            }));

            if (toInsert.length > 0) {
              await categoriesCol.insertMany(toInsert);
              storedCategories = await categoriesCol.find({}).sort({ name: 1 }).toArray();
            }
          } catch (discoverErr) {
            console.warn('Initial categories seed error:', discoverErr.message);
          }
        }

        const sanitized = storedCategories.map(({ _id, ...rest }) => rest);
        global._cachedCategoriesData = sanitized;
        global._cachedCategoriesTime = now;

        return res.status(200).json({
          success: true,
          data: sanitized,
          source: 'mongodb',
          dbConnected: true,
          envDetected: !!mongoConfig?.hasEnv
        });
      }

      // Memory Fallback
      return res.status(200).json({
        success: true,
        data: fallbackCategories,
        source: 'memory',
        dbConnected: false,
        envDetected: !!mongoConfig?.hasEnv,
        dbError: dbError || lastDbError
      });
    }

    // -----------------------------------------------------------------------
    // POST: Create a new custom category (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to create categories.'
        });
      }

      global._cachedCategoriesData = null;
      global._cachedCategoriesTime = 0;

      let rawBody = req.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON request format.' });
        }
      }
      const body = sanitizeInput(rawBody || {});
      const rawName = body?.name;

      if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
      }

      const name = rawName.trim().substring(0, 100);
      const description = typeof body.description === 'string' ? body.description.trim() : '';

      if (categoriesCol) {
        // Check if category already exists (case-insensitive)
        const existing = await categoriesCol.findOne({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (existing) {
          const { _id, ...rest } = existing;
          return res.status(200).json({
            success: true,
            data: rest,
            message: 'Category already exists.',
            source: 'mongodb',
            dbConnected: true
          });
        }

        const newCategory = {
          id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name,
          description,
          createdAt: new Date().toISOString()
        };

        await categoriesCol.insertOne({ ...newCategory });
        return res.status(201).json({
          success: true,
          data: newCategory,
          source: 'mongodb',
          dbConnected: true
        });
      }

      // Fallback
      const existingFallback = fallbackCategories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (existingFallback) {
        return res.status(200).json({
          success: true,
          data: existingFallback,
          message: 'Category already exists.',
          source: 'memory',
          dbConnected: false
        });
      }

      const newCategory = {
        id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name,
        description,
        createdAt: new Date().toISOString()
      };
      fallbackCategories.push(newCategory);

      return res.status(201).json({
        success: true,
        data: newCategory,
        source: 'memory',
        dbConnected: false
      });
    }

    // -----------------------------------------------------------------------
    // PUT: Rename / Update a custom category (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to update categories.'
        });
      }

      global._cachedCategoriesData = null;
      global._cachedCategoriesTime = 0;
      global._cachedRoomsData = null;
      global._cachedRoomsTime = 0;

      let rawBody = req.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON request format.' });
        }
      }
      const body = sanitizeInput(rawBody || {});
      const id = typeof body?.id === 'string' ? body.id : null;
      const oldName = typeof (body?.oldName || body?.name) === 'string' ? (body.oldName || body.name) : null;
      const newName = typeof body?.newName === 'string' ? body.newName : null;
      const description = typeof body?.description === 'string' ? body.description : undefined;

      if (!newName || !newName.trim()) {
        return res.status(400).json({ success: false, error: 'New category name is required.' });
      }

      const trimmedNew = newName.trim().substring(0, 100);
      const filter = {};
      if (id) filter.id = id;
      else if (oldName) filter.name = { $regex: new RegExp(`^${oldName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      else {
        return res.status(400).json({ success: false, error: 'Category ID or Old Name required.' });
      }

      if (categoriesCol) {
        const existing = await categoriesCol.findOne(filter);
        const prevName = existing?.name || oldName;

        await categoriesCol.updateOne(filter, {
          $set: {
            name: trimmedNew,
            ...(description !== undefined ? { description: description.trim().substring(0, 500) } : {}),
            updatedAt: new Date().toISOString()
          }
        });

        // Cascade rename to all rooms using this category!
        if (roomsCol && prevName) {
          const prevRegex = new RegExp(`^${prevName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          await roomsCol.updateMany(
            { category: { $regex: prevRegex } },
            { $set: { category: trimmedNew, tier: trimmedNew, updatedAt: new Date().toISOString() } }
          );
        }

        const updated = await categoriesCol.findOne({ name: trimmedNew });
        const sanitized = updated ? (({ _id, ...rest }) => rest)(updated) : { id, name: trimmedNew };
        return res.status(200).json({
          success: true,
          data: sanitized,
          source: 'mongodb',
          dbConnected: true
        });
      }

      // In-Memory Fallback
      const idx = fallbackCategories.findIndex((c) => {
        if (id && c.id === id) return true;
        if (oldName && c.name.toLowerCase() === oldName.trim().toLowerCase()) return true;
        return false;
      });

      if (idx !== -1) {
        fallbackCategories[idx].name = trimmedNew;
        if (description !== undefined) fallbackCategories[idx].description = description.trim();
        return res.status(200).json({
          success: true,
          data: fallbackCategories[idx],
          source: 'memory',
          dbConnected: false
        });
      }

      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    // -----------------------------------------------------------------------
    // DELETE: Delete a custom category (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to delete categories.'
        });
      }

      global._cachedCategoriesData = null;
      global._cachedCategoriesTime = 0;
      global._cachedRoomsData = null;
      global._cachedRoomsTime = 0;

      let rawBody = req.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch (e) {
          rawBody = {};
        }
      }
      const body = sanitizeInput(rawBody || {});
      const id = typeof body?.id === 'string' ? body.id : (typeof req.query?.id === 'string' ? req.query.id : null);
      const name = typeof body?.name === 'string' ? body.name : (typeof req.query?.name === 'string' ? req.query.name : null);

      if (!id && !name) {
        return res.status(400).json({ success: false, error: 'Category ID or Name required for deletion.' });
      }

      const filter = {};
      if (id) filter.id = id;
      if (name) filter.name = { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

      if (categoriesCol) {
        const catToDelete = await categoriesCol.findOne(filter);
        const delName = catToDelete?.name || name;

        const result = await categoriesCol.deleteOne(filter);

        // Also clean up any rooms that had this category name
        if (roomsCol && delName) {
          const regex = new RegExp(`^${delName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          await roomsCol.updateMany(
            { category: { $regex: regex } },
            { $set: { category: '', updatedAt: new Date().toISOString() } }
          );
        }

        return res.status(200).json({
          success: true,
          deletedCount: result.deletedCount,
          source: 'mongodb',
          dbConnected: true
        });
      }

      fallbackCategories = fallbackCategories.filter((c) => {
        if (id && c.id === id) return false;
        if (name && c.name.toLowerCase() === name.trim().toLowerCase()) return false;
        return true;
      });

      return res.status(200).json({
        success: true,
        source: 'memory',
        dbConnected: false
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in /api/categories:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
