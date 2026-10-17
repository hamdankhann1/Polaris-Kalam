/**
 * =========================================================================
 * POLARIS HOTEL — FLOOR SERVICE
 * =========================================================================
 * 
 * Manages custom user-defined hotel floors / levels (e.g. '1st Floor', '3rd Floor', 'Summit Penthouse').
 * Persisted to MongoDB Atlas via /api/floors.
 * Provides real-time reactive updates to CMS dropdowns, floor manager modal, and booking flows.
 */

let cachedFloors = [];
const listeners = new Set();
let inFlightFloorsPromise = null;
let lastFloorsFetchTime = 0;
const FLOORS_CACHE_TTL_MS = 10000; // 10-second in-memory throttle for read queries

function notifyListeners(floors) {
  listeners.forEach((listener) => {
    try {
      listener([...floors]);
    } catch (e) {
      console.error('Error notifying floor listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('polaris:floors-update', { detail: floors }));
    } catch (err) {}
  }
}

function getStaffAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('polaris_staff_token');
  const key = sessionStorage.getItem('polaris_staff_key');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-staff-token'] = token;
  }
  if (key) {
    headers['x-admin-hash'] = key;
  }
  return headers;
}

export const FloorService = {
  /**
   * Subscribe to floor changes
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Fetch all custom floors from database
   */
  async getFloors(force = false) {
    const now = Date.now();
    if (!force && cachedFloors.length > 0 && (now - lastFloorsFetchTime < FLOORS_CACHE_TTL_MS)) {
      return [...cachedFloors];
    }

    if (inFlightFloorsPromise) {
      return inFlightFloorsPromise;
    }

    inFlightFloorsPromise = (async () => {
      try {
        const res = await fetch(`/api/floors?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            ...getStaffAuthHeaders()
          }
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            cachedFloors = json.data;
            lastFloorsFetchTime = Date.now();
            notifyListeners(cachedFloors);
            return [...cachedFloors];
          }
        }
      } catch (e) {
        console.warn('[FloorService] API unreachable:', e);
      } finally {
        inFlightFloorsPromise = null;
      }

      return [...cachedFloors];
    })();

    return inFlightFloorsPromise;
  },

  /**
   * Create a new floor -> persists to MongoDB
   */
  async addFloor(name, description = '') {
    if (!name || !name.trim()) {
      throw new Error('Floor name cannot be empty.');
    }

    const trimmed = name.trim();

    const res = await fetch('/api/floors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getStaffAuthHeaders()
      },
      body: JSON.stringify({ name: trimmed, description: description.trim() })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create floor.');
    }

    const json = await res.json();
    const created = json.data;

    // Refresh floors from database
    await this.getFloors(true);
    return created;
  },

  /**
   * Delete a floor from database
   */
  async deleteFloor(idOrName) {
    if (!idOrName) return;

    const payload = typeof idOrName === 'string' && idOrName.startsWith('floor-')
      ? { id: idOrName }
      : { name: idOrName };

    const res = await fetch('/api/floors', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getStaffAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete floor.');
    }

    await this.getFloors(true);
    return true;
  }
};

// Initial real-time load and debounced focus sync
if (typeof window !== 'undefined') {
  FloorService.getFloors().catch(() => {});

  let lastFocusSync = Date.now();
  const handleRefocus = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastFocusSync > 15000) {
      lastFocusSync = Date.now();
      FloorService.getFloors().catch(() => {});
    }
  };
  window.addEventListener('visibilitychange', handleRefocus);
  window.addEventListener('focus', handleRefocus);
}

