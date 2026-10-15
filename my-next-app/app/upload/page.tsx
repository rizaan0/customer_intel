import { UploadForm } from "@/components/upload-form";

export default function UploadPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Upload a dataset</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          This replaces the complaints and orders currently loaded, then rebuilds the briefing. Complaint columns are
          id, text, created_at, channel, and order_id. Order columns are order_id, ordered_at, product, warehouse,
          partner, and region.
        </p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <UploadForm />
      </div>
    </main>
  );
}
