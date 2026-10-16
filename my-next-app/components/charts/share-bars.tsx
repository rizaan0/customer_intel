"use client";

import type { ShareRow } from "@/lib/analytics";
import { liftLabel, percent } from "@/lib/weeks";
import { ChartFill, ChartTrack, chartRowClass } from "./chart-ui";

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
    <div className="space-y-2">
      {rows.map((row) => (
        <button
          key={row.value}
          type="button"
          aria-pressed={selected === row.value}
          onClick={() => onSelect(row.value)}
          className={chartRowClass(selected === row.value)}
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-stone-900">
              {row.value}
              {row.qualifies ? <span className="ml-2 text-xs text-teal-800">marked</span> : null}
            </span>
            <span className="font-mono text-xs tabular-nums text-stone-500">lift {liftLabel(row.lift)}</span>
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
    <div className="mt-2 grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-xs text-stone-500">
      <span>{label}</span>
      <ChartTrack>
        <ChartFill width={`${Math.max(share * 100, 2)}%`} className={className} />
      </ChartTrack>
      <span className="text-right font-mono tabular-nums text-stone-700">{percent(share)}</span>
    </div>
  );
}
