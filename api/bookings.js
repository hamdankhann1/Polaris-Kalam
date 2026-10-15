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

let cachedClient = null;
let cachedDb = null;
let lastDbError = null;

// Initial seed requests (Empty - production database starts clean)
const INITIAL_REQUESTS = [];
const DEMO_REQUEST_IDS = ['req-101', 'req-102'];

// Fallback in-memory storage for serverless runtime
let fallbackBookings = [];

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
    console.error('MongoDB connection error in /api/bookings:', err);
    lastDbError = err.message;
    return { db: null, error: err.message, config };
  }
}

export default async function handler(req, res) {
  // CORS & Strict Real-Time No-Cache Headers (Prevents mobile devices from caching stale database responses)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const collection = db ? db.collection('booking_requests') : null;

    // Database index optimization
    if (collection) {
      try {
        collection.createIndex({ createdAt: -1 }).catch(() => {});
        collection.createIndex({ status: 1, checkOut: 1 }).catch(() => {});
      } catch (e) {}
    }

    // -----------------------------------------------------------------------
    // GET: Fetch all booking requests
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        // Safe 3-month cleanup:
        // STRICT SAFETY RULES:
        // 1. NEVER delete 'pending', 'approved', or 'contacted' requests!
        // 2. Only declutter unwanted records ('declined', 'cancelled', or 'completed')
        // 3. AND record must be strictly older than 3 months (90 days)
        // 4. Room details and active inventory are completely protected in a separate collection.
        const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const ninetyDaysAgoISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

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

        const bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();
        const sanitized = bookings.map(({ _id, ...rest }) => rest);
        return res.status(200).json({
          success: true,
          data: sanitized,
          source: 'mongodb',
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

      return res.status(200).json({
        success: true,
        data: fallbackBookings,
        source: 'memory',
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      // Reset booking requests
      if (body?.action === 'reset' || req.query?.action === 'reset') {
        if (collection) {
          await collection.deleteMany({});
          return res.status(200).json({ success: true, data: [], source: 'mongodb', dbConnected: true });
        }
        fallbackBookings = [];
        return res.status(200).json({ success: true, data: [], source: 'memory', dbConnected: false });
      }

      if (!body) {
        return res.status(400).json({ success: false, error: 'Request body required' });
      }

      const newBooking = {
        id: body.id || 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        guestName: (body.guestName || 'VIP Guest').trim(),
        phone: (body.phone || '+92 300 0000000').trim(),
        email: (body.email || 'concierge@polarishotel.pk').trim(),
        roomId: body.roomId || 'room-custom',
        roomNumber: body.roomNumber || '101',
        roomName: body.roomName || 'Polaris Suite',
        tier: body.tier || 'Executive Suite',
        floor: body.floor || 'Floor 1',
        preferredFloor: (body.preferredFloor || body.floor || '').trim(),
        pricePKR: Number(body.pricePKR) || 45000,
        checkIn: body.checkIn || new Date().toISOString().split('T')[0],
        checkOut: body.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        nights: Number(body.nights) || 1,
        guests: body.guests || '2 Guests',
        notes: body.notes ? body.notes.trim() : (body.source ? `Source: ${body.source}` : ''),
        status: body.status || 'pending',
        createdAt: body.createdAt || new Date().toISOString()
      };

      if (collection) {
        await collection.insertOne({ ...newBooking });
        return res.status(201).json({ success: true, data: newBooking, source: 'mongodb', dbConnected: true });
      }

      fallbackBookings.unshift(newBooking);
      return res.status(201).json({
        success: true,
        data: newBooking,
        source: 'memory',
        dbConnected: false,
        warning: 'Saved to temporary server memory only. Set MONGODB_URI in Vercel to persist permanently.'
      });
    }

    // -----------------------------------------------------------------------
    // PUT: Update status or notes of a booking request
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, status, staffNote } = body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'Booking ID required' });
      }

      const updateFields = {
        updatedAt: new Date().toISOString()
      };
      if (status) updateFields.status = status;
      if (staffNote !== undefined) updateFields.staffNote = staffNote;

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
    // DELETE: Remove a booking request OR Purge all
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = body?.id || req.query?.id;
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
        return res.status(400).json({ success: false, error: 'Booking ID required' });
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
