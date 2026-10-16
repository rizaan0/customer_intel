"use client";

import type { ReactNode } from "react";
import { ChartSwatch, chartRowClass } from "./chart-ui";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-stone-950">{title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {keys.map((key) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-xs capitalize text-stone-600">
              <ChartSwatch color={colors[key]} />
              {key}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-xs tabular-nums text-stone-500">{grand} complaints</p>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
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
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-stone-500">
          {keys.map((key, index) => {
            const count = totals[index];
            const pct = grand > 0 ? Math.round((count / grand) * 100) : 0;
            return (
              <span key={key} className="capitalize">
                {key} {count} ({pct}%)
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
          {rows.map((row) => {
            const total = keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);

            const content = (
              <div className="flex w-full flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-stone-900">{row.issue}</span>
                  <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-stone-500">
                    {keys.map((k) => (
                      <span key={k} style={{ color: colors[k] }} className="font-medium">
                        {row[k]}
                      </span>
                    ))}
                    <span className="text-stone-300">|</span>
                    <span className="font-medium text-stone-900">{total}</span>
                  </div>
                </div>

                <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
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
                <div key={row.issue} className={chartRowClass(false)}>
                  {content}
                </div>
              );
            }

            return (
              <button
                key={row.issue}
                type="button"
                onClick={() => onSelect(row.issue)}
                className={chartRowClass(false)}
              >
                {content}
              </button>
            );
          })}
      </div>
    </div>
  );
}
