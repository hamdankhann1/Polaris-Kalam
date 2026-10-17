/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/bookings
 * =========================================================================
 * 
 * Provides cloud database persistence for guest booking requests submitted
 * from polarishotels.pk/booking or the secret admin CMS.
 * 
 * Supports:
 * - MongoDB Atlas (when MONGODB_URI environment variable is provided)
 * - In-memory / serverless fallback (when MONGODB_URI is not yet configured)
 */

import { MongoClient } from 'mongodb';
import {
  isStaffAuthorized,
  redactBookingPII,
  sanitizeInput,
  checkRateLimit,
  applySecurityHeaders
} from './_security.js';

let cachedClient = null;
let cachedDb = null;
let lastDbError = null;

// Initial seed requests (Empty - production database starts clean)
const INITIAL_REQUESTS = [];
const DEMO_REQUEST_IDS = ['req-101', 'req-102'];

// Fallback in-memory storage for serverless runtime
let fallbackBookings = [];

function getPakistanYMD(d = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(d);
  } catch (e) {
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

function addDaysYMD(ymdStr, days = 1) {
  const match = (ymdStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return getPakistanYMD();
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const utc = new Date(Date.UTC(y, m, day + days));
  const pad = (n) => String(n).padStart(2, '0');
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
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

  // 1. Check known candidate keys
  for (const c of candidates) {
    if (c.val && typeof c.val === 'string' && c.val.trim().length > 0) {
      const cleanUri = sanitizeMongoUri(c.val);
      return { uri: cleanUri, keyName: c.name, hasEnv: true };
    }
  }

  // 2. Scan entire process.env for any variable containing a mongodb connection string
  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === 'string' && (val.includes('mongodb+srv://') || val.includes('mongodb://'))) {
      const cleanUri = sanitizeMongoUri(val);
      if (cleanUri) {
        return { uri: cleanUri, keyName: key, hasEnv: true };
      }
    }
  }

  // Collect any similar keys found in process.env for diagnostic hints
  const similarKeys = Object.keys(process.env).filter(
    (k) => /mongo|database|db_url/i.test(k) && !k.startsWith('npm_')
  );

  return {
    uri: null,
    keyName: null,
    hasEnv: false,
    hint: similarKeys.length > 0 ? `Found related keys in Vercel: ${similarKeys.join(', ')}` : null
  };
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
    console.error('MongoDB connection error in /api/bookings:', err);
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

  // General rate limiting (150 requests per minute per IP)
  const rateCheck = checkRateLimit(req, 'bookings_api', 150, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many requests to bookings service. Retry in ${rateCheck.retryAfter} seconds.`
    });
  }

  // Determine whether caller possesses verified staff privileges
  const isStaff = isStaffAuthorized(req);

  try {
    const { db, error: dbError, config: mongoConfig } = await getDatabase();
    const collection = db ? db.collection('booking_requests') : null;

    // Database index optimization - run once per serverless process lifecycle
    if (collection && !global._bookingsDbInitialized) {
      try {
        collection.createIndex({ id: 1 }, { unique: true }).catch(() => {});
        collection.createIndex({ createdAt: -1 }).catch(() => {});
        collection.createIndex({ status: 1, checkOut: 1 }).catch(() => {});
        collection.createIndex({ roomId: 1 }).catch(() => {});
        collection.createIndex({ checkIn: 1, checkOut: 1 }).catch(() => {});
        global._bookingsDbInitialized = true;
      } catch (e) {}
    }

    // -----------------------------------------------------------------------
    // GET: Fetch booking requests (PII is strictly redacted for public callers)
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        const now = Date.now();

        // Micro-cache (2 seconds) to absorb concurrent traffic spikes
        if (global._cachedBookingsData && (now - (global._cachedBookingsTime || 0) < 2000)) {
          const cachedOutput = isStaff
            ? global._cachedBookingsData
            : global._cachedBookingsData.map(redactBookingPII);

          return res.status(200).json({
            success: true,
            data: cachedOutput,
            source: 'mongodb-cache',
            isStaffAuthenticated: isStaff,
            dbConnected: true,
            envDetected: !!mongoConfig?.hasEnv,
            envKey: mongoConfig?.keyName || null
          });
        }

        // Safe 3-month cleanup: run at most once every 6 hours per serverless instance
        if (!global._lastBookingsPurgeTime || now - global._lastBookingsPurgeTime > 6 * 3600 * 1000) {
          global._lastBookingsPurgeTime = now;
          const ninetyDaysAgoYMD = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const ninetyDaysAgoISO = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

          try {
            // Remove legacy placeholder IDs if present
            await collection.deleteMany({ id: { $in: DEMO_REQUEST_IDS } });

            // Safe declutter of unwanted, non-active requests older than 3 months (90 days)
            await collection.deleteMany({
              status: { $in: ['declined', 'cancelled', 'completed'] },
              $or: [
                { checkOut: { $exists: true, $type: 'string', $regex: /^\d{4}-\d{2}-\d{2}/, $lt: ninetyDaysAgoYMD } },
                { createdAt: { $exists: true, $lt: ninetyDaysAgoISO } }
              ]
            });
          } catch (e) {
            console.warn('MongoDB 3-month purge warning in /api/bookings:', e.message);
          }
        }

        const bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();
        const sanitized = bookings.map(({ _id, ...rest }) => rest);
        global._cachedBookingsData = sanitized;
        global._cachedBookingsTime = now;

        const responseData = isStaff ? sanitized : sanitized.map(redactBookingPII);

        return res.status(200).json({
          success: true,
          data: responseData,
          source: 'mongodb',
          isStaffAuthenticated: isStaff,
          dbConnected: true,
          envDetected: !!mongoConfig?.hasEnv,
          envKey: mongoConfig?.keyName || null
        });
      }

      // In-Memory Fallback
      const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      fallbackBookings = fallbackBookings.filter((b) => {
        if (!b) return false;
        if (DEMO_REQUEST_IDS.includes(b.id)) return false;
        // Never expire active/pending/approved reservations
        if (['pending', 'approved', 'contacted'].includes(b.status)) return true;
        if (b.checkOut && typeof b.checkOut === 'string' && b.checkOut.length >= 10 && b.checkOut < ninetyDaysAgoYMD) {
          return false;
        }
        return true;
      });

      const responseData = isStaff ? fallbackBookings : fallbackBookings.map(redactBookingPII);

      return res.status(200).json({
        success: true,
        data: responseData,
        source: 'memory',
        isStaffAuthenticated: isStaff,
        dbConnected: false,
        envDetected: !!mongoConfig?.hasEnv,
        envKey: mongoConfig?.keyName || null,
        dbError: dbError || lastDbError
      });
    }

    // -----------------------------------------------------------------------
    // POST: Create a new booking request OR Reset requests
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      let rawBody = req.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON request format.' });
        }
      }
      const body = sanitizeInput(rawBody || {});

      // 1. Reset booking requests: STRICTLY STAFF ONLY
      if (body?.action === 'reset' || req.query?.action === 'reset') {
        if (!isStaff) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized: Staff credentials required to reset reservations.'
          });
        }

        global._cachedBookingsData = null;
        global._cachedBookingsTime = 0;

        if (collection) {
          await collection.deleteMany({});
          return res.status(200).json({ success: true, data: [], source: 'mongodb', dbConnected: true });
        }
        fallbackBookings = [];
        return res.status(200).json({ success: true, data: [], source: 'memory', dbConnected: false });
      }

      // 2. Guest reservation request creation (Public or Staff)
      // Anti-bot submission rate limit: max 20 bookings per 10 minutes per IP
      const submitCheck = checkRateLimit(req, 'booking_create', 20, 10 * 60 * 1000);
      if (!submitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: `Booking rate limit exceeded. Please wait ${submitCheck.retryAfter} seconds before submitting again.`
        });
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ success: false, error: 'Valid booking request data required' });
      }

      // Sanitize and validate fields
      const guestName = String(body.guestName || 'VIP Guest').trim().substring(0, 100);
      const phone = String(body.phone || '+92 300 0000000').trim().substring(0, 30);
      const email = String(body.email || 'concierge@polarishotel.pk').trim().substring(0, 100);
      const checkIn = String(body.checkIn || getPakistanYMD()).trim().substring(0, 10);
      const checkOut = String(body.checkOut || addDaysYMD(checkIn, 2)).trim().substring(0, 10);

      const newBooking = {
        id: String(body.id || 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
        guestName,
        phone,
        email,
        roomId: String(body.roomId || 'room-custom').substring(0, 50),
        roomNumber: String(body.roomNumber || '101').substring(0, 20),
        roomName: String(body.roomName || 'Polaris Suite').substring(0, 100),
        tier: String(body.tier || 'Executive Suite').substring(0, 100),
        floor: String(body.floor || 'Floor 1').substring(0, 50),
        preferredFloor: String(body.preferredFloor || body.floor || '').trim().substring(0, 50),
        pricePKR: Math.max(0, Number(body.pricePKR) || 45000),
        checkIn,
        checkOut,
        nights: Math.max(1, Number(body.nights) || 1),
        guests: String(body.guests || '2 Guests').substring(0, 50),
        notes: body.notes ? String(body.notes).trim().substring(0, 1000) : (body.source ? `Source: ${String(body.source).substring(0, 50)}` : ''),
        status: String(body.status || 'pending').substring(0, 30),
        createdAt: body.createdAt || new Date().toISOString()
      };

      global._cachedBookingsData = null;
      global._cachedBookingsTime = 0;

      if (collection) {
        await collection.insertOne({ ...newBooking });
        return res.status(201).json({
          success: true,
          data: isStaff ? newBooking : redactBookingPII(newBooking),
          source: 'mongodb',
          dbConnected: true
        });
      }

      fallbackBookings.unshift(newBooking);
      return res.status(201).json({
        success: true,
        data: isStaff ? newBooking : redactBookingPII(newBooking),
        source: 'memory',
        dbConnected: false,
        warning: 'Saved to temporary server memory only. Set MONGODB_URI in Vercel to persist permanently.'
      });
    }

    // -----------------------------------------------------------------------
    // PUT: Update status or notes of a booking request (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to update reservations.'
        });
      }

      global._cachedBookingsData = null;
      global._cachedBookingsTime = 0;

      let rawBody = req.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON request format.' });
        }
      }
      const body = sanitizeInput(rawBody || {});
      const { id, status, staffNote } = body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid booking ID required' });
      }

      const updateFields = {
        updatedAt: new Date().toISOString()
      };
      if (status) updateFields.status = String(status).substring(0, 30);
      if (staffNote !== undefined) updateFields.staffNote = String(staffNote).substring(0, 1000);
      if (body.checkedOutAt) updateFields.checkedOutAt = String(body.checkedOutAt).substring(0, 50);

      if (collection) {
        await collection.updateOne({ id }, { $set: updateFields });
        const updated = await collection.findOne({ id });
        if (updated) {
          const { _id, ...rest } = updated;
          return res.status(200).json({ success: true, data: rest, source: 'mongodb', dbConnected: true });
        }
      }

      const idx = fallbackBookings.findIndex((b) => b.id === id);
      if (idx !== -1) {
        fallbackBookings[idx] = { ...fallbackBookings[idx], ...updateFields };
        return res.status(200).json({ success: true, data: fallbackBookings[idx], source: 'memory', dbConnected: false });
      }

      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // -----------------------------------------------------------------------
    // DELETE: Remove a booking request OR Purge all (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to delete reservations.'
        });
      }

      global._cachedBookingsData = null;
      global._cachedBookingsTime = 0;

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
      const purgeAll = body?.all === true || req.query?.all === 'true';

      if (purgeAll) {
        if (collection) {
          await collection.deleteMany({});
          return res.status(200).json({ success: true, message: 'All booking requests purged', source: 'mongodb', dbConnected: true });
        }
        fallbackBookings = [];
        return res.status(200).json({ success: true, message: 'All booking requests purged', source: 'memory', dbConnected: false });
      }

      if (!id) {
        return res.status(400).json({ success: false, error: 'Valid booking ID required' });
      }

      if (collection) {
        await collection.deleteOne({ id });
        return res.status(200).json({ success: true, deletedId: id, source: 'mongodb', dbConnected: true });
      }

      fallbackBookings = fallbackBookings.filter((b) => b.id !== id);
      return res.status(200).json({ success: true, deletedId: id, source: 'memory', dbConnected: false });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in /api/bookings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
