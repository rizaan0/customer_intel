import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingPanel } from "@/components/briefing-panel";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";

export default function SentimentPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading sentiment…</p>}>
      <Sentiment />
    </Suspense>
  );
}

async function Sentiment() {
  await connection();
  return (
    <BriefingShell>
      <BriefingPanel briefing={readBriefing()} section="sentiment" />
    </BriefingShell>
  );
}
