"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/upload", { method: "POST", body: new FormData(event.currentTarget) });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }
    router.refresh();
    router.push("/briefing");
  }

  async function restore() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/sample/restore", { method: "POST" });
    setPending(false);
    if (!response.ok) {
      setError("The sample dataset could not be restored.");
      return;
    }
    router.refresh();
    router.push("/briefing");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-stone-800">
        Complaints CSV
        <input
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          type="file"
          name="complaints"
          accept=".csv,text/csv"
          required
        />
      </label>
      <label className="block text-sm font-medium text-stone-800">
        Orders CSV
        <input
          className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          type="file"
          name="orders"
          accept=".csv,text/csv"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Working…" : "Replace dataset"}
        </button>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
          type="button"
          onClick={restore}
          disabled={pending}
        >
          Restore sample data
        </button>
      </div>
    </form>
  );
}
