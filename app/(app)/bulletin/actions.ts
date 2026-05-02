"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { check } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/result";
import { announcementSchema } from "@/lib/schemas";

export async function postAnnouncement(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail({ code: "unauthorized", message: "サインインが必要です" });

  const rl = await check("write", user.id);
  if (!rl.ok) return fail({ code: "rate_limited", message: "操作回数が多すぎます" });

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  if (meta.role !== "manager" || !meta.store_id) {
    return fail({ code: "forbidden", message: "管理者のみ投稿できます" });
  }

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    image_path: formData.get("image_path") || undefined,
  });
  if (!parsed.success) return fail({ code: "validation", message: "入力を確認してください" });

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      store_id: meta.store_id as string,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      image_path: parsed.data.image_path ?? null,
    })
    .select("id")
    .single();
  if (error) return fail({ code: "unknown", message: error.message });

  revalidatePath("/bulletin");
  return ok({ id: data!.id });
}

export async function markRead(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail({ code: "unauthorized", message: "サインインが必要です" });

  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: id, user_id: user.id },
      { onConflict: "announcement_id,user_id" },
    );
  if (error) return fail({ code: "unknown", message: error.message });
  return ok(null);
}
