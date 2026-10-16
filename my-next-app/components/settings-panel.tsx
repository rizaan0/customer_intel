"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ConnectionStatus } from "@/lib/types";

export function SettingsPanel({ status, notice }: { status: ConnectionStatus; notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(status);

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/gmail/app-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        appPassword: form.get("appPassword"),
      }),
    });
    const payload = (await response.json()) as { error?: string; email?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not save the inbox.");
      return;
    }
    setConnected({
      connected: true,
      method: "app-password",
      email: payload.email,
      label: "complaints",
      googleConfigured: status.googleConfigured,
    });
  }

  async function runImport() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/gmail/import", { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "Import failed.");
      return;
    }
    router.refresh();
    router.push("/briefing");
  }

  async function disconnect() {
    if (!window.confirm("Disconnect this support inbox? Imported complaints stay in the dataset.")) return;
    setPending(true);
    await fetch("/api/gmail/connection", { method: "DELETE" });
    setPending(false);
    setConnected({ connected: false, googleConfigured: status.googleConfigured });
  }

  return (
    <div className="space-y-8">
      {notice ? <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-pretty text-amber-900">{notice}</p> : null}
      {error ? <p role="alert" className="text-sm text-pretty text-red-700">{error}</p> : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Support inbox</h2>
        {connected.connected ? (
          <p className="mt-2 text-sm text-stone-600">
            {connected.email || "Gmail"} · {connected.label} label.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">No inbox is connected yet.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {connected.connected ? (
            <>
              <button
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                type="button"
                onClick={runImport}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Working…" : "Import complaints"}
              </button>
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
                type="button"
                onClick={disconnect}
                disabled={pending}
              >
                Disconnect
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Google</h2>
        <p className="mt-2 text-pretty text-sm leading-6 text-stone-600">
          Sign in as the support mailbox. Read-only.
        </p>
        <a
          className="mt-4 inline-block rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-white"
          href="/api/gmail/start"
        >
          Connect Gmail
        </a>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">App password</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Use a Google app password, not the account password.
        </p>
        <form onSubmit={savePassword} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-stone-800">
            Support address
            <input
              className="mt-2 block w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-base focus:border-teal-800 focus:bg-white sm:text-sm"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={error ? true : undefined}
              placeholder="support@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            App password
            <input
              className="mt-2 block w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-base focus:border-teal-800 focus:bg-white sm:text-sm"
              name="appPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={error ? true : undefined}
            />
          </label>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            Save inbox
          </button>
        </form>
      </section>
    </div>
  );
}
