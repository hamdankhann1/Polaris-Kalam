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
    return { db: null, error: 'No MongoDB URI configured.', config };
  }

  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return { db: cachedDb, error: null, config };
    } catch (e) {
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(config.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      authSource: 'admin'
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'polaris_hotel');
    cachedClient = client;
    cachedDb = db;
    lastDbError = null;
    return { db, error: null, config };
  } catch (err) {
    console.error('MongoDB connection error in /api/categories:', err);
    lastDbError = err.message;
    return { db: null, error: err.message, config };
  }
}

export default async function handler(req, res) {
  // CORS & Strict Real-Time No-Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db, error: dbError, config: mongoConfig } = await getDatabase();
    const categoriesCol = db ? db.collection('categories') : null;
    const roomsCol = db ? db.collection('rooms') : null;

    // -----------------------------------------------------------------------
    // GET: Fetch all custom categories
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (categoriesCol) {
        let storedCategories = await categoriesCol.find({}).sort({ name: 1 }).toArray();

        // Auto-discover any categories already existing on room documents
        if (roomsCol) {
          try {
            const roomCategories = await roomsCol.distinct('category');
            const roomFloors = await roomsCol.distinct('floor');
            const candidateNames = Array.from(new Set([...roomCategories, ...roomFloors]))
              .filter((n) => typeof n === 'string' && n.trim().length > 0);

            const existingNamesLower = new Set(storedCategories.map((c) => c.name.toLowerCase()));
            const toInsert = [];

            for (const name of candidateNames) {
              const trimmed = name.trim();
              if (!existingNamesLower.has(trimmed.toLowerCase())) {
                const newCat = {
                  id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  name: trimmed,
                  createdAt: new Date().toISOString()
                };
                toInsert.push(newCat);
                existingNamesLower.add(trimmed.toLowerCase());
              }
            }

            if (toInsert.length > 0) {
              await categoriesCol.insertMany(toInsert);
              storedCategories = await categoriesCol.find({}).sort({ name: 1 }).toArray();
            }
          } catch (discoverErr) {
            console.warn('Auto-discover categories error:', discoverErr.message);
          }
        }

        const sanitized = storedCategories.map(({ _id, ...rest }) => rest);
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
    // POST: Create a new custom category
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const rawName = body?.name;

      if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
      }

      const name = rawName.trim();
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
    // DELETE: Delete a custom category
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = body?.id || req.query?.id;
      const name = body?.name || req.query?.name;

      if (!id && !name) {
        return res.status(400).json({ success: false, error: 'Category ID or Name required for deletion.' });
      }

      const filter = {};
      if (id) filter.id = id;
      if (name) filter.name = { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

      if (categoriesCol) {
        const result = await categoriesCol.deleteOne(filter);
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
