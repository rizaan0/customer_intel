"use client";

import { CHANNEL_COLORS } from "@/lib/analytics";
import { weekLabel } from "@/lib/weeks";

export function ChannelMix({
  weeks,
}: {
  weeks: { week: string; total: number; counts: { channel: string; count: number }[] }[];
}) {
  const max = Math.max(...weeks.map((week) => week.total), 1);
  return (
    <div className="flex items-end gap-3 overflow-x-auto">
      {weeks.map((week) => (
        <div key={week.week} className="flex w-16 shrink-0 flex-col items-center gap-2">
          <div className="flex h-36 w-8 flex-col justify-end overflow-hidden rounded-full bg-stone-100">
            {week.counts
              .filter((item) => item.count > 0)
              .map((item) => (
                <span
                  key={item.channel}
                  title={`${item.channel}: ${item.count}`}
                  style={{
                    height: `${(item.count / max) * 100}%`,
                    background: CHANNEL_COLORS[item.channel] ?? "#44403c",
                  }}
                />
              ))}
          </div>
          <span className="text-center text-[10px] leading-3 text-stone-500">{weekLabel(week.week).replace("Week of ", "")}</span>
        </div>
      ))}
    </div>
  );
}
