import React, { useState, useEffect } from 'react';
import { LogIn, X, Calendar, User, Phone, CheckCircle2, Bed, Clock } from 'lucide-react';

export default function CheckInModal({
  isOpen,
  onClose,
  booking = null,
  room = null,
  onConfirmCheckIn
}) {
  if (!isOpen || (!booking && !room)) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const initialCheckIn = booking?.actualCheckIn || booking?.checkIn || room?.activeBooking?.checkIn || todayStr;
  const initialCheckOut = booking?.actualCheckOut || booking?.checkOut || room?.activeBooking?.checkOut || todayStr;

  const [actualCheckIn, setActualCheckIn] = useState(initialCheckIn);
  const [expectedCheckOut, setExpectedCheckOut] = useState(initialCheckOut);
  const [remarks, setRemarks] = useState('Guest arrived & verified. Keys issued.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (booking || room) {
      const start = booking?.actualCheckIn || booking?.checkIn || room?.activeBooking?.checkIn || todayStr;
      const end = booking?.actualCheckOut || booking?.checkOut || room?.activeBooking?.checkOut || todayStr;
      setActualCheckIn(start);
      setExpectedCheckOut(end);
    }
  }, [booking, room]);

  const guestName = booking?.guestName || room?.activeBooking?.guestName || 'VIP Guest';
  const roomNumber = booking?.roomNumber || room?.roomNumber || '—';
  const roomName = booking?.roomName || room?.name || 'Polaris Suite';
  const phone = booking?.phone || '';

  // Calculate nights
  const nights = Math.max(1, Math.ceil(Math.abs(new Date(expectedCheckOut) - new Date(actualCheckIn)) / 86400000)) || 1;
  const pricePKR = booking?.pricePKR || room?.pricePKR || 45000;
  const estAmount = pricePKR * nights;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmCheckIn({
        booking,
        room,
        actualCheckIn,
        expectedCheckOut,
        nights,
        remarks
      });
      onClose();
    } catch (err) {
      console.error('Error during check-in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                FRONT DESK GUEST ARRIVAL
              </span>
              <h3 className="font-display text-xl text-stone-900 font-medium">
                Guest Check-In
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest & Room Details Card */}
        <div className="my-5 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-stone-500" />
              <span className="font-semibold text-stone-900 text-sm">{guestName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Arriving Guest</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-stone-600 font-mono text-[11px] pt-1">
            <Bed className="w-3.5 h-3.5 text-[#B48A28]" />
            <span className="font-bold text-stone-900">Room #{roomNumber}</span>
            <span>—</span>
            <span>{roomName}</span>
          </div>

          {phone && (
            <div className="flex items-center space-x-1.5 text-emerald-700 font-mono text-[11px]">
              <Phone className="w-3 h-3" />
              <span>{phone}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Date Coordination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-semibold flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Actual Check-In Date</span>
              </label>
              <input
                type="date"
                required
                value={actualCheckIn}
                onChange={(e) => setActualCheckIn(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#B48A28]" />
                <span>Expected Check-Out Date</span>
              </label>
              <input
                type="date"
                required
                min={actualCheckIn}
                value={expectedCheckOut}
                onChange={(e) => setExpectedCheckOut(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>
          </div>

          {/* Stay Calculation Summary */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs font-mono text-emerald-900">
            <div>
              <span className="text-emerald-700 font-semibold block">Coordinated Duration</span>
              <span className="font-bold text-sm">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-700 font-semibold block">Est. Revenue</span>
              <span className="font-bold text-sm text-[#B48A28]">PKR {estAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Front Desk Remarks */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
              Front Desk Remarks / ID Verification
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. CNIC verified, advance PKR 20,000 paid"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
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
              className="px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all flex items-center space-x-2 shadow-md shadow-emerald-900/10 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking In...' : 'Confirm Arrival & Check In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
