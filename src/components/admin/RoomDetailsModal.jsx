import React from 'react';
import { X, Bed, Calendar, User, Sparkles, CheckCircle2, ShieldCheck, Clock, MapPin, Tag, ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { BookingRequestService } from '../../services/bookingRequestService';

/**
 * =========================================================================
 * RoomDetailsModal Component
 * =========================================================================
 * 
 * Shows comprehensive room specifications, current status details,
 * scheduled reservations, and pending booking inquiries.
 */
export default function RoomDetailsModal({ 
  isOpen, 
  onClose, 
  room, 
  onTriggerStatusChange,
  bookingRequests = [],
  onApproveRequest
}) {
  if (!isOpen || !room) return null;

  const statusConfig = {
    available: {
      label: 'AVAILABLE',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-500',
      description: 'Room is cleaned, inspected, and open for guest reservations.'
    },
    booked: {
      label: 'BOOKED / OCCUPIED',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      dotClass: 'bg-rose-500',
      description: 'Room is occupied or reserved. Blocked on website to prevent double bookings.'
    },
    'in cleaning': {
      label: 'IN CLEANING / TURNOVER',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500 animate-pulse',
      description: 'Housekeeping team is actively sanitizing and renewing this room.'
    }
  }[room.status] || {
    label: room.status,
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200',
    dotClass: 'bg-stone-500',
    description: ''
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-xl shadow-2xl p-6 sm:p-8 text-stone-900 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-stone-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">
                ROOM #{room.roomNumber}
              </span>
              <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${statusConfig.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                <span>{statusConfig.label}</span>
              </span>
            </div>
            <h3 className="font-display text-2xl text-stone-900 font-medium tracking-wide pt-1">
              {room.name}
            </h3>
            <p className="text-xs text-stone-500 font-light flex items-center space-x-3">
              <span>{room.tier}</span>
              <span>•</span>
              <span>{room.floor}</span>
              <span>•</span>
              <span className="text-[#B48A28] font-mono font-semibold">PKR {room.pricePKR.toLocaleString()} / night</span>
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

        {/* Scrollable Content */}
        <div className="mt-6 space-y-6 overflow-y-auto pr-1">

          {/* ACTIVE STATUS SECTION */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="text-[10px] font-mono tracking-widest uppercase text-stone-500">
              Current Operational State
            </div>

            {/* If BOOKED */}
            {room.status === 'booked' && room.activeBooking && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <span className="text-stone-500">Guest Name:</span>
                  <span className="text-stone-900 font-medium">{room.activeBooking.guestName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <span className="text-stone-500">Dates:</span>
                  <span className="text-rose-700 font-mono font-medium">
                    {room.activeBooking.checkIn} → {room.activeBooking.checkOut}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <span className="text-stone-500">Booking Channel:</span>
                  <span className="text-stone-800 px-2 py-0.5 rounded bg-white border border-stone-200 font-mono text-[11px]">
                    {room.activeBooking.source}
                  </span>
                </div>
                {room.activeBooking.bookingRef && (
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                    <span className="text-stone-500">Reference Ref:</span>
                    <span className="text-stone-700 font-mono text-[11px]">{room.activeBooking.bookingRef}</span>
                  </div>
                )}
                {room.activeBooking.notes && (
                  <div className="pt-1">
                    <span className="text-stone-500 block mb-1">Staff Notes:</span>
                    <p className="text-stone-800 bg-white p-2.5 rounded border border-stone-200 text-[11px] italic">
                      "{room.activeBooking.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* If IN CLEANING */}
            {room.status === 'in cleaning' && room.cleaningInfo && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <span className="text-stone-500">Assigned Team:</span>
                  <span className="text-stone-900 font-medium">{room.cleaningInfo.assignedTo}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <span className="text-stone-500">Priority Level:</span>
                  <span className="text-amber-800 font-medium">{room.cleaningInfo.priority}</span>
                </div>
                {room.cleaningInfo.notes && (
                  <div className="pt-1">
                    <span className="text-stone-500 block mb-1">Turnover Instructions:</span>
                    <p className="text-stone-800 bg-white p-2.5 rounded border border-stone-200 text-[11px] italic">
                      "{room.cleaningInfo.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* If AVAILABLE */}
            {room.status === 'available' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inspected and Certified Ready for Guest Check-in</span>
                </div>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  Last sanitized and inspected: {new Date(room.lastCleanedAt || room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}.
                  This room is currently listed as available for booking inquiries.
                </p>
              </div>
            )}
          </div>

          {/* PENDING & SCHEDULED RESERVATIONS FOR THIS SUITE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500">
                Scheduled Reservations & Inquiries ({bookingRequests.filter((r) => r.roomId === room.id).length + (Array.isArray(room.bookedRanges) ? room.bookedRanges.length : 0)})
              </span>
              {bookingRequests.filter((r) => r.roomId === room.id && r.status === 'pending').length > 0 && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  {bookingRequests.filter((r) => r.roomId === room.id && r.status === 'pending').length} Pending Review
                </span>
              )}
            </div>

            {/* List of pending inquiries */}
            {bookingRequests.filter((r) => r.roomId === room.id).length === 0 && (!room.bookedRanges || room.bookedRanges.length === 0) ? (
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600 font-mono text-center">
                No active reservations or pending inquiries on this suite.
              </div>
            ) : (
              <div className="space-y-2">
                {/* 1. Pending Inquiries */}
                {bookingRequests.filter((r) => r.roomId === room.id).map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';

                  return (
                    <div 
                      key={req.id}
                      className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isPending ? 'bg-amber-50/80 border-amber-300' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-900">{req.guestName}</span>
                          <span className={`text-[9.5px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                            isPending ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-stone-600">
                          {req.checkIn} → {req.checkOut} ({req.nights}N) • {req.guests}
                        </div>
                        {req.phone && (
                          <div className="text-[10.5px] font-mono text-emerald-700 flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{req.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                        <a
                          href={BookingRequestService.generateWhatsAppLink(req)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-mono uppercase font-bold transition-all flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        {isPending && onApproveRequest && (
                          <button
                            onClick={() => {
                              onApproveRequest(req);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10.5px] font-mono uppercase font-bold transition-all flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Coordinated Calendar Blocks */}
                {Array.isArray(room.bookedRanges) && room.bookedRanges.map((b, idx) => (
                  <div key={b.id || idx} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-medium text-stone-900">{b.guestName || 'VIP Reservation'}</span>
                      <span className="text-[10px] text-stone-500 block font-mono">{b.source || 'Scheduled Block'}</span>
                    </div>
                    <span className="font-mono text-rose-700 font-medium text-[11px]">
                      {b.checkIn} → {b.checkOut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ROOM SPECIFICATIONS */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono tracking-widest uppercase text-stone-500">
              Suite Specifications & Amenities
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center space-x-3 text-stone-800 font-medium">
                <Bed className="w-4 h-4 text-[#B48A28] shrink-0" />
                <span>{room.capacity}</span>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center space-x-3 text-stone-800 font-medium">
                <MapPin className="w-4 h-4 text-[#B48A28] shrink-0" />
                <span>{room.floor}</span>
              </div>
            </div>

            {/* Amenities Badges */}
            <div className="pt-2">
              <span className="text-[11px] text-stone-500 block mb-2 font-medium">Architectural Amenities:</span>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK STATUS SWITCH OPTIONS */}
          <div className="pt-4 border-t border-stone-200 space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500 block">
              Quickly Switch Status To:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerStatusChange(room, 'available');
                }}
                disabled={room.status === 'available'}
                className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all text-center ${
                  room.status === 'available'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold cursor-default'
                    : 'border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800'
                }`}
              >
                ✓ Available
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerStatusChange(room, 'booked');
                }}
                disabled={room.status === 'booked'}
                className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all text-center ${
                  room.status === 'booked'
                    ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold cursor-default'
                    : 'border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-600 hover:text-rose-800'
                }`}
              >
                ✕ Booked
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerStatusChange(room, 'in cleaning');
                }}
                disabled={room.status === 'in cleaning'}
                className={`py-2 px-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all text-center ${
                  room.status === 'in cleaning'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold cursor-default'
                    : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50 text-stone-600 hover:text-amber-800'
                }`}
              >
                🧹 In Cleaning
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 flex justify-end border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
