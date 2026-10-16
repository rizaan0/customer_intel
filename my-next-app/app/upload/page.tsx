import { Suspense } from "react";
import { connection } from "next/server";
import { CreateDataset } from "@/components/create-dataset";
import { UploadForm } from "@/components/upload-form";
import { connectionStatus } from "@/lib/store";

export default function UploadPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 text-stone-500">Loading upload…</main>}>
      <Upload />
    </Suspense>
  );
}

async function Upload() {
  await connection();
  const status = connectionStatus();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-3xl text-stone-950 sm:text-4xl">Upload a dataset</h1>
        <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-stone-600">
          Replaces the loaded complaints and orders. Complaints need id, text, created_at, channel, order_id. Orders need order_id, ordered_at, product, warehouse, partner, region.
        </p>
      </div>
      <CreateDataset connected={status.connected} email={status.email ?? ""} />
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <UploadForm />
      </div>
    </main>
  );
}
