"use client";

import { ISSUE_COLORS } from "@/lib/analytics";
import { weekLabel } from "@/lib/weeks";

type Point = { week: string; count: number };
type Series = { issue: string; points: Point[] };

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
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 28 };
  const counts = series.flatMap((item) => item.points.map((point) => point.count));
  const max = Math.max(...counts, guide ?? 0, 1);
  const weeks = series[0]?.points.map((point) => point.week) ?? [];
  const x = (index: number) => pad.left + (weeks.length <= 1 ? 0 : (index / (weeks.length - 1)) * (width - pad.left - pad.right));
  const y = (count: number) => pad.top + (1 - count / max) * (height - pad.top - pad.bottom);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Complaints by issue across weeks">
        {guide ? (
          <line x1={pad.left} x2={width - pad.right} y1={y(guide)} y2={y(guide)} stroke="#a8a29e" strokeDasharray="4 4" />
        ) : null}
        {series.map((item) => {
          const color = ISSUE_COLORS[item.issue] ?? "#44403c";
          const path = item.points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.count)}`).join(" ");
          return (
            <g key={item.issue}>
              <path d={path} fill="none" stroke={color} strokeWidth="2" />
              {item.points.map((point, index) => (
                <circle
                  key={point.week}
                  cx={x(index)}
                  cy={y(point.count)}
                  r={point.week === selectedWeek ? 6 : 4}
                  fill={color}
                  className="cursor-pointer"
                  onClick={() => onSelect(point.week, item.issue)}
                >
                  <title>{`${item.issue}, ${weekLabel(point.week)}, ${point.count}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {weeks.map((week, index) => (
          <text key={week} x={x(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#78716c">
            {week.slice(5)}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-600">
        {series.map((item) => (
          <span key={item.issue} className="inline-flex items-center gap-1 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: ISSUE_COLORS[item.issue] ?? "#44403c" }} />
            {item.issue}
          </span>
        ))}
        {guide ? <span className="text-stone-400">Dashed line is 1.5× the previous four-week average</span> : null}
      </div>
    </div>
  );
}
