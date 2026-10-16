import React, { useState, useEffect } from 'react';
import { LogOut, X, Sparkles, CheckCircle2, Bed, Calendar, DollarSign, User, Phone, ShieldCheck, Clock } from 'lucide-react';

export default function CheckOutModal({
  isOpen,
  onClose,
  booking = null,
  room = null,
  onConfirmCheckOut
}) {
  if (!isOpen || (!booking && !room)) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const initialCheckIn = booking?.actualCheckIn || booking?.checkIn || room?.activeBooking?.actualCheckIn || room?.activeBooking?.checkIn || todayStr;
  const initialCheckOut = booking?.actualCheckOut || booking?.checkOut || room?.activeBooking?.actualCheckOut || room?.activeBooking?.checkOut || todayStr;
  const baseRate = Number(booking?.pricePKR || room?.pricePKR || 45000);

  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [nightlyRate, setNightlyRate] = useState(baseRate);
  const [extraCharges, setExtraCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash at Desk');
  const [moveToCleaning, setMoveToCleaning] = useState(true);
  const [departureNotes, setDepartureNotes] = useState('Bill settled in full. Keys returned to front desk.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (booking || room) {
      const start = booking?.actualCheckIn || booking?.checkIn || room?.activeBooking?.actualCheckIn || room?.activeBooking?.checkIn || todayStr;
      const end = booking?.actualCheckOut || booking?.checkOut || room?.activeBooking?.actualCheckOut || room?.activeBooking?.checkOut || todayStr;
      const rate = Number(booking?.pricePKR || room?.pricePKR || 45000);
      setCheckInDate(start);
      setCheckOutDate(end);
      setNightlyRate(rate);
    }
  }, [booking, room]);

  // Derived details
  const guestName = booking?.guestName || room?.activeBooking?.guestName || 'VIP Guest';
  const roomNumber = booking?.roomNumber || room?.roomNumber || '—';
  const roomName = booking?.roomName || room?.name || 'Polaris Suite';
  const phone = booking?.phone || '';

  // Calculate dynamic nights and total
  const nights = Math.max(1, Math.ceil(Math.abs(new Date(checkOutDate) - new Date(checkInDate)) / 86400000)) || 1;
  const roomCharge = nightlyRate * nights;
  const totalAmount = Math.max(0, roomCharge + Number(extraCharges || 0) - Number(discount || 0));

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmCheckOut({
        booking,
        room,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        nightlyRate,
        extraCharges: Number(extraCharges || 0),
        discount: Number(discount || 0),
        totalAmount,
        paymentMethod,
        moveToCleaning,
        departureNotes
      });
      onClose();
    } catch (err) {
      console.error('Error during check-out:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B48A28]">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#B48A28] font-bold">
                FRONT DESK GUEST DEPARTURE & REVENUE SYNC
              </span>
              <h3 className="font-display text-xl text-stone-900 font-medium">
                Guest Check-Out
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

        {/* Guest & Reservation Card */}
        <div className="my-4 p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-stone-500" />
              <span className="font-semibold text-stone-900 text-sm">{guestName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Departing Guest
            </span>
          </div>

          <div className="flex items-center space-x-2 text-stone-600 font-mono text-[11px] pt-0.5">
            <Bed className="w-3.5 h-3.5 text-[#B48A28]" />
            <span className="font-bold text-stone-900">Room #{roomNumber}</span>
            <span>—</span>
            <span>{roomName}</span>
          </div>

          {phone && (
            <div className="flex items-center space-x-1.5 text-stone-600 font-mono text-[11px]">
              <Phone className="w-3 h-3 text-stone-400" />
              <span>{phone}</span>
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConfirm} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {/* Date Coordination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-semibold flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Check-In Date</span>
              </label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-rose-700" />
                <span>Check-Out Date</span>
              </label>
              <input
                type="date"
                required
                min={checkInDate}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>
          </div>

          {/* Rate & Extras Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
                Nightly Rate (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={nightlyRate}
                onChange={(e) => setNightlyRate(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
                Extras / Minibar
              </label>
              <input
                type="number"
                min="0"
                value={extraCharges}
                onChange={(e) => setExtraCharges(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
                Discount (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
              />
            </div>
          </div>

          {/* Revenue Calculation Live Summary Banner */}
          <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>{nights} {nights === 1 ? 'Night' : 'Nights'} × PKR {nightlyRate.toLocaleString()}</span>
              <span>PKR {roomCharge.toLocaleString()}</span>
            </div>
            {Number(extraCharges) > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>Add Extras / Services</span>
                <span>+ PKR {Number(extraCharges).toLocaleString()}</span>
              </div>
            )}
            {Number(discount) > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span>Less Special Discount</span>
                <span>- PKR {Number(discount).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-700 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">Total Revenue (Syncs to Master Look)</span>
              <span className="text-base font-bold text-[#B48A28]">PKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
              Payment Method & Settlement Channel
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#B48A28] focus:bg-white"
            >
              <option value="Cash at Desk">💵 Cash at Front Desk</option>
              <option value="Bank Wire / IBFT">🏦 Bank Wire / IBFT (Habib Metro / Meezan)</option>
              <option value="Credit / Debit Card">💳 Credit / Debit Card Terminal</option>
              <option value="Advance Paid in Full">🛡️ Advance Paid / Pre-Authorized</option>
              <option value="Corporate / Direct Invoice">📄 Corporate Account / Direct Billing</option>
            </select>
          </div>

          {/* Housekeeping Option */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start space-x-3">
            <input
              type="checkbox"
              id="moveToCleaning"
              checked={moveToCleaning}
              onChange={(e) => setMoveToCleaning(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[#B48A28] focus:ring-[#B48A28]"
            />
            <label htmlFor="moveToCleaning" className="cursor-pointer">
              <div className="font-semibold text-stone-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B48A28]" />
                <span>Transition Room to IN TURNOVER / CLEANING</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Immediately unlocks the calendar dates, notifies housekeeping that guest has departed, and prepares suite for next arrival.
              </p>
            </label>
          </div>

          {/* Departure Remarks */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1 font-medium">
              Departure Remarks
            </label>
            <input
              type="text"
              value={departureNotes}
              onChange={(e) => setDepartureNotes(e.target.value)}
              placeholder="e.g. Paid in full via Bank Wire, minibar checked."
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#B48A28] focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-stone-200 shrink-0">
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
              <LogOut className="w-4 h-4" />
              <span>{isSubmitting ? 'Syncing Revenue & Checking Out...' : 'Complete Check-Out & Sync Revenue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
