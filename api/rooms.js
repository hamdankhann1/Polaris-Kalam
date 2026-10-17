/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/rooms
 * =========================================================================
 * 
 * Manages hotel rooms across 4 floors + 1 top suite.
 * Syncs room status ('available', 'booked', 'in cleaning'), prices,
 * and booked ranges in real time with MongoDB Atlas or in-memory fallback.
 */

import { MongoClient } from 'mongodb';
import {
  isStaffAuthorized,
  redactRoomPII,
  sanitizeInput,
  checkRateLimit,
  applySecurityHeaders
} from './_security.js';

let cachedClient = null;
let cachedDb = null;
let lastDbError = null;

// Initial seed dataset (Categorized across 4 floors + 1 top suite)
// Clean slate: all suites 100% available with zero demo date locks
const INITIAL_ROOMS = [
  {
    id: 'room-top-suite-501',
    roomNumber: '501',
    name: 'The Celestial Summit Penthouse',
    tier: 'Top Suite / Presidential',
    floor: 'Top Suite',
    capacity: '4 Guests • 1 Master Grand King + 1 Twin',
    pricePKR: 120000,
    status: 'available',
    amenities: [
      '360° Unobstructed Glacial Panorama',
      'Private Heated Cedar Plunge Pool',
      'Astronomical Stargazing Telescope',
      'Stone Hearth Fireplace',
      'Private Butler & Concierge Entry'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-401',
    roomNumber: '401',
    name: 'Starlight Glacier Horizon Suite',
    tier: 'Executive Panoramic Suite',
    floor: 'Floor 4',
    capacity: '2 Guests • 1 Super King Bed',
    pricePKR: 75000,
    status: 'available',
    amenities: [
      'Floor-to-Ceiling Horizon Glass',
      'Heated Oak Floors',
      'Freestanding Soaking Tub',
      'Artisan Espresso Bar'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-402',
    roomNumber: '402',
    name: 'Starwatcher Glacial Studio',
    tier: 'Luxury Studio',
    floor: 'Floor 4',
    capacity: '2 Guests • 1 King Bed',
    pricePKR: 58000,
    status: 'available',
    amenities: [
      'Ceiling Glass Skylight',
      'Rainfall Mountain Shower',
      'Wool & Cashmere Linens'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-301',
    roomNumber: '301',
    name: 'Falcon Peak Horizon Suite',
    tier: 'Presidential Suite',
    floor: 'Floor 3',
    capacity: '3 Guests • 1 King + 1 Daybed',
    pricePKR: 68000,
    status: 'available',
    amenities: [
      'Private Stargazing Balcony',
      'Stone Hearth Fireplace',
      'Alpine Library Lounge'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-302',
    roomNumber: '302',
    name: 'Alpine Ridge Horizon Room',
    tier: 'Deluxe Alpine',
    floor: 'Floor 3',
    capacity: '2 Guests • 1 King Bed',
    pricePKR: 48000,
    status: 'available',
    amenities: [
      'Glacial Peak Views',
      'Underfloor Heating',
      'Walk-in Dressing Suite'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-201',
    roomNumber: '201',
    name: 'Kalam Riverfront Vista Suite',
    tier: 'Executive Suite',
    floor: 'Floor 2',
    capacity: '3 Guests • 1 King + Daybed',
    pricePKR: 52000,
    status: 'available',
    amenities: [
      'Direct Swat River Soundscape',
      'Private Cedar Viewing Deck',
      'Deep Soaking Mountain Bathtub'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-202',
    roomNumber: '202',
    name: 'Swat Ridge Double Deluxe',
    tier: 'Deluxe Alpine',
    floor: 'Floor 2',
    capacity: '4 Guests • 2 Queen Beds',
    pricePKR: 46000,
    status: 'available',
    amenities: [
      'River & Ridge Vistas',
      'Twin Vanities',
      'Smart Climate Control'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-101',
    roomNumber: '101',
    name: 'Alpine Pine Forest Chalet',
    tier: 'Forest Chalet',
    floor: 'Floor 1',
    capacity: '2 Guests • 1 King Bed',
    pricePKR: 42000,
    status: 'available',
    amenities: [
      'Pine Forest Garden View',
      'Stone Hearth Fireplace',
      'Custom Mountain Cedar Bath'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-102',
    roomNumber: '102',
    name: 'Ushu Valley Vista Room',
    tier: 'Deluxe Alpine',
    floor: 'Floor 1',
    capacity: '2 Guests • 1 King Bed',
    pricePKR: 38000,
    status: 'available',
    amenities: [
      'Valley Horizon View',
      'Underfloor Heating',
      'Rainfall Shower'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: null,
    lastCleanedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let fallbackRooms = INITIAL_ROOMS.map((r) => ({ ...r, activeBooking: null, bookedRanges: [] }));

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
    console.error('MongoDB connection error in /api/rooms:', err);
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
  const rateCheck = checkRateLimit(req, 'rooms_api', 150, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many requests to rooms service. Retry in ${rateCheck.retryAfter} seconds.`
    });
  }

  const isStaff = isStaffAuthorized(req);

  try {
    const { db, error: dbError, config: mongoConfig } = await getDatabase();
    const collection = db ? db.collection('rooms') : null;

    // Ensure MongoDB has rooms seeded and indexed ONLY ONCE per process lifecycle
    if (collection && !global._roomsDbInitialized) {
      try {
        const metadataCol = db.collection('system_metadata');
        const meta = await metadataCol.findOne({ key: 'has_seeded_initial_rooms' });
        if (!meta) {
          const count = await collection.countDocuments();
          if (count === 0) {
            await collection.insertMany(INITIAL_ROOMS.map((r) => ({ ...r, activeBooking: null, bookedRanges: [] })));
          }
          await metadataCol.updateOne(
            { key: 'has_seeded_initial_rooms' },
            { $set: { key: 'has_seeded_initial_rooms', initialized: true, createdAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
        collection.createIndex({ id: 1 }, { unique: true }).catch(() => {});
        collection.createIndex({ roomNumber: 1 }).catch(() => {});
        collection.createIndex({ category: 1 }).catch(() => {});
        collection.createIndex({ floor: 1 }).catch(() => {});
        global._roomsDbInitialized = true;
      } catch (seedErr) {
        console.warn('MongoDB initial room seed warning:', seedErr.message);
      }
    }

    // -----------------------------------------------------------------------
    // GET: Fetch all rooms directly from database (Redacts PII for public)
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        // Micro-cache (2 seconds) to absorb concurrent traffic spikes without pounding Atlas
        const now = Date.now();
        if (global._cachedRoomsData && (now - (global._cachedRoomsTime || 0) < 2000)) {
          const output = isStaff ? global._cachedRoomsData : global._cachedRoomsData.map(redactRoomPII);
          return res.status(200).json({
            success: true,
            data: output,
            source: 'mongodb-cache',
            isStaffAuthenticated: isStaff,
            dbConnected: true,
            envDetected: !!mongoConfig?.hasEnv,
            envKey: mongoConfig?.keyName || null
          });
        }

        // Run expired date cleanup at most once every 6 hours per serverless instance
        if (!global._lastRoomPurgeTime || now - global._lastRoomPurgeTime > 6 * 3600 * 1000) {
          global._lastRoomPurgeTime = now;
          const ninetyDaysAgoYMD = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          collection.updateMany(
            {},
            {
              $pull: {
                bookedRanges: {
                  checkOut: { $exists: true, $type: 'string', $regex: /^\d{4}-\d{2}-\d{2}/, $lt: ninetyDaysAgoYMD }
                }
              }
            }
          ).catch((e) => console.warn('Purge warning:', e.message));
        }

        const rooms = await collection.find({}).sort({ roomNumber: 1 }).toArray();
        const sanitized = rooms.map(({ _id, ...rest }) => rest);
        global._cachedRoomsData = sanitized;
        global._cachedRoomsTime = now;

        const output = isStaff ? sanitized : sanitized.map(redactRoomPII);

        return res.status(200).json({
          success: true,
          data: output,
          source: 'mongodb',
          isStaffAuthenticated: isStaff,
          dbConnected: true,
          envDetected: !!mongoConfig?.hasEnv,
          envKey: mongoConfig?.keyName || null
        });
      }

      // In-Memory Fallback
      const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      fallbackRooms.forEach((r) => {
        if (Array.isArray(r.bookedRanges)) {
          r.bookedRanges = r.bookedRanges.filter(
            (b) => !b.checkOut || typeof b.checkOut !== 'string' || b.checkOut.length < 10 || b.checkOut >= ninetyDaysAgoYMD
          );
        }
      });

      const output = isStaff ? fallbackRooms : fallbackRooms.map(redactRoomPII);

      return res.status(200).json({
        success: true,
        data: output,
        source: 'memory',
        isStaffAuthenticated: isStaff,
        dbConnected: false,
        envDetected: !!mongoConfig?.hasEnv,
        envKey: mongoConfig?.keyName || null,
        dbError: dbError || lastDbError
      });
    }

    // -----------------------------------------------------------------------
    // PUT: Update room status, price, or specifications (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to modify hotel rooms.'
        });
      }

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
      const { id, ...updates } = body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid room ID required' });
      }

      updates.updatedAt = new Date().toISOString();

      if (collection) {
        await collection.updateOne({ id }, { $set: updates }, { upsert: true });
        const updated = await collection.findOne({ id });
        if (updated) {
          const { _id, ...rest } = updated;
          return res.status(200).json({ success: true, data: rest, source: 'mongodb', dbConnected: true });
        }
        return res.status(200).json({ success: true, data: { id, ...updates }, source: 'mongodb', dbConnected: true });
      }

      const idx = fallbackRooms.findIndex((r) => r.id === id);
      if (idx !== -1) {
        fallbackRooms[idx] = { ...fallbackRooms[idx], ...updates };
        return res.status(200).json({ success: true, data: fallbackRooms[idx], source: 'memory', dbConnected: false });
      }

      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // -----------------------------------------------------------------------
    // POST: Add new room OR Reset inventory (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to create or reset hotel rooms.'
        });
      }

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
      
      // Reset database inventory to default initial suites
      if (body?.action === 'reset' || req.query?.action === 'reset') {
        if (collection) {
          await collection.deleteMany({});
          await collection.insertMany(INITIAL_ROOMS);
          const fresh = await collection.find({}).toArray();
          const sanitized = fresh.map(({ _id, ...rest }) => rest);
          return res.status(200).json({ success: true, data: sanitized, source: 'mongodb', dbConnected: true });
        }
        fallbackRooms = INITIAL_ROOMS.map((r) => ({ ...r, activeBooking: null, bookedRanges: [] }));
        return res.status(200).json({ success: true, data: fallbackRooms, source: 'memory', dbConnected: false });
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ success: false, error: 'Valid room data required' });
      }

      const newRoom = {
        ...body,
        id: String(body.id || 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
        updatedAt: new Date().toISOString()
      };

      if (collection) {
        await collection.insertOne({ ...newRoom });
        return res.status(201).json({ success: true, data: newRoom, source: 'mongodb', dbConnected: true });
      }

      fallbackRooms.push(newRoom);
      return res.status(201).json({
        success: true,
        data: newRoom,
        source: 'memory',
        dbConnected: false,
        warning: 'Saved to temporary server memory only. Set MONGODB_URI in Vercel to persist permanently.'
      });
    }

    // -----------------------------------------------------------------------
    // DELETE: Delete room OR Clear all rooms (STRICTLY STAFF ONLY)
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      if (!isStaff) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff credentials required to delete hotel rooms.'
        });
      }

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
      const all = body?.all === true || req.query?.all === 'true';

      // 1. Clear out ALL rooms from hotel inventory
      if (all) {
        if (collection) {
          await collection.deleteMany({});
          // Ensure metadata flag is permanently recorded so empty database is never auto-seeded
          await db.collection('system_metadata').updateOne(
            { key: 'has_seeded_initial_rooms' },
            { $set: { key: 'has_seeded_initial_rooms', initialized: true, clearedAt: new Date().toISOString() } },
            { upsert: true }
          );
          return res.status(200).json({ success: true, message: 'All rooms cleared from database inventory', data: [], source: 'mongodb', dbConnected: true });
        }

        fallbackRooms = [];
        return res.status(200).json({ success: true, message: 'All rooms cleared from temporary memory', data: [], source: 'memory', dbConnected: false });
      }

      // 2. Delete a single specific room
      if (!id) return res.status(400).json({ success: false, error: 'Valid room ID required' });

      if (collection) {
        await collection.deleteOne({ id });
        await db.collection('system_metadata').updateOne(
          { key: 'has_seeded_initial_rooms' },
          { $set: { key: 'has_seeded_initial_rooms', initialized: true } },
          { upsert: true }
        );
        return res.status(200).json({ success: true, deletedId: id, source: 'mongodb', dbConnected: true });
      }

      fallbackRooms = fallbackRooms.filter((r) => r.id !== id);
      return res.status(200).json({ success: true, deletedId: id, source: 'memory', dbConnected: false });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in /api/rooms:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
