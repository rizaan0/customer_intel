"use client";

import { useState } from "react";
import { COMPLAINT_KEYWORDS } from "@/lib/label";

export function CreateDataset({ connected, email }: { connected: boolean; email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createCsv() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/dataset/create", { method: "POST" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setPending(false);
      setError(payload.error ?? "Could not create the CSV.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "complaints-from-gmail.csv";
    link.click();
    URL.revokeObjectURL(url);
    setPending(false);
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-stone-900">Create dataset</h2>
      {connected ? (
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {email || "Gmail"} is connected. Downloads a complaints file. Does not replace the loaded dataset.
        </p>
      ) : (
        <p id="create-dataset-help" className="mt-2 text-pretty text-sm leading-6 text-stone-600">Connect Gmail in Settings before creating a CSV.</p>
      )}
      <p className="mt-3 text-sm text-stone-600">Keywords: {COMPLAINT_KEYWORDS.join(", ")}.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-pretty text-red-700">{error}</p> : null}
      <button
        className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        type="button"
        onClick={createCsv}
        disabled={!connected || pending}
        aria-busy={pending}
        aria-describedby={connected ? undefined : "create-dataset-help"}
      >
        {pending ? "Working…" : "Create CSV file"}
      </button>
    </section>
  );
}
