import { importInbox } from "@/lib/gmail";

export async function POST() {
  try {
    const imported = await importInbox();
    return Response.json({ ok: true, imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
