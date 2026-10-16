import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function ConcentrationPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading concentration…</p>}>
      <Concentration />
    </Suspense>
  );
}

async function Concentration() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="concentration" />
    </BriefingShell>
  );
}
