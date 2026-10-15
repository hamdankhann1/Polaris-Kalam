import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Sparkles, ArrowRight } from 'lucide-react';

/**
 * =========================================================================
 * QuickPriceModal Component
 * =========================================================================
 * 
 * Allows instant nightly rate adjustments for a specific room.
 * Includes seasonal quick presets (+10% Summer Peak, +25% Snow/Holiday, -10% Off-Peak).
 */
export default function QuickPriceModal({ isOpen, onClose, room, onSavePrice }) {
  if (!isOpen || !room) return null;

  const [price, setPrice] = useState(room.pricePKR || 45000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setPrice(room.pricePKR || 45000);
      setError('');
    }
  }, [room, isOpen]);

  const applyModifier = (percent) => {
    const original = room.pricePKR || 45000;
    const computed = Math.round((original * (1 + percent / 100)) / 500) * 500;
    setPrice(computed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numeric = Number(price);
    if (isNaN(numeric) || numeric <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSavePrice(room.id, numeric);
      onClose();
    } catch (err) {
      setError(err.message || 'Error updating price.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-2xl p-6 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono text-xs text-stone-500">
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200 font-bold">ROOM #{room.roomNumber}</span>
              <span>•</span>
              <span className="text-[#8A661C] font-semibold">{room.category || room.floor}</span>
            </div>
            <h3 className="font-display text-lg text-stone-900 font-medium">
              Update Nightly Rate
            </h3>
            <p className="text-xs text-stone-500 font-light truncate max-w-[280px]">
              {room.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="text-xs text-rose-700 font-mono bg-rose-50 p-2.5 rounded border border-rose-200">
              {error}
            </p>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
              New Nightly Rate (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-mono text-[#B48A28] font-bold">PKR</span>
              <input
                type="number"
                min={1000}
                step={500}
                required
                autoFocus
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-14 pr-4 py-2.5 text-base text-stone-900 font-mono font-medium focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-stone-500 font-mono mt-1">
              Current Base Rate: PKR {room.pricePKR.toLocaleString()} / night
            </p>
          </div>

          {/* Seasonal Rate Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-medium block">
              Seasonal Quick Adjustments:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyModifier(10)}
                className="py-1.5 px-2 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10.5px] font-mono text-stone-700 hover:text-[#8A661C] transition-all flex items-center justify-center space-x-1"
              >
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>+10% Peak</span>
              </button>

              <button
                type="button"
                onClick={() => applyModifier(25)}
                className="py-1.5 px-2 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10.5px] font-mono text-stone-700 hover:text-[#8A661C] transition-all flex items-center justify-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>+25% Snow</span>
              </button>

              <button
                type="button"
                onClick={() => applyModifier(-10)}
                className="py-1.5 px-2 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10.5px] font-mono text-stone-700 hover:text-[#8A661C] transition-all flex items-center justify-center space-x-1"
              >
                <TrendingDown className="w-3 h-3 text-rose-600" />
                <span>-10% Off-Pk</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-semibold transition-all flex items-center space-x-1.5 shadow-xs ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>{isSubmitting ? 'Saving...' : 'Save New Price'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
