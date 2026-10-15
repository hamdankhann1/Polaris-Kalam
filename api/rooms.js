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
    { name: 'DATABASE_URL', val: process.env.DATABASE_URL },
    { name: 'VITE_MONGODB_URI', val: process.env.VITE_MONGODB_URI }
  ];

  for (const c of candidates) {
    if (c.val && typeof c.val === 'string' && c.val.trim().length > 0) {
      const cleanUri = c.val.trim().replace(/^["']|["']$/g, '');
      return { uri: cleanUri, keyName: c.name, hasEnv: true };
    }
  }

  return { uri: null, keyName: null, hasEnv: false };
}

async function getDatabase() {
  const config = getMongoConfig();
  if (!config.hasEnv || !config.uri) {
    return { db: null, error: 'No MongoDB URI found in environment variables (checked MONGODB_URI, MONGO_URI, DATABASE_URL, MONGODB_URL)', config };
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
      socketTimeoutMS: 10000
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'polaris_hotel');
    cachedClient = client;
    cachedDb = db;
    lastDbError = null;
    return { db, error: null, config };
  } catch (err) {
    console.error('MongoDB connection error in /api/rooms:', err);
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
    const collection = db ? db.collection('rooms') : null;

    // -----------------------------------------------------------------------
    // GET: Fetch all rooms
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        // Automatically declutter expired past booked ranges older than 3 months (90 days)
        const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
          await collection.updateMany(
            {},
            {
              $pull: {
                bookedRanges: {
                  checkOut: { $exists: true, $type: 'string', $regex: /^\d{4}-\d{2}-\d{2}/, $lt: ninetyDaysAgoYMD }
                }
              }
            }
          );
        } catch (purgeErr) {
          console.warn('MongoDB room purge warning in /api/rooms:', purgeErr.message);
        }

        let rooms = await collection.find({}).toArray();
        if (rooms.length === 0) {
          await collection.insertMany(INITIAL_ROOMS);
          rooms = await collection.find({}).toArray();
        }
        const sanitized = rooms.map(({ _id, ...rest }) => rest);
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
      fallbackRooms.forEach((r) => {
        if (Array.isArray(r.bookedRanges)) {
          r.bookedRanges = r.bookedRanges.filter(
            (b) => !b.checkOut || typeof b.checkOut !== 'string' || b.checkOut.length < 10 || b.checkOut >= ninetyDaysAgoYMD
          );
        }
      });
      return res.status(200).json({
        success: true,
        data: fallbackRooms,
        source: 'memory',
        dbConnected: false,
        envDetected: !!mongoConfig?.hasEnv,
        envKey: mongoConfig?.keyName || null,
        dbError: dbError || lastDbError
      });
    }

    // -----------------------------------------------------------------------
    // PUT: Update room status, price, or specifications
    // -----------------------------------------------------------------------
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, ...updates } = body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'Room ID required' });
      }

      updates.updatedAt = new Date().toISOString();

      if (collection) {
        await collection.updateOne({ id }, { $set: updates });
        const updated = await collection.findOne({ id });
        if (updated) {
          const { _id, ...rest } = updated;
          return res.status(200).json({ success: true, data: rest, source: 'mongodb', dbConnected: true });
        }
      }

      const idx = fallbackRooms.findIndex((r) => r.id === id);
      if (idx !== -1) {
        fallbackRooms[idx] = { ...fallbackRooms[idx], ...updates };
        return res.status(200).json({ success: true, data: fallbackRooms[idx], source: 'memory', dbConnected: false });
      }

      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // -----------------------------------------------------------------------
    // POST: Add new room OR Reset inventory
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
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

      if (!body) return res.status(400).json({ success: false, error: 'Room data required' });

      const newRoom = {
        ...body,
        id: body.id || 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
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
    // DELETE: Delete room
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = body?.id || req.query?.id;

      if (!id) return res.status(400).json({ success: false, error: 'Room ID required' });

      if (collection) {
        await collection.deleteOne({ id });
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
