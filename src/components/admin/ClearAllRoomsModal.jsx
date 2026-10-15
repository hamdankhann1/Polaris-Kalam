import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * =========================================================================
 * ClearAllRoomsModal Component
 * =========================================================================
 * 
 * Safe confirmation modal before clearing all hotel rooms from inventory.
 * Informs staff that they can start fresh and add custom rooms,
 * and that default suites can always be restored with 1 click.
 */
export default function ClearAllRoomsModal({ isOpen, onClose, totalRooms, onConfirmClear }) {
  if (!isOpen) return null;

  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onConfirmClear();
      onClose();
    } catch (err) {
      console.error('Error clearing rooms:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-2xl p-6 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-stone-900 font-medium">
                Clear All Hotel Rooms
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                {totalRooms} {totalRooms === 1 ? 'room' : 'rooms'} currently in inventory
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
              <p className="font-medium text-stone-900">Start with a Clean Slate?</p>
              <p className="text-stone-600 mt-1">
                This will delete all <strong>{totalRooms} rooms</strong> from the hotel database so you can add rooms according to your exact preference.
              </p>
              <p className="text-stone-500 mt-2 text-[11px] font-mono">
                💡 Don't worry: You can restore the 8 default Polaris suites at any time with the "Restore Default Suites" button.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 flex items-center justify-end space-x-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isClearing}
            className={`px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all flex items-center space-x-2 shadow-xs ${
              isClearing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Clearing Inventory...' : 'Confirm Clear All Rooms'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
