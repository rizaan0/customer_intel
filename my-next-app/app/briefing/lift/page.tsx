import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function LiftPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading lift…</p>}>
      <Lift />
    </Suspense>
  );
}

async function Lift() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="lift" />
    </BriefingShell>
  );
}
