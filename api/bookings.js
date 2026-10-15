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

let cachedClient = null;
let cachedDb = null;

// Initial seed requests
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

// Fallback in-memory storage for serverless runtime
let fallbackBookings = [...INITIAL_REQUESTS];

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
    console.error('MongoDB connection error in /api/bookings:', err);
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
    const collection = db ? db.collection('booking_requests') : null;

    // -----------------------------------------------------------------------
    // GET: Fetch all booking requests
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        let bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();
        if (bookings.length === 0) {
          // Seed database
          await collection.insertMany(INITIAL_REQUESTS);
          bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();
        }
        // Sanitize MongoDB _id
        const sanitized = bookings.map(({ _id, ...rest }) => rest);
        return res.status(200).json({ success: true, data: sanitized, source: 'mongodb' });
      }

      return res.status(200).json({ success: true, data: fallbackBookings, source: 'memory' });
    }

    // -----------------------------------------------------------------------
    // POST: Create a new booking request
    // -----------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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
        return res.status(201).json({ success: true, data: newBooking, source: 'mongodb' });
      }

      fallbackBookings.unshift(newBooking);
      return res.status(201).json({ success: true, data: newBooking, source: 'memory' });
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
          return res.status(200).json({ success: true, data: rest, source: 'mongodb' });
        }
      }

      const idx = fallbackBookings.findIndex((b) => b.id === id);
      if (idx !== -1) {
        fallbackBookings[idx] = { ...fallbackBookings[idx], ...updateFields };
        return res.status(200).json({ success: true, data: fallbackBookings[idx], source: 'memory' });
      }

      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // -----------------------------------------------------------------------
    // DELETE: Remove a booking request
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = body?.id || req.query?.id;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Booking ID required' });
      }

      if (collection) {
        await collection.deleteOne({ id });
        return res.status(200).json({ success: true, deletedId: id, source: 'mongodb' });
      }

      fallbackBookings = fallbackBookings.filter((b) => b.id !== id);
      return res.status(200).json({ success: true, deletedId: id, source: 'memory' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in /api/bookings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
