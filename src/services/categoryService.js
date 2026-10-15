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
    try {
      const res = await fetch(`/api/categories?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          cachedCategories = json.data;
          notifyListeners(cachedCategories);
          return [...cachedCategories];
        }
      }
    } catch (e) {
      console.warn('[CategoryService] API unreachable:', e);
    }

    return [...cachedCategories];
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
      headers: { 'Content-Type': 'application/json' },
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
   * Delete a category from database
   */
  async deleteCategory(idOrName) {
    if (!idOrName) return;

    const payload = typeof idOrName === 'string' && idOrName.startsWith('cat-')
      ? { id: idOrName }
      : { name: idOrName };

    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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

// Automatic real-time background sync
if (typeof window !== 'undefined') {
  CategoryService.getCategories().catch(() => {});

  setInterval(() => {
    if (document.visibilityState === 'visible') {
      CategoryService.getCategories().catch(() => {});
    }
  }, 5000);
}
