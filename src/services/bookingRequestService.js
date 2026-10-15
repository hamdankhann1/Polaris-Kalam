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

const STORAGE_KEY = 'polaris_booking_requests_v2';

// Pre-seeded sample booking requests for immediate demonstration (Soft Launch Dec 2026)
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
    status: 'pending', // 'pending' | 'approved' | 'contacted' | 'declined'
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

const listeners = new Set();
let isSyncing = false;

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

// Listen to storage events from other tabs / windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      try {
        const updated = event.newValue ? JSON.parse(event.newValue) : [];
        notifyListeners(updated);
      } catch (e) {
        console.error('Error handling storage event for booking requests:', e);
      }
    }
  });
}

export const BookingRequestService = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Fetch all requests.
   * Returns local cached requests immediately, then syncs with cloud in background.
   */
  async getRequests() {
    let localData = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localData = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read booking requests from localStorage', e);
    }

    if (!localData) {
      localData = [...INITIAL_REQUESTS];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
      } catch (e) {}
    }

    // Trigger background cloud sync if in browser
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncWithCloud().catch(() => {});
      }, 50);
    }

    return [...localData];
  },

  /**
   * Synchronize with cloud API (/api/bookings)
   */
  async syncWithCloud() {
    if (isSyncing || typeof window === 'undefined') return;
    isSyncing = true;

    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const cloudRequests = json.data;
          const currentStored = localStorage.getItem(STORAGE_KEY);
          const currentParsed = currentStored ? JSON.parse(currentStored) : [];

          // Merge: use cloud list as authoritative, but preserve any local items not yet in cloud
          const cloudIds = new Set(cloudRequests.map((r) => r.id));
          const localOnly = currentParsed.filter((r) => !cloudIds.has(r.id));
          const merged = [...cloudRequests, ...localOnly];

          const hasChanged = JSON.stringify(merged) !== currentStored;
          if (hasChanged) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            notifyListeners(merged);
          }
        }
      }
    } catch (err) {
      // Cloud sync offline or local dev without serverless - silent fallback to local
    } finally {
      isSyncing = false;
    }
  },

  async resetToDefaults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
    notifyListeners(INITIAL_REQUESTS);
    return [...INITIAL_REQUESTS];
  },

  /**
   * Create a new booking request.
   * Optimistically updates UI & localStorage, then pushes to cloud API.
   */
  async createRequest(data) {
    const requests = await this.getRequests();

    // Compute nights
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
      pricePKR: Number(data.pricePKR) || 45000,
      checkIn: data.checkIn || new Date().toISOString().split('T')[0],
      checkOut: data.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      nights: diffDays,
      guests: data.guests || '2 Guests',
      notes: data.notes ? data.notes.trim() : (data.source ? `Source: ${data.source}` : ''),
      status: data.status || 'pending', // 'pending' increments the red notification badge!
      createdAt: new Date().toISOString()
    };

    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    notifyListeners(requests);

    // Push to cloud backend
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      }).catch((e) => console.warn('Cloud API sync deferred:', e.message));
    } catch (e) {}

    return newRequest;
  },

  /**
   * Update status of a request ('pending', 'approved', 'contacted', 'declined')
   */
  async updateStatus(requestId, newStatus, note = '') {
    const requests = await this.getRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error(`Booking request with ID "${requestId}" not found.`);
    }

    requests[index].status = newStatus;
    if (note) {
      requests[index].staffNote = note;
    }
    requests[index].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    notifyListeners(requests);

    // Sync to cloud
    try {
      fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
          staffNote: note
        })
      }).catch(() => {});
    } catch (e) {}

    return requests[index];
  },

  /**
   * Delete a booking request
   */
  async deleteRequest(requestId) {
    const requests = await this.getRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error(`Booking request with ID "${requestId}" not found.`);
    }

    const deleted = requests.splice(index, 1)[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    notifyListeners(requests);

    // Sync to cloud
    try {
      fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId })
      }).catch(() => {});
    } catch (e) {}

    return deleted;
  },

  /**
   * Helper: Generate a pre-filled WhatsApp link with a luxury concierge greeting
   */
  generateWhatsAppLink(request) {
    let cleanPhone = (request.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const message = `Hello ${request.guestName},

Warm greetings from POLARIS Hotel & Sanctuary, Kalam Valley.

We have received your reservation request for:
• Suite: Room #${request.roomNumber} — ${request.roomName} (${request.floor})
• Stay Dates: ${request.checkIn} to ${request.checkOut} (${request.nights} Nights)
• Guests: ${request.guests}
• Nightly Rate: PKR ${request.pricePKR.toLocaleString()}

We would be delighted to confirm your allocation for the inaugural season. Please let us know if your dates are confirmed and if you require private mountain transfers from Swat or Islamabad.

Kind regards,
Concierge Team • Polaris Kalam Valley`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
};

// Automatic background sync every 20 seconds while tab is active
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      BookingRequestService.syncWithCloud().catch(() => {});
    }
  }, 20000);

  window.addEventListener('focus', () => {
    BookingRequestService.syncWithCloud().catch(() => {});
  });
}
