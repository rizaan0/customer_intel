"use client";

import { useState } from "react";
import { ISSUE_COLORS } from "@/lib/analytics";
import { weekLabel } from "@/lib/weeks";

type Point = { week: string; count: number };
type Series = { issue: string; points: Point[] };

function pointName(issue: string): string {
  return issue.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function axisWeek(iso: string): string {
  return weekLabel(iso).replace(/^Week of /, "").replace(/ \d{4}$/, "");
}

// Generate smooth cubic bezier SVG path through points
function getCurvedPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
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
  const [hoveredPoint, setHoveredPoint] = useState<{ week: string; issue: string; count: number; x: number; y: number } | null>(null);

  const width = 720;
  const height = 280;
  const pad = { top: 24, right: 28, bottom: 40, left: 36 };
  const counts = series.flatMap((item) => item.points.map((point) => point.count));
  const max = Math.max(...counts, guide ?? 0, 1);
  const weeks = series[0]?.points.map((point) => point.week) ?? [];

  const x = (index: number) => pad.left + (weeks.length <= 1 ? 0 : (index / (weeks.length - 1)) * (width - pad.left - pad.right));
  const y = (count: number) => pad.top + (1 - count / max) * (height - pad.top - pad.bottom);
  const baselineY = y(0);

  // Filter series if user toggled an issue filter in legend
  const visibleSeries = activeIssue ? series.filter((s) => s.issue === activeIssue) : series;

  return (
    <div className="space-y-4">
      {/* Header controls & chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveIssue(null)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeIssue === null
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All Issues ({series.length})
          </button>
          {series.map((item) => {
            const isActive = activeIssue === item.issue;
            const color = ISSUE_COLORS[item.issue] ?? "#0f766e";
            return (
              <button
                key={item.issue}
                type="button"
                onClick={() => setActiveIssue(isActive ? null : item.issue)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span>{item.issue}</span>
              </button>
            );
          })}
        </div>

        {guide ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-teal-800">
            <span className="h-0.5 w-3.5 border-t border-dashed border-teal-800" />
            1.5× 4-wk average threshold
          </span>
        ) : null}
      </div>

      {/* SVG chart canvas with interactive hover tooltip */}
      <div className="relative overflow-x-auto rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px]" role="img" aria-label="Complaints by issue across weeks">
          <defs>
            {series.map((item) => {
              const color = ISSUE_COLORS[item.issue] ?? "#0f766e";
              return (
                <linearGradient key={`grad-${item.issue}`} id={`grad-${item.issue.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Clean dashed horizontal gridlines */}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="#e7e5e4" strokeWidth="1" />
          <line x1={pad.left} x2={width - pad.right} y1={y(max * 0.33)} y2={y(max * 0.33)} stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={pad.left} x2={width - pad.right} y1={y(max * 0.66)} y2={y(max * 0.66)} stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={pad.left} x2={width - pad.right} y1={y(max)} y2={y(max)} stroke="#f5f5f4" strokeWidth="1" strokeDasharray="3 3" />

          {/* Guide Line (1.5x baseline) */}
          {guide ? (
            <line x1={pad.left} x2={width - pad.right} y1={y(guide)} y2={y(guide)} stroke="#0f766e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          ) : null}

          {/* Smooth area fills and spline lines */}
          {visibleSeries.map((item) => {
            const color = ISSUE_COLORS[item.issue] ?? "#0f766e";
            const pts = item.points.map((p, idx) => ({ x: x(idx), y: y(p.count) }));
            const curve = getCurvedPath(pts);
            const firstX = pts[0]?.x ?? pad.left;
            const lastX = pts[pts.length - 1]?.x ?? width - pad.right;
            const areaD = pts.length ? `${curve} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z` : "";
            const gradId = `grad-${item.issue.replace(/\s+/g, "-")}`;

            return (
              <g key={item.issue} className="transition-opacity duration-200">
                {/* Gradient area fill */}
                <path d={areaD} fill={`url(#${gradId})`} />

                {/* Curved line path */}
                <path
                  d={curve}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {item.points.map((point, idx) => {
                  const ptX = x(idx);
                  const ptY = y(point.count);
                  const isSelected = point.week === selectedWeek;
                  const isHovered = hoveredPoint?.week === point.week && hoveredPoint?.issue === item.issue;

                  return (
                    <g
                      key={point.week}
                      role="button"
                      tabIndex={0}
                      aria-label={`${pointName(item.issue)}, ${weekLabel(point.week)}, ${point.count} complaints`}
                      className="cursor-pointer focus:outline-hidden"
                      onClick={() => onSelect(point.week, item.issue)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") onSelect(point.week, item.issue);
                      }}
                      onMouseEnter={() => setHoveredPoint({ week: point.week, issue: item.issue, count: point.count, x: ptX, y: ptY })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Outer pulse glow on selected */}
                      {isSelected ? (
                        <circle cx={ptX} cy={ptY} r={10} fill={color} opacity="0.18" />
                      ) : null}

                      {/* White border circle with solid accent dot inside */}
                      <circle
                        cx={ptX} cy={ptY}
                        r={isHovered ? 7 : isSelected ? 6.5 : 4.5}
                        fill="#ffffff"
                        stroke={color}
                        strokeWidth={isHovered ? 3.5 : isSelected ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Bottom X-axis labels */}
          {weeks.map((week, idx) => (
            <text
              key={week}
              x={x(idx)}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#78716c"
              fontWeight={week === selectedWeek ? "600" : "400"}
              fontFamily="monospace"
            >
              {axisWeek(week)}
            </text>
          ))}
        </svg>

        {/* Floating tooltip when hovering points */}
        {hoveredPoint ? (
          <div
            className="pointer-events-none absolute z-30 rounded-lg border border-stone-200 bg-stone-900/95 px-2.5 py-1.5 text-xs text-white shadow-lg backdrop-blur-xs transition-transform"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              transform: "translate(-50%, -125%)",
            }}
          >
            <div className="flex items-center gap-1.5 capitalize font-medium">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ISSUE_COLORS[hoveredPoint.issue] ?? "#14b8a6" }} />
              <span>{hoveredPoint.issue}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-stone-300 font-mono">
              <span>{weekLabel(hoveredPoint.week).replace("Week of ", "")}</span>
              <span className="font-bold text-white">{hoveredPoint.count} msgs</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>Click any data point to inspect underlying complaints for that period</span>
        <span className="font-mono text-[11px]">Exact counts preserved</span>
      </div>
    </div>
  );
}
