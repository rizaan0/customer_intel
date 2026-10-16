"use client";

import { useState } from "react";
import { ISSUE_COLORS } from "@/lib/analytics";
import { weekLabel } from "@/lib/weeks";
import { GlowingAreaChart } from "@/components/ui/c-chart-16";

type Point = { week: string; count: number };
type Series = { issue: string; points: Point[] };

function slug(issue: string) {
  return issue.replace(/\s+/g, "-");
}

function axisWeek(iso: string) {
  return weekLabel(iso).replace(/^Week of /, "").replace(/ \d{4}$/, "");
}

export function IssueTrend({
  series,
  guide,
  selectedWeek,
  onSelect,
}: {
  series: Series[];
  guide: number | null;
  selectedWeek: string;
  onSelect: (week: string, issue: string) => void;
}) {
  const [activeIssue, setActiveIssue] = useState<string | null>(null);
  const visible = activeIssue ? series.filter((item) => item.issue === activeIssue) : series;
  const weeks = series[0]?.points.map((point) => point.week) ?? [];
  const data = weeks.map((week) => {
    const row: Record<string, string | number> = { week: axisWeek(week), iso: week };
    for (const item of series) {
      row[slug(item.issue)] = item.points.find((point) => point.week === week)?.count ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveIssue(null)}
            aria-pressed={activeIssue === null}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              activeIssue === null ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All ({series.length})
          </button>
          {series.map((item) => {
            const pressed = activeIssue === item.issue;
            return (
              <button
                key={item.issue}
                type="button"
                onClick={() => setActiveIssue(pressed ? null : item.issue)}
                aria-pressed={pressed}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize ${
                  pressed ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: pressed ? "#fff" : ISSUE_COLORS[item.issue] ?? "#0f766e" }} />
                {item.issue}
              </button>
            );
          })}
        </div>
        {guide ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-teal-800">
            <span className="h-0.5 w-3.5 border-t border-dashed border-teal-800" />
            1.5× average
          </span>
        ) : null}
      </div>
      <GlowingAreaChart
        data={data}
        xKey="week"
        guide={guide}
        series={visible.map((item) => ({
          key: slug(item.issue),
          label: item.issue,
          color: ISSUE_COLORS[item.issue] ?? "#0f766e",
        }))}
        onPoint={(label, key) => {
          const week = data.find((row) => row.week === label)?.iso;
          const issue = series.find((item) => slug(item.issue) === key)?.issue;
          if (typeof week === "string" && issue) onSelect(week, issue);
        }}
      />
      <p className="sr-only">Selected week {selectedWeek}</p>
    </div>
  );
}
