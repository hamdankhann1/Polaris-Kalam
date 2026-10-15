import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  Lock,
  Moon
} from 'lucide-react';

/**
 * =========================================================================
 * PolarisCalendar Component
 * =========================================================================
 * 
 * Luxury interactive calendar coordination component for Polaris Kalam Hotel.
 * Replaces the default HTML date input with an elegant obsidian & gold interface.
 * 
 * Key Capabilities:
 * 1. Automatically greys out past dates (e.g. today is Oct 15, 2026; Oct 14 is greyed out).
 * 2. Automatically greys out & locks dates that are already booked for the selected suite.
 * 3. Interactive range selection (Check-In -> Check-Out) with hover preview.
 * 4. Prevents invalid selections that would overlap with existing bookings.
 * 5. Displays real-time stay duration and estimated pricing calculation.
 */
export const SOFT_LAUNCH_DATE = '2026-12-01';

export default function PolarisCalendar({
  checkIn,
  checkOut,
  onChange,
  bookedDates = [],
  pricePKR = 0,
  nightlyRate = 0,
  minDate = null,
  roomName = 'Suite',
  roomNumber = '',
  minNights = 1,
  className = ''
}) {
  const effectivePrice = pricePKR || nightlyRate || 0;

  // Current real-world / application date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  // Base month view state: year & month index (0-11).
  // Defaults to checkIn month or today's current month so guests can navigate freely.
  const [currentYear, setCurrentYear] = useState(() => {
    if (checkIn) return new Date(checkIn + 'T00:00:00').getFullYear();
    if (minDate) return new Date(minDate + 'T00:00:00').getFullYear();
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (checkIn) return new Date(checkIn + 'T00:00:00').getMonth();
    if (minDate) return new Date(minDate + 'T00:00:00').getMonth();
    return new Date().getMonth();
  });

  // Hover state for range preview
  const [hoverDate, setHoverDate] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Month names for luxury typography
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Check if current view is at or before min month (if minDate is provided)
  const isMinMonthView = useMemo(() => {
    if (minDate) {
      const minD = new Date(minDate + 'T00:00:00');
      if (currentYear < minD.getFullYear()) return true;
      if (currentYear === minD.getFullYear() && currentMonth <= minD.getMonth()) return true;
      return false;
    }
    return false;
  }, [currentYear, currentMonth, minDate]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (isMinMonthView) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Reset view to current month
  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Helper: check if date is booked for this suite
  const isDateBooked = (dateStr) => {
    return Array.isArray(bookedDates) && bookedDates.includes(dateStr);
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0');
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(d)}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isBooked: isDateBooked(dateStr)
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isBooked: isDateBooked(dateStr)
      });
    }

    // 3. Next month leading days (fill grid to multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(d)}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isBooked: isDateBooked(dateStr)
      });
    }

    return days;
  }, [currentYear, currentMonth, bookedDates]);

  // Check if a range has any booked dates in between
  const hasBookedDatesInRange = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const current = new Date(start);

    // Loop through nights [start, end)
    while (current < end) {
      const pad = (n) => String(n).padStart(2, '0');
      const dStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
      if (isDateBooked(dStr)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  // Handle clicking a calendar date
  const handleDateClick = (dayObj) => {
    setValidationError('');

    // Cannot select booked dates
    if (dayObj.isBooked) {
      setValidationError('This suite is already reserved on this date. Please choose an available date.');
      return;
    }

    const clickedStr = dayObj.dateStr;

    // Selection Logic:
    // Case A: Neither is selected, or both were selected -> set Check-In, clear Check-Out
    if (!checkIn || (checkIn && checkOut)) {
      onChange({
        checkIn: clickedStr,
        checkOut: '',
        nights: 0
      });
      return;
    }

    // Case B: Check-In is selected, clicking the same date -> no-op
    if (clickedStr === checkIn) {
      return;
    }

    // Case C: Clicking a date before the selected Check-In -> update Check-In to this earlier date
    if (clickedStr < checkIn) {
      onChange({
        checkIn: clickedStr,
        checkOut: '',
        nights: 0
      });
      return;
    }

    // Case D: Clicking a date after Check-In -> validate range & set Check-Out
    if (clickedStr > checkIn) {
      if (hasBookedDatesInRange(checkIn, clickedStr)) {
        setValidationError('Your selected stay overlaps with an existing reservation. Please select consecutive available dates.');
        return;
      }

      // Calculate nights
      const start = new Date(checkIn + 'T00:00:00');
      const end = new Date(clickedStr + 'T00:00:00');
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

      onChange({
        checkIn,
        checkOut: clickedStr,
        nights: diffDays
      });
    }
  };

  // Reset dates
  const handleResetDates = () => {
    setValidationError('');
    onChange({
      checkIn: '',
      checkOut: '',
      nights: 0
    });
  };

  // Calculate nights
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  // Format date for display: "Thu, Oct 15, 2026"
  const formatDisplayDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`rounded-2xl bg-white border border-stone-200/90 p-3 sm:p-5 text-stone-900 shadow-xl relative overflow-hidden w-full max-w-full ${className}`}>
      
      {/* Background celestial glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* =====================================================================
          1. HEADER: ACTIVE DATES SUMMARY & STAY CALCULATOR
          ===================================================================== */}
      <div className="pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[#8A661C] flex items-center space-x-1.5 font-bold">
              <CalendarIcon className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
              <span>LIVE SUITE CALENDAR</span>
            </span>
            {roomNumber && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[#8A661C] font-bold shrink-0">
                Room #{roomNumber}
              </span>
            )}
          </div>
          <h4 className="font-display text-base sm:text-lg text-stone-900 font-semibold flex items-center space-x-2">
            <span>Coordinate Your Stay Dates</span>
          </h4>
        </div>

        {/* Clear selection action */}
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={handleResetDates}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-300 font-semibold transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Dates</span>
          </button>
        )}
      </div>

      {/* Date Cards (Check-In & Check-Out Pills) */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {/* Check-In Pill */}
        <div className={`p-2.5 sm:p-3.5 rounded-xl border transition-all ${
          checkIn
            ? 'bg-amber-50/90 border-[#B48A28]/50 text-stone-900'
            : 'bg-stone-50 border-stone-200 text-stone-600'
        }`}>
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold truncate">
            Check-In Date
          </div>
          <div className="mt-1 font-mono text-xs sm:text-base font-bold text-stone-900 truncate">
            {checkIn ? formatDisplayDate(checkIn) : 'Select date'}
          </div>
        </div>

        {/* Check-Out Pill */}
        <div className={`p-2.5 sm:p-3.5 rounded-xl border transition-all ${
          checkOut
            ? 'bg-amber-50/90 border-[#B48A28]/50 text-stone-900'
            : checkIn
            ? 'bg-amber-50/70 border-[#B48A28]/50 text-[#8A661C] animate-pulse font-bold'
            : 'bg-stone-50 border-stone-200 text-stone-600'
        }`}>
          <div className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold truncate">
            Check-Out Date
          </div>
          <div className="mt-1 font-mono text-xs sm:text-base font-bold text-stone-900 truncate">
            {checkOut ? formatDisplayDate(checkOut) : checkIn ? 'Click check-out' : 'After check-in'}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. MONTH NAVIGATION BAR
          ===================================================================== */}
      <div className="mt-5 flex items-center justify-between pb-3 border-b border-stone-200">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isMinMonthView}
          className={`p-2 rounded-lg border transition-all ${
            isMinMonthView
              ? 'opacity-30 cursor-not-allowed border-transparent text-stone-400'
              : 'border-stone-200 hover:border-[#B48A28] hover:bg-stone-100 text-stone-700 hover:text-stone-900'
          }`}
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="font-display text-base sm:text-lg font-bold tracking-wider text-stone-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <p className="text-xs font-mono text-[#8A661C] uppercase tracking-wider font-semibold mt-0.5">
            Kalam Seasonal Allocation
          </p>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-lg border border-stone-200 hover:border-[#B48A28] hover:bg-stone-100 text-stone-700 hover:text-stone-900 transition-all"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Validation Message / Instructions */}
      {validationError ? (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-mono flex items-center space-x-2 animate-fadeIn font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      ) : !checkIn ? (
        <div className="mt-3 text-xs sm:text-sm font-mono text-stone-700 text-center font-medium">
          Tap an available date on the calendar to begin your reservation.
        </div>
      ) : !checkOut ? (
        <div className="mt-3 text-xs sm:text-sm font-mono text-[#8A661C] text-center flex items-center justify-center space-x-1.5 animate-pulse font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#8A661C]" />
          <span>Now select your departure date.</span>
        </div>
      ) : (
        <div className="mt-3 text-xs sm:text-sm font-mono text-emerald-900 text-center flex items-center justify-center space-x-1.5 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'} selected ({formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)})</span>
        </div>
      )}

      {/* =====================================================================
          3. DAY LABELS (SU, MO, TU, WE, TH, FR, SA)
          ===================================================================== */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((day) => (
          <div key={day} className="text-xs font-mono font-bold text-stone-700 py-1.5 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* =====================================================================
          4. CALENDAR DAYS GRID (35 / 42 CELLS)
          ===================================================================== */}
      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5 select-none w-full max-w-full">
        {calendarDays.map((dayObj, idx) => {
          const { dayNumber, dateStr, isCurrentMonth, isBooked } = dayObj;

          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          const isHoverRange = checkIn && !checkOut && hoverDate && dateStr > checkIn && dateStr <= hoverDate;
          const isToday = dateStr === todayStr;

          // Determine disabled state: booked dates or outside current month
          const isDisabled = isBooked || !isCurrentMonth;

          return (
            <button
              key={`${dateStr}-${idx}`}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(dayObj)}
              onMouseEnter={() => {
                if (checkIn && !checkOut && !isDisabled) {
                  setHoverDate(dateStr);
                }
              }}
              onMouseLeave={() => setHoverDate(null)}
              className={`relative h-11 sm:h-14 rounded-xl text-xs sm:text-sm font-mono transition-all flex flex-col items-center justify-center group ${
                // 1. Check-In & Check-Out Solid Gold
                isCheckIn || isCheckOut
                  ? 'bg-[#B48A28] text-white font-bold shadow-md shadow-amber-900/20 scale-105 z-20 ring-2 ring-[#D4AF37]'
                  // 2. Dates in Range (Selected or Hover)
                  : isInRange || isHoverRange
                  ? 'bg-[#FAF6ED] text-[#8A661C] border-y border-[#B48A28]/30 rounded-none font-bold'
                  // 3. Booked Dates (Rose badge, locked)
                  : isBooked
                  ? 'bg-rose-50 border border-rose-300 text-rose-500/80 cursor-not-allowed'
                  // 4. Outside current month
                  : !isCurrentMonth
                  ? 'text-stone-300 opacity-40 cursor-not-allowed'
                  // 5. Available dates
                  : 'text-stone-800 hover:bg-amber-50 hover:text-[#B48A28] hover:border-[#B48A28]/40 border border-stone-200/80 bg-stone-50/70 font-semibold'
              }`}
            >
              <span className={`text-xs sm:text-sm ${isCheckIn || isCheckOut ? 'font-bold' : 'font-semibold'}`}>
                {dayNumber}
              </span>

              {/* Status Indicator Sub-Badges */}
              {isCheckIn && (
                <span className="text-[8.5px] sm:text-[10px] font-bold tracking-tight uppercase leading-none mt-0.5">
                  CHECK IN
                </span>
              )}
              {isCheckOut && (
                <span className="text-[8.5px] sm:text-[10px] font-bold tracking-tight uppercase leading-none mt-0.5">
                  CHECK OUT
                </span>
              )}

              {/* Booked indicator */}
              {isBooked && isCurrentMonth && (
                <span className="text-[8.5px] sm:text-[10px] font-mono tracking-tight uppercase text-rose-700 font-bold leading-none mt-0.5">
                  BOOKED
                </span>
              )}

              {/* Today dot indicator */}
              {isToday && !isCheckIn && !isCheckOut && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B48A28] mt-0.5" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          5. FOOTER: LEGEND & ESTIMATE
          ===================================================================== */}
      <div className="mt-5 pt-3.5 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-mono w-full max-w-full">
        
        {/* Interactive Legend */}
        <div className="flex flex-wrap items-center gap-3 text-stone-700 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-stone-50 border border-stone-300 inline-block" />
            <span>Available</span>
          </span>

          <span className="flex items-center space-x-1.5 text-rose-700 font-semibold">
            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-300 inline-block" />
            <span>Booked</span>
          </span>

          <span className="flex items-center space-x-1.5 text-[#8A661C] font-bold">
            <span className="w-3 h-3 rounded bg-[#B48A28] inline-block" />
            <span>Your Stay</span>
          </span>
        </div>

        {/* Estimated Rate calculation */}
        {effectivePrice > 0 && nightsCount > 0 && (
          <div className="text-right">
            <span className="text-stone-600 text-xs block font-semibold">Est. Stay Total:</span>
            <span className="font-mono text-[#8A661C] font-bold text-sm sm:text-base">
              PKR {(effectivePrice * nightsCount).toLocaleString()}
            </span>
            <span className="text-xs text-stone-600 block font-normal mt-0.5">
              ({nightsCount} {nightsCount === 1 ? 'night' : 'nights'} × PKR {effectivePrice.toLocaleString()})
            </span>
          </div>
        )}

      </div>

    </div>
  );
}
