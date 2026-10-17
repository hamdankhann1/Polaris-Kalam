import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Sparkles, Calendar, User, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { getTodayYMD, addDaysYMD } from '../../utils/dateUtils';

/**
 * =========================================================================
 * StatusChangeModal Component
 * =========================================================================
 * 
 * Handles switching a room's status between the 3 core options:
 * - 'available'
 * - 'booked'
 * - 'in cleaning'
 */
export default function StatusChangeModal({ isOpen, onClose, room, targetStatus, onConfirm }) {
  if (!isOpen || !room || !targetStatus) return null;

  // Form states for 'booked'
  const today = getTodayYMD();
  const tomorrow = addDaysYMD(today, 1);
  const threeDaysLater = addDaysYMD(today, 3);

  const [guestName, setGuestName] = useState(room.activeBooking?.guestName || '');
  const [checkIn, setCheckIn] = useState(room.activeBooking?.checkIn || today);
  const [checkOut, setCheckOut] = useState(room.activeBooking?.checkOut || threeDaysLater);
  const [source, setSource] = useState(room.activeBooking?.source || 'Other Hotel CMS (Sync)');
  const [notes, setNotes] = useState(room.activeBooking?.notes || '');

  // Form states for 'in cleaning'
  const [assignedTo, setAssignedTo] = useState(room.cleaningInfo?.assignedTo || 'Housekeeping Team Alpha');
  const [priority, setPriority] = useState(room.cleaningInfo?.priority || 'Standard Departure Cleaning');
  const [cleaningNotes, setCleaningNotes] = useState(room.cleaningInfo?.notes || '');

  // Form states for 'available'
  const [inspectedBy, setInspectedBy] = useState('Front Desk Duty Supervisor');
  const [certifiedClean, setCertifiedClean] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (room) {
      if (targetStatus === 'booked') {
        setGuestName(room.activeBooking?.guestName || '');
        setCheckIn(room.activeBooking?.checkIn || today);
        setCheckOut(room.activeBooking?.checkOut || threeDaysLater);
        setSource(room.activeBooking?.source || 'Other Hotel CMS (Sync)');
        setNotes(room.activeBooking?.notes || '');
      } else if (targetStatus === 'in cleaning') {
        setAssignedTo(room.cleaningInfo?.assignedTo || 'Housekeeping Team Alpha');
        setPriority(room.cleaningInfo?.priority || 'Standard Departure Cleaning');
        setCleaningNotes(room.cleaningInfo?.notes || '');
      } else if (targetStatus === 'available') {
        setInspectedBy('Front Desk Duty Supervisor');
        setCertifiedClean(true);
      }
    }
  }, [room, targetStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let meta = {};
      if (targetStatus === 'booked') {
        meta = {
          guestName: guestName.trim() || 'VIP Guest (Sync)',
          checkIn,
          checkOut,
          source,
          notes: notes.trim(),
        };
      } else if (targetStatus === 'in cleaning') {
        meta = {
          assignedTo: assignedTo.trim() || 'Turnover Staff',
          priority,
          notes: cleaningNotes.trim(),
        };
      } else if (targetStatus === 'available') {
        meta = {
          inspectedBy: inspectedBy.trim(),
          certifiedClean
        };
      }

      await onConfirm(room.id, targetStatus, meta);
      onClose();
    } catch (err) {
      console.error('Error changing room status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper colors & titles based on target status
  const config = {
    available: {
      title: 'Mark Room Available',
      subtitle: 'Certify room as inspected, sanitized, and open for direct website booking.',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs',
      accentColor: 'border-emerald-300'
    },
    booked: {
      title: 'Lock Specific Dates / Record Booking',
      subtitle: 'Locks this suite on the calendar for the selected dates only. The room continues to be open for all other dates.',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
      actionBtn: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs',
      accentColor: 'border-rose-300'
    },
    'in cleaning': {
      title: 'Move Room to In Cleaning',
      subtitle: 'Notifies staff that housekeeping and sanitization turnover are underway.',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
      actionBtn: 'bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs',
      accentColor: 'border-amber-300'
    }
  }[targetStatus] || {
    title: 'Update Room Status',
    subtitle: '',
    badgeBg: 'bg-stone-100 text-stone-800 border-stone-200',
    actionBtn: 'bg-[#B48A28] text-white',
    accentColor: 'border-stone-300'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full max-w-xl bg-white border ${config.accentColor} rounded-xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-stone-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">
                ROOM #{room.roomNumber}
              </span>
              <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
                New Status: {targetStatus.toUpperCase()}
              </span>
            </div>
            <h3 className="font-display text-xl text-stone-900 font-medium tracking-wide pt-1">
              {config.title}
            </h3>
            <p className="text-xs text-stone-500 font-light">
              {config.subtitle}
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
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          {/* TARGET STATUS: BOOKED */}
          {targetStatus === 'booked' && (
            <>
              {/* Alert Notice */}
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Once saved, <strong>Room {room.roomNumber} ({room.name})</strong> will immediately be marked as <strong>UNAVAILABLE</strong> on the public website for these dates.
                </span>
              </div>

              {/* Guest Full Name */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Guest Name / Primary Guest *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Guest Full Name / Corporate VIP"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Date Range: Check-In & Check-Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                    Check-In Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                    Check-Out Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="date"
                      required
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Origin / Source */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Booking Source / Channel *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                >
                  <option value="Other Hotel CMS (Sync)">Other Hotel CMS / Front-Desk Software</option>
                  <option value="Direct Phone / WhatsApp">Direct Phone / Concierge WhatsApp</option>
                  <option value="Walk-in Front Desk">Walk-in Guest at Front Desk</option>
                  <option value="OTA Channel (Booking.com / Agoda)">OTA Channel (Booking.com / Agoda)</option>
                  <option value="VIP Founder Reservation">VIP / Founder Private Reservation</option>
                </select>
              </div>

              {/* Operational Notes */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Internal Notes / Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in cash at reception; requested late checkout at 2:00 PM."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                />
              </div>
            </>
          )}

          {/* TARGET STATUS: IN CLEANING */}
          {targetStatus === 'in cleaning' && (
            <>
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Room <strong>{room.roomNumber}</strong> will show as <strong>IN CLEANING</strong>. Housekeeping will be flagged to prepare the suite.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Assigned Housekeeping Team / Staff
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. Team Alpha / Hamza & Tariq"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Turnaround Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                >
                  <option value="Urgent — Same Day Guest Arrival">Urgent — Same Day Guest Arrival (ETA 3:00 PM)</option>
                  <option value="Standard Departure Cleaning">Standard Departure Cleaning (Guest Checked Out)</option>
                  <option value="Deep Sanitization & Steaming">Deep Sanitization & Mountain Cedar Steaming</option>
                  <option value="Linen & Restocking Routine">Linen & Restocking Routine</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Turnover Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cleaningNotes}
                  onChange={(e) => setCleaningNotes(e.target.value)}
                  placeholder="e.g. Replace down pillows, restock fireplace logs and artisan tea."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </>
          )}

          {/* TARGET STATUS: AVAILABLE */}
          {targetStatus === 'available' && (
            <>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-medium text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ready for Guest Arrival</span>
                </div>
                <p className="text-emerald-700 text-[11.5px] leading-relaxed">
                  Marking <strong>Room {room.roomNumber} ({room.name})</strong> as Available will clear any cleaning or previous booking locks and immediately display this suite as open for reservations on the public website.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 mb-1.5">
                  Inspected & Approved By
                </label>
                <input
                  type="text"
                  value={inspectedBy}
                  onChange={(e) => setInspectedBy(e.target.value)}
                  placeholder="e.g. Front Desk Duty Manager / Head of Housekeeping"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <label className="flex items-start space-x-3 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={certifiedClean}
                  onChange={(e) => setCertifiedClean(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-0"
                />
                <span className="text-xs text-stone-700">
                  I confirm this suite has passed room inspection (linens renewed, amenities restocked, climate calibrated).
                </span>
              </label>
            </>
          )}

          {/* Action Buttons */}
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
              className={`px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 ${config.actionBtn} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{isSubmitting ? 'Updating...' : `Confirm: Mark as ${targetStatus.toUpperCase()}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
