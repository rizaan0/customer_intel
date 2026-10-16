"use client";

import type { ShareRow } from "@/lib/analytics";
import { liftLabel, percent } from "@/lib/weeks";

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 text-xs">
        <div>
          <span className="font-semibold text-stone-900">Operational Lift Index</span>
          <span className="ml-2 text-stone-400">Ratio = Complaint Share ÷ Order Share</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 text-stone-600">
            <span className="h-2 w-2 rounded-xs bg-teal-800" />
            Observed Lift
          </span>
          <span className="inline-flex items-center gap-1.5 text-stone-950 font-semibold">
            <span className="h-3 w-0.5 bg-stone-950" />
            Benchmark = 1.0×
          </span>
        </div>
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
              onClick={() => onSelect(row.value)}
              className={`group flex w-full flex-col rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-teal-800 bg-teal-50/70 shadow-xs ring-1 ring-teal-800/20"
                  : "border-stone-200/90 bg-white hover:border-stone-300 hover:bg-stone-50/40"
              }`}
            >
              {/* Row title & status */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold tracking-tight ${isSelected ? "text-teal-950" : "text-stone-950"}`}>
                    {row.value}
                  </span>
                  {isHighSpike ? (
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                      Spike (≥2.0×)
                    </span>
                  ) : isOverrepresented ? (
                    <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-600">
                      Overrepresented
                    </span>
                  ) : (
                    <span className="rounded-md bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] text-stone-400">
                      Under benchmark
                    </span>
                  )}
                </div>

                {/* Quantitative summary badge */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-stone-500">
                    {row.complaintCount}c ({percent(row.complaintShare)}) / {percent(row.orderShare)} ord
                  </span>
                  <span
                    className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                      isHighSpike
                        ? "bg-rose-100 text-rose-900"
                        : isOverrepresented
                          ? "bg-teal-100/80 text-teal-900"
                          : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {liftLabel(row.lift)}×
                  </span>
                </div>
              </div>

              {/* Proportional visual track with benchmark guideline */}
              <div className="relative mt-3.5 h-3 w-full overflow-hidden rounded-full bg-stone-100">
                {/* Benchmark guideline 1.0 */}
                <div
                  className="absolute inset-y-0 z-20 w-0.5 bg-stone-950 shadow-xs"
                  style={{ left: `${benchmarkPct}%` }}
                  title="Benchmark baseline = 1.0x"
                />

                {/* Lift bar */}
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isHighSpike
                      ? "bg-rose-600"
                      : isOverrepresented
                        ? "bg-teal-800 group-hover:bg-teal-700"
                        : "bg-stone-400"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Sub-track legend */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                <span>0.0×</span>
                <span className="text-stone-700 font-semibold">1.0× Expected Representation</span>
                <span>{scale.toFixed(1)}× Max</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-stone-950" />
          Benchmark line marks exact parity (Lift = 1.0×). Bars extending past it have higher complaint shares than order shares.
        </span>
        <span className="font-mono text-[11px]">Click row to drill into complaints</span>
      </div>
    </div>
  );
}
