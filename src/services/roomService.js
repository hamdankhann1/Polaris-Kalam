/**
 * =========================================================================
 * POLARIS HOTEL — ROOM SERVICE & MASTER AVAILABILITY MANAGER
 * =========================================================================
 * 
 * Manages hotel rooms categorized across:
 * - Top Suite (Presidential Penthouse)
 * - Floor 4 (Starlight & Glacier Deck)
 * - Floor 3 (Summit & Falcon Wing)
 * - Floor 2 (River & Alpine Wing)
 * - Floor 1 (Forest & Valley Level)
 * 
 * Provides:
 * 1. Room Status Tracking (Available, Booked, In Cleaning)
 * 2. Add New Rooms
 * 3. Remove / Delete Rooms
 * 4. Update Room Nightly Prices & Specifications
 */

const STORAGE_KEY = 'polaris_hotel_rooms_v4';
const HISTORY_KEY = 'polaris_room_audit_log_v2';

// The 5 Official Architectural Categories: 4 Floors + 1 Top Suite
export const FLOOR_CATEGORIES = [
  'Top Suite',
  'Floor 4',
  'Floor 3',
  'Floor 2',
  'Floor 1'
];

/**
 * Helper: Given checkIn and checkOut (YYYY-MM-DD), return array of all occupied night dates [checkIn, checkOut)
 */
export function getBookedNightsInRange(checkIn, checkOut) {
  if (!checkIn) return [];
  const dates = [];
  const current = new Date(checkIn + 'T00:00:00');
  const end = checkOut ? new Date(checkOut + 'T00:00:00') : new Date(checkIn + 'T00:00:00');
  
  if (current.getTime() === end.getTime()) {
    const pad = (n) => String(n).padStart(2, '0');
    return [`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`];
  }

  while (current < end) {
    const pad = (n) => String(n).padStart(2, '0');
    dates.push(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Helper: Format a Date object to YYYY-MM-DD using local time
 */
export function formatYMD(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Seed dataset categorized by 4 floors and 1 top suite with calendar coordination
export const INITIAL_ROOMS = [
  // --- TOP SUITE (SUMMIT PENTHOUSE) ---
  {
    id: 'room-top-suite-501',
    roomNumber: '501',
    name: 'The Celestial Summit Penthouse',
    tier: 'Top Suite / Presidential',
    floor: 'Top Suite',
    capacity: '4 Guests • 1 Master Grand King + 1 Twin',
    pricePKR: 120000,
    status: 'available', // 'available' | 'booked' | 'in cleaning'
    amenities: [
      '360° Unobstructed Glacial Panorama',
      'Private Heated Cedar Plunge Pool',
      'Astronomical Stargazing Telescope',
      'Stone Hearth Fireplace',
      'Private Butler & Concierge Entry'
    ],
    activeBooking: null,
    // Coordinated calendar reservations for this suite
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

  // --- FLOOR 4 (STARLIGHT & GLACIER DECK) ---
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

  // --- FLOOR 3 (SUMMIT & FALCON WING) ---
  {
    id: 'room-301',
    roomNumber: '301',
    name: 'Falcon Peak Horizon Suite',
    tier: 'Presidential Suite',
    floor: 'Floor 3',
    capacity: '3 Guests • 1 King + 1 Daybed',
    pricePKR: 68000,
    status: 'booked',
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

  // --- FLOOR 2 (RIVER & GLACIAL WING) ---
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
    status: 'booked',
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

  // --- FLOOR 1 (FOREST & VALLEY LEVEL) ---
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

// Helper: Listeners for real-time reactive updates
const listeners = new Set();

function notifyListeners(rooms) {
  listeners.forEach((listener) => {
    try {
      listener(rooms);
    } catch (e) {
      console.error('Error notifying room listener:', e);
    }
  });
}

/**
 * Log an audit action to history
 */
function logAudit(action, roomId, roomNumber, details) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const entry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      roomId,
      roomNumber,
      details,
      staff: 'Front Desk Duty'
    };
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.error('Failed to log room audit:', err);
  }
}

export const RoomService = {
  /**
   * Subscribe to room status changes in real-time
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Fetch all rooms (immediate local cached read + background cloud sync)
   */
  async getRooms() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof window !== 'undefined') {
            setTimeout(() => this.syncWithCloud().catch(() => {}), 100);
          }
          return parsed.map((r) => ({
            ...r,
            bookedRanges: Array.isArray(r.bookedRanges) ? r.bookedRanges : []
          }));
        }
      }
      // Migrate from v2 if available
      const oldV2 = localStorage.getItem('polaris_hotel_rooms_v2');
      if (oldV2) {
        const parsed = JSON.parse(oldV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((r) => {
            const seed = INITIAL_ROOMS.find((s) => s.id === r.id);
            return {
              ...r,
              bookedRanges: Array.isArray(r.bookedRanges) && r.bookedRanges.length > 0
                ? r.bookedRanges
                : (seed?.bookedRanges || [])
            };
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial rooms');
    }
    // Initialize default seed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS));
    if (typeof window !== 'undefined') {
      setTimeout(() => this.syncWithCloud().catch(() => {}), 100);
    }
    return [...INITIAL_ROOMS];
  },

  /**
   * Sync with cloud /api/rooms (MongoDB Atlas on Vercel)
   */
  async syncWithCloud() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const current = localStorage.getItem(STORAGE_KEY);
          if (JSON.stringify(json.data) !== current) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
            notifyListeners(json.data);
          }
        }
      }
    } catch (e) {
      // offline / local fallback
    }
  },

  /**
   * Get audit history log
   */
  async getAuditLog() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Add a new room
   */
  async addRoom(roomData) {
    const rooms = await this.getRooms();

    // Check duplicate room number
    const duplicate = rooms.find(
      (r) => r.roomNumber.trim().toLowerCase() === roomData.roomNumber.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Room #${roomData.roomNumber} already exists in the inventory.`);
    }

    const newRoom = {
      id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      roomNumber: roomData.roomNumber.trim(),
      name: roomData.name.trim(),
      tier: roomData.tier || 'Deluxe Alpine',
      floor: roomData.floor || 'Floor 1',
      capacity: roomData.capacity || '2 Guests • 1 King Bed',
      pricePKR: Number(roomData.pricePKR) || 45000,
      status: roomData.status || 'available', // 'available' | 'booked' | 'in cleaning'
      amenities: Array.isArray(roomData.amenities)
        ? roomData.amenities
        : (roomData.amenities || 'Scenic Mountain View, Private Bath, Climate Control')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      activeBooking: roomData.status === 'booked' && roomData.activeBooking ? roomData.activeBooking : null,
      bookedRanges: Array.isArray(roomData.bookedRanges) ? roomData.bookedRanges : [],
      cleaningInfo: roomData.status === 'in cleaning' && roomData.cleaningInfo ? roomData.cleaningInfo : null,
      lastCleanedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    rooms.push(newRoom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    
    logAudit('ROOM_CREATED', newRoom.id, newRoom.roomNumber, {
      name: newRoom.name,
      floor: newRoom.floor,
      pricePKR: newRoom.pricePKR,
      status: newRoom.status
    });

    notifyListeners(rooms);
    return newRoom;
  },

  /**
   * Remove / Delete a room
   */
  async deleteRoom(roomId) {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);

    if (index === -1) {
      throw new Error(`Room with ID "${roomId}" not found.`);
    }

    const deletedRoom = rooms[index];
    rooms.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));

    logAudit('ROOM_DELETED', deletedRoom.id, deletedRoom.roomNumber, {
      name: deletedRoom.name,
      floor: deletedRoom.floor
    });

    notifyListeners(rooms);
    return deletedRoom;
  },

  /**
   * Update Room Price per night (PKR)
   */
  async updatePrice(roomId, newPricePKR) {
    const price = Number(newPricePKR);
    if (isNaN(price) || price <= 0) {
      throw new Error('Please enter a valid positive price per night.');
    }

    return this.updateRoom(roomId, { pricePKR: price });
  },

  /**
   * Update room specifications / fields
   */
  async updateRoom(roomId, fields = {}) {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);

    if (index === -1) {
      throw new Error(`Room with ID "${roomId}" not found.`);
    }

    const room = { ...rooms[index] };
    const prevPrice = room.pricePKR;

    // Apply allowed updates
    if (fields.roomNumber) room.roomNumber = fields.roomNumber.trim();
    if (fields.name) room.name = fields.name.trim();
    if (fields.floor) room.floor = fields.floor;
    if (fields.tier) room.tier = fields.tier;
    if (fields.capacity) room.capacity = fields.capacity;
    if (fields.pricePKR !== undefined) room.pricePKR = Number(fields.pricePKR);
    if (fields.amenities) {
      room.amenities = Array.isArray(fields.amenities)
        ? fields.amenities
        : fields.amenities.split(',').map((s) => s.trim()).filter(Boolean);
    }

    room.updatedAt = new Date().toISOString();
    rooms[index] = room;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));

    if (fields.pricePKR !== undefined && fields.pricePKR !== prevPrice) {
      logAudit('PRICE_CHANGED', room.id, room.roomNumber, {
        previousPrice: prevPrice,
        newPrice: room.pricePKR
      });
    } else {
      logAudit('ROOM_UPDATED', room.id, room.roomNumber, fields);
    }

    notifyListeners(rooms);
    return room;
  },

  /**
   * Update a room's status between: 'available', 'booked', and 'in cleaning'
   */
  async updateStatus(roomId, newStatus, meta = {}) {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);

    if (index === -1) {
      throw new Error(`Room with ID "${roomId}" not found.`);
    }

    const room = { ...rooms[index] };
    const prevStatus = room.status;

    room.status = newStatus;
    room.updatedAt = new Date().toISOString();

    if (newStatus === 'booked') {
      const bookingEntry = {
        id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        guestName: meta.guestName || 'VIP Guest (Direct Booking)',
        checkIn: meta.checkIn || new Date().toISOString().split('T')[0],
        checkOut: meta.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        source: meta.source || 'Other Hotel CMS (Sync)',
        notes: meta.notes || '',
        bookingRef: meta.bookingRef || 'PK-' + Math.floor(1000 + Math.random() * 9000),
        bookedAt: new Date().toISOString()
      };
      room.activeBooking = bookingEntry;
      room.cleaningInfo = null;

      // Synchronize into bookedRanges calendar
      room.bookedRanges = Array.isArray(room.bookedRanges) ? [...room.bookedRanges] : [];
      const alreadyHas = room.bookedRanges.some(
        (b) => b.checkIn === bookingEntry.checkIn && b.checkOut === bookingEntry.checkOut
      );
      if (!alreadyHas) {
        room.bookedRanges.push(bookingEntry);
      }

      logAudit('ROOM_MARKED_BOOKED', room.id, room.roomNumber, {
        guestName: room.activeBooking.guestName,
        source: room.activeBooking.source,
        checkIn: room.activeBooking.checkIn,
        checkOut: room.activeBooking.checkOut
      });

    } else if (newStatus === 'in cleaning') {
      room.cleaningInfo = {
        assignedTo: meta.assignedTo || 'Housekeeping Duty Team',
        priority: meta.priority || 'Standard Turnover',
        notes: meta.notes || 'Turnover initiated from front desk',
        startedAt: new Date().toISOString()
      };
      room.activeBooking = null;

      logAudit('ROOM_MARKED_CLEANING', room.id, room.roomNumber, {
        assignedTo: room.cleaningInfo.assignedTo,
        priority: room.cleaningInfo.priority,
        notes: room.cleaningInfo.notes
      });

    } else if (newStatus === 'available') {
      room.activeBooking = null;
      room.cleaningInfo = null;
      room.lastCleanedAt = new Date().toISOString();

      logAudit('ROOM_MARKED_AVAILABLE', room.id, room.roomNumber, {
        previousStatus: prevStatus,
        inspectedBy: meta.inspectedBy || 'Front Desk Supervisor',
        note: 'Inspected and certified ready for guest booking'
      });
    }

    rooms[index] = room;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    notifyListeners(rooms);
    return room;
  },

  /**
   * Quick action: Mark room as available immediately
   */
  async markAvailable(roomId, inspectedBy = 'Front Desk Duty') {
    return this.updateStatus(roomId, 'available', { inspectedBy });
  },

  /**
   * Synchronously compute all occupied dates (YYYY-MM-DD) for a room,
   * combining activeBooking, bookedRanges, and any approved booking requests.
   */
  getBookedDatesForRoomSync(room, requests = []) {
    if (!room) return [];
    const bookedSet = new Set();

    // 1. Current active booking on the room
    if (room.activeBooking && room.activeBooking.checkIn && room.activeBooking.checkOut) {
      const dates = getBookedNightsInRange(room.activeBooking.checkIn, room.activeBooking.checkOut);
      dates.forEach((d) => bookedSet.add(d));
    }

    // 2. All scheduled reservations / blocks in room.bookedRanges
    if (Array.isArray(room.bookedRanges)) {
      room.bookedRanges.forEach((range) => {
        if (range && range.checkIn && range.checkOut) {
          const dates = getBookedNightsInRange(range.checkIn, range.checkOut);
          dates.forEach((d) => bookedSet.add(d));
        }
      });
    }

    // 3. Any approved or pending booking requests for this room
    if (Array.isArray(requests)) {
      requests
        .filter((req) => req.roomId === room.id && (req.status === 'approved' || req.status === 'pending') && req.checkIn && req.checkOut)
        .forEach((req) => {
          const dates = getBookedNightsInRange(req.checkIn, req.checkOut);
          dates.forEach((d) => bookedSet.add(d));
        });
    }

    return Array.from(bookedSet).sort();
  },

  /**
   * Asynchronously compute all occupied dates for a room by ID
   */
  async getBookedDatesForRoom(roomId) {
    const rooms = await this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return [];

    let requests = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('polaris_booking_requests_v2');
        if (raw) requests = JSON.parse(raw);
      }
    } catch (e) {
      // silent
    }

    return this.getBookedDatesForRoomSync(room, requests);
  },

  /**
   * Add a scheduled booked date range for a room
   */
  async addBookedRange(roomId, range) {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);
    if (index === -1) throw new Error('Room not found');

    const room = { ...rooms[index] };
    room.bookedRanges = Array.isArray(room.bookedRanges) ? [...room.bookedRanges] : [];
    const newEntry = {
      id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      guestName: range.guestName || 'VIP Guest',
      source: range.source || 'Manual Calendar Block',
      createdAt: new Date().toISOString()
    };
    room.bookedRanges.push(newEntry);
    rooms[index] = room;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    notifyListeners(rooms);
    return newEntry;
  },

  /**
   * Remove a scheduled booked date range
   */
  async removeBookedRange(roomId, rangeId) {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);
    if (index === -1) throw new Error('Room not found');

    const room = { ...rooms[index] };
    if (Array.isArray(room.bookedRanges)) {
      room.bookedRanges = room.bookedRanges.filter((b) => b.id !== rangeId);
      rooms[index] = room;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      notifyListeners(rooms);
    }
    return room;
  },

  /**
   * Reset rooms back to default seed state
   */
  async resetToDefaults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS));
    localStorage.removeItem(HISTORY_KEY);
    notifyListeners(INITIAL_ROOMS);
    return [...INITIAL_ROOMS];
  },

  /**
   * Calculate summary KPI stats for dashboard
   */
  calculateStats(rooms) {
    const total = rooms.length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const booked = rooms.filter((r) => r.status === 'booked').length;
    const inCleaning = rooms.filter((r) => r.status === 'in cleaning').length;
    const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;

    // Floor counts
    const byCategory = {
      'Top Suite': rooms.filter((r) => r.floor === 'Top Suite').length,
      'Floor 4': rooms.filter((r) => r.floor === 'Floor 4').length,
      'Floor 3': rooms.filter((r) => r.floor === 'Floor 3').length,
      'Floor 2': rooms.filter((r) => r.floor === 'Floor 2').length,
      'Floor 1': rooms.filter((r) => r.floor === 'Floor 1').length,
    };

    return {
      total,
      available,
      booked,
      inCleaning,
      occupancyRate,
      byCategory
    };
  }
};
