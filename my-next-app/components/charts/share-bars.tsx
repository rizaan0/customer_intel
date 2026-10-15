"use client";

import type { ShareRow } from "@/lib/analytics";
import { liftLabel, percent } from "@/lib/weeks";

export function ShareBars({
  rows,
  selected,
  onSelect,
}: {
  rows: ShareRow[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <button
          key={row.value}
          type="button"
          onClick={() => onSelect(row.value)}
          className={`block w-full rounded-xl border px-3 py-2 text-left ${selected === row.value ? "border-teal-800 bg-teal-50" : "border-stone-200"}`}
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-stone-800">
              {row.value}
              {row.qualifies ? <span className="ml-2 text-teal-800">marked</span> : null}
            </span>
            <span className="text-stone-500">lift {liftLabel(row.lift)}</span>
          </div>
          <Bar label="Complaints" share={row.complaintShare} className="bg-teal-800" />
          <Bar label="Orders" share={row.orderShare} className="bg-stone-400" />
        </button>
      ))}
    </div>
  );
}

function Bar({ label, share, className }: { label: string; share: number; className: string }) {
  return (
    <div className="mt-1 grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-xs text-stone-500">
      <span>{label}</span>
      <span className="h-2 rounded-full bg-stone-100">
        <span className={`block h-2 rounded-full ${className}`} style={{ width: `${Math.max(share * 100, 2)}%` }} />
      </span>
      <span className="text-right">{percent(share)}</span>
    </div>
  );
}
