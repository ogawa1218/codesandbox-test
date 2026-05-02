"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { onboardingSchema } from "@/lib/schemas";
import { fail, type ActionResult } from "@/lib/result";

export async function setupStore(
  formData: FormData,
): Promise<ActionResult<null> | void> {
  const parsed = onboardingSchema.safeParse({
    store_name: formData.get("store_name"),
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return fail({ code: "validation", message: "入力を確認してください" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail({ code: "unauthorized", message: "サインインが必要です" });

  const sa = admin();
  const { data: store, error: e1 } = await sa
    .from("stores")
    .insert({ name: parsed.data.store_name })
    .select("id")
    .single();
  if (e1 || !store) {
    return fail({ code: "unknown", message: "店舗の作成に失敗しました" });
  }

  const { error: e2 } = await sa
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: parsed.data.full_name,
      role: "manager",
      store_id: store.id,
    });
  if (e2) {
    return fail({ code: "unknown", message: "プロフィールの作成に失敗しました" });
  }

  // Refresh JWT so the new claim is reflected.
  await supabase.auth.refreshSession();
  redirect("/dashboard");
}
