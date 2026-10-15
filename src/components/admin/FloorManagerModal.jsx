import React, { useState } from 'react';
import { X, Building2, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { FloorService } from '../../services/floorService';

/**
 * =========================================================================
 * FloorManagerModal Component
 * =========================================================================
 * 
 * Allows hotel managers to define, inspect, and delete custom hotel floors / levels.
 * (e.g. Ground Floor, 2nd Floor, 4th Floor Panorama, Top Penthouse).
 * All changes persist directly to MongoDB Atlas.
 */
export default function FloorManagerModal({
  isOpen,
  onClose,
  floors = [],
  rooms = [],
  onFloorUpdated
}) {
  if (!isOpen) return null;

  const [newFloorName, setNewFloorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleAddFloor = async (e) => {
    e.preventDefault();
    if (!newFloorName.trim()) {
      setError('Please enter a floor name or level.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const created = await FloorService.addFloor(newFloorName.trim());
      setNewFloorName('');
      setSuccess(`Floor "${created.name}" created successfully.`);
      if (onFloorUpdated) onFloorUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create floor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFloor = async (flr) => {
    const roomCount = rooms.filter(
      (r) => (r.floor || '').trim().toLowerCase() === flr.name.trim().toLowerCase()
    ).length;

    if (roomCount > 0) {
      if (
        !window.confirm(
          `Warning: ${roomCount} ${
            roomCount === 1 ? 'room is' : 'rooms are'
          } currently assigned to "${flr.name}". Are you sure you want to delete this floor?`
        )
      ) {
        return;
      }
    }

    setDeletingId(flr.id || flr.name);
    setError('');
    setSuccess('');

    try {
      await FloorService.deleteFloor(flr.id || flr.name);
      setSuccess(`Floor "${flr.name}" removed.`);
      if (onFloorUpdated) onFloorUpdated();
    } catch (err) {
      setError(err.message || 'Failed to delete floor.');
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
              <Building2 className="w-3.5 h-3.5" />
              <span>FLOOR & LEVEL INVENTORY</span>
            </span>
            <h3 className="font-display text-xl text-stone-900 font-medium">
              Manage Hotel Floors
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Define custom floors and architectural levels (e.g. 1st Floor, 4th Floor Panorama, Penthouse Level).
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

        {/* Create Floor Form */}
        <form onSubmit={handleAddFloor} className="mt-5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Add New Floor / Level
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder="e.g. 1st Floor, 4th Floor Glacier View, Penthouse..."
              className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newFloorName.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Add'}</span>
            </button>
          </div>
        </form>

        {/* Existing Floors List */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-2 pr-1">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-2">
            Existing Floors ({floors.length})
          </label>

          {floors.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-stone-50 border border-dashed border-stone-200 text-stone-500 text-xs font-mono">
              No floors defined yet. Add your first hotel floor or level above!
            </div>
          ) : (
            floors.map((flr) => {
              const count = rooms.filter(
                (r) => (r.floor || '').trim().toLowerCase() === flr.name.trim().toLowerCase()
              ).length;
              const isDeleting = deletingId === (flr.id || flr.name);

              return (
                <div
                  key={flr.id || flr.name}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B48A28] shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-stone-900 truncate">
                        {flr.name}
                      </h4>
                      <p className="text-[11px] font-mono text-stone-500">
                        {count} {count === 1 ? 'room assigned' : 'rooms assigned'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFloor(flr)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title={`Delete floor "${flr.name}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
