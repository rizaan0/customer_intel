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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-separate border-spacing-1 text-left text-xs">
        <thead>
          <tr>
            <th className="p-1 font-medium text-stone-500">Issue</th>
            {columns.map((column) => (
              <th key={column} className="p-1 font-medium text-stone-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.issue}>
              <th className="p-1 text-left font-medium capitalize text-stone-700">{row.issue}</th>
              {row.cells.map((cell) => {
                const active = row.issue === selectedIssue && cell.value === selectedValue;
                const strength = cell.complaintCount === 0 ? 0 : Math.min(cell.lift / 4, 1);
                return (
                  <td key={cell.value} className="p-0">
                    <button
                      type="button"
                      disabled={cell.complaintCount === 0}
                      onClick={() => onSelect(row.issue, cell.value)}
                      className={`h-10 w-full rounded-md ${strength > 0.55 ? "text-white" : "text-stone-900"} ${active ? "outline outline-2 outline-stone-900" : ""}`}
                      style={{ background: `rgba(15, 118, 110, ${strength})` }}
                    >
                      {cell.complaintCount === 0 ? "—" : liftLabel(cell.lift)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-stone-400">Color is lift. A darker cell means complaints are concentrated there relative to orders.</p>
    </div>
  );
}
