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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="p-3 font-medium">Issue</th>
              {columns.map((column) => (
                <th key={column} className="p-3 text-center font-medium text-stone-900">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr key={row.issue} className="transition-colors hover:bg-stone-50/30">
                <th className="p-3 font-medium capitalize whitespace-nowrap text-stone-950">{row.issue}</th>
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
                  const tone = !hasData
                    ? "bg-stone-100 text-stone-400"
                    : isMarked
                      ? "bg-teal-800 text-white"
                      : lift >= 1
                        ? "bg-teal-100 text-teal-900"
                        : "bg-stone-200 text-stone-700";

                  return (
                    <td key={cell.value} className="p-1.5 text-center">
                      <button
                        type="button"
                        disabled={!hasData}
                        aria-pressed={active}
                        aria-label={`${cell.value}, ${row.issue}, lift ${liftLabel(cell.lift)}, ${cell.complaintCount} complaints`}
                        onClick={() => onSelect(row.issue, cell.value)}
                        className={`flex h-14 w-full min-w-[6rem] flex-col items-center justify-center rounded-lg ${tone} ${
                          !hasData ? "cursor-not-allowed" : active ? "ring-2 ring-teal-800 ring-offset-2" : "hover:ring-1 hover:ring-stone-300"
                        }`}
                      >
                        <span className="font-mono text-sm font-medium tabular-nums leading-none">
                          {hasData ? `${liftLabel(cell.lift)}×` : "—"}
                        </span>
                        {hasData ? (
                          <span className={`mt-1 font-mono text-xs tabular-nums ${isMarked ? "text-teal-100" : "text-current opacity-70"}`}>
                            {count}
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
          <span className="text-xs font-semibold text-stone-700">Lift</span>
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span className="h-3 w-4 rounded-sm border border-stone-200 bg-stone-200" />
            0.0×
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span className="h-3 w-4 rounded-sm bg-teal-100" />
            1.0×
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span className="h-3 w-4 rounded-sm bg-teal-800" />
            ≥2.0×
          </span>
        </div>
      </div>
    </div>
  );
}
