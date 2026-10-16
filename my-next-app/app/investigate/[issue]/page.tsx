import { Suspense } from "react";
import { redirect } from "next/navigation";

export default function InvestigationPage({ params }: { params: Promise<{ issue: string }> }) {
  return (
    <Suspense fallback={null}>
      <Redirect params={params} />
    </Suspense>
  );
}

async function Redirect({ params }: { params: Promise<{ issue: string }> }) {
  const { issue } = await params;
  redirect(`/briefing/evidence/${issue}`);
  return null;
}
