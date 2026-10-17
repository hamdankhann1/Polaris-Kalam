/**
 * =========================================================================
 * POLARIS HOTEL — CATEGORY SERVICE
 * =========================================================================
 * 
 * Manages custom user-defined room categories (e.g. 'Executive Suite', 'Glacier View').
 * Persisted to MongoDB Atlas via /api/categories.
 * Provides real-time reactive updates to CMS dropdowns and modals.
 */

let cachedCategories = [];
const listeners = new Set();
let inFlightCategoriesPromise = null;
let lastCategoriesFetchTime = 0;
const CATEGORIES_CACHE_TTL_MS = 10000; // 10-second in-memory throttle for read queries

function notifyListeners(categories) {
  listeners.forEach((listener) => {
    try {
      listener([...categories]);
    } catch (e) {
      console.error('Error notifying category listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('polaris:categories-update', { detail: categories }));
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

export const CategoryService = {
  /**
   * Subscribe to category changes
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Fetch all custom categories from database
   */
  async getCategories(force = false) {
    const now = Date.now();
    if (!force && cachedCategories.length > 0 && (now - lastCategoriesFetchTime < CATEGORIES_CACHE_TTL_MS)) {
      return [...cachedCategories];
    }

    if (inFlightCategoriesPromise) {
      return inFlightCategoriesPromise;
    }

    inFlightCategoriesPromise = (async () => {
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}`, {
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
            cachedCategories = json.data;
            lastCategoriesFetchTime = Date.now();
            notifyListeners(cachedCategories);
            return [...cachedCategories];
          }
        }
      } catch (e) {
        console.warn('[CategoryService] API unreachable:', e);
      } finally {
        inFlightCategoriesPromise = null;
      }

      return [...cachedCategories];
    })();

    return inFlightCategoriesPromise;
  },

  /**
   * Create a new category -> persists to MongoDB
   */
  async addCategory(name, description = '') {
    if (!name || !name.trim()) {
      throw new Error('Category name cannot be empty.');
    }

    const trimmed = name.trim();

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getStaffAuthHeaders()
      },
      body: JSON.stringify({ name: trimmed, description: description.trim() })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category.');
    }

    const json = await res.json();
    const created = json.data;

    // Refresh categories from database
    await this.getCategories(true);
    return created;
  },

  /**
   * Rename a category -> persists to MongoDB and cascades to rooms
   */
  async renameCategory(idOrOldName, newName, description = '') {
    if (!newName || !newName.trim()) {
      throw new Error('New category name cannot be empty.');
    }

    const payload = typeof idOrOldName === 'string' && idOrOldName.startsWith('cat-')
      ? { id: idOrOldName, newName: newName.trim(), description: description.trim() }
      : { oldName: idOrOldName, newName: newName.trim(), description: description.trim() };

    const res = await fetch('/api/categories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getStaffAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to rename category.');
    }

    const json = await res.json();
    await this.getCategories(true);
    return json.data;
  },

  /**
   * Delete a category from database
   */
  async deleteCategory(idOrName) {
    if (!idOrName) return;

    const payload = typeof idOrName === 'string' && idOrName.startsWith('cat-')
      ? { id: idOrName }
      : { name: idOrName };

    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getStaffAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete category.');
    }

    await this.getCategories(true);
    return true;
  }
};

// Initial real-time load and debounced focus sync
if (typeof window !== 'undefined') {
  CategoryService.getCategories().catch(() => {});

  let lastFocusSync = Date.now();
  const handleRefocus = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastFocusSync > 15000) {
      lastFocusSync = Date.now();
      CategoryService.getCategories().catch(() => {});
    }
  };
  window.addEventListener('visibilitychange', handleRefocus);
  window.addEventListener('focus', handleRefocus);
}

