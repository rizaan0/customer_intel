import { clearConnection } from "@/lib/store";

export async function DELETE() {
  clearConnection();
  return Response.json({ ok: true });
}
