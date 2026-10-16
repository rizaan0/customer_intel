"use client";

import { liftLabel } from "@/lib/weeks";

export function Heatmap({
  columns,
  rows,
  selectedIssue,
  selectedValue,
  onSelect,
}: {
  columns: string[];
  rows: { issue: string; cells: { value: string; lift: number; complaintCount: number }[] }[];
  selectedIssue: string;
  selectedValue: string;
  onSelect: (issue: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Matrix Frame */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[38rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/90 text-stone-600">
              <th className="p-3.5 font-semibold uppercase tracking-wider text-[11px] text-stone-500">
                Issue Category
              </th>
              {columns.map((column) => (
                <th key={column} className="p-3.5 font-semibold text-stone-900 text-center">
                  <span className="block">{column}</span>
                  <span className="text-[10px] font-normal text-stone-400 font-mono">dimension</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr key={row.issue} className="transition-colors hover:bg-stone-50/30">
                <th className="p-3.5 font-semibold capitalize text-stone-950 whitespace-nowrap">
                  {row.issue}
                </th>
                {row.cells.map((cell) => {
                  const active = row.issue === selectedIssue && cell.value === selectedValue;
                  const count = cell.complaintCount;
                  const hasData = count > 0;
                  const lift = cell.lift;
                  const isMarked = count >= 5 && lift >= 2.0;

                  // Green-gradient color intensity calculation matching reference 5
                  // 0 -> #f5f5f4
                  // 1.0 -> #ccfbf1 (teal-100)
                  // 2.0+ -> #0f766e (teal-700) with dark text transition
                  const intensity = !hasData ? 0 : Math.min(lift / 2.6, 1);
                  const isDark = intensity > 0.65;

                  return (
                    <td key={cell.value} className="p-1.5 text-center">
                      <button
                        type="button"
                        disabled={!hasData}
                        aria-label={`${cell.value}, ${row.issue}, lift ${liftLabel(cell.lift)}, ${cell.complaintCount} complaints`}
                        title={`${cell.value}, ${row.issue}, lift ${liftLabel(cell.lift)}, ${cell.complaintCount} complaints`}
                        onClick={() => onSelect(row.issue, cell.value)}
                        className={`group relative flex h-14 w-full min-w-[6rem] flex-col items-center justify-center rounded-xl border transition-all ${
                          !hasData
                            ? "border-transparent bg-stone-50/50 text-stone-300 cursor-not-allowed"
                            : active
                              ? "border-stone-950 ring-2 ring-stone-950/20 shadow-xs"
                              : "border-stone-200/60 hover:border-teal-700 hover:scale-[1.02] shadow-2xs"
                        }`}
                        style={{
                          background: !hasData
                            ? "#f5f5f4"
                            : isMarked
                              ? `rgba(15, 118, 110, ${Math.max(intensity, 0.75)})`
                              : `rgba(20, 184, 166, ${Math.max(intensity * 0.7, 0.12)})`,
                          color: !hasData ? "#a8a29e" : isDark || isMarked ? "#ffffff" : "#0f172a",
                        }}
                      >
                        <span className="font-mono text-sm font-bold leading-none">
                          {hasData ? `${liftLabel(cell.lift)}×` : "—"}
                        </span>
                        {hasData ? (
                          <span
                            className={`mt-1 font-mono text-[10px] ${
                              isDark || isMarked ? "text-teal-100 opacity-90" : "text-stone-500"
                            }`}
                          >
                            {count} {count === 1 ? "complaint" : "complaints"}
                          </span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">Lift Scale:</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-3 w-4 rounded-xs bg-stone-100 border border-stone-200" />
            0.0×
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-3 w-4 rounded-xs bg-teal-100 border border-teal-200" />
            1.0× (Parity)
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-3 w-4 rounded-xs bg-teal-700" />
            ≥2.0× (Escalation)
          </span>
        </div>
        <span className="font-mono text-[11px]">Click cell to open complaint ledger</span>
      </div>
    </div>
  );
}
