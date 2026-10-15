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
  onLogout,
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

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [roomsData, reqsData] = await Promise.all([
        RoomService.getRooms(),
        BookingRequestService.getRequests(),
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

    // 1. Cross-component custom event listeners (instantaneous sync within same window)
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

    // 2. Window focus & visibility refresh for multi-tab booking coordination
    const handleFocus = async () => {
      try {
        const [freshRooms, freshReqs] = await Promise.all([
          RoomService.getRooms(),
          BookingRequestService.getRequests(),
        ]);
        setRooms(freshRooms);
        setBookingRequests(freshReqs);
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

    // 3. Active 3-second database polling (syncs room status/locks across phones & laptops live)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    }, 3000);

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

  // Keep selectedCategory in sync with latest live room data from database
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

  // Group rooms into distinct floor or room options with exact prices & room numbers
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
      const roomNumbers = floorRooms.map((r) => `#${r.roomNumber}`).join(', ');

      return {
        id: floorName,
        name: floorName,
        roomNumbers,
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

    // Filter available rooms for target stay range
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

    // 1. If guest selected a specific floor or room
    if (selectedFloorPreference) {
      const matchByRoom = candidates.find(
        (r) => r.id === selectedFloorPreference || r.roomNumber === selectedFloorPreference
      );
      if (matchByRoom) return matchByRoom;

      const matchByFloor = candidates.find(
        (r) => (r.floor || '').trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
      );
      if (matchByFloor) return matchByFloor;

      // Fallback: search across all category rooms (for preview)
      const anyMatch = categoryRooms.find(
        (r) =>
          r.id === selectedFloorPreference ||
          r.roomNumber === selectedFloorPreference ||
          (r.floor || '').trim().toLowerCase() === selectedFloorPreference.trim().toLowerCase()
      );
      if (anyMatch) return anyMatch;
    }

    // 2. "No Preference (Best Available)":
    // Sort candidates by price ascending to automatically allocate the best value suite
    const sorted = [...candidates].sort(
      (a, b) => (Number(a.pricePKR) || 0) - (Number(b.pricePKR) || 0)
    );

    return sorted[0] || categoryRooms[0];
  }, [selectedCategory, checkIn, checkOut, bookingRequests, selectedFloorPreference]);

  // Active nightly rate dynamically reactive to chosen suite/preference
  const currentNightlyPrice = useMemo(() => {
    if (currentAssignedRoom && Number(currentAssignedRoom.pricePKR) > 0) {
      return Number(currentAssignedRoom.pricePKR);
    }
    return selectedCategory?.minPrice || 45000;
  }, [currentAssignedRoom, selectedCategory]);

  // Number of nights for the selected stay
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn + "T00:00:00");
    const end = new Date(checkOut + "T00:00:00");
    const diffTime = end - start;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [checkIn, checkOut]);

  // Booked dates reactive to chosen floor/suite (or whole category for Best Available)
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
    const today = new Date().toISOString().split("T")[0];

    // Find next available start date beginning from today
    let startD = today;
    const cur = new Date(today + "T00:00:00");
    while (catBooked.includes(startD)) {
      cur.setDate(cur.getDate() + 1);
      const pad = (n) => String(n).padStart(2, "0");
      startD = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    }

    // Default 3 nights if free, or leave checkout open for calendar selection
    const endD = new Date(cur);
    endD.setDate(endD.getDate() + 3);
    const pad = (n) => String(n).padStart(2, "0");
    let endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}`;

    // If any night in between has zero suites available, leave checkout blank so guest picks
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
      alert(
        "Please select both your Check-In and Check-Out dates on the suite calendar."
      );
      return;
    }

    // Check available suites in this category for the requested stay
    const available = getAvailableRoomsForCategory(
      selectedCategory.rooms,
      checkIn,
      checkOut,
      bookingRequests
    );

    if (!available || available.length === 0) {
      alert(
        `All ${selectedCategory.totalRooms} suites in "${selectedCategory.name}" are occupied for the dates ${checkIn} to ${checkOut}. Please choose alternative dates.`
      );
      return;
    }

    // Allocate suite: prioritize match for guest's choice if available, else best available
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

  // Filter categories by floor or tier if selected
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAF9F5] text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-stone-900">
      {/* Discreet Staff Management Bar (Visible ONLY when logged in as admin) */}
      {isAdmin && (
        <div className="bg-stone-900 text-stone-200 border-b border-[#B48A28]/50 px-3 sm:px-6 py-2 flex items-center justify-between text-xs font-mono shadow-md z-50 w-full max-w-full overflow-hidden">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-amber-300 font-semibold tracking-wider uppercase text-[10.5px] sm:text-[11px] truncate">
              Staff Session Active
            </span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-400 font-light hidden sm:inline">
              Guest Booking Live Preview
            </span>
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
                <span className="hidden sm:inline">Kalam Valley, Swat </span>
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
          <span className="truncate">
            <span className="hidden sm:inline">Inaugural Season 2026 • </span>
            Private Concierge Allocation
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-stone-900 font-medium tracking-tight leading-tight px-2">
          Select Your Alpine Sanctuary
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-stone-700 font-normal mt-4 max-w-2xl mx-auto leading-relaxed px-2">
          Crafted with monolithic stone, heated cedar wood, and unobstructed
          glacial glass. Select an available suite to submit your reservation
          request. Our concierge desk will contact you directly on{" "}
          <strong className="font-semibold text-stone-900">WhatsApp</strong> to
          finalize your booking.
        </p>
      </section>

      {/* =========================================================================
          CATEGORY / ROOM TYPE FILTER TABS
          ========================================================================= */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 w-full max-w-full mb-8 overflow-hidden">
          <div className="flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-2 px-2 scrollbar-none w-full max-w-full">
            <button
              onClick={() => setSelectedFloor("all")}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-mono uppercase tracking-wider transition-all shrink-0 font-semibold ${
                selectedFloor === "all"
                  ? "bg-[#B48A28] text-white font-bold shadow-xs"
                  : "bg-white text-stone-700 hover:text-stone-900 border border-stone-300 shadow-2xs"
              }`}
            >
              All Room Types ({categories.length} Categories • {rooms.length} Suites)
            </button>

            {categories.map((cat) => {
              const isSelected = selectedFloor === cat.name || selectedFloor === cat.id;
              const isTop = cat.tier?.toLowerCase().includes("top") || cat.floor === "Top Suite";

              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedFloor(isSelected ? "all" : cat.name)}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-mono uppercase tracking-wider transition-all shrink-0 flex items-center space-x-1.5 font-semibold ${
                    isSelected
                      ? "bg-[#B48A28] text-white font-bold shadow-xs"
                      : isTop
                        ? "bg-amber-50 text-[#8A661C] border border-amber-300 hover:bg-amber-100/60 font-bold"
                        : "bg-white text-stone-700 hover:text-stone-900 border border-stone-300 shadow-2xs"
                  }`}
                >
                  {isTop && (
                    <Crown className="w-3.5 h-3.5 text-[#B48A28] shrink-0" />
                  )}
                  <span>
                    {cat.name} ({cat.totalRooms})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          ROOM CATEGORIES GRID
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-20 sm:pb-24 w-full max-w-full flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-stone-600 font-mono text-sm sm:text-base font-medium">
            Loading room categories and availability...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 sm:py-24 text-center rounded-3xl bg-white border border-stone-200/90 p-8 sm:p-12 shadow-xs max-w-2xl mx-auto my-6 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B48A28] mx-auto shadow-2xs">
              <Sparkles className="w-8 h-8 text-[#B48A28]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium tracking-tight">
                Seasonal Inventory Allocation in Progress
              </h3>
              <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto leading-relaxed">
                Our suite catalog is currently being updated by the concierge desk. For immediate bespoke reservations, private group inquiries, or custom dates, contact our concierge directly.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/${POLARIS_CONFIG.contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Polaris Kalam Concierge, I would like to inquire about suite availability and reservations.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-2 shadow-sm hover:scale-[1.01]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp ({POLARIS_CONFIG.contact.phone})</span>
              </a>
              <button
                onClick={onReturnHome}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-2 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-stone-500" />
                <span>Return to Homepage</span>
              </button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-stone-600 font-mono text-sm sm:text-base font-medium">
            No suites currently listed for this category filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCategories.map((cat) => {
              const isTop = cat.tier?.toLowerCase().includes("top") || cat.floor === "Top Suite";
              const hasAvailableNow = cat.availableRoomsNow > 0;

              return (
                <div
                  key={cat.id || cat.name}
                  className={`relative rounded-2xl bg-white border flex flex-col justify-between overflow-hidden transition-all duration-300 group hover:translate-y-[-2px] ${
                    isTop
                      ? "border-amber-300 shadow-[0_4px_25px_rgba(180,138,40,0.12)] hover:shadow-[0_12px_32px_rgba(180,138,40,0.18)]"
                      : "border-stone-200/90 hover:border-amber-300 shadow-xs hover:shadow-md"
                  }`}
                >
                  {/* Card Header & Content */}
                  <div className="p-5 sm:p-7 space-y-5">
                    {/* Top Row: Tier badge, Total suites count badge & Live status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span
                          className={`font-mono text-xs sm:text-sm px-3 py-1 rounded font-bold truncate ${
                            isTop
                              ? "bg-[#B48A28] text-white"
                              : "bg-stone-100 text-stone-900 border border-stone-300"
                          }`}
                        >
                          {cat.tier}
                        </span>

                        <span className="text-xs font-mono text-stone-600 font-semibold px-2 py-0.5 rounded bg-stone-50 border border-stone-200 shrink-0">
                          {cat.totalRooms} {cat.totalRooms === 1 ? "Suite" : "Suites"}
                        </span>
                      </div>

                      {/* Live status badge */}
                      {hasAvailableNow ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{cat.availableRoomsNow} Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-900 font-bold shrink-0">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Turnover</span>
                        </span>
                      )}
                    </div>

                    {/* Suite Category Title & Specs */}
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium group-hover:text-[#B48A28] transition-colors leading-snug">
                        {cat.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 mt-1.5 font-medium">
                        {cat.capacity}
                      </p>
                      {cat.floors && cat.floors.length > 1 ? (
                        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-stone-600 mt-2 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200 w-fit">
                          <Building2 className="w-3.5 h-3.5 text-[#B48A28] shrink-0" />
                          <span className="font-semibold text-stone-800">Available on:</span>
                          <span>{cat.floors.join(" • ")}</span>
                        </div>
                      ) : cat.floor ? (
                        <p className="text-[11px] font-mono text-stone-500 mt-1">
                          Level: {cat.floor}
                        </p>
                      ) : null}
                    </div>

                    {/* Nightly Allocation Price Tag */}
                    <div className="pt-3 pb-2.5 border-t border-b border-stone-200/90 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
                      <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-stone-500 font-medium">
                        Nightly Rate
                      </span>
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5">
                        {cat.minPrice !== cat.maxPrice && (
                          <span className="text-xs sm:text-sm font-sans font-medium text-stone-500">
                            From
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-sans font-bold text-stone-700 tracking-tight">
                          PKR
                        </span>
                        <span className="text-2xl sm:text-3xl font-sans font-bold text-[#8A661C] tracking-tight">
                          {cat.minPrice.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm font-sans text-stone-500 font-normal">
                          / night
                        </span>
                      </div>
                    </div>

                    {/* Key Amenities */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold block">
                        Category Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {cat.amenities.slice(0, 5).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-800 font-medium"
                          >
                            {item}
                          </span>
                        ))}
                        {cat.amenities.length > 5 && (
                          <span className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-800 font-mono font-semibold">
                            +{cat.amenities.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="p-5 sm:p-7 pt-0 space-y-1.5">
                    <button
                      onClick={() => handleOpenBooking(cat)}
                      className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      <Calendar className="w-4 h-4 text-white" />
                      <span>Select Dates & Check Availability</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10.5px] font-mono text-stone-500 text-center">
                      Live occupancy computed across {cat.totalRooms} {cat.totalRooms === 1 ? "suite" : "suites"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          RESERVATION REQUEST MODAL (Operates on Selected Room Category)
          ========================================================================= */}
      {isModalOpen && selectedCategory && (
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
                    Thank you,{" "}
                    <strong className="font-semibold text-stone-900">
                      {guestName}
                    </strong>
                    . Your reservation inquiry for{" "}
                    <strong className="font-semibold text-stone-900">
                      {selectedCategory.name} ({selectedCategory.tier})
                    </strong>
                    {selectedFloorPreference ? (
                      <span> on <strong className="font-semibold text-stone-900">{selectedFloorPreference}</strong></span>
                    ) : ""}{" "}
                    has been received by our private concierge.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs sm:text-sm text-emerald-950 font-mono text-left space-y-2 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-[#8A661C] font-bold">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp Concierge Contact:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-sans leading-relaxed font-normal">
                    Our guest manager will contact your WhatsApp at{" "}
                    <strong className="font-semibold text-stone-900">
                      {phone}
                    </strong>{" "}
                    to confirm your dates ({checkIn} → {checkOut}) and provide
                    payment / deposit instructions.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs sm:text-sm font-mono uppercase tracking-wider font-bold transition-all shadow-xs"
                >
                  Return to Room Types
                </button>
              </div>
            ) : (
              // BOOKING FORM
              <div>
                <div className="space-y-1 pb-4 border-b border-stone-200">
                  <div className="flex items-center space-x-2 font-mono text-xs sm:text-sm">
                    <span className="px-2.5 py-1 rounded bg-[#B48A28] text-white font-bold">
                      {selectedCategory.tier}
                    </span>
                    <span className="text-stone-600 font-semibold">
                      {selectedCategory.totalRooms}{" "}
                      {selectedCategory.totalRooms === 1 ? "Suite in Hotel" : "Suites in Hotel"}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium pt-1">
                    {selectedCategory.name}
                  </h3>
                  <div className="flex flex-wrap items-baseline gap-2 pt-1.5">
                    <span className="text-xs sm:text-sm font-sans font-bold text-stone-700">PKR</span>
                    <span className="text-2xl sm:text-3xl font-sans font-bold text-[#8A661C] tracking-tight transition-all">
                      {currentNightlyPrice.toLocaleString()}
                    </span>
                    <span className="text-xs sm:text-sm font-sans text-stone-500 font-normal">/ night</span>

                    {/* Dynamic Price Difference Badge */}
                    {selectedCategory.minPrice !== selectedCategory.maxPrice && (
                      currentNightlyPrice > selectedCategory.minPrice ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-fadeIn">
                          +PKR {(currentNightlyPrice - selectedCategory.minPrice).toLocaleString()} higher level
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fadeIn">
                          Best value rate
                        </span>
                      )
                    )}

                    <span className="text-stone-300 mx-1">•</span>
                    <span className="text-xs sm:text-sm font-sans text-stone-600 font-normal">
                      {currentAssignedRoom?.capacity || selectedCategory.capacity}
                    </span>

                    {currentAssignedRoom?.floor && (
                      <>
                        <span className="text-stone-300 mx-1">•</span>
                        <span className="text-xs font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {currentAssignedRoom.floor}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <form
                  onSubmit={handleSubmitRequest}
                  className="mt-5 space-y-4 sm:space-y-5"
                >
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

                  {/* Luxury Polaris Calendar Date Picker & Real-Time Category Availability */}
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 font-bold">
                        Stay Dates (Check-In & Check-Out) *
                      </label>
                      {checkIn && checkOut && (
                        <span className="text-xs font-mono font-semibold text-stone-500">
                          {checkIn} → {checkOut}
                        </span>
                      )}
                    </div>

                    {/* Real-Time Live Occupancy Feedback */}
                    {checkIn && checkOut && (
                      availableRoomsForRange.length > 0 ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs sm:text-sm text-emerald-950 flex items-center justify-between font-mono animate-fadeIn">
                          <span className="flex items-center space-x-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {availableRoomsForRange.length} of {selectedCategory.totalRooms}{" "}
                              {selectedCategory.totalRooms === 1 ? "suite" : "suites"} available for your stay
                            </span>
                          </span>
                          {availableRoomsForRange.length === 1 && (
                            <span className="text-amber-900 font-bold text-[10.5px] uppercase bg-amber-200/90 px-2 py-0.5 rounded shrink-0">
                              🔥 Only 1 Suite Left!
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-rose-950 space-y-1 animate-fadeIn">
                          <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              All {selectedCategory.totalRooms} Suites in this Category are Booked
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-normal">
                            No suites are available for the entire stay from {checkIn} to {checkOut}.
                            Please pick alternative dates on the calendar or explore other room categories.
                          </p>
                        </div>
                      )
                    )}

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

                  {/* Preferred Floor / Level Selection (When Category Has Multiple Rooms / Floors) */}
                  {selectedCategory.rooms && selectedCategory.rooms.length > 1 && (
                    <div className="pt-1 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 font-bold flex items-center space-x-1.5">
                          <Building2 className="w-4 h-4 text-[#B48A28]" />
                          <span>Select Floor / Room Preference</span>
                        </label>
                        {selectedCategory.minPrice !== selectedCategory.maxPrice && (
                          <span className="text-[11px] font-mono text-[#8A661C] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Rates vary by level
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 font-normal">
                        Choose your preferred room level or let our system allocate the best available suite:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {/* Option 1: Best Available / No Preference */}
                        <button
                          type="button"
                          onClick={() => setSelectedFloorPreference('')}
                          className={`p-3.5 rounded-xl text-left border transition-all text-xs font-mono cursor-pointer flex flex-col justify-between ${
                            !selectedFloorPreference
                              ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs ring-2 ring-stone-900/20'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center justify-between">
                              <span className="text-sm">Best Available</span>
                              {!selectedFloorPreference && (
                                <span className="flex items-center space-x-1 text-amber-400 font-bold text-[11px]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </span>
                              )}
                            </div>
                            <div className={`text-[10.5px] mt-1 ${!selectedFloorPreference ? 'text-stone-300' : 'text-stone-500'}`}>
                              Automated allocation • Best value suite
                            </div>
                          </div>

                          <div className={`mt-3 pt-2 border-t flex items-center justify-between ${
                            !selectedFloorPreference ? 'border-stone-700' : 'border-stone-200'
                          }`}>
                            <span className="text-[10.5px] opacity-80">
                              {!selectedFloorPreference && currentAssignedRoom
                                ? `Allocates Suite #${currentAssignedRoom.roomNumber}`
                                : 'Nightly Rate'}
                            </span>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-[10px] font-bold">PKR</span>
                              <span className={`text-sm font-bold ${!selectedFloorPreference ? 'text-amber-400' : 'text-[#8A661C]'}`}>
                                {(!selectedFloorPreference
                                  ? currentNightlyPrice
                                  : selectedCategory.minPrice
                                ).toLocaleString()}
                              </span>
                              <span className="text-[10px] opacity-80">/ night</span>
                            </div>
                          </div>
                        </button>

                        {/* Option 2..N: Specific Floors or Rooms */}
                        {floorOrRoomOptions.map((opt) => {
                          const isSelected = selectedFloorPreference === opt.name || selectedFloorPreference === opt.id;
                          const availableCount = availableRoomsForRange.filter(
                            (r) => (r.floor || '').trim().toLowerCase() === opt.name.trim().toLowerCase()
                          ).length;
                          const totalCount = opt.rooms.length;
                          const isSoldOut = Boolean(checkIn && checkOut && availableCount === 0);
                          const priceDiff = opt.pricePKR - selectedCategory.minPrice;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedFloorPreference(opt.name)}
                              className={`p-3.5 rounded-xl text-left border transition-all text-xs font-mono cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#B48A28] text-white border-[#B48A28] font-bold shadow-xs ring-2 ring-[#B48A28]/30'
                                  : isSoldOut
                                  ? 'bg-stone-50 text-stone-400 border-stone-200 opacity-70'
                                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-300'
                              }`}
                            >
                              <div>
                                <div className="font-semibold flex items-center justify-between">
                                  <span className="text-sm">{opt.name}</span>
                                  {isSelected ? (
                                    <span className="flex items-center space-x-1 text-white font-bold text-[11px]">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Selected</span>
                                    </span>
                                  ) : isSoldOut ? (
                                    <span className="text-rose-600 font-bold text-[10px] uppercase">
                                      Sold Out
                                    </span>
                                  ) : null}
                                </div>
                                <div className={`text-[10.5px] mt-1 ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}>
                                  {opt.roomNumbers ? `${opt.roomNumbers} • ` : ''}
                                  {checkIn && checkOut
                                    ? isSoldOut
                                      ? 'Occupied for selected stay'
                                      : `${availableCount} of ${totalCount} available`
                                    : `${totalCount} ${totalCount === 1 ? 'suite' : 'suites'} on this level`}
                                </div>
                              </div>

                              <div className={`mt-3 pt-2 border-t flex items-center justify-between ${
                                isSelected ? 'border-amber-400/40' : 'border-stone-200'
                              }`}>
                                <div>
                                  {priceDiff > 0 ? (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isSelected ? 'bg-amber-900/40 text-amber-100' : 'bg-amber-100 text-amber-900'
                                    }`}>
                                      +PKR {priceDiff.toLocaleString()}
                                    </span>
                                  ) : priceDiff === 0 && selectedCategory.minPrice !== selectedCategory.maxPrice ? (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isSelected ? 'bg-emerald-900/40 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      Best Value
                                    </span>
                                  ) : (
                                    <span className="text-[10px] opacity-75">Nightly Rate</span>
                                  )}
                                </div>

                                <div className="flex items-baseline space-x-1">
                                  <span className="text-[10px] font-bold">PKR</span>
                                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#8A661C]'}`}>
                                    {opt.pricePKR.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] opacity-80">/ night</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

                  {/* Live Allocation & Pricing Summary */}
                  {currentAssignedRoom && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-mono">
                      <div className="space-y-0.5">
                        <span className="text-stone-500 text-[10.5px] uppercase tracking-wider block font-semibold">
                          ALLOCATED SUITE & LEVEL:
                        </span>
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">
                          Suite #{currentAssignedRoom.roomNumber} ({currentAssignedRoom.floor})
                        </span>
                      </div>
                      <div className="sm:text-right space-y-0.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                        <span className="text-stone-500 text-[10.5px] uppercase tracking-wider block font-semibold">
                          {checkIn && checkOut && nightsCount > 0
                            ? `TOTAL ESTIMATE (${nightsCount} ${nightsCount === 1 ? 'NIGHT' : 'NIGHTS'}):`
                            : 'NIGHTLY RATE:'}
                        </span>
                        <div className="flex items-baseline sm:justify-end space-x-1">
                          <span className="text-[10.5px] font-bold text-stone-500">PKR</span>
                          <span className="text-base sm:text-lg font-bold text-[#8A661C]">
                            {checkIn && checkOut && nightsCount > 0
                              ? (currentNightlyPrice * nightsCount).toLocaleString()
                              : currentNightlyPrice.toLocaleString()}
                          </span>
                          {(!checkIn || !checkOut || nightsCount === 0) && (
                            <span className="text-[10px] text-stone-500">/ night</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        Boolean(checkIn && checkOut && availableRoomsForRange.length === 0)
                      }
                      className={`w-full py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-2 shadow-sm ${
                        checkIn && checkOut && availableRoomsForRange.length === 0
                          ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                          : "bg-[#B48A28] hover:bg-[#9E7719] text-white hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? "Transmitting Request..."
                          : checkIn && checkOut && availableRoomsForRange.length === 0
                          ? "Sold Out for Selected Dates"
                          : "Submit Reservation Request"}
                      </span>
                    </button>
                    <p className="text-xs text-stone-600 font-medium font-mono text-center mt-2.5">
                      Our front-desk team will contact your WhatsApp to confirm
                      availability and deposit.
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
      <footer className="border-t border-stone-200 bg-[#F5F2EB] py-5 sm:py-8 px-4 sm:px-6 text-center text-xs sm:text-sm text-stone-700 font-mono">
        <p>
          © {new Date().getFullYear()} POLARIS Hotel & Sanctuary • Kalam Valley,
          Swat, Pakistan
        </p>
        <p className="text-[11px] sm:text-xs text-stone-600 mt-1 font-medium">
          Direct Reservations Portal • polarishotels.pk/booking
        </p>
      </footer>
    </div>
  );
}
