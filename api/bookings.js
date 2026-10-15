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

// Initial seed requests (Empty - production database starts clean)
const INITIAL_REQUESTS = [];

const DEMO_REQUEST_IDS = ['req-101', 'req-102'];
const DEMO_GUEST_NAMES = [
  'Malik Zeeshan & Family',
  'Fatima Zahra Khan',
  'Ambassador Al-Mansoor',
  'Farhan Qureshi',
  'Syed Bilal Ahmad',
  'Zubair Shah',
  'Hassan Mir',
  'Dr. Ayesha Malik & Family',
  'Naveed Akhtar'
];

// Fallback in-memory storage for serverless runtime
let fallbackBookings = [];

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
    const db = await getDatabase();
    const collection = db ? db.collection('booking_requests') : null;

    // -----------------------------------------------------------------------
    // GET: Fetch all booking requests
    // -----------------------------------------------------------------------
    if (req.method === 'GET') {
      if (collection) {
        // Auto-purge records older than 3 months (90 days) & legacy demo requests
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgoYMD = ninetyDaysAgo.split('T')[0];

        try {
          await collection.deleteMany({
            $or: [
              { id: { $in: DEMO_REQUEST_IDS } },
              { guestName: { $in: DEMO_GUEST_NAMES } },
              { createdAt: { $lt: ninetyDaysAgo } },
              { checkOut: { $lt: ninetyDaysAgoYMD } }
            ]
          });
        } catch (e) {
          console.warn('MongoDB 3-month purge warning in /api/bookings:', e.message);
        }

        const bookings = await collection.find({}).sort({ createdAt: -1 }).toArray();
        // Sanitize MongoDB _id - NEVER re-seed demo requests
        const sanitized = bookings.map(({ _id, ...rest }) => rest);
        return res.status(200).json({ success: true, data: sanitized, source: 'mongodb' });
      }

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const ninetyDaysAgoYMD = ninetyDaysAgo.split('T')[0];

      fallbackBookings = fallbackBookings.filter(
        (b) => b && !DEMO_REQUEST_IDS.includes(b.id) && !DEMO_GUEST_NAMES.includes(b.guestName) &&
               (!b.createdAt || b.createdAt >= ninetyDaysAgo) &&
               (!b.checkOut || b.checkOut >= ninetyDaysAgoYMD)
      );
      return res.status(200).json({ success: true, data: fallbackBookings, source: 'memory' });
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
          return res.status(200).json({ success: true, data: [], source: 'mongodb' });
        }
        fallbackBookings = [];
        return res.status(200).json({ success: true, data: [], source: 'memory' });
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
    // DELETE: Remove a booking request OR Purge all
    // -----------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = body?.id || req.query?.id;
      const purgeAll = body?.all === true || req.query?.all === 'true';

      if (purgeAll) {
        if (collection) {
          await collection.deleteMany({});
          return res.status(200).json({ success: true, message: 'All booking requests purged', source: 'mongodb' });
        }
        fallbackBookings = [];
        return res.status(200).json({ success: true, message: 'All booking requests purged', source: 'memory' });
      }

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
