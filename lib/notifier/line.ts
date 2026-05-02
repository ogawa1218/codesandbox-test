import "server-only";
import type { Notifier } from "./index";
import { admin } from "@/lib/supabase/admin";

/**
 * URL-scheme based LINE share. Composes a https://line.me/R/share?text=...
 * link that the user opens to forward the prefilled message.
 */
export const lineNotifier: Notifier = {
  buildShareUrl(message: string) {
    const text = encodeURIComponent(message);
    return `https://line.me/R/share?text=${text}`;
  },
  async enqueue({ userId, payload }) {
    await admin()
      .from("notification_outbox")
      .insert({ user_id: userId, channel: "line", payload: payload as never });
  },
};
