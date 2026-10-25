import React, { useState, useEffect, useMemo } from "react";
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
  Lock,
  AlertCircle,
  Layers,
  Building2,
  Check,
  Users,
  Maximize2,
  Clock
} from "lucide-react";
import { POLARIS_CONFIG } from "../../polarisConfig";
import {
  RoomService,
  groupRoomsByCategory,
  getAvailableRoomsForCategory,
  getCategoryBookedDates,
} from "../../services/roomService";
import { BookingRequestService } from "../../services/bookingRequestService";
import PolarisCalendar from "../common/PolarisCalendar";
import { formatYMD, getTodayYMD, addDaysYMD, diffDaysYMD } from "../../utils/dateUtils";

/**
 * =========================================================================
 * BookingPage Component (polarishotels.pk/booking)
 * =========================================================================
 *
 * Ultra-clean, minimal, luxury booking portal.
 * Optimized for flawless touch interaction on phone, tablet, and desktop.
 * Guests browse rooms categorized by 4 vertical tiers,
 * view live availability with coordinated calendar date locking,
 * and submit a reservation request to be contacted directly via WhatsApp.
 */
export default function BookingPage({
  onReturnHome,
  isAdmin = false,
  onReturnToAdmin,
  onLogout,
  initialCategory = null,
}) {
  const [rooms, setRooms] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState("all");

  // Booking Modal State (Operates on high-level Room Category)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFloorPreference, setSelectedFloorPreference] = useState("");

  // Form State
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Prevent background body scroll when booking modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isModalOpen]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [roomsData, reqsData] = await Promise.all([
          RoomService.getRooms(),
          BookingRequestService.getRequests(),
        ]);
        setRooms(roomsData || []);
        setBookingRequests(reqsData || []);
      } catch (err) {
        console.error("Error loading booking inventory:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();

    const unsubRooms = RoomService.subscribe((updatedRooms) => {
      setRooms(updatedRooms || []);
    });

    const unsubReqs = BookingRequestService.subscribe((updatedReqs) => {
      setBookingRequests(updatedReqs || []);
    });

    const handleRoomUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRooms([...e.detail]);
      }
    };
    const handleBookingUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBookingRequests([...e.detail]);
      }
    };
    window.addEventListener("polaris:room-update", handleRoomUpdate);
    window.addEventListener("polaris:booking-update", handleBookingUpdate);

    const handleFocus = async () => {
      try {
        const [freshRooms, freshReqs] = await Promise.all([
          RoomService.getRooms(),
          BookingRequestService.getRequests(),
        ]);
        setRooms(freshRooms || []);
        setBookingRequests(freshReqs || []);
      } catch (err) {
        // silent
      }
    };
    window.addEventListener("focus", handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    }, 30000);

    return () => {
      unsubRooms();
      unsubReqs();
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("polaris:room-update", handleRoomUpdate);
      window.removeEventListener("polaris:booking-update", handleBookingUpdate);
    };
  }, []);

  // Compute distinct Room Categories / Types from the database rooms & live bookings
  const categories = useMemo(() => {
    return groupRoomsByCategory(rooms, bookingRequests);
  }, [rooms, bookingRequests]);

  // Keep selectedCategory in sync with latest live room data
  useEffect(() => {
    if (selectedCategory) {
      const live = categories.find(
        (c) => c.id === selectedCategory.id || c.name === selectedCategory.name
      );
      if (live && JSON.stringify(live) !== JSON.stringify(selectedCategory)) {
        setSelectedCategory(live);
      }
    }
  }, [categories, selectedCategory]);

  // Auto-open modal for initialCategory if passed from homepage suite selection
  useEffect(() => {
    if (initialCategory && categories.length > 0 && !selectedCategory) {
      const match = categories.find(
        (c) =>
          c.name.toLowerCase().includes(initialCategory.toLowerCase()) ||
          (c.id && c.id.toLowerCase().includes(initialCategory.toLowerCase())) ||
          (Array.isArray(c.rooms) && c.rooms.some((r) => 
            (r.floor && r.floor.toLowerCase().includes(initialCategory.toLowerCase())) ||
            (r.name && r.name.toLowerCase().includes(initialCategory.toLowerCase()))
          ))
      );
      if (match) {
        setSelectedCategory(match);
        setIsModalOpen(true);
      }
    }
  }, [initialCategory, categories, selectedCategory]);

  // Compute live available rooms within the selected category for the selected date range
  const availableRoomsForRange = useMemo(() => {
    if (!selectedCategory || !checkIn || !checkOut) {
      return selectedCategory ? selectedCategory.rooms : [];
    }
    return getAvailableRoomsForCategory(
      selectedCategory.rooms,
      checkIn,
      checkOut,
      bookingRequests
    );
  }, [selectedCategory, checkIn, checkOut, bookingRequests]);

  // Group rooms into distinct floor or room options
  const floorOrRoomOptions = useMemo(() => {
    if (!selectedCategory || !Array.isArray(selectedCategory.rooms)) return [];

    const floorMap = new Map();
    selectedCategory.rooms.forEach((r) => {
      const f = (r.floor || 'Standard Level').trim();
      if (!floorMap.has(f)) floorMap.set(f, []);
      floorMap.get(f).push(r);
    });

    return Array.from(floorMap.entries()).map(([floorName, floorRooms]) => {
      const minP = Math.min(...floorRooms.map((r) => Number(r.pricePKR) || 45000));
      const maxP = Math.max(...floorRooms.map((r) => Number(r.pricePKR) || 45000));

      return {
        id: floorName,
        name: floorName,
        pricePKR: minP,
        maxPricePKR: maxP,
        rooms: floorRooms
      };
    });
  }, [selectedCategory]);

  // Compute live allocated suite based on active dates & user preference
  const currentAssignedRoom = useMemo(() => {
    if (!selectedCategory || !Array.isArray(selectedCategory.rooms) || selectedCategory.rooms.length === 0) {
      return null;
    }

    const categoryRooms = selectedCategory.rooms;

    let candidates = categoryRooms;
    if (checkIn && checkOut) {
      const available = getAvailableRoomsForCategory(
        categoryRooms,
        checkIn,
        checkOut,
        bookingRequests
      );
      if (available.length > 0) {
        candidates = available;
      }
    }

    if (selectedFloorPreference) {
      const matchByRoom = candidates.find(
        (r) => r.id === selectedFloorPreference || r.roomNumber === selectedFloorPreference
      );
      if (matchByRoom) return matchByRoom;

      const matchByFloor = candidates.find(
        (r) => (r.floor || '').trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
      );
      if (matchByFloor) return matchByFloor;

      const anyMatch = categoryRooms.find(
        (r) =>
          r.id === selectedFloorPreference ||
          r.roomNumber === selectedFloorPreference ||
          (r.floor || '').trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
      );
      if (anyMatch) return anyMatch;
    }

    const sorted = [...candidates].sort(
      (a, b) => (Number(a.pricePKR) || 0) - (Number(b.pricePKR) || 0)
    );

    return sorted[0] || categoryRooms[0];
  }, [selectedCategory, checkIn, checkOut, bookingRequests, selectedFloorPreference]);

  const currentNightlyPrice = useMemo(() => {
    if (currentAssignedRoom && Number(currentAssignedRoom.pricePKR) > 0) {
      return Number(currentAssignedRoom.pricePKR);
    }
    return selectedCategory?.minPrice || 45000;
  }, [currentAssignedRoom, selectedCategory]);

  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return diffDaysYMD(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const activeBookedDates = useMemo(() => {
    if (!selectedCategory) return [];
    if (!selectedFloorPreference) {
      return selectedCategory.bookedDates || [];
    }

    const matchingRooms = selectedCategory.rooms.filter(
      (r) =>
        r.id === selectedFloorPreference ||
        r.roomNumber === selectedFloorPreference ||
        (r.floor || '').trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
    );

    if (matchingRooms.length === 0) return selectedCategory.bookedDates || [];

    return getCategoryBookedDates(matchingRooms, bookingRequests);
  }, [selectedCategory, selectedFloorPreference, bookingRequests]);

  const handleOpenBooking = (category) => {
    setSelectedCategory(category);
    setSelectedFloorPreference("");
    setIsSuccess(false);

    const catBooked = category.bookedDates || [];
    const today = getTodayYMD();

    let startD = today;
    while (catBooked.includes(startD)) {
      startD = addDaysYMD(startD, 1);
    }

    let endStr = addDaysYMD(startD, 3);
    const nights = RoomService.getBookedNightsInRange
      ? RoomService.getBookedNightsInRange(startD, endStr)
      : [];
    const overlaps = nights.some((d) => catBooked.includes(d));
    if (overlaps) {
      endStr = "";
    }

    setCheckIn(startD);
    setCheckOut(endStr);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedCategory || isSubmitting) return;

    if (!checkIn || !checkOut) {
      alert("Please select both your Check-In and Check-Out dates on the suite calendar.");
      return;
    }

    const available = getAvailableRoomsForCategory(
      selectedCategory.rooms,
      checkIn,
      checkOut,
      bookingRequests
    );

    if (!available || available.length === 0) {
      alert(`All ${selectedCategory.totalRooms} suites in "${selectedCategory.name}" are occupied for the dates ${checkIn} to ${checkOut}. Please choose alternative dates.`);
      return;
    }

    let assignedRoom = null;
    if (selectedFloorPreference) {
      assignedRoom = available.find(
        (r) =>
          r.id === selectedFloorPreference ||
          r.roomNumber === selectedFloorPreference ||
          (r.floor || "").trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
      );
    }
    if (!assignedRoom) {
      const sorted = [...available].sort(
        (a, b) => (Number(a.pricePKR) || 0) - (Number(b.pricePKR) || 0)
      );
      assignedRoom = sorted[0];
    }

    setIsSubmitting(true);
    try {
      const preferredFloorVal = selectedFloorPreference || assignedRoom.floor;
      await BookingRequestService.createRequest({
        guestName,
        phone,
        email,
        roomId: assignedRoom.id,
        roomNumber: assignedRoom.roomNumber,
        roomName: selectedCategory.name,
        tier: selectedCategory.tier,
        floor: assignedRoom.floor,
        preferredFloor: preferredFloorVal,
        pricePKR: assignedRoom.pricePKR,
        checkIn,
        checkOut,
        guests,
        notes: notes
          ? `${notes} [Category: ${selectedCategory.name} • Suite #${assignedRoom.roomNumber} (${assignedRoom.floor})${selectedFloorPreference ? ` • Preferred: ${selectedFloorPreference}` : ''} • Rate: PKR ${assignedRoom.pricePKR.toLocaleString()}/night]`
          : `Category: ${selectedCategory.name} • Suite #${assignedRoom.roomNumber} (${assignedRoom.floor})${selectedFloorPreference ? ` • Preferred: ${selectedFloorPreference}` : ''} • Rate: PKR ${assignedRoom.pricePKR.toLocaleString()}/night`,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Error submitting booking request:", err);
      alert("Failed to submit request: " + (err.message || "Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (selectedFloor === "all") return categories;
    return categories.filter((cat) => {
      if (cat.name === selectedFloor) return true;
      if (cat.floor === selectedFloor) return true;
      if (Array.isArray(cat.floors) && cat.floors.includes(selectedFloor)) return true;
      if (cat.tier === selectedFloor) return true;
      if (cat.id === selectedFloor) return true;
      return false;
    });
  }, [categories, selectedFloor]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FBFBFA] text-[#111111] flex flex-col font-sans selection:bg-[#111111] selection:text-[#FBFBFA]">
      
      {/* 1. DISCREET STAFF MANAGEMENT BAR (Only visible if admin session) */}
      {isAdmin && (
        <div className="bg-[#111111] text-[#FBFBFA] border-b border-[#8A661C]/40 px-3 sm:px-6 py-2 flex items-center justify-between text-xs font-mono shadow-sm z-50 w-full overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#E0BB53] animate-pulse shrink-0" />
            <span className="text-[#E0BB53] font-semibold tracking-wider uppercase text-[11px] truncate">
              Staff Session Active
            </span>
            <span className="text-stone-500 hidden sm:inline">•</span>
            <span className="text-stone-300 font-light hidden sm:inline">
              Live Direct Reservation Preview
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {onReturnToAdmin && (
              <button
                onClick={onReturnToAdmin}
                className="px-2.5 py-1 rounded bg-[#8A661C] hover:bg-[#A37B24] text-white font-medium text-[10.5px] tracking-wider uppercase transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3 shrink-0" />
                <span>Return</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2 py-1 rounded border border-stone-700 hover:border-rose-400 hover:text-rose-400 text-stone-400 text-[10.5px] tracking-wider uppercase transition-colors flex items-center space-x-1"
                title="End Staff Session"
              >
                <Lock className="w-3 h-3 shrink-0" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. RESPONSIVE COMPACT NAVIGATION HEADER (Touch friendly) */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#111111]/10 shadow-2xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-3 w-full">
          
          {/* Brand Monogram */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#111111]/20 flex items-center justify-center bg-white p-1.5 shadow-2xs shrink-0">
              <img
                src={POLARIS_CONFIG.emblem}
                alt="Polaris Star Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-display text-base sm:text-xl tracking-[0.18em] font-semibold text-[#111111] truncate">
                  POLARIS
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-[#111111] uppercase font-bold shrink-0">
                  RESERVATIONS
                </span>
              </div>
              <p className="text-[10px] sm:text-xs tracking-wider text-[#8A661C] uppercase font-mono font-bold truncate">
                Kalam Valley, Swat • 2,000M
              </p>
            </div>
          </div>

          {/* Return Action with 44px touch target */}
          <button
            onClick={onReturnHome}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-[#111111]/25 hover:border-[#111111] hover:bg-[#111111]/5 text-xs sm:text-sm font-mono uppercase tracking-wider text-[#111111] font-semibold transition-all flex items-center justify-center space-x-1.5 shrink-0 touch-manipulation min-h-[40px] sm:min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#8A661C] shrink-0" />
            <span className="hidden sm:inline">Return to Sanctuary</span>
            <span className="sm:hidden">Sanctuary</span>
          </button>
        </div>
      </header>

      {/* 3. EDITORIAL HERO STATEMENT */}
      <section className="relative pt-8 sm:pt-12 pb-6 px-4 sm:px-6 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[#8A661C]/30 bg-amber-50/70 text-[#8A661C] text-[11px] font-mono tracking-wider uppercase mb-3 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
          <span>Inaugural Season 2026 • Private Concierge Allocation</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-[#111111] font-normal tracking-tight leading-[1.05] uppercase">
          Select Your Alpine Sanctuary
        </h1>

        <p className="text-xs sm:text-base text-stone-600 font-normal mt-3 max-w-2xl mx-auto leading-relaxed">
          Monolithic cedar timber, heated glacial basalt, and unobstructed horizon glass.
          Select your suite tier to view live calendar availability. Our concierge desk confirms directly via <strong className="text-[#111111] font-semibold">WhatsApp</strong>.
        </p>
      </section>

      {/* 4. HORIZONTAL ROOM TYPE FILTER TABS (Smooth touch scroll) */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mb-8 overflow-hidden">
          <div className="flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 scrollbar-none w-full touch-pan-x">
            <button
              onClick={() => setSelectedFloor("all")}
              className={`px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 font-semibold touch-manipulation min-h-[42px] ${
                selectedFloor === "all"
                  ? "bg-[#111111] text-[#FBFBFA] shadow-xs"
                  : "bg-white text-stone-700 hover:text-[#111111] border border-stone-200 shadow-2xs"
              }`}
            >
              All Tiers ({categories.length})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedFloor === cat.name || selectedFloor === cat.id;
              const isTop = cat.tier?.toLowerCase().includes("top") || cat.floor === "Top Suite";

              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedFloor(isSelected ? "all" : cat.name)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 flex items-center space-x-1.5 font-semibold touch-manipulation min-h-[42px] ${
                    isSelected
                      ? "bg-[#111111] text-[#FBFBFA] shadow-xs"
                      : isTop
                      ? "bg-amber-50 text-[#8A661C] border border-[#8A661C]/40 hover:bg-amber-100/50"
                      : "bg-white text-stone-700 hover:text-[#111111] border border-stone-200 shadow-2xs"
                  }`}
                >
                  {isTop && <Crown className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ROOM CATEGORIES GRID WITH CURATED IMAGES & PROMINENT ICONS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 w-full flex-1">
        {isLoading ? (
          <div className="py-24 text-center text-stone-500 font-mono text-xs sm:text-sm">
            <div className="animate-pulse">SYNCHRONIZING POLARIS SUITE INVENTORY...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white border border-stone-200 p-8 max-w-xl mx-auto space-y-4">
            <Sparkles className="w-10 h-10 text-[#8A661C] mx-auto" />
            <h3 className="font-display text-2xl text-[#111111]">Seasonal Allocation in Progress</h3>
            <p className="text-xs sm:text-sm text-stone-600">
              For direct concierge reservations, contact our front desk on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${POLARIS_CONFIG.contact.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#111111] text-[#FBFBFA] text-xs font-mono uppercase tracking-widest font-semibold rounded-xl"
            >
              <MessageSquare className="w-4 h-4 text-[#E0BB53]" />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-stone-500 font-mono text-xs">
            No suites listed for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCategories.map((cat) => {
              const isTop = cat.tier?.toLowerCase().includes("top") || cat.floor === "Top Suite";
              const hasAvailableNow = cat.availableRoomsNow > 0;
              const cardImage = 
                (cat.rooms && cat.rooms.find(r => r.image || (Array.isArray(r.images) && r.images.length > 0))?.image) ||
                (cat.rooms && cat.rooms[0]?.images?.[0]) ||
                POLARIS_CONFIG.heroBackgroundImage;

              return (
                <div
                  key={cat.id || cat.name}
                  className={`relative rounded-2xl bg-white border flex flex-col justify-between overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${
                    isTop
                      ? "border-[#8A661C]/50 shadow-md hover:shadow-xl"
                      : "border-stone-200/90 hover:border-[#111111]/40 shadow-2xs hover:shadow-lg"
                  }`}
                >
                  {/* High-End Architectural Photo Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 border-b border-stone-200/80">
                    <img
                      src={cardImage}
                      alt={cat.name}
                      className="w-full h-full object-cover filter contrast-[1.04] brightness-[1.01] group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    
                    {/* Top Floating Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded bg-[#FBFBFA]/90 backdrop-blur-md border border-[#111111]/15 text-[10px] font-mono uppercase tracking-wider font-bold text-[#111111]">
                        {cat.tier}
                      </span>

                      {hasAvailableNow ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider font-bold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-white" />
                          <span>Waitlist</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Image Overlay Title & Price */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-normal drop-shadow-sm leading-tight">
                          {cat.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-mono uppercase tracking-widest text-amber-200 font-semibold">
                          Starting Rate
                        </span>
                        <span className="font-mono text-base sm:text-lg font-bold text-white drop-shadow-sm">
                          PKR {cat.minPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Specifications */}
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    
                    {/* Architectural Specifications with Prominent Icons */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono text-stone-700 pt-1">
                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                        <Bed className="w-4 h-4 text-[#8A661C] shrink-0" />
                        <span className="truncate">{cat.capacity || '1 King Bed'}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                        <Building2 className="w-4 h-4 text-[#8A661C] shrink-0" />
                        <span className="truncate">
                          {cat.floors && cat.floors.length > 1 ? `${cat.floors.length} Levels` : cat.floor || 'Level 01'}
                        </span>
                      </div>
                    </div>

                    {/* Key Amenities Inclusions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-[10.5px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-[#8A661C]" />
                        <span>Inclusions</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.amenities.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-1 rounded bg-[#F7F5F0] border border-stone-200 text-stone-800 font-mono"
                          >
                            {item}
                          </span>
                        ))}
                        {cat.amenities.length > 3 && (
                          <span className="text-[11px] px-2 py-1 rounded bg-amber-50 text-[#8A661C] border border-amber-200 font-mono font-semibold">
                            +{cat.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Trigger Button */}
                    <div className="pt-3 border-t border-stone-150 space-y-2">
                      <button
                        onClick={() => handleOpenBooking(cat)}
                        className="w-full py-3.5 rounded-xl text-xs font-mono uppercase tracking-widest bg-[#111111] hover:bg-[#2A2A2A] active:scale-[0.99] text-[#FBFBFA] font-bold transition-all flex items-center justify-center space-x-2 shadow-2xs touch-manipulation min-h-[48px]"
                      >
                        <Calendar className="w-4 h-4 text-[#E0BB53]" />
                        <span>Check Live Dates</span>
                        <ArrowRight className="w-4 h-4 text-white/80" />
                      </button>

                      <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-stone-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Direct Hotel Allocation</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. RESERVATION REQUEST MODAL (With Centered Icons & Touch Perfection) */}
      {isModalOpen && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-2xl sm:rounded-3xl shadow-2xl text-stone-900 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {isSuccess ? (
              // SUCCESS CONFIRMATION
              <div className="p-6 sm:p-10 text-center space-y-4 my-auto overflow-y-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
                    REQUEST RECEIVED
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
                    Sanctuary Allocation Requested
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 max-w-md mx-auto leading-relaxed pt-1">
                    Thank you, <strong className="font-semibold text-stone-900">{guestName}</strong>. Your reservation inquiry for <strong className="font-semibold text-stone-900">{selectedCategory.name}</strong> has been transmitted.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-mono text-left space-y-1.5 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-[#8A661C] font-bold">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp Concierge Confirmation:</span>
                  </div>
                  <p className="text-xs text-stone-700 font-sans leading-relaxed">
                    Our guest manager will contact your WhatsApp at <strong className="font-semibold text-stone-900">{phone}</strong> to confirm your dates ({checkIn} → {checkOut}) and provide deposit instructions.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-[#2A2A2A] text-[#FBFBFA] text-xs font-mono uppercase tracking-widest font-semibold transition-all shadow-xs touch-manipulation min-h-[44px]"
                >
                  Return to Suite Tiers
                </button>
              </div>
            ) : (
              // BOOKING FORM CONTAINER WITH FIXED HEADER, SCROLLABLE BODY, AND DOCKED FOOTER
              <>
                {/* MODAL HEADER */}
                <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-stone-200 bg-white relative flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="px-2.5 py-0.5 rounded bg-[#111111] text-[#FBFBFA] font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
                        {selectedCategory.tier}
                      </span>
                      <span className="text-stone-500 font-semibold text-[11px] truncate">
                        {selectedCategory.floors && selectedCategory.floors.length > 1
                          ? `${selectedCategory.floors.length} Levels Available`
                          : selectedCategory.floor || "Polaris Suite"}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-stone-900 font-normal pt-0.5 truncate">
                      {selectedCategory.name}
                    </h3>

                    <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5 font-mono text-xs">
                      <span className="text-stone-500">Nightly:</span>
                      <span className="text-base sm:text-lg font-bold text-[#8A661C]">
                        PKR {currentNightlyPrice.toLocaleString()}
                      </span>
                      {selectedCategory.minPrice !== selectedCategory.maxPrice && (
                        currentNightlyPrice > selectedCategory.minPrice ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                            +PKR {(currentNightlyPrice - selectedCategory.minPrice).toLocaleString()} higher level
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                            Best value rate
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* 44px Accessible Close Button */}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors shrink-0 touch-manipulation min-w-[40px]"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-stone-800" />
                  </button>
                </div>

                {/* MODAL FORM BODY */}
                <form
                  onSubmit={handleSubmitRequest}
                  className="flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
                    
                    {/* Full Name Input (Vertically centered icon) */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                        Full Name *
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Tariq Aziz"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors"
                        />
                      </div>
                    </div>

                    {/* WhatsApp & Email (Vertically centered icons) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                          WhatsApp / Phone *
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+92 300 1234567"
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                          Email Address *
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                          <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tariq@example.com"
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile-Friendly Live Polaris Calendar */}
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 font-bold">
                          Stay Dates (Check-In & Check-Out) *
                        </label>
                        {checkIn && checkOut && (
                          <span className="text-xs font-mono font-semibold text-stone-500">
                            {checkIn} → {checkOut}
                          </span>
                        )}
                      </div>

                      <PolarisCalendar
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onChange={({ checkIn: cIn, checkOut: cOut }) => {
                          setCheckIn(cIn);
                          setCheckOut(cOut);
                        }}
                        bookedDates={activeBookedDates}
                        pricePKR={currentNightlyPrice}
                        roomName={currentAssignedRoom?.name || selectedCategory.name}
                      />
                    </div>

                    {/* Floor Level Preference (When Category Spans Multiple Floors) */}
                    {selectedCategory.floors && selectedCategory.floors.length > 1 && (
                      <div className="pt-2 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 font-bold flex items-center space-x-1.5">
                            <Building2 className="w-4 h-4 text-[#8A661C]" />
                            <span>Select Floor Preference</span>
                          </label>
                          {selectedCategory.minPrice !== selectedCategory.maxPrice && (
                            <span className="text-[10.5px] font-mono text-[#8A661C] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Rates vary by level
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 w-full flex flex-col">
                          {/* Option 1: Best Preference */}
                          <button
                            type="button"
                            onClick={() => setSelectedFloorPreference('')}
                            className={`w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 touch-manipulation min-h-[50px] ${
                              !selectedFloorPreference
                                ? 'bg-[#111111] text-[#FBFBFA] border-[#111111] shadow-xs'
                                : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${!selectedFloorPreference ? 'bg-[#E0BB53]' : 'bg-stone-300'}`} />
                              <div className="min-w-0">
                                <span className="font-serif text-sm font-medium block truncate">
                                  Best Available Preference
                                </span>
                                <span className={`text-[10.5px] font-mono block truncate ${!selectedFloorPreference ? 'text-stone-300' : 'text-stone-500'}`}>
                                  {!selectedFloorPreference && currentAssignedRoom?.floor
                                    ? `Allocated on ${currentAssignedRoom.floor}`
                                    : 'System allocates best available suite'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-baseline space-x-1 font-mono text-right shrink-0">
                              <span className="text-[10px] text-stone-400">PKR</span>
                              <span className={`text-sm sm:text-base font-bold ${!selectedFloorPreference ? 'text-[#E0BB53]' : 'text-stone-900'}`}>
                                {(!selectedFloorPreference ? currentNightlyPrice : selectedCategory.minPrice).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-stone-400">/n</span>
                            </div>
                          </button>

                          {/* Specific Floor Options */}
                          {floorOrRoomOptions.map((opt) => {
                            const isSelected = selectedFloorPreference === opt.name || selectedFloorPreference === opt.id;
                            const availableCount = availableRoomsForRange.filter(
                              (r) => (r.floor || '').trim().toLowerCase() === opt.name.trim().toLowerCase()
                            ).length;
                            const isSoldOut = Boolean(checkIn && checkOut && availableCount === 0);

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isSoldOut}
                                onClick={() => setSelectedFloorPreference(opt.name)}
                                className={`w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 touch-manipulation min-h-[50px] ${
                                  isSelected
                                    ? 'bg-[#111111] text-[#FBFBFA] border-[#111111] shadow-xs'
                                    : isSoldOut
                                    ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed opacity-50'
                                    : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[#E0BB53]' : isSoldOut ? 'bg-stone-200' : 'bg-stone-300'}`} />
                                  <span className={`font-serif text-sm font-medium truncate ${isSelected ? 'text-white' : isSoldOut ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                    {opt.name}
                                  </span>
                                </div>

                                <div className="flex items-baseline space-x-1 font-mono text-right shrink-0">
                                  <span className="text-[10px] text-stone-400">PKR</span>
                                  <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-[#E0BB53]' : isSoldOut ? 'text-stone-400' : 'text-stone-900'}`}>
                                    {opt.pricePKR.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-stone-400">/n</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Number of Guests (With Users icon) */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                        Number of Guests
                      </label>
                      <div className="relative flex items-center">
                        <Users className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                        <input
                          type="text"
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          placeholder="e.g. 2 Adults, 1 Child"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Special Requests (With MessageSquare icon) */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                        Special Requests / Airport Transfer (Optional)
                      </label>
                      <div className="relative">
                        <MessageSquare className="w-4 h-4 text-[#8A661C] absolute left-3.5 top-3.5 pointer-events-none shrink-0" />
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Swat valley transfer, late evening check-in, dietary preferences."
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors resize-none"
                        />
                      </div>
                    </div>

                  </div>

                  {/* DOCKED FOOTER: ESTIMATE & SUBMIT (Touch friendly) */}
                  <div className="shrink-0 border-t border-stone-200 bg-[#FBFBFA] p-4 sm:p-5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] space-y-3">
                    {currentAssignedRoom && (
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <div className="min-w-0">
                          <span className="text-stone-400 text-[10px] uppercase tracking-wider block font-semibold truncate">
                            SUITE ALLOCATION:
                          </span>
                          <span className="font-bold text-stone-900 text-xs sm:text-sm truncate block">
                            {selectedCategory.name} • {currentAssignedRoom.floor || "Standard Level"}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-stone-400 text-[10px] uppercase tracking-wider block font-semibold">
                            {checkIn && checkOut && nightsCount > 0
                              ? `ESTIMATED TOTAL (${nightsCount}N):`
                              : 'NIGHTLY RATE:'}
                          </span>
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="text-[10px] font-bold text-stone-500">PKR</span>
                            <span className="text-base sm:text-lg font-bold text-[#8A661C]">
                              {checkIn && checkOut && nightsCount > 0
                                ? (currentNightlyPrice * nightsCount).toLocaleString()
                                : currentNightlyPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        Boolean(checkIn && checkOut && availableRoomsForRange.length === 0)
                      }
                      className={`w-full py-3.5 sm:py-4 rounded-xl text-xs font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 shadow-sm touch-manipulation min-h-[48px] ${
                        checkIn && checkOut && availableRoomsForRange.length === 0
                          ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                          : "bg-[#111111] hover:bg-[#2A2A2A] active:scale-[0.99] text-[#FBFBFA] hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <Send className="w-4 h-4 text-[#E0BB53] shrink-0" />
                      <span className="truncate">
                        {isSubmitting
                          ? "Transmitting Request..."
                          : checkIn && checkOut && availableRoomsForRange.length === 0
                          ? "Sold Out for Selected Dates"
                          : "Submit Direct Reservation Request"}
                      </span>
                    </button>

                    <p className="text-[10.5px] sm:text-xs text-stone-500 font-mono text-center">
                      Our front-desk concierge will contact your WhatsApp to confirm dates & deposit.
                    </p>
                  </div>

                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 7. MINIMAL FOOTER */}
      <footer className="border-t border-[#111111]/10 bg-[#F7F5F0] py-6 px-4 sm:px-6 text-center text-xs text-stone-600 font-mono">
        <p>© {new Date().getFullYear()} POLARIS Hotel & Sanctuary • Kalam Valley, Swat, Pakistan</p>
        <p className="text-[10.5px] text-stone-500 mt-1">Direct Reservations Portal • polarishotels.pk/booking</p>
      </footer>

    </div>
  );
}
