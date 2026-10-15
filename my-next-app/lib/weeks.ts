export const WEEK_STARTS = [
  "2026-08-31",
  "2026-09-07",
  "2026-09-14",
  "2026-09-21",
  "2026-09-28",
  "2026-10-05",
] as const;

export function weekStart(iso: string): string {
  const date = new Date(iso);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

export function addDays(start: string, days: number): string {
  const date = new Date(`${start}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function weekLabel(isoDate: string): string {
  const label = new Date(`${isoDate}T12:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Week of ${label}`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function liftLabel(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(1);
}
