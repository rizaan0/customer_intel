import type { ReactNode } from "react";

export const CHART = {
  ink: "#0c0a09",
  muted: "#78716c",
  line: "#e7e5e4",
  grid: "#f5f5f4",
  accent: "#0f766e",
  track: "#f5f5f4",
} as const;

export function chartRowClass(selected: boolean) {
  return `block w-full rounded-xl border px-3 py-2.5 text-left ${
    selected ? "border-teal-800 bg-teal-50" : "border-stone-200 bg-white hover:border-stone-300"
  }`;
}

export function ChartTooltip({
  left,
  top,
  context,
  label,
  value,
  swatch,
}: {
  left: string;
  top: string;
  context: string;
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute z-30 min-w-36 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs shadow-xs"
      style={{ left, top, transform: "translate(-50%, calc(-100% - 8px))" }}
    >
      <p className="font-mono text-stone-500">{context}</p>
      <p className="mt-1 flex items-center justify-between gap-3 text-stone-950">
        <span className="inline-flex items-center gap-1.5 capitalize">
          {swatch ? <span aria-hidden="true" className="size-2 rounded-full" style={{ background: swatch }} /> : null}
          {label}
        </span>
        <span className="font-mono font-medium tabular-nums">{value}</span>
      </p>
    </div>
  );
}

export function ChartTrack({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`relative h-2 w-full overflow-hidden rounded-full bg-stone-100 ${className}`}>{children}</div>;
}

export function ChartFill({ width, className = "bg-teal-800" }: { width: string; className?: string }) {
  return <span className={`block h-full rounded-full ${className}`} style={{ width }} />;
}

export function ChartSwatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: color }} />;
}
