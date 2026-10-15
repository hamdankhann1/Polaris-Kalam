import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Bed, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Send, 
  X, 
  ShieldCheck, 
  Compass, 
  ArrowRight,
  MessageSquare,
  Lock
} from 'lucide-react';
import { POLARIS_CONFIG } from '../../polarisConfig';
import { RoomService, FLOOR_CATEGORIES } from '../../services/roomService';
import { BookingRequestService } from '../../services/bookingRequestService';
import PolarisCalendar from '../common/PolarisCalendar';

/**
 * =========================================================================
 * BookingPage Component (polarishotels.pk/booking)
 * =========================================================================
 * 
 * Ultra-clean, minimal, luxury booking portal.
 * Guests can browse rooms categorized by 4 floors and one top suite,
 * view live availability with coordinated calendar date locking,
 * and submit a reservation request to be contacted directly via WhatsApp.
 */
export default function BookingPage({ 
  onReturnHome,
  isAdmin = false,
  onReturnToAdmin,
  onLogout
}) {
  const [rooms, setRooms] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('all');

  // Booking Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 Guests');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [roomsData, reqsData] = await Promise.all([
        RoomService.getRooms(),
        BookingRequestService.getRequests()
      ]);
      setRooms(roomsData);
      setBookingRequests(reqsData);
      setIsLoading(false);
    }
    load();

    const unsubRooms = RoomService.subscribe((updatedRooms) => {
      setRooms(updatedRooms);
    });

    const unsubReqs = BookingRequestService.subscribe((updatedReqs) => {
      setBookingRequests(updatedReqs);
    });

    // Window focus refresh for multi-tab booking coordination
    const handleFocus = async () => {
      try {
        const [freshRooms, freshReqs] = await Promise.all([
          RoomService.getRooms(),
          BookingRequestService.getRequests()
        ]);
        setRooms(freshRooms);
        setBookingRequests(freshReqs);
      } catch (err) {
        // silent
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubRooms();
      unsubReqs();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Compute all booked dates for the currently selected room
  const bookedDates = useMemo(() => {
    if (!selectedRoom) return [];
    return RoomService.getBookedDatesForRoomSync(selectedRoom, bookingRequests);
  }, [selectedRoom, bookingRequests]);

  const handleOpenBooking = (room) => {
    setSelectedRoom(room);
    setIsSuccess(false);

    // Soft Launch Day: December 1, 2026
    const SOFT_LAUNCH_DATE = '2026-12-01';
    const roomBooked = RoomService.getBookedDatesForRoomSync(room, bookingRequests);
    const today = new Date().toISOString().split('T')[0];

    // Find next available start date beginning from December 1, 2026 (Soft Launch)
    const baseDateStr = today < SOFT_LAUNCH_DATE ? SOFT_LAUNCH_DATE : today;
    let startD = baseDateStr;
    const cur = new Date(baseDateStr + 'T00:00:00');
    while (roomBooked.includes(startD)) {
      cur.setDate(cur.getDate() + 1);
      const pad = (n) => String(n).padStart(2, '0');
      startD = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    }

    // Default 3 nights if free, or leave checkout open for calendar selection
    const endD = new Date(cur);
    endD.setDate(endD.getDate() + 3);
    const pad = (n) => String(n).padStart(2, '0');
    let endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}`;

    // If any night in between is booked, leave checkout blank so guest picks
    const nights = RoomService.getBookedNightsInRange ? RoomService.getBookedNightsInRange(startD, endStr) : [];
    const overlaps = nights.some((d) => roomBooked.includes(d));
    if (overlaps) {
      endStr = '';
    }

    setCheckIn(startD);
    setCheckOut(endStr);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedRoom || isSubmitting) return;

    if (!checkIn || !checkOut) {
      alert('Please select both your Check-In and Check-Out dates on the suite calendar.');
      return;
    }

    if (checkIn < '2026-12-01') {
      alert('Polaris Kalam Hotel opens for Soft Launch on December 1, 2026. Please select dates starting from December 1, 2026.');
      return;
    }

    setIsSubmitting(true);
    try {
      await BookingRequestService.createRequest({
        guestName,
        phone,
        email,
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        roomName: selectedRoom.name,
        tier: selectedRoom.tier,
        floor: selectedRoom.floor,
        pricePKR: selectedRoom.pricePKR,
        checkIn,
        checkOut,
        guests,
        notes
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Error submitting booking request:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (selectedFloor !== 'all' && room.floor !== selectedFloor) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAF9F5] text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      
      {/* Discreet Staff Management Bar (Visible ONLY when logged in as admin) */}
      {isAdmin && (
        <div className="bg-stone-900 text-stone-200 border-b border-[#B48A28]/50 px-3 sm:px-6 py-2 flex items-center justify-between text-xs font-mono shadow-md z-50 w-full max-w-full overflow-hidden">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-amber-300 font-semibold tracking-wider uppercase text-[10.5px] sm:text-[11px] truncate">Staff Session Active</span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-400 font-light hidden sm:inline">Guest Booking Live Preview</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {onReturnToAdmin && (
              <button
                onClick={onReturnToAdmin}
                className="px-2.5 sm:px-3 py-1 rounded-md bg-[#B48A28] hover:bg-amber-600 text-white font-medium text-[10.5px] sm:text-[11px] tracking-wider uppercase transition-colors flex items-center space-x-1 sm:space-x-1.5 shadow-2xs"
              >
                <ArrowLeft className="w-3 h-3 shrink-0" />
                <span>Return</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2 sm:px-2.5 py-1 rounded-md border border-stone-700 hover:border-rose-400 hover:text-rose-400 text-stone-400 text-[10.5px] sm:text-[11px] tracking-wider uppercase transition-colors flex items-center space-x-1 sm:space-x-1.5"
                title="End Staff Session & Auto-Logout"
              >
                <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TOP MINIMAL HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80 shadow-2xs w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-0 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-0 w-full max-w-full">
          
          {/* Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 max-w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-500/30 flex items-center justify-center bg-white p-1.5 shadow-2xs shrink-0">
              <img
                src={POLARIS_CONFIG.emblem}
                alt="Polaris Star"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(180,138,40,0.3)]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-display text-base sm:text-xl tracking-[0.16em] sm:tracking-[0.22em] font-semibold text-stone-900 truncate">
                  POLARIS
                </span>
                <span className="text-[9px] sm:text-xs font-mono tracking-wider px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 uppercase font-bold shrink-0">
                  DIRECT RESERVATIONS
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs tracking-wider text-[#8A661C] uppercase font-mono font-bold mt-0.5 truncate max-w-[240px] sm:max-w-none">
                <span className="hidden sm:inline">Kalam Valley, Swat • </span>polarishotels.pk/booking
              </p>
            </div>
          </div>

          {/* Return Action */}
          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg border border-stone-300 hover:border-amber-600 hover:bg-amber-50/60 text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 hover:text-stone-900 font-semibold transition-all flex items-center justify-center space-x-2 shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#B48A28] shrink-0" />
            <span>Return to Sanctuary</span>
          </button>

        </div>
      </header>

      {/* =========================================================================
          HERO STATEMENT
          ========================================================================= */}
      <section className="relative pt-10 sm:pt-14 pb-6 sm:pb-8 px-3 sm:px-6 text-center max-w-4xl mx-auto w-full max-w-full">
        <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 rounded-full border border-amber-300/80 bg-amber-50 text-[#8A661C] text-xs font-mono tracking-wider uppercase mb-4 shadow-2xs font-bold max-w-[92vw]">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate"><span className="hidden sm:inline">Inaugural Season 2026 • </span>Private Concierge Allocation</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-stone-900 font-medium tracking-tight leading-tight px-2">
          Select Your Alpine Sanctuary
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-stone-700 font-normal mt-4 max-w-2xl mx-auto leading-relaxed px-2">
          Crafted with monolithic stone, heated cedar wood, and unobstructed glacial glass. 
          Select an available suite to submit your reservation request. Our concierge desk will contact you directly on <strong className="font-semibold text-stone-900">WhatsApp</strong> to finalize your booking.
        </p>
      </section>

      {/* =========================================================================
          CATEGORY / FLOOR FILTER TABS
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 w-full max-w-full mb-8 overflow-hidden">
        <div className="flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 px-2 scrollbar-none w-full max-w-full">
          <button
            onClick={() => setSelectedFloor('all')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-mono uppercase tracking-wider transition-all shrink-0 font-semibold ${
              selectedFloor === 'all'
                ? 'bg-[#B48A28] text-white font-bold shadow-xs'
                : 'bg-white text-stone-700 hover:text-stone-900 border border-stone-300 shadow-2xs'
            }`}
          >
            All Suites ({rooms.length})
          </button>

          {FLOOR_CATEGORIES.map((cat) => {
            const count = rooms.filter((r) => r.floor === cat).length;
            const isTop = cat === 'Top Suite';

            return (
              <button
                key={cat}
                onClick={() => setSelectedFloor(cat)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-mono uppercase tracking-wider transition-all shrink-0 flex items-center space-x-1.5 font-semibold ${
                  selectedFloor === cat
                    ? 'bg-[#B48A28] text-white font-bold shadow-xs'
                    : isTop
                    ? 'bg-amber-50 text-[#8A661C] border border-amber-300 hover:bg-amber-100/60 font-bold'
                    : 'bg-white text-stone-700 hover:text-stone-900 border border-stone-300 shadow-2xs'
                }`}
              >
                {isTop && <Crown className="w-3.5 h-3.5 text-[#B48A28] shrink-0" />}
                <span>{cat} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ROOMS GRID
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-20 sm:pb-24 w-full max-w-full flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-stone-600 font-mono text-sm sm:text-base font-medium">
            Loading suites and availability...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center text-stone-600 font-mono text-sm sm:text-base font-medium">
            No suites currently listed for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredRooms.map((room) => {
              const isAvailable = room.status === 'available';
              const isBooked = room.status === 'booked';
              const isCleaning = room.status === 'in cleaning';
              const isTop = room.floor === 'Top Suite';

              return (
                <div
                  key={room.id}
                  className={`relative rounded-2xl bg-white border flex flex-col justify-between overflow-hidden transition-all duration-300 group hover:translate-y-[-2px] ${
                    isTop
                      ? 'border-amber-300 shadow-[0_4px_25px_rgba(180,138,40,0.12)] hover:shadow-[0_12px_32px_rgba(180,138,40,0.18)]'
                      : 'border-stone-200/90 hover:border-amber-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Card Header & Content */}
                  <div className="p-5 sm:p-7 space-y-5">
                    
                    {/* Top Row: Room number & Status badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-xs sm:text-sm px-3 py-1 rounded font-bold ${
                          isTop ? 'bg-[#B48A28] text-white' : 'bg-stone-100 text-stone-900 border border-stone-300'
                        }`}>
                          #{room.roomNumber}
                        </span>

                        <span className={`text-xs sm:text-sm font-mono ${
                          isTop ? 'text-[#8A661C] font-bold' : 'text-stone-700 font-semibold'
                        }`}>
                          {room.floor}
                        </span>
                      </div>

                      {/* Status indicator */}
                      {isAvailable && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Available</span>
                        </span>
                      )}

                      {isBooked && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-rose-50 border border-rose-300 text-rose-800 font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Fully Booked</span>
                        </span>
                      )}

                      {isCleaning && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Turnover</span>
                        </span>
                      )}
                    </div>

                    {/* Suite Title & Tier */}
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium group-hover:text-[#B48A28] transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 mt-1.5 font-medium">
                        {room.tier} • {room.capacity}
                      </p>
                    </div>

                    {/* Price Tag */}
                    <div className="pt-2.5 pb-2 border-t border-b border-stone-200/90 flex items-baseline justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
                        Nightly Allocation
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl sm:text-3xl font-mono font-bold text-[#8A661C]">
                          PKR {room.pricePKR.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm font-mono text-stone-600 font-medium">/ night</span>
                      </div>
                    </div>

                    {/* Key Amenities */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold block">
                        Suite Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {room.amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-800 font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Card Action Button */}
                  <div className="p-5 sm:p-7 pt-0">
                    {isAvailable && (
                      <button
                        onClick={() => handleOpenBooking(room)}
                        className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                      >
                        <Calendar className="w-4 h-4 text-white" />
                        <span>Select Dates & Reserve</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {isBooked && (
                      <button
                        onClick={() => handleOpenBooking(room)}
                        className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold transition-all flex items-center justify-center space-x-2 shadow-2xs"
                      >
                        <Calendar className="w-4 h-4 text-rose-600" />
                        <span>Check Calendar & Future Dates</span>
                        <ArrowRight className="w-4 h-4 text-stone-600" />
                      </button>
                    )}

                    {isCleaning && (
                      <button
                        onClick={() => handleOpenBooking(room)}
                        className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-[#8A661C] font-bold transition-all flex items-center justify-center space-x-2 shadow-2xs"
                      >
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>In Turnover • Book Upcoming Stay</span>
                        <ArrowRight className="w-4 h-4 text-amber-600" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          RESERVATION REQUEST MODAL
          ========================================================================= */}
      {isModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-2xl p-5 sm:p-8 md:p-10 text-stone-900 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              // SUCCESS CONFIRMATION
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
                    REQUEST RECEIVED
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium">
                    Sanctuary Allocation Requested
                  </h3>
                  <p className="text-sm sm:text-base text-stone-700 max-w-md mx-auto leading-relaxed pt-2 font-normal">
                    Thank you, <strong className="font-semibold text-stone-900">{guestName}</strong>. Your reservation inquiry for <strong className="font-semibold text-stone-900">Room #{selectedRoom.roomNumber} ({selectedRoom.name})</strong> has been received by our private concierge.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs sm:text-sm text-emerald-950 font-mono text-left space-y-2 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-[#8A661C] font-bold">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp Concierge Contact:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-sans leading-relaxed font-normal">
                    Our guest manager will contact your WhatsApp at <strong className="font-semibold text-stone-900">{phone}</strong> to confirm your dates ({checkIn} → {checkOut}) and provide payment / deposit instructions.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs sm:text-sm font-mono uppercase tracking-wider font-bold transition-all shadow-xs"
                >
                  Return to Suites
                </button>
              </div>
            ) : (
              // BOOKING FORM
              <div>
                <div className="space-y-1 pb-4 border-b border-stone-200">
                  <div className="flex items-center space-x-2 font-mono text-xs sm:text-sm">
                    <span className="px-2.5 py-1 rounded bg-[#B48A28] text-white font-bold">
                      ROOM #{selectedRoom.roomNumber}
                    </span>
                    <span className="text-stone-600 font-semibold">{selectedRoom.floor}</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium pt-1">
                    {selectedRoom.name}
                  </h3>
                  <p className="text-sm sm:text-base text-[#8A661C] font-mono font-bold">
                    PKR {selectedRoom.pricePKR.toLocaleString()} / night • {selectedRoom.capacity}
                  </p>
                </div>

                <form onSubmit={handleSubmitRequest} className="mt-5 space-y-4 sm:space-y-5">
                  {/* Guest Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Tariq Aziz"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* WhatsApp & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                        WhatsApp / Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+92 300 1234567"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tariq@example.com"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Luxury Polaris Calendar Date Picker */}
                  <div className="pt-1">
                    <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-2 font-bold flex items-center justify-between">
                      <span>Stay Dates (Check-In & Check-Out) *</span>
                      <span className="text-xs text-[#8A661C] font-mono font-bold">Soft Launch: Dec 1, 2026 (Earlier Dates Disabled)</span>
                    </label>

                    <PolarisCalendar
                      checkIn={checkIn}
                      checkOut={checkOut}
                      onChange={({ checkIn: cIn, checkOut: cOut }) => {
                        setCheckIn(cIn);
                        setCheckOut(cOut);
                      }}
                      bookedDates={bookedDates}
                      minDate="2026-12-01"
                      pricePKR={selectedRoom.pricePKR}
                      roomName={selectedRoom.name}
                      roomNumber={selectedRoom.roomNumber}
                    />
                  </div>

                  {/* Number of Guests */}
                  <div>
                    <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                      Number of Guests
                    </label>
                    <input
                      type="text"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      placeholder="e.g. 2 Adults, 1 Child"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Special Requests / Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                      Special Requests / Private Transfer Needs (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Honeymoon setup, Swat airport transfer, late evening arrival."
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Reservation Request'}</span>
                    </button>
                    <p className="text-xs text-stone-600 font-medium font-mono text-center mt-2.5">
                      Our front-desk team will contact your WhatsApp to confirm availability and deposit.
                    </p>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          MINIMAL FOOTER
          ========================================================================= */}
      <footer className="border-t border-stone-200 bg-[#F5F2EB] py-8 px-4 sm:px-6 text-center text-xs sm:text-sm text-stone-700 font-mono">
        <p>© {new Date().getFullYear()} POLARIS Hotel & Sanctuary • Kalam Valley, Swat, Pakistan</p>
        <p className="text-xs text-stone-600 mt-1.5 font-medium">Direct Reservations Portal • polarishotels.pk/booking</p>
      </footer>

    </div>
  );
}
