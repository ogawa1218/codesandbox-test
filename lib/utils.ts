import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function formatYen(value: number | string | null | undefined) {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return yen.format(n);
}

export function formatPct(value: number | null | undefined, fractionDigits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/**
 * Validate `?next=` parameter for safe internal redirects.
 * Rejects external origins to defend against open redirects.
 */
export function safeNext(next: string | null, origin: string): string {
  if (!next) return "/dashboard";
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/dashboard";
    if (!url.pathname.startsWith("/")) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

/**
 * Convert a Date to a "business date" YYYY-MM-DD in the store's timezone,
 * shifting times before business_open_at into the previous day.
 */
export function businessDate(
  at: Date,
  opts: { tz?: string; openAtHour?: number } = {},
): string {
  const { tz = "Asia/Tokyo", openAtHour = 5 } = opts;
  // Shift back by openAt hours so 02:00 belongs to the previous business day.
  const shifted = new Date(at.getTime() - openAtHour * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(shifted);
}
