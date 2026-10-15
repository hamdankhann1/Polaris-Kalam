import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * =========================================================================
 * DeleteConfirmModal Component
 * =========================================================================
 * 
 * Safe confirmation modal before permanently removing a room from inventory.
 */
export default function DeleteConfirmModal({ isOpen, onClose, room, onConfirmDelete }) {
  if (!isOpen || !room) return null;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(room.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-2xl p-6 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-stone-900 font-medium">
                Remove Room #{room.roomNumber}
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                {room.floor} • {room.tier}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="mt-5 space-y-3">
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-3 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-stone-900">Permanently Remove Suite?</p>
              <p className="text-stone-600 mt-1">
                Are you sure you want to remove <strong>Room #{room.roomNumber} ({room.name})</strong>? 
                This room will immediately be removed from the hotel inventory and will no longer be available for booking on the website.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 flex items-center justify-end space-x-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all flex items-center space-x-2 shadow-xs ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Removing...' : 'Confirm Remove Room'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
