import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function ComplaintsPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading complaints…</p>}>
      <Complaints />
    </Suspense>
  );
}

async function Complaints() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="complaints" />
    </BriefingShell>
  );
}
