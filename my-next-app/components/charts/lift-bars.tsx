"use client";

import type { ShareRow } from "@/lib/analytics";
import { liftLabel } from "@/lib/weeks";

export function LiftBars({ rows, selected, onSelect }: { rows: ShareRow[]; selected: string; onSelect: (value: string) => void }) {
  const sorted = [...rows].sort((a, b) => b.lift - a.lift);
  const scale = Math.max(2, ...sorted.map((row) => row.lift), 0.1);
  const mark = (2 / scale) * 100;

  return (
    <div className="relative space-y-2">
      {sorted.map((row) => (
        <button
          key={row.value}
          type="button"
          onClick={() => onSelect(row.value)}
          className={`grid w-full grid-cols-[8rem_1fr_2.5rem] items-center gap-2 text-left text-sm ${selected === row.value ? "font-semibold" : ""}`}
        >
          <span className="truncate text-stone-700">{row.value}</span>
          <span className="relative h-3 rounded-full bg-stone-100">
            <span className="absolute inset-y-0 w-px bg-stone-400" style={{ left: `${mark}%` }} />
            <span className="absolute inset-y-0 rounded-full bg-teal-800" style={{ width: `${(row.lift / scale) * 100}%` }} />
          </span>
          <span className="text-right text-stone-600">{liftLabel(row.lift)}</span>
        </button>
      ))}
      <p className="text-xs text-stone-400">The line marks a lift of 2.</p>
    </div>
  );
}
