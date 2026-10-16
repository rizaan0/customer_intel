"use client";

import type { ShareRow } from "@/lib/analytics";
import { liftLabel, percent } from "@/lib/weeks";
import { ChartFill, ChartTrack, chartRowClass } from "./chart-ui";

export function LiftBars({
  rows,
  selected,
  onSelect,
}: {
  rows: ShareRow[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.lift - a.lift);
  const maxLift = Math.max(2.5, ...sorted.map((r) => r.lift));
  const scale = maxLift * 1.08;
  const benchmarkPct = (1.0 / scale) * 100;

  return (
    <div className="space-y-4">
      {/* Chart Top Header & Axis Meta */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-teal-800" />
          Lift
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-stone-950" />
          1.0×
        </span>
      </div>

      {/* Main Diverging / Relative Bar Stream */}
      <div className="space-y-3">
        {sorted.map((row) => {
          const isSelected = selected === row.value;
          const isOverrepresented = row.lift > 1.0;
          const isHighSpike = row.lift >= 2.0 && row.complaintCount >= 5;
          const barWidth = Math.min(100, (row.lift / scale) * 100);

          return (
            <button
              key={row.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(row.value)}
              className={chartRowClass(isSelected)}
            >
              {/* Row title & status */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-950">{row.value}</span>
                  {isHighSpike ? <span className="text-xs text-rose-700">High lift</span> : null}
                </div>

                {/* Quantitative summary badge */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-stone-500">
                    {row.complaintCount} complaints · {percent(row.orderShare)} of orders
                  </span>
                  <span className="font-mono text-sm font-medium tabular-nums text-stone-950">{liftLabel(row.lift)}×</span>
                </div>
              </div>

              {/* Proportional visual track with benchmark guideline */}
              <ChartTrack className="mt-2">
                <span className="absolute inset-y-0 z-10 w-px bg-stone-950" style={{ left: `${benchmarkPct}%` }} />
                <ChartFill width={`${barWidth}%`} className={isOverrepresented ? "bg-teal-800" : "bg-stone-400"} />
              </ChartTrack>
            </button>
          );
        })}
      </div>

    </div>
  );
}
