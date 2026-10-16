"use client";

import { useId, type CSSProperties } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type GlowSeries = {
  key: string;
  label: string;
  color: string;
};

export function GlowingAreaChart({
  data,
  xKey,
  series,
  guide,
  className = "aspect-auto h-72 w-full",
  onPoint,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: GlowSeries[];
  guide?: number | null;
  className?: string;
  onPoint?: (x: string, seriesKey: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const chartConfig = Object.fromEntries(series.map((item) => [item.key, { label: item.label, color: item.color }])) satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart accessibilityLayer data={data} margin={{ top: 20, right: 16, bottom: 0, left: 16 }}>
        <defs>
          {series.flatMap((item) => [
            <linearGradient key={`${item.key}-fill`} id={`${uid}-fill-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${item.key})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`var(--color-${item.key})`} stopOpacity={0} />
            </linearGradient>,
            <filter key={`${item.key}-dot`} id={`${uid}-dot-${item.key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>,
            <filter key={`${item.key}-line`} id={`${uid}-line-${item.key}`} x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>,
          ])}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} interval={0} tickLine={false} axisLine={false} tickMargin={8} />
        {guide ? <ReferenceLine y={guide} stroke="var(--accent)" strokeDasharray="4 4" /> : null}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              className="min-w-36 gap-2.5"
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-2.5 shrink-0 rounded-xs bg-(--color-bg)"
                      style={{ "--color-bg": `var(--color-${name})` } as CSSProperties}
                    />
                    <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">{Number(value).toLocaleString()}</span>
                </div>
              )}
            />
          }
        />
        {series.map((item) => (
          <Area
            key={item.key}
            dataKey={item.key}
            type="natural"
            fill={`url(#${uid}-fill-${item.key})`}
            stroke={`var(--color-${item.key})`}
            strokeWidth={2}
            filter={`url(#${uid}-line-${item.key})`}
            dot={{
              r: 4,
              fill: `var(--color-${item.key})`,
              strokeWidth: 2,
              stroke: "var(--background)",
              filter: `url(#${uid}-dot-${item.key})`,
            }}
            activeDot={{
              r: 6,
              strokeWidth: 3,
              stroke: "var(--background)",
              onClick: (_event, payload) => {
                const row = (payload as { payload?: Record<string, string | number> }).payload;
                const x = row?.[xKey];
                if (x !== undefined && onPoint) onPoint(String(x), item.key);
              },
            }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
