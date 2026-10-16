/**
 * =========================================================================
 * POLARIS HOTEL — REVENUE SERVICE & LEDGER CLIENT
 * =========================================================================
 * 
 * Manages Master Revenue Look operations:
 * - Day Revenue, Weekly Revenue, Monthly Revenue & Custom Range Analytics
 * - Booking amounts ledger tracking
 * - Synchronizing accepted guest reservations into revenue records
 * - Resetting revenue for specified dates with master cryptographic password
 * - Deleting individual revenue records with master cryptographic password
 * 
 * Target Cryptographic Hashes:
 * 1. Portal Access Password:
 *    Polar1s@Asif@Master@PortalPass26/12
 *    SHA-256: 8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39
 * 
 * 2. Deletion / Reset Password:
 *    Polar1s@Asif@Master@26/12
 *    SHA-256: ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d
 */

const PORTAL_PASS_HASH = '8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39';
const DELETE_PASS_HASH = 'ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d';

const TOKEN_STORAGE_KEY = 'polaris_revenue_token';
const AUTH_STATUS_KEY = 'polaris_revenue_auth';

let cachedRevenueData = null;
let lastFetchTimestamp = 0;
let inFlightFetchPromise = null;
const REVENUE_CACHE_TTL_MS = 3000; // 3-second cache throttle

/**
 * Computes SHA-256 hex digest using browser standard Web Crypto API
 */
export async function computeSha256(str) {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(String(str).trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const RevenueService = {
  /**
   * Check if user is currently authenticated in the revenue portal session
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(TOKEN_STORAGE_KEY);
  },

  /**
   * Get the active session token
   */
  getToken() {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  },

  /**
   * Authenticate into Master Revenue Look portal
   */
  async login(password) {
    if (!password || !password.trim()) {
      throw new Error('Please enter the Master Portal Access Password.');
    }

    const trimmed = password.trim();
    // Validate client-side hash first for zero-latency rejection if wrong
    const clientHash = await computeSha256(trimmed);
    if (clientHash !== PORTAL_PASS_HASH) {
      throw new Error('Incorrect Master Portal Access Password. Access denied.');
    }

    // Authenticate with server to receive secure signed session token
    const res = await fetch('/api/revenue?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clientHash })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Server authentication failed.');
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, json.token);
      sessionStorage.setItem(AUTH_STATUS_KEY, 'true');
    }

    return true;
  },

  /**
   * Log out and destroy session
   */
  logout() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STATUS_KEY);
    }
    cachedRevenueData = null;
  },

  /**
   * Fetch revenue metrics, summaries, and booking ledger records
   */
  async getRevenueData({ startDate = '', endDate = '', force = false } = {}) {
    const token = this.getToken();
    const now = Date.now();
    const cacheKey = `${startDate}_${endDate}`;

    if (!force && cachedRevenueData && cachedRevenueData._cacheKey === cacheKey && (now - lastFetchTimestamp < REVENUE_CACHE_TTL_MS)) {
      return cachedRevenueData;
    }

    if (inFlightFetchPromise) {
      return inFlightFetchPromise;
    }

    inFlightFetchPromise = (async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        params.set('t', String(Date.now()));

        const res = await fetch(`/api/revenue?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (res.status === 401) {
          this.logout();
          throw new Error('SESSION_EXPIRED');
        }

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load revenue data.');
        }

        const payload = {
          ...json.data,
          source: json.source || 'mongodb',
          dbConnected: Boolean(json.dbConnected),
          lastSyncedAt: json.lastSyncedAt || new Date().toISOString(),
          _cacheKey: cacheKey
        };

        cachedRevenueData = payload;
        lastFetchTimestamp = Date.now();
        return payload;
      } finally {
        inFlightFetchPromise = null;
      }
    })();

    return inFlightFetchPromise;
  },

  /**
   * Create / record a new booking revenue entry
   */
  async addRecord(recordData) {
    const token = this.getToken();
    const res = await fetch('/api/revenue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(recordData)
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save revenue record.');
    }

    cachedRevenueData = null; // Invalidate cache
    return json.data;
  },

  /**
   * 1-Click Sync: Import confirmed/accepted guest reservations into Revenue records
   */
  async syncFromBookings() {
    const token = this.getToken();
    const res = await fetch('/api/revenue?action=sync-bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to sync bookings.');
    }

    cachedRevenueData = null;
    return json;
  },

  /**
   * Reset / Delete revenue records for a specified date range.
   * Strictly requires Master Deletion Password: Polar1s@Asif@Master@26/12
   */
  async resetRangeRevenue(startDate, endDate, deletePassword) {
    if (!deletePassword || !deletePassword.trim()) {
      throw new Error('Master Deletion Password is required.');
    }

    const trimmedPass = deletePassword.trim();
    const clientPassHash = await computeSha256(trimmedPass);

    if (clientPassHash !== DELETE_PASS_HASH) {
      throw new Error('Incorrect Master Deletion Password. Revenue records were NOT reset.');
    }

    const token = this.getToken();
    const res = await fetch('/api/revenue?action=reset-range', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-delete-password': clientPassHash
      },
      body: JSON.stringify({
        startDate,
        endDate,
        deletePassword: clientPassHash
      })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to reset revenue for specified dates.');
    }

    cachedRevenueData = null;
    return json;
  },

  /**
   * Delete a single revenue record by ID.
   * Strictly requires Master Deletion Password: Polar1s@Asif@Master@26/12
   */
  async deleteRecord(recordId, deletePassword) {
    if (!deletePassword || !deletePassword.trim()) {
      throw new Error('Master Deletion Password is required.');
    }

    const trimmedPass = deletePassword.trim();
    const clientPassHash = await computeSha256(trimmedPass);

    if (clientPassHash !== DELETE_PASS_HASH) {
      throw new Error('Incorrect Master Deletion Password. Revenue record was NOT deleted.');
    }

    const token = this.getToken();
    const res = await fetch('/api/revenue', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-delete-password': clientPassHash
      },
      body: JSON.stringify({
        id: recordId,
        deletePassword: clientPassHash
      })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete revenue record.');
    }

    cachedRevenueData = null;
    return json;
  }
};
