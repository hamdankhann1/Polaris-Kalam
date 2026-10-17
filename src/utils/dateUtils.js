/**
 * Centralized, timezone-safe date utilities for Polaris Kalam Hotel.
 * Avoids UTC timezone rollback bugs (e.g. Asia/Karachi UTC+5 being shifted to yesterday
 * when calling toISOString() or parsing local dates).
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the local calendar.
 */
export function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Normalizes any Date, timestamp, or string to a strict YYYY-MM-DD string.
 * If already a YYYY-MM-DD string, extracts it directly without Date parsing.
 */
export function formatYMD(dateInput = new Date()) {
  if (!dateInput) return getTodayYMD();

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) return getTodayYMD();
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return getTodayYMD();
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return getTodayYMD();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return getTodayYMD();
}

/**
 * Safely adds or subtracts days from a YYYY-MM-DD string without timezone shifts.
 */
export function addDaysYMD(ymdStr, days = 1) {
  if (!ymdStr) ymdStr = getTodayYMD();
  const match = ymdStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return getTodayYMD();

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  const utcDate = new Date(Date.UTC(year, month, day + days));
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates number of nights between two YYYY-MM-DD strings.
 * Returns at least 1 night.
 */
export function diffDaysYMD(startYMD, endYMD) {
  if (!startYMD || !endYMD) return 1;
  const m1 = startYMD.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const m2 = endYMD.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m1 || !m2) return 1;

  const t1 = Date.UTC(parseInt(m1[1], 10), parseInt(m1[2], 10) - 1, parseInt(m1[3], 10));
  const t2 = Date.UTC(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));

  const nights = Math.round((t2 - t1) / 86400000);
  return Math.max(1, nights);
}

/**
 * Safe compare or range check (YYYY-MM-DD strings are strictly sortable).
 */
export function isBetweenYMD(dateYMD, startYMD, endYMD) {
  const d = (dateYMD || '').substring(0, 10);
  if (startYMD && d < startYMD) return false;
  if (endYMD && d > endYMD) return false;
  return true;
}
