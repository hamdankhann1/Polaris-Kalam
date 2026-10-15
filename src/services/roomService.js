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
// Seed dataset categorized by 4 floors and 1 top suite
// Clean slate: all rooms 100% open with zero placeholder date locks
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

  // --- FLOOR 3 (SUMMIT & FALCON WING) ---
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

  // --- FLOOR 1 (FOREST & VALLEY LEVEL) ---
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

// Helper: Listeners for real-time reactive updates
const listeners = new Set();

function notifyListeners(rooms) {
  listeners.forEach((listener) => {
    try {
      listener([...rooms]);
    } catch (e) {
      console.error('Error notifying room listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('polaris:room-update', { detail: rooms }));
    } catch (err) {}
  }
}

let auditHistory = [];

/**
 * Log an audit action to history (kept in runtime memory)
 */
function logAudit(action, roomId, roomNumber, details) {
  const entry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    action,
    roomId,
    roomNumber,
    details,
    staff: 'Front Desk Duty'
  };
  auditHistory.unshift(entry);
  if (auditHistory.length > 50) auditHistory.pop();
}

const DEMO_RANGE_IDS = new Set([
  'b-501-1',
  'b-401-1',
  'b-301-1',
  'b-301-2',
  'b-201-1',
  'b-202-1',
  'b-101-1'
]);

function isDemoRange(range) {
  if (!range) return false;
  if (range.id && (DEMO_RANGE_IDS.has(range.id) || String(range.id).startsWith('b-demo-'))) return true;
  return false;
}

export function cleanRoom(room) {
  if (!room) return room;
  const isDemoActive = room.activeBooking && room.activeBooking.bookingRef && ['PK-9821', 'PK-4412'].includes(room.activeBooking.bookingRef);

  const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cleanedRanges = Array.isArray(room.bookedRanges)
    ? room.bookedRanges.filter((b) => !isDemoRange(b) && (!b.checkOut || typeof b.checkOut !== 'string' || b.checkOut.length < 10 || b.checkOut >= ninetyDaysAgoYMD))
    : [];

  return {
    ...room,
    activeBooking: isDemoActive ? null : (room.activeBooking || null),
    bookedRanges: cleanedRanges
  };
}

// Purge all legacy localStorage room keys so no persistent storage remains in browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('polaris_hotel_rooms_v4');
    localStorage.removeItem('polaris_hotel_rooms_v3');
    localStorage.removeItem('polaris_hotel_rooms_v2');
    localStorage.removeItem('polaris_hotel_rooms');
    localStorage.removeItem('polaris_rooms_inventory_v3');
    localStorage.removeItem('polaris_room_audit_log_v2');
  } catch (e) {}
}

let cachedRooms = [];
let lastDbConnection = { dbConnected: false, source: 'unknown', dbError: null, lastSyncedAt: null };

export const RoomService = {
  /**
   * Subscribe to room status changes in real-time
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getConnectionStatus() {
    return { ...lastDbConnection };
  },

  /**
   * Fetch all rooms directly from database API (/api/rooms).
   * Ensures mobile phones, laptops, and staff desks see the exact same database inventory.
   */
  async getRooms(force = false) {
    try {
      const res = await fetch(`/api/rooms?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const json = await res.json();
        lastDbConnection = {
          dbConnected: Boolean(json.dbConnected || json.source === 'mongodb'),
          source: json.source || (json.dbConnected ? 'mongodb' : 'memory'),
          dbError: json.dbError || null,
          envDetected: Boolean(json.envDetected),
          envKey: json.envKey || null,
          lastSyncedAt: new Date().toISOString()
        };

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const cleaned = json.data.map(cleanRoom);
          cachedRooms = cleaned;
          notifyListeners(cleaned);
          return [...cleaned];
        }
      } else {
        const errJson = await res.json().catch(() => null);
        lastDbConnection = {
          dbConnected: false,
          source: 'error',
          dbError: errJson?.error || `HTTP ${res.status} ${res.statusText}`,
          envDetected: false,
          envKey: null,
          lastSyncedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('[RoomService] Database API unreachable:', e);
      lastDbConnection = {
        dbConnected: false,
        source: 'network_error',
        dbError: e.message || 'Network request failed',
        envDetected: false,
        envKey: null,
        lastSyncedAt: new Date().toISOString()
      };
    }

    if (cachedRooms.length > 0) {
      return [...cachedRooms];
    }
    return INITIAL_ROOMS.map(cleanRoom);
  },

  /**
   * Force sync with database API
   */
  async syncWithCloud() {
    return this.getRooms(true);
  },

  /**
   * Get audit history log (in-memory)
   */
  async getAuditLog() {
    return [...auditHistory];
  },

  /**
   * Add a new room -> immediately persists to database
   */
  async addRoom(roomData) {
    const newRoom = {
      id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      roomNumber: roomData.roomNumber.trim(),
      name: roomData.name.trim(),
      tier: roomData.tier || 'Deluxe Alpine',
      floor: roomData.floor || 'Floor 1',
      capacity: roomData.capacity || '2 Guests • 1 King Bed',
      pricePKR: Number(roomData.pricePKR) || 45000,
      status: roomData.status || 'available',
      amenities: Array.isArray(roomData.amenities)
        ? roomData.amenities
        : (roomData.amenities || 'Scenic Mountain View, Private Bath, Climate Control')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      activeBooking: null,
      bookedRanges: Array.isArray(roomData.bookedRanges) ? roomData.bookedRanges : [],
      cleaningInfo: null,
      lastCleanedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save new room to database.');
    }

    logAudit('ROOM_CREATED', newRoom.id, newRoom.roomNumber, {
      name: newRoom.name,
      floor: newRoom.floor,
      pricePKR: newRoom.pricePKR,
      status: newRoom.status
    });

    await this.getRooms(true);
    return newRoom;
  },

  /**
   * Remove / Delete a room -> immediately deletes from database
   */
  async deleteRoom(roomId) {
    const res = await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: roomId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete room from database.');
    }

    logAudit('ROOM_DELETED', roomId, '', {});
    await this.getRooms(true);
    return { id: roomId };
  },

  /**
   * Update Room Price per night (PKR) -> persists to database
   */
  async updatePrice(roomId, newPricePKR) {
    const price = Number(newPricePKR);
    if (isNaN(price) || price <= 0) {
      throw new Error('Please enter a valid positive price per night.');
    }
    return this.updateRoom(roomId, { pricePKR: price });
  },

  /**
   * Update room specifications / fields -> persists to database
   */
  async updateRoom(roomId, fields = {}) {
    const payload = {
      id: roomId,
      ...fields,
      updatedAt: new Date().toISOString()
    };
    if (fields.roomNumber) payload.roomNumber = fields.roomNumber.trim();
    if (fields.name) payload.name = fields.name.trim();
    if (fields.pricePKR !== undefined) payload.pricePKR = Number(fields.pricePKR);
    if (fields.amenities) {
      payload.amenities = Array.isArray(fields.amenities)
        ? fields.amenities
        : fields.amenities.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update room in database.');
    }

    logAudit('ROOM_UPDATED', roomId, fields.roomNumber || '', fields);
    const freshRooms = await this.getRooms(true);
    return freshRooms.find((r) => r.id === roomId) || payload;
  },

  /**
   * Update a room's operational status ('available' or 'in cleaning'),
   * or lock specific dates if 'booked' is passed.
   */
  async updateStatus(roomId, newStatus, meta = {}) {
    let current = cachedRooms.find((r) => r.id === roomId);
    if (!current) {
      const fresh = await this.getRooms();
      current = fresh.find((r) => r.id === roomId);
    }

    const updates = {
      id: roomId,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'booked') {
      updates.status = 'available';
      if (meta.checkIn && meta.checkOut) {
        const bookingEntry = {
          id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          guestName: meta.guestName || 'VIP Guest (Direct Booking)',
          checkIn: meta.checkIn,
          checkOut: meta.checkOut,
          source: meta.source || 'Staff CMS Date Block',
          notes: meta.notes || '',
          bookingRef: meta.bookingRef || 'PK-' + Math.floor(1000 + Math.random() * 9000),
          createdAt: new Date().toISOString()
        };
        updates.activeBooking = bookingEntry;

        const currentRanges = Array.isArray(current?.bookedRanges) ? [...current.bookedRanges] : [];
        if (!currentRanges.some((b) => b.checkIn === bookingEntry.checkIn && b.checkOut === bookingEntry.checkOut)) {
          currentRanges.push(bookingEntry);
        }
        updates.bookedRanges = currentRanges;
      }
    } else if (newStatus === 'in cleaning') {
      updates.status = 'in cleaning';
      updates.cleaningInfo = {
        assignedTo: meta.assignedTo || 'Housekeeping Duty Team',
        priority: meta.priority || 'Standard Turnover',
        notes: meta.notes || 'Turnover initiated from front desk',
        startedAt: new Date().toISOString()
      };
      updates.activeBooking = null;
    } else if (newStatus === 'available') {
      updates.status = 'available';
      updates.activeBooking = null;
      updates.cleaningInfo = null;
      updates.lastCleanedAt = new Date().toISOString();
    }

    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update room status in database.');
    }

    logAudit('STATUS_UPDATED', roomId, current?.roomNumber || '', { status: newStatus, meta });
    const fresh = await this.getRooms(true);
    return fresh.find((r) => r.id === roomId) || updates;
  },

  async markAvailable(roomId, inspectedBy = 'Front Desk Duty') {
    return this.updateStatus(roomId, 'available', { inspectedBy });
  },

  /**
   * Synchronously compute all occupied dates (YYYY-MM-DD) for a room
   */
  getBookedDatesForRoomSync(room, requests = []) {
    if (!room) return [];
    const bookedSet = new Set();

    if (room.activeBooking && room.activeBooking.checkIn && room.activeBooking.checkOut) {
      const dates = getBookedNightsInRange(room.activeBooking.checkIn, room.activeBooking.checkOut);
      dates.forEach((d) => bookedSet.add(d));
    }

    if (Array.isArray(room.bookedRanges)) {
      room.bookedRanges.forEach((range) => {
        if (range && range.checkIn && range.checkOut) {
          const dates = getBookedNightsInRange(range.checkIn, range.checkOut);
          dates.forEach((d) => bookedSet.add(d));
        }
      });
    }

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

  async getBookedDatesForRoom(roomId) {
    const rooms = await this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return [];
    return this.getBookedDatesForRoomSync(room, []);
  },

  /**
   * Add a scheduled booked date range for a room -> persists to database
   */
  async addBookedRange(roomId, range) {
    let current = cachedRooms.find((r) => r.id === roomId);
    if (!current) {
      const fresh = await this.getRooms();
      current = fresh.find((r) => r.id === roomId);
    }
    if (!current) throw new Error('Room not found');

    const newEntry = {
      id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      guestName: range.guestName || 'VIP Guest',
      source: range.source || 'Manual Calendar Block',
      createdAt: new Date().toISOString()
    };

    const updatedRanges = Array.isArray(current.bookedRanges) ? [...current.bookedRanges, newEntry] : [newEntry];

    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: roomId,
        bookedRanges: updatedRanges,
        updatedAt: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save date block to database.');
    }

    await this.getRooms(true);
    return newEntry;
  },

  /**
   * Remove a scheduled booked date range -> persists to database
   */
  async removeBookedRange(roomId, rangeId) {
    let current = cachedRooms.find((r) => r.id === roomId);
    if (!current) {
      const fresh = await this.getRooms();
      current = fresh.find((r) => r.id === roomId);
    }
    if (!current) throw new Error('Room not found');

    const updatedRanges = (current.bookedRanges || []).filter((b) => b.id !== rangeId);

    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: roomId,
        bookedRanges: updatedRanges,
        updatedAt: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove date block from database.');
    }

    await this.getRooms(true);
    return current;
  },

  /**
   * Reset database inventory to default initial suites
   */
  async resetToDefaults() {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset database inventory.');
    }

    const fresh = await this.getRooms(true);
    return fresh;
  },

  calculateStats(rooms) {
    const total = rooms.length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const inCleaning = rooms.filter((r) => r.status === 'in cleaning').length;
    const hasBookedRanges = rooms.filter((r) => Array.isArray(r.bookedRanges) && r.bookedRanges.length > 0).length;
    const booked = hasBookedRanges;
    const occupancyRate = total > 0 ? Math.round((hasBookedRanges / total) * 100) : 0;

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

// Automatic real-time background sync every 3 seconds while active
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      RoomService.getRooms().catch(() => {});
    }
  }, 3000);

  window.addEventListener('focus', () => {
    RoomService.getRooms().catch(() => {});
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      RoomService.getRooms().catch(() => {});
    }
  });
}
