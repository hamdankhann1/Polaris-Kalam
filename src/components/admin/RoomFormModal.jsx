import React, { useState, useEffect } from 'react';
import { X, Bed, DollarSign, Layers, Tag, Users, Sparkles, ArrowRight, Plus, Check } from 'lucide-react';
import { CategoryService } from '../../services/categoryService';
import { FloorService } from '../../services/floorService';

/**
 * =========================================================================
 * RoomFormModal Component
 * =========================================================================
 * 
 * Used for both ADDING a new room and EDITING an existing room's details:
 * - Room Number
 * - Room / Suite Title
 * - Room Category (100% custom user-defined, persisted to MongoDB)
 * - Floor / Level (Optional custom field)
 * - Nightly Rate (PKR)
 * - Guest Capacity & Bed Type
 * - Architectural Amenities
 */
export default function RoomFormModal({ isOpen, onClose, roomToEdit = null, initialCategory = null, onSave }) {
  if (!isOpen) return null;

  const isEditing = Boolean(roomToEdit);

  const [roomNumber, setRoomNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [floor, setFloor] = useState('');
  const [pricePKR, setPricePKR] = useState(45000);
  const [capacity, setCapacity] = useState('2 Guests • 1 King Bed');
  const [amenities, setAmenities] = useState('Panoramic Mountain View, Heated Floors, Private Bath');
  const [status, setStatus] = useState('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom Categories state & inline creation
  const [customCategories, setCustomCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Custom Floors state & inline creation
  const [customFloors, setCustomFloors] = useState([]);
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [isCreatingFloor, setIsCreatingFloor] = useState(false);

  useEffect(() => {
    // Load categories from database
    CategoryService.getCategories().then((cats) => {
      if (Array.isArray(cats)) {
        setCustomCategories(cats);
      }
    });

    const unsubscribeCats = CategoryService.subscribe((cats) => {
      setCustomCategories(cats);
    });

    // Load floors from database
    FloorService.getFloors().then((flrs) => {
      if (Array.isArray(flrs)) {
        setCustomFloors(flrs);
      }
    });

    const unsubscribeFloors = FloorService.subscribe((flrs) => {
      setCustomFloors(flrs);
    });

    return () => {
      unsubscribeCats();
      unsubscribeFloors();
    };
  }, [isOpen]);

  useEffect(() => {
    if (roomToEdit) {
      setRoomNumber(roomToEdit.roomNumber || '');
      setName(roomToEdit.name || '');
      const existingCategory = (roomToEdit.category || roomToEdit.tier || roomToEdit.floor || '').trim();
      setCategory(existingCategory);
      setFloor(roomToEdit.floor || '');
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
      // Default to initialCategory or first category if available
      const defaultCat = (initialCategory || customCategories[0]?.name || '').trim();
      setCategory(defaultCat);
      setFloor(customFloors[0]?.name || '');
      setPricePKR(45000);
      setCapacity('2 Guests • 1 King Bed');
      setAmenities('Panoramic Mountain View, Heated Floors, Private Bath');
      setStatus('available');
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
    setIsAddingFloor(false);
    setNewFloorName('');
    setError('');
  }, [roomToEdit, isOpen, initialCategory]);

  // Keep category and floor synchronized as soon as customCategories/customFloors resolve asynchronously
  useEffect(() => {
    if (!roomToEdit) {
      if (initialCategory && customCategories.some((c) => c.name === initialCategory)) {
        setCategory(initialCategory);
      } else if (!category && customCategories.length > 0) {
        setCategory(customCategories[0].name);
      }

      if (!floor && customFloors.length > 0) {
        setFloor(customFloors[0].name);
      }
    }
  }, [customCategories, customFloors, initialCategory, roomToEdit]);

  const handleQuickAddCategory = async (e) => {
    e?.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Please enter a name for the new category.');
      return;
    }

    setIsCreatingCat(true);
    setError('');
    try {
      const created = await CategoryService.addCategory(newCategoryName.trim());
      const catName = created?.name || newCategoryName.trim();
      setCategory(catName);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setError('');
    } catch (catErr) {
      setError(catErr.message || 'Failed to save new category.');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleQuickAddFloor = async (e) => {
    e?.preventDefault();
    if (!newFloorName.trim()) {
      setError('Please enter a name for the new floor.');
      return;
    }

    setIsCreatingFloor(true);
    setError('');
    try {
      const created = await FloorService.addFloor(newFloorName.trim());
      const flrName = created?.name || newFloorName.trim();
      setFloor(flrName);
      setNewFloorName('');
      setIsAddingFloor(false);
      setError('');
    } catch (flrErr) {
      setError(flrErr.message || 'Failed to save new floor.');
    } finally {
      setIsCreatingFloor(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!roomNumber.trim()) {
      setError('Please provide a valid Room Number.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a Room or Suite Title.');
      return;
    }

    const selectedCat = (category || initialCategory || customCategories[0]?.name || '').trim();
    if (!selectedCat) {
      setError('Please select or create a Room Category.');
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
        category: selectedCat,
        tier: selectedCat, // Keep in sync for compatibility
        floor: (floor || customFloors[0]?.name || selectedCat || 'Floor 1').trim(),
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
                ? 'Update room pricing, custom category allocation, or architectural amenities.' 
                : 'Define room specifications and assign to your custom room categories.'}
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

          {/* Row 1: Room Number & Room Category */}
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

            {/* Room Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 font-medium">
                  Room Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[10px] font-mono text-[#B48A28] hover:text-[#8A661C] underline font-medium"
                >
                  {isAddingCategory ? 'Select Existing' : '+ New Category'}
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Executive Alpine Suite"
                    className="flex-1 bg-stone-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={isCreatingCat}
                    className="px-3 py-2 rounded-lg bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono font-bold transition-colors shrink-0"
                  >
                    {isCreatingCat ? '...' : 'Add'}
                  </button>
                </div>
              ) : (
                <select
                  value={category || (customCategories[0]?.name || '')}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setIsAddingCategory(true);
                    } else {
                      setCategory(e.target.value);
                      setError('');
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
                >
                  {category && !customCategories.some((c) => c.name === category) && (
                    <option value={category}>{category}</option>
                  )}
                  {customCategories.length === 0 && !category && (
                    <option value="">-- No categories defined yet --</option>
                  )}
                  {customCategories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__" className="text-[#B48A28] font-bold">
                    + Create New Category...
                  </option>
                </select>
              )}
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

          {/* Row 3: Floor / Level & Nightly Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 font-medium">
                  Floor / Level
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingFloor(!isAddingFloor)}
                  className="text-[10px] font-mono text-[#B48A28] hover:text-[#8A661C] underline font-medium"
                >
                  {isAddingFloor ? 'Select Existing' : '+ New Floor'}
                </button>
              </div>

              {isAddingFloor ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder="e.g. 4th Floor Panoramic"
                    className="flex-1 bg-stone-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddFloor}
                    disabled={isCreatingFloor}
                    className="px-3 py-2 rounded-lg bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono font-bold transition-colors shrink-0"
                  >
                    {isCreatingFloor ? '...' : 'Add'}
                  </button>
                </div>
              ) : (
                <select
                  value={floor || (customFloors[0]?.name || '')}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW_FLOOR__') {
                      setIsAddingFloor(true);
                    } else {
                      setFloor(e.target.value);
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
                >
                  {floor && !customFloors.some((f) => f.name === floor) && (
                    <option value={floor}>{floor}</option>
                  )}
                  {customFloors.length === 0 && !floor && (
                    <option value="">-- No floors defined yet --</option>
                  )}
                  {customFloors.map((flr) => (
                    <option key={flr.id || flr.name} value={flr.name}>
                      {flr.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW_FLOOR__" className="text-[#B48A28] font-bold">
                    + Create New Floor...
                  </option>
                </select>
              )}
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
