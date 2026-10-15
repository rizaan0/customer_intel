import { restoreSample } from "@/lib/store";

export async function POST() {
  restoreSample();
  return Response.json({ ok: true });
}
