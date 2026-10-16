import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function SharePage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading share…</p>}>
      <Share />
    </Suspense>
  );
}

async function Share() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="share" />
    </BriefingShell>
  );
}
