import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function TrendPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading trend…</p>}>
      <Trend />
    </Suspense>
  );
}

async function Trend() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="trend" />
    </BriefingShell>
  );
}
