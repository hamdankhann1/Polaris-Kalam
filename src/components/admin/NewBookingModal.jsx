import React, { useState, useMemo } from 'react';
import { X, Calendar, User, ShieldAlert, ArrowRight, Bed, Phone, Mail, MessageSquare } from 'lucide-react';
import { FLOOR_CATEGORIES, RoomService } from '../../services/roomService';
import PolarisCalendar from '../common/PolarisCalendar';

/**
 * =========================================================================
 * NewBookingModal Component
 * =========================================================================
 * 
 * Allows staff to quickly select any room and block it / record an incoming booking
 * from the other CMS, phone reservation, or walk-in.
 */
export default function NewBookingModal({ isOpen, onClose, rooms, onSaveBooking }) {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const SOFT_LAUNCH_DATE = '2026-12-01';
  const defaultStart = today < SOFT_LAUNCH_DATE ? SOFT_LAUNCH_DATE : today;
  const defaultEnd = new Date(new Date(defaultStart + 'T00:00:00').getTime() + 86400000 * 3).toISOString().split('T')[0];

  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState(defaultStart);
  const [checkOut, setCheckOut] = useState(defaultEnd);
  const [source, setSource] = useState('Other Hotel CMS (Sync)');
  const [queueStatus, setQueueStatus] = useState('pending'); // 'pending' increments the red notification badge!
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const bookedDates = useMemo(() => {
    if (!selectedRoom) return [];
    return RoomService.getBookedDatesForRoomSync(selectedRoom);
  }, [selectedRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    setIsSubmitting(true);
    try {
      await onSaveBooking(selectedRoomId, 'booked', {
        guestName: guestName.trim() || 'VIP Guest',
        phone: phone.trim() || '+92 300 0000000',
        email: email.trim() || 'concierge@polarishotel.pk',
        checkIn,
        checkOut,
        source,
        notes: notes.trim(),
        queueStatus,
        addToInquiriesQueue: true
      });
      onClose();
    } catch (err) {
      console.error('Error saving manual booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white border border-rose-300 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-stone-200">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-700 font-semibold">
              OPERATIONAL SYNC & RESERVATION BLOCK
            </span>
            <h3 className="font-display text-xl text-stone-900 font-medium tracking-wide">
              Record External Booking
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Manually lock a room received from your other hotel CMS, phone call, or walk-in.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 overflow-y-auto pr-1 flex-1">

          {/* Room Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Select Room to Block *
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors cursor-pointer"
            >
              {FLOOR_CATEGORIES.map((cat) => {
                const floorRooms = rooms.filter((r) => r.floor === cat);
                if (floorRooms.length === 0) return null;

                return (
                  <optgroup 
                    key={cat} 
                    label={cat === 'Top Suite' ? '👑 Top Suite (Summit Penthouse)' : cat}
                    className="text-stone-800 font-semibold"
                  >
                    {floorRooms.map((room) => (
                      <option key={room.id} value={room.id} className="text-stone-900">
                        Room #{room.roomNumber} — {room.name} ({room.tier}) [Currently: {room.status.toUpperCase()}]
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {selectedRoom && selectedRoom.status !== 'available' && (
              <p className="text-[11px] text-amber-800 mt-1 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Note: This room is currently marked as <strong>{selectedRoom.status.toUpperCase()}</strong>. Proceeding will override it to <strong>BOOKED</strong>.</span>
              </p>
            )}
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Guest Name / Reservation Contact *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Mr. Tariq Aziz / Islamabad Corporate Delegation"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* WhatsApp Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                WhatsApp / Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Dates / Live Suite Calendar Coordination */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-2 font-medium flex items-center justify-between">
              <span>Select Stay Dates on Suite Calendar *</span>
              <span className="text-[10px] text-rose-700 font-mono">Soft Launch: Dec 1, 2026 (Earlier Dates Disabled)</span>
            </label>

            <PolarisCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={({ checkIn: newIn, checkOut: newOut }) => {
                setCheckIn(newIn);
                setCheckOut(newOut);
              }}
              bookedDates={bookedDates}
              minDate="2026-12-01"
              nightlyRate={selectedRoom?.price}
              roomName={`Room #${selectedRoom?.roomNumber || ''} ${selectedRoom?.name || ''}`}
            />
          </div>

          {/* Channel / Source & Queue Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Booking Source / Channel *
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
              >
                <option value="Other Hotel CMS (Sync)">Other Hotel CMS / Front-Desk</option>
                <option value="Direct Phone / WhatsApp">Direct Phone / Concierge WhatsApp</option>
                <option value="Walk-in Front Desk">Walk-in Guest at Front Desk</option>
                <option value="OTA Channel (Booking.com / Agoda)">OTA (Booking.com / Agoda)</option>
                <option value="VIP Founder Reservation">VIP Founder Reservation</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                Inquiry Notification Badge *
              </label>
              <select
                value={queueStatus}
                onChange={(e) => setQueueStatus(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors font-mono"
              >
                <option value="pending">🔴 Pending Review (Increments Badge)</option>
                <option value="approved">🟢 Pre-Approved & Locked</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
              Notes & Special Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified advance deposit via bank transfer. Requires twin rollaway bed."
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
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
              className="px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all flex items-center space-x-2 shadow-md shadow-rose-900/10"
            >
              <span>{isSubmitting ? 'Blocking Room...' : 'Lock Room & Save Booking'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
