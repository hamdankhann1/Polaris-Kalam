/**
 * =========================================================================
 * POLARIS HOTEL — BOOKING REQUEST SERVICE (HYBRID CLOUD & LOCAL STORAGE)
 * =========================================================================
 * 
 * Manages guest reservation requests submitted via the direct booking website
 * (polarishotels.pk/booking) or manually recorded by hotel staff.
 * 
 * Features:
 * 1. Dual-Layer Storage: Instant client rendering via localStorage + automatic
 *    cloud synchronization via /api/bookings (MongoDB Atlas on Vercel).
 * 2. Cross-Device Real-Time Sync: Bookings submitted on mobile devices automatically
 *    propagate to the admin CMS on laptops and desktop browsers.
 * 3. 1-Click WhatsApp greeting generator.
 * 4. Status transitions: 'pending' (red badge), 'approved', 'contacted', 'declined'.
 */

// Zero placeholder bookings - production database starts completely clean
const INITIAL_REQUESTS = [];

const DEMO_REQUEST_IDS = new Set(['req-101', 'req-102']);

function isDemoBooking(r) {
  if (!r) return false;
  if (r.id && (DEMO_REQUEST_IDS.has(r.id) || String(r.id).startsWith('req-demo-'))) return true;
  return false;
}

// Check if request is unwanted data older than 3 months (90 days)
export function isExpiredRequest(r) {
  if (!r) return true;
  if (isDemoBooking(r)) return true;
  // NEVER expire pending, approved, or contacted reservations!
  if (r.status === 'pending' || r.status === 'approved' || r.status === 'contacted') {
    return false;
  }
  // Only declutter archived / completed / declined records older than 90 days (3 months)
  const ninetyDaysAgoYMD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ninetyDaysAgoISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  if (r.checkOut && typeof r.checkOut === 'string' && r.checkOut.length >= 10 && r.checkOut < ninetyDaysAgoYMD) {
    return true;
  }
  if (r.createdAt && typeof r.createdAt === 'string' && r.createdAt < ninetyDaysAgoISO) {
    return true;
  }
  return false;
}

// Purge all legacy localStorage keys on startup so no persistent storage remains in browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('polaris_booking_requests_v2');
    localStorage.removeItem('polaris_booking_requests_v1');
    localStorage.removeItem('polaris_booking_requests');
  } catch (e) {}
}

const listeners = new Set();
let isSyncing = false;
let lastDbConnection = { dbConnected: false, source: 'unknown', dbError: null, lastSyncedAt: null };

function notifyListeners(requests) {
  listeners.forEach((listener) => {
    try {
      listener([...requests]);
    } catch (e) {
      console.error('Error notifying booking request listener:', e);
    }
  });

  // Cross-component custom event broadcast within same window
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('polaris:booking-update', { detail: requests }));
    } catch (err) {
      // ignore
    }
  }
}

let cachedRequests = [];
let inFlightRequestsPromise = null;
let lastRequestsFetchTime = 0;
const REQUESTS_CACHE_TTL_MS = 5000; // 5-second in-memory throttle for read queries

export const BookingRequestService = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getConnectionStatus() {
    return { ...lastDbConnection };
  },

  /**
   * Fetch all booking requests directly from database API (/api/bookings).
   * Ensures mobile phones, laptops, and staff desks see the exact same reservations.
   * SOLE SOURCE OF TRUTH IS THE DATABASE — NO PERSISTENT LOCAL STORAGE.
   */
  async getRequests(force = false) {
    const now = Date.now();
    // 1. If fresh data was fetched within TTL and force is not set, return cached copy immediately
    if (!force && cachedRequests.length > 0 && (now - lastRequestsFetchTime < REQUESTS_CACHE_TTL_MS)) {
      return [...cachedRequests];
    }

    // 2. Deduplicate in-flight promises: if already fetching, reuse active promise
    if (inFlightRequestsPromise) {
      return inFlightRequestsPromise;
    }

    inFlightRequestsPromise = (async () => {
      try {
        const res = await fetch(`/api/bookings?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (res.ok) {
          const json = await res.json();
          lastDbConnection = {
            dbConnected: Boolean(json.dbConnected || json.source === 'mongodb' || json.source === 'mongodb-cache'),
            source: json.source || (json.dbConnected ? 'mongodb' : 'memory'),
            dbError: json.dbError || null,
            envDetected: Boolean(json.envDetected),
            envKey: json.envKey || null,
            lastSyncedAt: new Date().toISOString()
          };

          if (json.success && Array.isArray(json.data)) {
            const cloudRequests = json.data.filter((r) => !isExpiredRequest(r));
            cachedRequests = cloudRequests;
            lastRequestsFetchTime = Date.now();
            notifyListeners(cloudRequests);
            return [...cloudRequests];
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
      } catch (err) {
        console.warn('[BookingRequestService] Database API unreachable:', err);
        lastDbConnection = {
          dbConnected: false,
          source: 'network_error',
          dbError: err.message || 'Network request failed',
          envDetected: false,
          envKey: null,
          lastSyncedAt: new Date().toISOString()
        };
      } finally {
        inFlightRequestsPromise = null;
      }

      return [...cachedRequests];
    })();

    return inFlightRequestsPromise;
  },

  async syncWithCloud() {
    return this.getRequests(true);
  },

  async resetToDefaults() {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset bookings in database.');
    }

    cachedRequests = [];
    notifyListeners([]);
    return [];
  },

  /**
   * Create a new booking request -> persists to database
   */
  async createRequest(data) {
    const start = new Date(data.checkIn || Date.now());
    const end = new Date(data.checkOut || Date.now() + 86400000);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const newRequest = {
      id: 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      guestName: (data.guestName || 'VIP Guest').trim(),
      phone: (data.phone || '+92 300 0000000').trim(),
      email: (data.email || 'concierge@polarishotel.pk').trim(),
      roomId: data.roomId || 'room-custom',
      roomNumber: data.roomNumber || '101',
      roomName: data.roomName || 'Polaris Suite',
      tier: data.tier || 'Executive Suite',
      floor: data.floor || 'Floor 1',
      preferredFloor: (data.preferredFloor || data.floor || '').trim(),
      pricePKR: Number(data.pricePKR) || 45000,
      checkIn: data.checkIn || new Date().toISOString().split('T')[0],
      checkOut: data.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      nights: diffDays,
      guests: data.guests || '2 Guests',
      notes: data.notes ? data.notes.trim() : (data.source ? `Source: ${data.source}` : ''),
      status: data.status || 'pending',
      createdAt: new Date().toISOString()
    };

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save booking to database.');
    }

    await this.getRequests(true);
    return newRequest;
  },

  /**
   * Update status of a request -> persists to database
   */
  async updateStatus(requestId, newStatus, note = '', extraFields = {}) {
    const res = await fetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: requestId,
        status: newStatus,
        staffNote: note,
        ...extraFields
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update booking status in database.');
    }

    const fresh = await this.getRequests(true);
    return fresh.find((r) => r.id === requestId);
  },

  /**
   * Delete a booking request -> persists to database
   */
  async deleteRequest(requestId) {
    const res = await fetch('/api/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete booking request from database.');
    }

    await this.getRequests(true);
    return { id: requestId };
  },

  generateWhatsAppLink(request) {
    let cleanPhone = (request.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const floorLine = request.preferredFloor && request.preferredFloor !== request.floor
      ? `• Suite: Room #${request.roomNumber} — ${request.roomName} (${request.floor}) [Preferred: ${request.preferredFloor}]`
      : `• Suite: Room #${request.roomNumber} — ${request.roomName} (${request.floor})`;

    const message = `Hello ${request.guestName},

Warm greetings from POLARIS Hotel & Sanctuary, Kalam Valley.

We have received your reservation request for:
${floorLine}
• Stay Dates: ${request.checkIn} to ${request.checkOut} (${request.nights} Nights)
• Guests: ${request.guests}
• Nightly Rate: PKR ${request.pricePKR.toLocaleString()}

We would be delighted to confirm your allocation for the inaugural season. Please let us know if your dates are confirmed and if you require private mountain transfers from Swat or Islamabad.

Kind regards,
Concierge Team • Polaris Kalam Valley`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
};

// Real-time window focus & visibility sync (throttled by REQUESTS_CACHE_TTL_MS)
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    BookingRequestService.getRequests().catch(() => {});
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      BookingRequestService.getRequests().catch(() => {});
    }
  });
}
