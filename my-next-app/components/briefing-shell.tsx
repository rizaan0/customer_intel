import type { ReactNode } from "react";
import { BriefingNav } from "@/components/briefing-nav";
import { readBriefing } from "@/lib/store";

export function BriefingShell({ children }: { children: ReactNode }) {
  const briefing = readBriefing();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
      <BriefingNav
        evidence={briefing.investigations.map((item) => ({
          slug: item.slug,
          issue: item.issue,
          current: item.current,
        }))}
        datasetStats={{
          complaints: briefing.complaintCount,
          orders: briefing.orderCount,
          latestWeek: briefing.latestWeek,
        }}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
