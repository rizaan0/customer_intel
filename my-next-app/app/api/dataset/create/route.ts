import { toCsv } from "@/lib/csv";
import { listConnectedMail } from "@/lib/gmail";
import { labelComplaint } from "@/lib/label";
import { complaintsFromCsv, readConnection, writeMailList } from "@/lib/store";

const HEADERS = ["id", "text", "created_at", "channel", "order_id"];

export async function POST() {
  const connection = readConnection();
  if (!connection) {
    return Response.json({ error: "Connect a support inbox in Settings first." }, { status: 400 });
  }

  try {
    const messages = await listConnectedMail();
    writeMailList({
      fetchedAt: new Date().toISOString(),
      email: connection.email,
      label: connection.label,
      messages,
    });
    if (messages.length === 0) {
      return Response.json({ error: "The connected label has no messages." }, { status: 400 });
    }
    const curated = messages.filter((message) => labelComplaint(message.text).issue !== "other");
    if (curated.length === 0) {
      return Response.json({ error: "No messages matched the complaint keywords." }, { status: 400 });
    }
    const csv = toCsv(
      HEADERS,
      curated.map((message) => ({
        id: message.id,
        text: message.text,
        created_at: message.createdAt,
        channel: message.channel,
        order_id: message.orderId,
      })),
    );
    complaintsFromCsv(csv);
    if (Buffer.byteLength(csv) > 2_000_000) {
      return Response.json({ error: "The complaints CSV is over 2 MB, so the upload page cannot accept it." }, { status: 400 });
    }
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="complaints-from-gmail.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the CSV.";
    return Response.json({ error: message }, { status: 400 });
  }
}
