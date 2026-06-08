/**
 * Clock / date utility library.
 *
 * Centralizes all "now"-relative date math and formatting so the UI always
 * feels current. Safe to import from both server and client components — no
 * browser-only APIs, no "use client", no extra dependencies.
 */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const LOCALE = "en-US";

/** Current Date object. Centralizes "now" so we can swap in a fixed clock for tests later. */
export function now(): Date {
  return new Date();
}

/** Add days to now. Returns a Date. */
export function daysFromNow(days: number): Date {
  const d = now();
  d.setTime(d.getTime() + days * MS_PER_DAY);
  return d;
}

/** Subtract days from now. Returns a Date. */
export function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

/** Subtract hours from now. */
export function hoursAgo(hours: number): Date {
  const d = now();
  d.setTime(d.getTime() - hours * MS_PER_HOUR);
  return d;
}

/** Subtract minutes from now. */
export function minutesAgo(minutes: number): Date {
  const d = now();
  d.setTime(d.getTime() - minutes * MS_PER_MINUTE);
  return d;
}

/** Strip time-of-day from a Date, returning a new Date at local midnight. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar-day delta between two dates (ignores time). Positive if `to` is after `from`. */
export function daysBetween(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/** Days from now until `d`. Can be negative if `d` is in the past. */
export function daysUntil(d: Date): number {
  return daysBetween(now(), d);
}

/** "Jun 15" or "Jun 15, 2026" */
export function formatDate(d: Date, opts?: { withYear?: boolean }): string {
  const formatter = new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    ...(opts?.withYear ? { year: "numeric" } : {}),
  });
  return formatter.format(d);
}

/** "Monday, June 15, 2026" */
export function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** "Jun 15, 3:14 PM" */
export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** "3:14 PM" */
export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Relative phrase for a past timestamp.
 *
 * Thresholds:
 *  - <60s: "just now"
 *  - <60min: "X min ago"
 *  - <24h same calendar day: "Today, h:mm AM/PM"
 *  - <24h crossing calendar boundary: "Yesterday, h:mm AM/PM"
 *  - 2-6 days: "X days ago"
 *  - same year: "Mar 15"
 *  - other year: "Mar 15, 2025"
 */
export function relativeTime(d: Date): string {
  const current = now();
  const diffMs = current.getTime() - d.getTime();

  // Future or essentially "now"
  if (diffMs < 60 * 1000) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const calendarDelta = daysBetween(d, current); // positive if d is in the past

  if (diffMs < MS_PER_DAY) {
    if (calendarDelta === 0) {
      return `Today, ${formatTime(d)}`;
    }
    return `Yesterday, ${formatTime(d)}`;
  }

  if (calendarDelta === 1) {
    return `Yesterday, ${formatTime(d)}`;
  }

  if (calendarDelta >= 2 && calendarDelta <= 6) {
    return `${calendarDelta} days ago`;
  }

  const sameYear = d.getFullYear() === current.getFullYear();
  return formatDate(d, { withYear: !sameYear });
}

/**
 * Relative day phrase.
 *  - "Today" / "Tomorrow" / "Yesterday"
 *  - within next/previous week: "Mon, Jun 10"
 *  - otherwise: "Jun 15"
 */
export function relativeDay(d: Date): string {
  const delta = daysUntil(d);

  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";

  if (delta >= -6 && delta <= 6) {
    return new Intl.DateTimeFormat(LOCALE, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
  }

  const sameYear = d.getFullYear() === now().getFullYear();
  return formatDate(d, { withYear: !sameYear });
}

/**
 * Friendly countdown for a candidate/consultant start date.
 *
 * Examples:
 *   today        → { label: "Today",       days: 0,  isPast: false }
 *   tomorrow     → { label: "Tomorrow",    days: 1,  isPast: false }
 *   +8 days      → { label: "in 8 days",   days: 8,  isPast: false }
 *   -3 days      → { label: "3 days ago",  days: -3, isPast: true  }
 */
export function startDateCountdown(d: Date): {
  label: string;
  days: number;
  isPast: boolean;
} {
  const days = daysUntil(d);

  if (days === 0) {
    return { label: "Today", days: 0, isPast: false };
  }
  if (days === 1) {
    return { label: "Tomorrow", days: 1, isPast: false };
  }
  if (days === -1) {
    return { label: "Yesterday", days: -1, isPast: true };
  }
  if (days > 0) {
    return { label: `in ${days} days`, days, isPast: false };
  }
  return { label: `${Math.abs(days)} days ago`, days, isPast: true };
}

/**
 * Deterministic, recent-feeling timestamp derived from a seed key.
 *
 * The minute offset is stable for a given (seedKey, maxMinutes) within the
 * same calendar day, so the value doesn't jump every render but does refresh
 * across days — useful for mock communication / activity feeds.
 */
export function recentMinutesAgo(seedKey: string, maxMinutes: number): Date {
  const safeMax = Math.max(1, Math.floor(maxMinutes));
  const current = now();
  const dayBucket = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
  const offset = hashString(`${seedKey}|${dayBucket}`) % safeMax;
  return minutesAgo(offset);
}

/** Simple deterministic non-negative 32-bit string hash (djb2 variant). */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + c, kept inside 32-bit unsigned range
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}
