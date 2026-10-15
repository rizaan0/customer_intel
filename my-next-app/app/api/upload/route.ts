import { complaintsFromCsv, ordersFromCsv, rebuildBriefing, writeDataset } from "@/lib/store";

export async function POST(request: Request) {
  const form = await request.formData();
  const complaintsFile = form.get("complaints");
  const ordersFile = form.get("orders");
  if (!(complaintsFile instanceof File) || !(ordersFile instanceof File)) {
    return Response.json({ error: "Choose both a complaints file and an orders file." }, { status: 400 });
  }
  if (complaintsFile.size > 2_000_000 || ordersFile.size > 2_000_000) {
    return Response.json({ error: "Each file must be under 2 MB." }, { status: 400 });
  }
  try {
    const complaints = complaintsFromCsv(await complaintsFile.text());
    const orders = ordersFromCsv(await ordersFile.text());
    writeDataset(complaints, orders);
    rebuildBriefing();
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the files.";
    return Response.json({ error: message }, { status: 400 });
  }
}
