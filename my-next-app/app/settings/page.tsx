import { Suspense } from "react";
import { connection } from "next/server";
import { SettingsPanel } from "@/components/settings-panel";
import { connectionStatus } from "@/lib/store";

const NOTICES: Record<string, string> = {
  "missing-google-config":
    "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server environment, then restart the app. Customers still connect from this page.",
  "oauth-state": "The Google sign-in expired. Start the connection again.",
  "oauth-denied": "Google did not grant access to the inbox.",
  "no-refresh": "Google did not return a refresh token. Remove the app from the Google account and connect again.",
  connected: "The support inbox is connected. Import reads the complaints label.",
};

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 text-stone-500">Loading settings…</main>}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const notice = params.connected ? NOTICES.connected : params.error ? NOTICES[params.error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Settings</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          Connect the company&apos;s support Gmail here. Messages in the complaints label become complaint rows. Include
          an order id such as Order 5001 so the briefing can place the mail against a warehouse, product, or partner.
        </p>
      </div>
      <SettingsPanel status={connectionStatus()} notice={notice} />
    </main>
  );
}
