import React, { useState, useEffect } from 'react';
import { X, Bed, DollarSign, Layers, Tag, Users, Sparkles, ArrowRight } from 'lucide-react';
import { FLOOR_CATEGORIES } from '../../services/roomService';

/**
 * =========================================================================
 * RoomFormModal Component
 * =========================================================================
 * 
 * Used for both ADDING a new room and EDITING an existing room's details:
 * - Room Number
 * - Room / Suite Name
 * - Floor / Category (Top Suite, Floor 4, Floor 3, Floor 2, Floor 1)
 * - Room Tier / Class
 * - Nightly Rate (PKR)
 * - Guest Capacity & Bed Type
 * - Architectural Amenities
 */
export default function RoomFormModal({ isOpen, onClose, roomToEdit = null, onSave }) {
  if (!isOpen) return null;

  const isEditing = Boolean(roomToEdit);

  const [roomNumber, setRoomNumber] = useState('');
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('Floor 1');
  const [tier, setTier] = useState('Deluxe Alpine');
  const [pricePKR, setPricePKR] = useState(45000);
  const [capacity, setCapacity] = useState('2 Guests • 1 King Bed');
  const [amenities, setAmenities] = useState('Panoramic Mountain View, Heated Floors, Private Bath');
  const [status, setStatus] = useState('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (roomToEdit) {
      setRoomNumber(roomToEdit.roomNumber || '');
      setName(roomToEdit.name || '');
      setFloor(roomToEdit.floor || 'Floor 1');
      setTier(roomToEdit.tier || 'Deluxe Alpine');
      setPricePKR(roomToEdit.pricePKR || 45000);
      setCapacity(roomToEdit.capacity || '2 Guests • 1 King Bed');
      setAmenities(
        Array.isArray(roomToEdit.amenities)
          ? roomToEdit.amenities.join(', ')
          : (roomToEdit.amenities || '')
      );
      setStatus(roomToEdit.status || 'available');
    } else {
      setRoomNumber('');
      setName('');
      setFloor('Floor 1');
      setTier('Deluxe Alpine');
      setPricePKR(45000);
      setCapacity('2 Guests • 1 King Bed');
      setAmenities('Panoramic Mountain View, Heated Floors, Private Bath');
      setStatus('available');
    }
    setError('');
  }, [roomToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomNumber.trim()) {
      setError('Please provide a valid Room Number.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a Room or Suite Name.');
      return;
    }
    if (isNaN(Number(pricePKR)) || Number(pricePKR) <= 0) {
      setError('Please provide a valid positive nightly price (PKR).');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        roomNumber: roomNumber.trim(),
        name: name.trim(),
        floor,
        tier,
        pricePKR: Number(pricePKR),
        capacity: capacity.trim(),
        amenities: amenities.split(',').map((s) => s.trim()).filter(Boolean),
        status: isEditing ? (roomToEdit.status || 'available') : status
      };

      await onSave(data, roomToEdit?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save room details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white border border-stone-200 rounded-xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-stone-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A661C] font-semibold">
              {isEditing ? 'MODIFY SUITE SPECIFICATIONS' : 'NEW SUITE INVENTORY'}
            </span>
            <h3 className="font-display text-xl text-stone-900 font-medium tracking-wide">
              {isEditing ? `Edit Room #${roomToEdit.roomNumber}` : 'Add New Hotel Room'}
            </h3>
            <p className="text-xs text-stone-500 font-light">
              {isEditing 
                ? 'Update room pricing, floor allocation, or architectural amenities.' 
                : 'Categorize room into one of the 4 floors or the top penthouse suite.'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Row 1: Room Number & Floor Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Room Number *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 501, 402, 101"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Floor / Category *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                {FLOOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Top Suite' ? '👑 Top Suite (Summit Penthouse)' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Room Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
              Room / Suite Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Celestial Glacier Panoramic Suite"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Row 3: Tier & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Room Tier / Class
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                <option value="Top Suite / Presidential">Top Suite / Presidential</option>
                <option value="Presidential Suite">Presidential Suite</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Deluxe Alpine">Deluxe Alpine</option>
                <option value="Forest Chalet">Forest Chalet</option>
                <option value="Luxury Studio">Luxury Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Price per Night (PKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[11px] font-mono text-stone-400 font-bold">PKR</span>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={pricePKR}
                  onChange={(e) => setPricePKR(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Capacity */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
              Guest Capacity & Bed Setup
            </label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 2 Guests • 1 Super King Bed"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Row 5: Amenities */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
              Architectural Amenities (comma-separated)
            </label>
            <textarea
              rows={2}
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="e.g. Unobstructed Horizon Glass, Heated Plunge Pool, Fireplace, Telescope"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Row 6: Initial status if creating new room */}
          {!isEditing && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Initial Room Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('available')}
                  className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                    status === 'available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  ✓ Available
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('booked')}
                  className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                    status === 'booked'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  ✕ Booked
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('in cleaning')}
                  className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                    status === 'in cleaning'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  🧹 Cleaning
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-semibold transition-all flex items-center space-x-2 shadow-xs ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Room Specs' : 'Add to Inventory'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
