import { NextResponse } from "next/server";
import { lineNotifier } from "@/lib/notifier/line";

/**
 * Build a LINE share URL from a message body. Used by the client when it
 * wants the abstracted notifier rather than hand-rolling the URL.
 */
export async function POST(req: Request) {
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (typeof message !== "string" || message.length === 0 || message.length > 1000) {
    return NextResponse.json({ error: "invalid message" }, { status: 400 });
  }
  const url = lineNotifier.buildShareUrl(message);
  return NextResponse.json({ url });
}
