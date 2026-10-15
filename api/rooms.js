/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/rooms
 * =========================================================================
 * 
 * Manages hotel rooms across 4 floors + 1 top suite.
 * Syncs room status ('available', 'booked', 'in cleaning'), prices,
 * and booked ranges in real time with MongoDB Atlas or in-memory fallback.
 */

let cachedClient = null;
let cachedDb = null;

// Initial seed dataset (Categorized across 4 floors + 1 top suite)
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
    bookedRanges: [
      {
        id: 'b-501-1',
        checkIn: '2026-12-08',
        checkOut: '2026-12-12',
        guestName: 'Ambassador Al-Mansoor',
        source: 'VIP Diplomatic Allocation'
      }
    ],
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
    bookedRanges: [
      {
        id: 'b-401-1',
        checkIn: '2026-12-04',
        checkOut: '2026-12-07',
        guestName: 'Farhan Qureshi',
        source: 'Website Reservation'
      }
    ],
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
    status: 'in cleaning',
    amenities: [
      'Ceiling Glass Skylight',
      'Rainfall Mountain Shower',
      'Wool & Cashmere Linens'
    ],
    activeBooking: null,
    bookedRanges: [],
    cleaningInfo: {
      assignedTo: 'Turnover Team Alpha (Hamza)',
      priority: 'Urgent — Check-in today at 4:30 PM',
      notes: 'Deep sanitization and cedar fragrance renewal in progress.',
      startedAt: new Date(Date.now() - 3600000 * 1.2).toISOString()
    },
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
    activeBooking: {
      guestName: 'Syed Bilal Ahmad',
      checkIn: '2026-12-01',
      checkOut: '2026-12-04',
      source: 'Other Hotel CMS (Sync)',
      notes: 'Inaugural soft-launch guest arrival. Welcome mountain tea requested.',
      bookingRef: 'PK-9821',
      bookedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    bookedRanges: [
      {
        id: 'b-301-1',
        checkIn: '2026-12-01',
        checkOut: '2026-12-04',
        guestName: 'Syed Bilal Ahmad',
        source: 'Other Hotel CMS (Sync)'
      },
      {
        id: 'b-301-2',
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        guestName: 'Zubair Shah',
        source: 'VIP Reservation'
      }
    ],
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
    bookedRanges: [
      {
        id: 'b-201-1',
        checkIn: '2026-12-20',
        checkOut: '2026-12-24',
        guestName: 'Hassan Mir',
        source: 'Direct WhatsApp'
      }
    ],
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
    activeBooking: {
      guestName: 'Dr. Ayesha Malik & Family',
      checkIn: '2026-12-10',
      checkOut: '2026-12-14',
      source: 'Direct Phone / WhatsApp',
      notes: 'Soft launch family stay. Early check-in approved (1:00 PM). Extra blankets.',
      bookingRef: 'PK-4412',
      bookedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    bookedRanges: [
      {
        id: 'b-202-1',
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
        guestName: 'Dr. Ayesha Malik & Family',
        source: 'Direct Phone / WhatsApp'
      }
    ],
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
    status: 'in cleaning',
    amenities: [
      'Pine Forest Garden View',
      'Stone Hearth Fireplace',
      'Custom Mountain Cedar Bath'
    ],
    activeBooking: null,
    bookedRanges: [
      {
        id: 'b-101-1',
        checkIn: '2026-10-22',
        checkOut: '2026-10-25',
        guestName: 'Naveed Akhtar',
        source: 'OTA Agoda'
      }
    ],
    cleaningInfo: {
      assignedTo: 'Turnover Team Beta (Tariq)',
      priority: 'Standard Departure Cleaning',
      notes: 'Linen turnover and pine logs restocked.',
      startedAt: new Date(Date.now() - 3600000 * 0.9).toISOString()
    },
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

let fallbackRooms = [...INITIAL_ROOMS];

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'polaris_hotel');
    cachedClient = client;
    cachedDb = db;
    return db;
  } catch (err) {
    console.error('MongoDB connection error in /api/rooms:', err);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDatabase();
    const collection = db ? db.collection('rooms') : null;

    // -----------------------------------------------------------------------
    // GET: Fetch all rooms
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        let rooms = await collection.find({}).toArray();
        if (rooms.length === 0) {
          await collection.insertMany(INITIAL_ROOMS);
          rooms = await collection.find({}).toArray();
        }
        const sanitized = rooms.map(({ _id, ...rest }) => rest);
        return res.status(200).json({ success: true, data: sanitized, source: 'mongodb' });
      }

      return res.status(200).json({ success: true, data: fallbackRooms, source: 'memory' });
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
          return res.status(200).json({ success: true, data: rest, source: 'mongodb' });
        }
      }

      const idx = fallbackRooms.findIndex((r) => r.id === id);
      if (idx !== -1) {
        fallbackRooms[idx] = { ...fallbackRooms[idx], ...updates };
        return res.status(200).json({ success: true, data: fallbackRooms[idx], source: 'memory' });
      }

      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // -----------------------------------------------------------------------
    // POST: Add new room
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body) return res.status(400).json({ success: false, error: 'Room data required' });

      const newRoom = {
        ...body,
        id: body.id || 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        updatedAt: new Date().toISOString()
      };

      if (collection) {
        await collection.insertOne({ ...newRoom });
        return res.status(201).json({ success: true, data: newRoom, source: 'mongodb' });
      }

      fallbackRooms.push(newRoom);
      return res.status(201).json({ success: true, data: newRoom, source: 'memory' });
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
        return res.status(200).json({ success: true, deletedId: id, source: 'mongodb' });
      }

      fallbackRooms = fallbackRooms.filter((r) => r.id !== id);
      return res.status(200).json({ success: true, deletedId: id, source: 'memory' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in /api/rooms:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
