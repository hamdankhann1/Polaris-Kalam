import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles,
  Lock,
  Moon,
  Clock
} from 'lucide-react';

/**
 * =========================================================================
 * PolarisCalendar Component
 * =========================================================================
 * 
 * Luxury interactive calendar coordination component for Polaris Kalam Hotel.
 * Engineered for silky smooth touch interaction on phone, tablet, and desktop.
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

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  const isMinMonthView = useMemo(() => {
    if (minDate) {
      const minD = new Date(minDate + 'T00:00:00');
      if (currentYear < minD.getFullYear()) return true;
      if (currentYear === minD.getFullYear() && currentMonth <= minD.getMonth()) return true;
      return false;
    }
    return false;
  }, [currentYear, currentMonth, minDate]);

  const handlePrevMonth = () => {
    if (isMinMonthView) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

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

    // 3. Next month leading days
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

  const hasBookedDatesInRange = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const current = new Date(start);

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

  const handleDateClick = (dayObj) => {
    setValidationError('');

    if (dayObj.isBooked) {
      setValidationError('This suite is already reserved on this date. Please choose an available date.');
      return;
    }

    const clickedStr = dayObj.dateStr;

    if (!checkIn || (checkIn && checkOut)) {
      onChange({
        checkIn: clickedStr,
        checkOut: '',
        nights: 0
      });
      return;
    }

    if (clickedStr === checkIn) {
      return;
    }

    if (clickedStr < checkIn) {
      onChange({
        checkIn: clickedStr,
        checkOut: '',
        nights: 0
      });
      return;
    }

    if (clickedStr > checkIn) {
      if (hasBookedDatesInRange(checkIn, clickedStr)) {
        setValidationError('Your selected stay overlaps with an existing reservation. Please select consecutive available dates.');
        return;
      }

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

  const handleResetDates = () => {
    setValidationError('');
    onChange({
      checkIn: '',
      checkOut: '',
      nights: 0
    });
  };

  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const formatDisplayDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`rounded-2xl bg-white border border-stone-200 p-3.5 sm:p-5 text-stone-900 shadow-md relative overflow-hidden w-full max-w-full ${className}`}>
      
      {/* 1. HEADER: SUMMARY & CLEAR ACTION */}
      <div className="pb-3 sm:pb-4 border-b border-stone-150 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 text-[11px] font-mono tracking-wider uppercase text-[#8A661C] font-bold">
            <CalendarIcon className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
            <span className="truncate">LIVE SUITE CALENDAR</span>
            {roomNumber && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[#8A661C] font-semibold shrink-0">
                #{roomNumber}
              </span>
            )}
          </div>
          <h4 className="font-display text-sm sm:text-base text-stone-900 font-medium truncate mt-0.5">
            Coordinate Stay Dates
          </h4>
        </div>

        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={handleResetDates}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[10.5px] sm:text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 font-semibold transition-colors flex items-center space-x-1 shrink-0 touch-manipulation min-h-[36px]"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Date Cards (Check-In & Check-Out Pills) with Icons */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {/* Check-In Pill */}
        <div className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
          checkIn
            ? 'bg-amber-50/90 border-[#B48A28]/60 text-stone-900 shadow-2xs'
            : 'bg-stone-50 border-stone-200 text-stone-600'
        }`}>
          <div className="flex items-center space-x-1.5 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold truncate">
            <CalendarIcon className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
            <span>Check-In</span>
          </div>
          <div className="mt-1 font-mono text-xs sm:text-sm font-bold text-stone-900 truncate">
            {checkIn ? formatDisplayDate(checkIn) : 'Select date'}
          </div>
        </div>

        {/* Check-Out Pill */}
        <div className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
          checkOut
            ? 'bg-amber-50/90 border-[#B48A28]/60 text-stone-900 shadow-2xs'
            : checkIn
            ? 'bg-amber-50/60 border-[#B48A28]/40 text-[#8A661C] animate-pulse font-bold'
            : 'bg-stone-50 border-stone-200 text-stone-600'
        }`}>
          <div className="flex items-center space-x-1.5 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold truncate">
            <Moon className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
            <span>Check-Out</span>
          </div>
          <div className="mt-1 font-mono text-xs sm:text-sm font-bold text-stone-900 truncate">
            {checkOut ? formatDisplayDate(checkOut) : checkIn ? 'Click checkout' : 'After check-in'}
          </div>
        </div>
      </div>

      {/* 2. MONTH NAVIGATION BAR WITH LARGE TOUCH TARGETS */}
      <div className="mt-4 flex items-center justify-between pb-2.5 border-b border-stone-150">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isMinMonthView}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all touch-manipulation ${
            isMinMonthView
              ? 'opacity-25 cursor-not-allowed border-transparent text-stone-300'
              : 'border-stone-200 hover:border-[#B48A28] hover:bg-stone-50 text-stone-700 active:bg-stone-100'
          }`}
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4 text-stone-800" />
        </button>

        <div className="text-center">
          <span className="font-display text-sm sm:text-base font-bold tracking-wider text-stone-900 block">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <span className="text-[10px] font-mono text-[#8A661C] uppercase tracking-wider font-semibold">
            Seasonal Allocation
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-stone-200 hover:border-[#B48A28] hover:bg-stone-50 text-stone-700 active:bg-stone-100 flex items-center justify-center transition-all touch-manipulation"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      {/* Feedback & Helper Text */}
      {validationError ? (
        <div className="mt-2.5 p-2 sm:p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-mono flex items-center space-x-1.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="leading-tight">{validationError}</span>
        </div>
      ) : !checkIn ? (
        <div className="mt-2 text-[11px] sm:text-xs font-mono text-stone-500 text-center">
          Tap an available date to begin your reservation.
        </div>
      ) : !checkOut ? (
        <div className="mt-2 text-[11px] sm:text-xs font-mono text-[#8A661C] text-center flex items-center justify-center space-x-1.5 animate-pulse font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#8A661C] shrink-0" />
          <span>Now select your departure date.</span>
        </div>
      ) : (
        <div className="mt-2 text-[11px] sm:text-xs font-mono text-emerald-800 text-center flex items-center justify-center space-x-1.5 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'} selected ({formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)})</span>
        </div>
      )}

      {/* 3. DAY LABELS (SU, MO, TU, WE, TH, FR, SA) */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((day) => (
          <div key={day} className="text-[10px] sm:text-xs font-mono font-bold text-stone-500 py-1 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* 4. CALENDAR DAYS GRID (RESPONSIVE & CLEAN TOUCH PADDING) */}
      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5 select-none w-full max-w-full">
        {calendarDays.map((dayObj, idx) => {
          const { dayNumber, dateStr, isCurrentMonth, isBooked } = dayObj;

          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          const isHoverRange = checkIn && !checkOut && hoverDate && dateStr > checkIn && dateStr <= hoverDate;
          const isToday = dateStr === todayStr;
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
              className={`relative h-10 sm:h-12 rounded-xl text-xs sm:text-sm font-mono transition-all flex flex-col items-center justify-center touch-manipulation group ${
                isCheckIn || isCheckOut
                  ? 'bg-[#111111] text-white font-bold shadow-sm scale-[1.03] z-10'
                  : isInRange || isHoverRange
                  ? 'bg-amber-100/70 text-[#8A661C] border-y border-[#B48A28]/40 rounded-none font-bold'
                  : isBooked
                  ? 'bg-rose-50 border border-rose-200 text-rose-400 cursor-not-allowed opacity-75'
                  : !isCurrentMonth
                  ? 'text-stone-300 opacity-25 cursor-not-allowed'
                  : 'text-stone-800 hover:bg-amber-50 hover:text-[#8A661C] hover:border-[#8A661C]/30 border border-stone-200/80 bg-stone-50/50 font-medium active:scale-95'
              }`}
            >
              <span className={`text-[11px] sm:text-xs leading-none ${isCheckIn || isCheckOut ? 'font-bold text-white' : ''}`}>
                {dayNumber}
              </span>

              {/* Status Sub-Indicator (Clean, non-overflowing) */}
              {isCheckIn && (
                <span className="text-[7.5px] sm:text-[9px] font-mono tracking-tight uppercase leading-none mt-0.5 text-amber-300 font-bold">
                  <span className="sm:hidden">IN</span>
                  <span className="hidden sm:inline">CHECK IN</span>
                </span>
              )}
              {isCheckOut && (
                <span className="text-[7.5px] sm:text-[9px] font-mono tracking-tight uppercase leading-none mt-0.5 text-amber-300 font-bold">
                  <span className="sm:hidden">OUT</span>
                  <span className="hidden sm:inline">CHECK OUT</span>
                </span>
              )}
              {isBooked && isCurrentMonth && (
                <span className="text-[7.5px] sm:text-[8.5px] font-mono tracking-tight uppercase text-rose-500 font-semibold leading-none mt-0.5 flex items-center justify-center">
                  <span className="sm:hidden">•</span>
                  <span className="hidden sm:inline">LOCKED</span>
                </span>
              )}
              {isToday && !isCheckIn && !isCheckOut && (
                <span className="w-1 h-1 rounded-full bg-[#8A661C] mt-0.5" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* 5. FOOTER: INTERACTIVE LEGEND */}
      <div className="mt-3.5 pt-3 border-t border-stone-150 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-xs font-mono">
        <div className="flex items-center space-x-3 text-stone-600">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-stone-100 border border-stone-300 inline-block" />
            <span>Open</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-700">
            <span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-300 inline-block" />
            <span>Booked</span>
          </span>
          <span className="flex items-center space-x-1 text-[#8A661C] font-semibold">
            <span className="w-2.5 h-2.5 rounded bg-[#111111] inline-block" />
            <span>Selected</span>
          </span>
        </div>

        {effectivePrice > 0 && nightsCount > 0 && (
          <div className="text-right text-[#8A661C] font-bold">
            <span>PKR {(effectivePrice * nightsCount).toLocaleString()}</span>
            <span className="text-stone-500 font-normal ml-1">({nightsCount}N)</span>
          </div>
        )}
      </div>

    </div>
  );
}
