/**
 * =========================================================================
 * POLARIS HOTEL & SANCTUARY — PRODUCTION NODE.JS & MONGODB SERVER
 * =========================================================================
 * 
 * Standalone server for self-hosting on Hostinger VPS or Linux servers.
 * Connects directly to local MongoDB Community Server (100% Free Forever):
 *   mongodb://127.0.0.1:27017/polaris_hotel
 * 
 * Capabilities:
 * 1. Hosts the complete frontend (Vite production build from dist/)
 * 2. REST API for booking requests (/api/bookings) & room inventory (/api/rooms)
 * 3. Self-healing database connection with automatic seeding on first run
 * 4. Zero external cloud dependencies — 100% owned and private
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
// Default to local MongoDB Community Server port 27017
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'polaris_hotel';

// Middleware
app.use(cors());
app.use(express.json());

// =========================================================================
// SEED DATA (Used on first launch to populate local MongoDB)
// =========================================================================
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

const INITIAL_REQUESTS = [
  {
    id: 'req-101',
    guestName: 'Malik Zeeshan & Family',
    phone: '+92 300 8554210',
    email: 'zeeshan.malik@outlook.com',
    roomId: 'room-top-suite-501',
    roomNumber: '501',
    roomName: 'The Celestial Summit Penthouse',
    tier: 'Top Suite / Presidential',
    floor: 'Top Suite',
    pricePKR: 120000,
    checkIn: '2026-12-05',
    checkOut: '2026-12-08',
    nights: 3,
    guests: '3 Adults, 1 Child',
    notes: 'Inaugural soft launch family vacation. Requesting private Swat airport transfer and late arrival dinner.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'req-102',
    guestName: 'Fatima Zahra Khan',
    phone: '+92 321 4455889',
    email: 'fatima.zkhan@gmail.com',
    roomId: 'room-401',
    roomNumber: '401',
    roomName: 'Starlight Glacier Horizon Suite',
    tier: 'Executive Panoramic Suite',
    floor: 'Floor 4',
    pricePKR: 75000,
    checkIn: '2026-12-12',
    checkOut: '2026-12-14',
    nights: 2,
    guests: '2 Adults',
    notes: 'Soft launch anniversary celebration trip. Please prepare fireplace cedar logs and mountain tea.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

// In-memory fallback if MongoDB is starting up
let memoryRooms = [...INITIAL_ROOMS];
let memoryBookings = [...INITIAL_REQUESTS];

// =========================================================================
// MONGODB COMMUNITY CONNECTION & SEEDING
// =========================================================================
let db = null;
let mongoClient = null;

async function initMongoDB() {
  try {
    console.log(`[MongoDB] Connecting to local MongoDB Community Server at: ${MONGODB_URI}`);
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log(`[MongoDB] Connected successfully to database: "${DB_NAME}"`);

    // Ensure collections and seed initial data if empty
    const roomsCol = db.collection('rooms');
    const bookingsCol = db.collection('booking_requests');

    const roomsCount = await roomsCol.countDocuments();
    if (roomsCount === 0) {
      console.log('[MongoDB] Seeding initial room inventory into local database...');
      await roomsCol.insertMany(INITIAL_ROOMS);
      console.log(`[MongoDB] Seeded ${INITIAL_ROOMS.length} rooms.`);
    }

    const bookingsCount = await bookingsCol.countDocuments();
    if (bookingsCount === 0) {
      console.log('[MongoDB] Seeding initial demo booking requests into local database...');
      await bookingsCol.insertMany(INITIAL_REQUESTS);
      console.log(`[MongoDB] Seeded ${INITIAL_REQUESTS.length} booking requests.`);
    }

    // Create helpful indexes
    await roomsCol.createIndex({ id: 1 }, { unique: true });
    await roomsCol.createIndex({ roomNumber: 1 });
    await bookingsCol.createIndex({ id: 1 }, { unique: true });
    await bookingsCol.createIndex({ status: 1 });

    console.log('[MongoDB] Collections & indexes verified.');
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${MONGODB_URI}.`);
    console.warn(`[MongoDB Warning] Details: ${err.message}`);
    console.warn(`[MongoDB Warning] Running with high-speed memory cache until MongoDB is ready.`);
    db = null;
  }
}

// Retry MongoDB connection periodically if it was temporarily offline during boot
setInterval(() => {
  if (!db) {
    initMongoDB().catch(() => {});
  }
}, 10000);

// =========================================================================
// API ENDPOINTS
// =========================================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'mongodb_community' : 'in_memory_fallback',
    dbConnected: !!db,
    dbName: DB_NAME
  });
});

// --- BOOKING REQUESTS API ---

// 1. GET /api/bookings
app.get('/api/bookings', async (req, res) => {
  try {
    if (db) {
      const docs = await db.collection('booking_requests').find({}).sort({ createdAt: -1 }).toArray();
      const sanitized = docs.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: sanitized, source: 'mongodb' });
    }
    return res.json({ success: true, data: memoryBookings, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/bookings (Create a booking request from /booking page or staff)
app.post('/api/bookings', async (req, res) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ success: false, error: 'Booking payload required' });

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
      pricePKR: Number(body.pricePKR) || 45000,
      checkIn: body.checkIn || new Date().toISOString().split('T')[0],
      checkOut: body.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      nights: Number(body.nights) || 1,
      guests: body.guests || '2 Guests',
      notes: body.notes ? body.notes.trim() : (body.source ? `Source: ${body.source}` : ''),
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString()
    };

    if (db) {
      await db.collection('booking_requests').insertOne({ ...newBooking });
      console.log(`[Booking Received] ${newBooking.guestName} booked Suite #${newBooking.roomNumber} (${newBooking.checkIn} -> ${newBooking.checkOut})`);
      return res.status(201).json({ success: true, data: newBooking, source: 'mongodb' });
    }

    memoryBookings.unshift(newBooking);
    return res.status(201).json({ success: true, data: newBooking, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PUT /api/bookings (Update status: 'approved', 'contacted', 'declined', or add staff notes)
app.put('/api/bookings', async (req, res) => {
  try {
    const { id, status, staffNote } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Booking ID required' });

    const updateFields = { updatedAt: new Date().toISOString() };
    if (status) updateFields.status = status;
    if (staffNote !== undefined) updateFields.staffNote = staffNote;

    if (db) {
      await db.collection('booking_requests').updateOne({ id }, { $set: updateFields });
      const updated = await db.collection('booking_requests').findOne({ id });
      if (updated) {
        const { _id, ...rest } = updated;
        return res.json({ success: true, data: rest, source: 'mongodb' });
      }
    }

    const idx = memoryBookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      memoryBookings[idx] = { ...memoryBookings[idx], ...updateFields };
      return res.json({ success: true, data: memoryBookings[idx], source: 'memory' });
    }

    return res.status(404).json({ success: false, error: 'Booking not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE /api/bookings
app.delete('/api/bookings', async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    if (!id) return res.status(400).json({ success: false, error: 'Booking ID required' });

    if (db) {
      await db.collection('booking_requests').deleteOne({ id });
      return res.json({ success: true, deletedId: id, source: 'mongodb' });
    }

    memoryBookings = memoryBookings.filter((b) => b.id !== id);
    return res.json({ success: true, deletedId: id, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ROOMS INVENTORY API ---

// 1. GET /api/rooms
app.get('/api/rooms', async (req, res) => {
  try {
    if (db) {
      const docs = await db.collection('rooms').find({}).toArray();
      const sanitized = docs.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: sanitized, source: 'mongodb' });
    }
    return res.json({ success: true, data: memoryRooms, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. PUT /api/rooms (Update room status, prices, or specs)
app.put('/api/rooms', async (req, res) => {
  try {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Room ID required' });

    updates.updatedAt = new Date().toISOString();

    if (db) {
      await db.collection('rooms').updateOne({ id }, { $set: updates });
      const updated = await db.collection('rooms').findOne({ id });
      if (updated) {
        const { _id, ...rest } = updated;
        return res.json({ success: true, data: rest, source: 'mongodb' });
      }
    }

    const idx = memoryRooms.findIndex((r) => r.id === id);
    if (idx !== -1) {
      memoryRooms[idx] = { ...memoryRooms[idx], ...updates };
      return res.json({ success: true, data: memoryRooms[idx], source: 'memory' });
    }

    return res.status(404).json({ success: false, error: 'Room not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/rooms (Add room)
app.post('/api/rooms', async (req, res) => {
  try {
    const newRoom = {
      ...req.body,
      id: req.body.id || 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      updatedAt: new Date().toISOString()
    };

    if (db) {
      await db.collection('rooms').insertOne({ ...newRoom });
      return res.status(201).json({ success: true, data: newRoom, source: 'mongodb' });
    }

    memoryRooms.push(newRoom);
    return res.status(201).json({ success: true, data: newRoom, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE /api/rooms (Delete room)
app.delete('/api/rooms', async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    if (!id) return res.status(400).json({ success: false, error: 'Room ID required' });

    if (db) {
      await db.collection('rooms').deleteOne({ id });
      return res.json({ success: true, deletedId: id, source: 'mongodb' });
    }

    memoryRooms = memoryRooms.filter((r) => r.id !== id);
    return res.json({ success: true, deletedId: id, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// STATIC FRONTEND SERVING (Vite production build from dist/)
// =========================================================================
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For all non-API routes, serve index.html (SPA client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// =========================================================================
// START SERVER
// =========================================================================
app.listen(PORT, async () => {
  console.log(`=================================================================`);
  console.log(`🌟 POLARIS KALAM HOTEL & SANCTUARY SERVER RUNNING`);
  console.log(`📡 Local Port: http://localhost:${PORT}`);
  console.log(`🔗 Secret CMS: http://localhost:${PORT}/admintopsecretmanage`);
  console.log(`🏨 Booking:    http://localhost:${PORT}/booking`);
  console.log(`=================================================================`);
  await initMongoDB();
});
