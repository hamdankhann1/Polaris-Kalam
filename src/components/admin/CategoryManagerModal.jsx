import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Check, AlertCircle, Sparkles, Edit3 } from 'lucide-react';
import { CategoryService } from '../../services/categoryService';

/**
 * =========================================================================
 * CategoryManagerModal Component
 * =========================================================================
 * 
 * Allows hotel managers to define, inspect, rename, and delete custom room categories.
 * All changes persist directly to MongoDB Atlas.
 */
export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  rooms = [],
  onCategoryUpdated
}) {
  if (!isOpen) return null;

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Renaming state
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const created = await CategoryService.addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setSuccess(`Category "${created.name}" created successfully.`);
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (cat) => {
    setEditingCatId(cat.id || cat.name);
    setEditingName(cat.name);
    setError('');
    setSuccess('');
  };

  const handleCancelRename = () => {
    setEditingCatId(null);
    setEditingName('');
  };

  const handleSaveRename = async (cat) => {
    if (!editingName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    if (editingName.trim() === cat.name) {
      setEditingCatId(null);
      return;
    }

    setIsRenaming(true);
    setError('');
    setSuccess('');

    try {
      await CategoryService.renameCategory(cat.id || cat.name, editingName.trim());
      setSuccess(`Category renamed to "${editingName.trim()}".`);
      setEditingCatId(null);
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      setError(err.message || 'Failed to rename category.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const roomCount = rooms.filter(
      (r) => (r.category || '').trim().toLowerCase() === cat.name.trim().toLowerCase()
    ).length;

    if (roomCount > 0) {
      if (!window.confirm(`Warning: ${roomCount} ${roomCount === 1 ? 'room is' : 'rooms are'} currently assigned to "${cat.name}". Are you sure you want to delete this category?`)) {
        return;
      }
    }

    setDeletingId(cat.id || cat.name);
    setError('');
    setSuccess('');

    try {
      await CategoryService.deleteCategory(cat.id || cat.name);
      setSuccess(`Category "${cat.name}" removed.`);
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-7 text-stone-900 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A661C] font-semibold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>CATEGORY INVENTORY</span>
            </span>
            <h3 className="font-display text-xl text-stone-900 font-medium">
              Manage Room Categories
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Define custom categories (e.g. Executive Suite, Riverside Chalet) for the hotel inventory.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Create Category Form */}
        <form onSubmit={handleAddCategory} className="mt-5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Add New Room Category
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Deluxe Alpine, Executive Panoramic Suite..."
              className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Add'}</span>
            </button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-2 pr-1">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-2">
            Existing Categories ({categories.length})
          </label>

          {categories.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-stone-50 border border-dashed border-stone-200 text-stone-500 text-xs font-mono">
              No categories created yet. Add your first room category above!
            </div>
          ) : (
            categories.map((cat) => {
              const count = rooms.filter(
                (r) => (r.category || '').trim().toLowerCase() === cat.name.trim().toLowerCase()
              ).length;
              const isDeleting = deletingId === (cat.id || cat.name);
              const isEditingThis = editingCatId === (cat.id || cat.name);

              return (
                <div
                  key={cat.id || cat.name}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition-colors space-y-2"
                >
                  {isEditingThis ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B48A28] shrink-0">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 bg-white border border-amber-400 rounded-lg px-3 py-1.5 text-sm text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(cat);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(cat)}
                        disabled={isRenaming || !editingName.trim()}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 shadow-2xs"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors shrink-0"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B48A28] shrink-0">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-stone-900 truncate">
                            {cat.name}
                          </h4>
                          <p className="text-[11px] font-mono text-stone-500">
                            {count} {count === 1 ? 'room assigned' : 'rooms assigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartRename(cat)}
                          className="p-2 rounded-lg text-stone-500 hover:text-[#B48A28] hover:bg-amber-50 transition-colors"
                          title={`Rename category "${cat.name}"`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={`Delete category "${cat.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
