import React, { useState, useMemo } from 'react';
import { X, Calendar, User, Phone, Mail, ArrowRight, Bed, MessageSquare, Sparkles } from 'lucide-react';
import { RoomService } from '../../services/roomService';
import PolarisCalendar from '../common/PolarisCalendar';

/**
 * =========================================================================
 * AddBookingRequestModal Component
 * =========================================================================
 * 
 * Allows hotel staff to manually record a new incoming booking request
 * (e.g. from an incoming phone call, direct WhatsApp chat, or walk-in inquiry)
 * with status 'pending' (which increments the red notification badge count)
 * or 'approved'.
 */
export default function AddBookingRequestModal({ isOpen, onClose, rooms, onSaveRequest, bookingRequests = [] }) {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const defaultStart = today;
  const defaultEnd = new Date(new Date(defaultStart + 'T00:00:00').getTime() + 86400000 * 3).toISOString().split('T')[0];

  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState(defaultStart);
  const [checkOut, setCheckOut] = useState(defaultEnd);
  const [guests, setGuests] = useState('2 Guests');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending'); // 'pending' increments the red badge!
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const roomCategories = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      const c = (r.category || r.floor || 'General Inventory').trim();
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [rooms]);

  const bookedDates = useMemo(() => {
    if (!selectedRoom) return [];
    return RoomService.getBookedDatesForRoomSync(selectedRoom, bookingRequests);
  }, [selectedRoom, bookingRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      setError('Please select a room.');
      return;
    }
    if (!guestName.trim()) {
      setError('Please provide a guest name.');
      return;
    }
    if (!checkIn || !checkOut) {
      setError('Please select both Check-In and Check-Out dates on the calendar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSaveRequest({
        guestName: guestName.trim(),
        phone: phone.trim() || '+92 300 0000000',
        email: email.trim() || 'concierge@polarishotel.pk',
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        roomName: selectedRoom.name,
        tier: selectedRoom.tier,
        floor: selectedRoom.floor,
        pricePKR: selectedRoom.pricePKR,
        checkIn,
        checkOut,
        guests,
        notes: notes.trim(),
        status // 'pending' or 'approved'
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white border border-[#B48A28]/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B48A28] font-semibold">
              STAFF INQUIRY LOG
            </span>
            <h3 className="font-display text-xl text-stone-900 font-medium">
              Create New Booking Request
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Record a direct phone or WhatsApp reservation request to track and review in your CMS queue.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1 flex-1">
          {error && (
            <p className="text-xs text-rose-700 font-mono bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          {/* Room Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Select Suite / Room *
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors cursor-pointer"
            >
              {roomCategories.map((cat) => {
                const catRooms = rooms.filter((r) => (r.category || r.floor || 'General Inventory').trim() === cat);
                if (catRooms.length === 0) return null;

                return (
                  <optgroup 
                    key={cat} 
                    label={cat}
                    className="text-stone-800 font-semibold"
                  >
                    {catRooms.map((r) => (
                      <option key={r.id} value={r.id} className="text-stone-900">
                        Room #{r.roomNumber} — {r.name} ({r.category || r.tier || ''}) (PKR {r.pricePKR.toLocaleString()}/nt) [{r.status.toUpperCase()}]
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Guest Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Tariq Aziz / Corporate VIP"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* WhatsApp / Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                WhatsApp Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Live Suite Calendar Coordination */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-2 font-medium">
              Select Stay Dates on Suite Calendar *
            </label>

            <PolarisCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={({ checkIn: cIn, checkOut: cOut }) => {
                setCheckIn(cIn);
                setCheckOut(cOut);
              }}
              bookedDates={bookedDates}
              pricePKR={selectedRoom ? selectedRoom.pricePKR : 0}
              roomName={selectedRoom ? selectedRoom.name : 'Suite'}
              roomNumber={selectedRoom ? selectedRoom.roomNumber : ''}
            />
          </div>

          {/* Number of Guests & Status Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Number of Guests
              </label>
              <input
                type="text"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="e.g. 2 Adults"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Initial Queue Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors font-mono"
              >
                <option value="pending">🔴 Pending Review (Increases Red Badge)</option>
                <option value="approved">🟢 Approved & Confirmed</option>
                <option value="contacted">🔵 Contacted via WhatsApp</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Special Notes / Origin
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received over phone; inquiry for late check-in."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#B48A28] focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-semibold transition-all flex items-center space-x-2 shadow-md shadow-amber-950/20 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>{isSubmitting ? 'Saving...' : 'Add Booking Request'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
