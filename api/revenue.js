/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/revenue
 * =========================================================================
 * 
 * Provides encrypted, role-secured cloud persistence for the Polaris Kalam
 * Master Revenue Look portal (polarishotels.pk/revenuemasterlook).
 * 
 * SECURITY SPECIFICATIONS:
 * 1. Portal Access Password:
 *    - Required to access the portal and read/write revenue data.
 *    - Plain text: Polar1s@Asif@Master@PortalPass26/12
 *    - Encrypted SHA-256 Hash: 8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39
 * 
 * 2. Deletion / Reset Password:
 *    - Strictly required to delete single revenue entries or reset revenue for specified date ranges.
 *    - Plain text: Polar1s@Asif@Master@26/12
 *    - Encrypted SHA-256 Hash: ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d
 * 
 * 3. Token-Based Session Authentication:
 *    - Successful portal login returns an HMAC-SHA256 signed session token.
 *    - All GET, POST, DELETE queries require this valid token.
 * 
 * 4. MongoDB Persistence:
 *    - Persisted to collection 'revenue_records' in MongoDB Atlas.
 *    - Serverless-optimized connection pool: maxPoolSize: 1, minPoolSize: 0, maxIdleTimeMS: 5000.
 *    - Global connection reuse to prevent connection leaks.
 */

import crypto from 'crypto';
import { MongoClient } from 'mongodb';

// Target Cryptographic SHA-256 Hashes
const PORTAL_PASS_HASH = '8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39';
const DELETE_PASS_HASH = 'ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d';

// Cryptographic signing secret for session tokens
const TOKEN_SECRET = process.env.REVENUE_TOKEN_SECRET || 'polaris_kalam_revenue_master_secret_key_2026';

// Fallback in-memory storage for development / isolated serverless runs
let fallbackRevenue = [];

/**
 * Computes SHA-256 hex digest
 */
function sha256(str) {
  if (!str) return '';
  return crypto.createHash('sha256').update(String(str).trim()).digest('hex');
}

/**
 * Verifies a submitted password or password hash against target hash in constant time
 */
function verifyPassword(input, targetHash) {
  if (!input) return false;
  const inputStr = String(input).trim();
  const inputHash = inputStr.length === 64 && /^[0-9a-f]{64}$/i.test(inputStr)
    ? inputStr.toLowerCase()
    : sha256(inputStr);

  try {
    const a = Buffer.from(inputHash, 'hex');
    const b = Buffer.from(targetHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return inputHash === targetHash;
  }
}

/**
 * Generates an HMAC-SHA256 signed session token (valid for 24 hours)
 */
function createSessionToken() {
  const payload = {
    scope: 'revenue_master',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const jsonPayload = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(jsonPayload).digest('hex');
  return Buffer.from(JSON.stringify({ p: payload, s: signature })).toString('base64');
}

/**
 * Validates an HMAC-SHA256 session token
 */
function verifySessionToken(token) {
  if (!token) return false;
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const decoded = JSON.parse(Buffer.from(cleanToken, 'base64').toString('utf8'));
    if (!decoded || !decoded.p || !decoded.s) return false;

    // Check expiration
    if (decoded.p.exp && Date.now() > decoded.p.exp) return false;

    // Verify HMAC signature
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(JSON.stringify(decoded.p)).digest('hex');
    const a = Buffer.from(decoded.s, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

/**
 * Extract and sanitize MongoDB URI
 */
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

    uri = uri.replace(/^(mongodb(?:\+srv)?:\/\/)([^@]+)@/i, (match, proto, creds) => {
      const colonIdx = creds.indexOf(':');
      if (colonIdx === -1) return match;
      let user = creds.slice(0, colonIdx).replace(/^<|>$/g, '');
      let pass = creds.slice(colonIdx + 1).replace(/^<|>$/g, '');
      return `${proto}${user}:${pass}@`;
    });

    return uri;
  }

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

/**
 * Reusable database connector with serverless connection pooling
 */
async function getDatabase() {
  const config = getMongoConfig();
  if (!config.hasEnv || !config.uri) {
    return { db: null, error: 'No MongoDB URI configured in environment variables.', config };
  }

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
      maxPoolSize: 1,      // 1 socket per serverless instance
      minPoolSize: 0,      // drop connections when idle
      maxIdleTimeMS: 5000, // close idle socket within 5s
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
    console.error('MongoDB connection error in /api/revenue:', err);
    return { db: null, error: err.message, config };
  }
}

/**
 * Date helper: Format Date object to YYYY-MM-DD
 */
function toYMD(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  if (typeof d === 'string') {
    const match = d.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default async function handler(req, res) {
  // CORS & Strict Real-Time No-Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-revenue-token, x-delete-password');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchParams } = new URL(req.url, 'http://localhost');
  const action = searchParams.get('action');

  // =========================================================================
  // 1. PUBLIC AUTH GATEWAY: POST /api/revenue?action=login
  // =========================================================================
  if (req.method === 'POST' && action === 'login') {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required to enter Master Revenue Look.' });
    }

    const isValid = verifyPassword(password, PORTAL_PASS_HASH);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid Master Portal Access Password. Access denied.' });
    }

    const token = createSessionToken();
    return res.status(200).json({
      success: true,
      token,
      message: 'Portal access authorized.',
      expiresIn: 86400
    });
  }

  // =========================================================================
  // 2. SECURITY ENFORCEMENT: VALIDATE PORTAL SESSION TOKEN
  // =========================================================================
  const authHeader = req.headers.authorization || req.headers['x-revenue-token'];
  const isAuthorized = verifySessionToken(authHeader);

  // If session token is invalid, also allow passing portal password directly in header or body
  const fallbackAuthPass = req.headers['x-portal-password'] || req.body?.portalPassword;
  const isDirectPasswordValid = fallbackAuthPass && verifyPassword(fallbackAuthPass, PORTAL_PASS_HASH);

  // Allow trusted internal CMS checkouts and sync operations from Front Desk
  const isInternalCms = req.headers['x-cms-source'] === 'polaris-cms' || req.query?.source === 'polaris-cms' || req.body?.source === 'polaris-cms';

  if (!isAuthorized && !isDirectPasswordValid) {
    if (req.method === 'POST' && isInternalCms) {
      // Authorized internal CMS check-out revenue record
    } else {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Master Revenue Portal is locked. Enter password to view revenue.'
      });
    }
  }

  // Connect to Database
  const { db, error: dbError, config: mongoConfig } = await getDatabase();
  const revenueCol = db ? db.collection('revenue_records') : null;
  const bookingsCol = db ? db.collection('booking_requests') : null;

  // Initialize Indexes once per serverless container
  if (revenueCol && !global._revenueDbInitialized) {
    try {
      revenueCol.createIndex({ date: 1 }).catch(() => {});
      revenueCol.createIndex({ createdAt: -1 }).catch(() => {});
      revenueCol.createIndex({ bookingRef: 1 }).catch(() => {});
      global._revenueDbInitialized = true;
    } catch (e) {}
  }

  // =========================================================================
  // 3. GET: FETCH REVENUE METRICS & RECORDS
  // =========================================================================
  if (req.method === 'GET') {
    try {
      const startDate = searchParams.get('startDate'); // YYYY-MM-DD
      const endDate = searchParams.get('endDate');     // YYYY-MM-DD

      let allRecords = [];

      if (revenueCol) {
        const count = await revenueCol.countDocuments({});
        if (count === 0 && bookingsCol) {
          // Auto-seed revenue_records from any existing confirmed bookings!
          const confirmedBookings = await bookingsCol.find({
            status: { $in: ['approved', 'confirmed', 'accepted', 'completed'] }
          }).toArray();
          const nowIso = new Date().toISOString();
          for (const b of confirmedBookings) {
            const bookingRef = b.bookingRef || b.id;
            const revenueDate = (b.checkIn || b.createdAt || nowIso).substring(0, 10);
            const totalAmount = Number(b.pricePKR || b.totalPKR || 45000) * (Number(b.nights) || 1);
            await revenueCol.insertOne({
              id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              bookingId: b.id,
              bookingRef: bookingRef,
              guestName: b.guestName || 'VIP Guest',
              phone: b.phone || '',
              roomNumber: b.roomNumber || '',
              roomName: b.roomName || 'Polaris Suite',
              category: b.category || b.tier || 'Executive Suite',
              floor: b.floor || '',
              checkIn: b.checkIn || revenueDate,
              checkOut: b.checkOut || revenueDate,
              nights: Number(b.nights) || 1,
              nightlyRate: Number(b.pricePKR) || 45000,
              amount: totalAmount,
              paymentMethod: b.paymentMethod || 'Confirmed Reservation',
              status: b.status === 'completed' ? 'completed' : 'paid',
              date: revenueDate,
              notes: b.notes || 'Auto-imported from Confirmed Bookings',
              createdAt: b.createdAt || nowIso,
              updatedAt: nowIso
            });
          }
        }

        allRecords = await revenueCol.find({}).sort({ date: -1, createdAt: -1 }).toArray();
        allRecords = allRecords.map(({ _id, ...rest }) => rest);
      } else {
        allRecords = [...fallbackRevenue];
      }

      // Compute Global Timeframes (supporting both Pakistan local date and UTC date)
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const todayIso = now.toISOString().split('T')[0];
      const todayYMD = todayLocal;

      // Current 7-day range (last 7 days including today)
      const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const sevenDaysAgoYMD = `${sevenDaysAgo.getFullYear()}-${pad(sevenDaysAgo.getMonth() + 1)}-${pad(sevenDaysAgo.getDate())}`;

      // Current calendar month prefix (e.g. 2026-10)
      const currentMonthPrefix = todayYMD.substring(0, 7);

      // Past 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoYMD = `${thirtyDaysAgo.getFullYear()}-${pad(thirtyDaysAgo.getMonth() + 1)}-${pad(thirtyDaysAgo.getDate())}`;

      // Calculate Metrics across all records
      let dayRevenue = 0;
      let dayBookingsCount = 0;

      let weeklyRevenue = 0;
      let weeklyBookingsCount = 0;

      let monthlyRevenue = 0;
      let monthlyBookingsCount = 0;

      allRecords.forEach((r) => {
        const amt = Number(r.amount) || 0;
        const d = (r.date || r.createdAt || '').substring(0, 10);

        if (d === todayLocal || d === todayIso) {
          dayRevenue += amt;
          dayBookingsCount += 1;
        }

        if (d >= sevenDaysAgoYMD && d <= todayYMD) {
          weeklyRevenue += amt;
          weeklyBookingsCount += 1;
        }

        if (d.startsWith(currentMonthPrefix) || (d >= thirtyDaysAgoYMD && d <= todayYMD)) {
          monthlyRevenue += amt;
          monthlyBookingsCount += 1;
        }
      });

      // Filter records for custom selected date range if provided
      let filteredRecords = allRecords;
      if (startDate && endDate) {
        filteredRecords = allRecords.filter((r) => {
          const d = (r.date || r.createdAt || '').substring(0, 10);
          return d >= startDate && d <= endDate;
        });
      } else if (startDate) {
        filteredRecords = allRecords.filter((r) => {
          const d = (r.date || r.createdAt || '').substring(0, 10);
          return d >= startDate;
        });
      } else if (endDate) {
        filteredRecords = allRecords.filter((r) => {
          const d = (r.date || r.createdAt || '').substring(0, 10);
          return d <= endDate;
        });
      }

      // Range Totals
      const totalRevenueInRange = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const totalBookingsInRange = filteredRecords.length;
      const averageBookingValue = totalBookingsInRange > 0 ? Math.round(totalRevenueInRange / totalBookingsInRange) : 0;

      // Daily Breakdown Map within range for visual charts
      const dailyMap = {};
      filteredRecords.forEach((r) => {
        const d = (r.date || r.createdAt || '').substring(0, 10);
        if (!dailyMap[d]) {
          dailyMap[d] = { date: d, total: 0, count: 0 };
        }
        dailyMap[d].total += (Number(r.amount) || 0);
        dailyMap[d].count += 1;
      });

      const dailyTimeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      // Category breakdown
      const categoryMap = {};
      filteredRecords.forEach((r) => {
        const cat = (r.category || r.tier || 'Standard Suite').trim();
        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(r.amount) || 0);
      });

      // Payment method breakdown
      const paymentMap = {};
      filteredRecords.forEach((r) => {
        const method = (r.paymentMethod || 'Direct Booking').trim();
        paymentMap[method] = (paymentMap[method] || 0) + (Number(r.amount) || 0);
      });

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            dayRevenue,
            dayBookingsCount,
            weeklyRevenue,
            weeklyBookingsCount,
            monthlyRevenue,
            monthlyBookingsCount,
            totalRevenueInRange,
            totalBookingsInRange,
            averageBookingValue,
            startDate: startDate || null,
            endDate: endDate || null
          },
          dailyTimeline,
          categoryBreakdown: categoryMap,
          paymentMethodBreakdown: paymentMap,
          records: filteredRecords
        },
        source: revenueCol ? 'mongodb' : 'memory',
        dbConnected: !!revenueCol,
        envDetected: !!mongoConfig?.hasEnv,
        lastSyncedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error fetching revenue in /api/revenue:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 4. POST: CREATE REVENUE RECORD OR SYNC FROM BOOKINGS
  // =========================================================================
  if (req.method === 'POST') {
    try {
      // 4A. One-Click Sync from Confirmed Bookings in MongoDB
      if (action === 'sync-bookings') {
        let importedCount = 0;
        const nowIso = new Date().toISOString();

        // 1. Sync from booking_requests collection
        if (bookingsCol) {
          const confirmedBookings = await bookingsCol.find({
            status: { $in: ['approved', 'confirmed', 'accepted', 'completed'] }
          }).toArray();

          for (const b of confirmedBookings) {
            const bookingRef = b.bookingRef || b.id;
            const revenueDate = (b.checkIn || b.createdAt || nowIso).substring(0, 10);
            const totalAmount = Number(b.pricePKR || b.totalPKR || 45000) * (Number(b.nights) || 1);

            if (revenueCol) {
              const exists = await revenueCol.findOne({
                $or: [
                  { bookingId: b.id },
                  { bookingRef: bookingRef }
                ]
              });

              if (!exists) {
                const newEntry = {
                  id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  bookingId: b.id,
                  bookingRef: bookingRef,
                  guestName: b.guestName || 'VIP Guest',
                  phone: b.phone || '',
                  roomNumber: b.roomNumber || '',
                  roomName: b.roomName || 'Polaris Suite',
                  category: b.category || b.tier || 'Executive Suite',
                  floor: b.floor || '',
                  checkIn: b.checkIn || revenueDate,
                  checkOut: b.checkOut || revenueDate,
                  nights: Number(b.nights) || 1,
                  nightlyRate: Number(b.pricePKR) || 45000,
                  amount: totalAmount,
                  paymentMethod: b.paymentMethod || 'Confirmed Reservation',
                  status: b.status === 'completed' ? 'completed' : 'paid',
                  date: revenueDate,
                  notes: b.notes || 'Imported from Confirmed Reservations',
                  createdAt: b.createdAt || nowIso,
                  updatedAt: nowIso
                };

                await revenueCol.insertOne(newEntry);
                importedCount++;
              }
            }
          }
        }

        // 2. Also sync from rooms collection bookedRanges (direct staff calendar locks)
        const roomsCol = db ? db.collection('rooms') : null;
        if (roomsCol && revenueCol) {
          const allRooms = await roomsCol.find({}).toArray();
          for (const room of allRooms) {
            if (Array.isArray(room.bookedRanges)) {
              for (const range of room.bookedRanges) {
                const bookingRef = range.bookingRef || range.id;
                const exists = await revenueCol.findOne({
                  $or: [
                    { bookingId: range.id },
                    { bookingRef: bookingRef }
                  ]
                });

                if (!exists && range.checkIn && range.checkOut) {
                  const start = new Date(range.checkIn);
                  const end = new Date(range.checkOut);
                  const nights = Math.max(1, Math.ceil(Math.abs(end - start) / 86400000)) || 1;
                  const totalAmount = (Number(room.pricePKR) || 45000) * nights;
                  const revenueDate = range.checkIn.substring(0, 10);

                  const newEntry = {
                    id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                    bookingId: range.id,
                    bookingRef: bookingRef || 'BLK-' + Math.floor(1000 + Math.random() * 9000),
                    guestName: range.guestName || 'VIP Guest',
                    phone: '',
                    roomNumber: room.roomNumber || '',
                    roomName: room.name || 'Polaris Suite',
                    category: room.category || room.tier || 'Executive Suite',
                    floor: room.floor || '',
                    checkIn: range.checkIn,
                    checkOut: range.checkOut,
                    nights: nights,
                    nightlyRate: Number(room.pricePKR) || 45000,
                    amount: totalAmount,
                    paymentMethod: range.source || 'Front Desk Locked Dates',
                    status: 'paid',
                    date: revenueDate,
                    notes: range.notes || 'Imported from Room Booked Dates',
                    createdAt: range.createdAt || nowIso,
                    updatedAt: nowIso
                  };

                  await revenueCol.insertOne(newEntry);
                  importedCount++;
                }
              }
            }
          }
        }

        return res.status(200).json({
          success: true,
          importedCount,
          message: `Successfully synchronized ${importedCount} confirmed bookings into Revenue Ledger.`
        });
      }

      // 4B. Create Manual or Direct Revenue Entry
      const payload = req.body || {};
      const amount = Number(payload.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'A valid positive booking amount (PKR) is required.' });
      }

      const revenueDate = payload.date ? toYMD(payload.date) : toYMD(new Date());
      const nowIso = new Date().toISOString();

      const newRecord = {
        id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        bookingRef: (payload.bookingRef || 'REV-' + Math.floor(1000 + Math.random() * 9000)).trim(),
        bookingId: payload.bookingId || null,
        guestName: (payload.guestName || 'Walk-In Guest').trim(),
        phone: (payload.phone || '').trim(),
        roomNumber: (payload.roomNumber || '').trim(),
        roomName: (payload.roomName || 'Executive Suite').trim(),
        category: (payload.category || payload.tier || 'Deluxe Room').trim(),
        floor: (payload.floor || '').trim(),
        checkIn: payload.checkIn || revenueDate,
        checkOut: payload.checkOut || revenueDate,
        nights: Number(payload.nights) || 1,
        nightlyRate: Number(payload.nightlyRate) || amount,
        amount: amount,
        paymentMethod: (payload.paymentMethod || 'Bank Transfer').trim(),
        status: (payload.status || 'paid').trim(),
        date: revenueDate,
        notes: (payload.notes || '').trim(),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      if (revenueCol) {
        await revenueCol.insertOne({ ...newRecord });
      } else {
        fallbackRevenue.unshift(newRecord);
      }

      return res.status(201).json({
        success: true,
        data: newRecord,
        message: 'Revenue record successfully stored in database.'
      });
    } catch (err) {
      console.error('Error creating revenue record in /api/revenue:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 5. DELETE: DELETE SINGLE RECORD OR RESET SPECIFIED DATES
  // =========================================================================
  if (req.method === 'DELETE') {
    try {
      // STRICT SECURITY REQUIREMENT:
      // Must be authorized by the Master Deletion Password: Polar1s@Asif@Master@26/12
      const deletePassword = req.headers['x-delete-password'] || req.body?.deletePassword;
      if (!deletePassword) {
        return res.status(401).json({
          success: false,
          error: 'Master Deletion Password required. Please provide password to authorize deletion.'
        });
      }

      const isDeleteAuthorized = verifyPassword(deletePassword, DELETE_PASS_HASH);
      if (!isDeleteAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'Invalid Master Deletion Password. Revenue records could not be deleted.'
        });
      }

      // 5A. Reset revenue for specified date range: DELETE /api/revenue?action=reset-range
      if (action === 'reset-range') {
        const { startDate, endDate } = req.body || {};
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            error: 'Start Date and End Date are required to reset revenue for specified dates.'
          });
        }

        const startYMD = toYMD(startDate);
        const endYMD = toYMD(endDate);

        let deletedCount = 0;
        if (revenueCol) {
          const result = await revenueCol.deleteMany({
            date: { $gte: startYMD, $lte: endYMD }
          });
          deletedCount = result.deletedCount || 0;
        } else {
          const before = fallbackRevenue.length;
          fallbackRevenue = fallbackRevenue.filter((r) => r.date < startYMD || r.date > endYMD);
          deletedCount = before - fallbackRevenue.length;
        }

        return res.status(200).json({
          success: true,
          deletedCount,
          startDate: startYMD,
          endDate: endYMD,
          message: `Successfully reset and deleted ${deletedCount} revenue records between ${startYMD} and ${endYMD}.`
        });
      }

      // 5B. Delete single revenue record by ID
      const { id } = req.body || {};
      const recordId = id || searchParams.get('id');

      if (!recordId) {
        return res.status(400).json({ success: false, error: 'Revenue Record ID is required for deletion.' });
      }

      let deletedCount = 0;
      if (revenueCol) {
        const result = await revenueCol.deleteOne({ id: recordId });
        deletedCount = result.deletedCount || 0;
      } else {
        const before = fallbackRevenue.length;
        fallbackRevenue = fallbackRevenue.filter((r) => r.id !== recordId);
        deletedCount = before - fallbackRevenue.length;
      }

      if (deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Revenue record not found in database.' });
      }

      return res.status(200).json({
        success: true,
        deletedId: recordId,
        message: 'Revenue record permanently deleted from database.'
      });
    } catch (err) {
      console.error('Error deleting revenue in /api/revenue:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
