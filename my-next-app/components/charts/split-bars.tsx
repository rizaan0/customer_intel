"use client";

import type { ReactNode } from "react";

export function SplitBars({
  title,
  icon,
  rows,
  keys,
  colors,
  onSelect,
}: {
  title: string;
  icon?: ReactNode;
  rows: { issue: string; [key: string]: string | number }[];
  keys: string[];
  colors: Record<string, string>;
  onSelect?: (issue: string) => void;
}) {
  const max = Math.max(...rows.map((row) => keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0)), 1);
  const totals = keys.map((key) => rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0));
  const grand = totals.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-5">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold tracking-tight text-stone-950 uppercase">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {keys.map((key) => (
            <span key={key} className="flex items-center gap-1.5 text-xs font-medium capitalize text-stone-600">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[key] }} />
              <span>{key}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Aggregate Distribution Bar */}
      <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-4">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-400">Total Distribution</span>
          <span className="font-mono text-[11px] font-semibold text-stone-900">{grand} total complaints</span>
        </div>

        {/* Large segmented bar */}
        <div className="mt-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
          {keys.map((key, index) => {
            const count = totals[index];
            const pct = grand > 0 ? (count / grand) * 100 : 0;
            return (
              <div
                key={key}
                title={`${key}: ${count} (${Math.round(pct)}%)`}
                style={{ width: `${pct}%`, background: colors[key] }}
                className="h-full transition-all duration-200 hover:opacity-90"
              />
            );
          })}
        </div>

        {/* Aggregate breakdown labels */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {keys.map((key, index) => {
            const count = totals[index];
            const pct = grand > 0 ? Math.round((count / grand) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors[key] }} />
                <span className="capitalize text-stone-600">{key}:</span>
                <span className="font-bold text-stone-900">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Issue Horizontal Breakdown Stream */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          Breakdown by Issue Category
        </span>

        <div className="space-y-2">
          {rows.map((row) => {
            const total = keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);

            const content = (
              <div className="flex w-full flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize text-stone-900 group-hover:text-teal-900">
                    {row.issue}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-stone-500">
                    {keys.map((k) => (
                      <span key={k} style={{ color: colors[k] }} className="font-medium">
                        {row[k]}
                      </span>
                    ))}
                    <span className="text-stone-300">|</span>
                    <span className="font-bold text-stone-900">{total} msgs</span>
                  </div>
                </div>

                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                  {keys.map((key) => {
                    const val = Number(row[key] ?? 0);
                    const widthPct = (val / max) * 100;
                    if (val === 0) return null;

                    return (
                      <div
                        key={key}
                        title={`${key}: ${val} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`}
                        style={{ width: `${widthPct}%`, background: colors[key] }}
                        className="h-full transition-all duration-200"
                      />
                    );
                  })}
                </div>
              </div>
            );

            if (!onSelect) {
              return (
                <div key={row.issue} className="rounded-xl border border-stone-200/60 bg-white p-3 shadow-2xs">
                  {content}
                </div>
              );
            }

            return (
              <button
                key={row.issue}
                type="button"
                onClick={() => onSelect(row.issue)}
                className="group flex w-full flex-col rounded-xl border border-stone-200/70 bg-white p-3 text-left transition-all hover:border-stone-300 hover:bg-stone-50/50 shadow-2xs"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
