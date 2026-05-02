"use server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { check } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/result";

const upsertSchema = z
  .object({
    business_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    budget: z.coerce.number().int().min(0).max(999_999_999_999).optional(),
    actual: z.coerce.number().int().min(0).max(999_999_999_999).optional(),
    tax_included: z.coerce.boolean().default(true),
    tax_rate: z.coerce.number().min(0).max(0.5).default(0.1),
  })
  .strict();

export async function saveDayBudgetAndSales(
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = upsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail({ code: "validation", message: "入力を確認してください" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail({ code: "unauthorized", message: "サインインが必要です" });

  const h = await headers();
  const rl = await check("write", user.id);
  if (!rl.ok) return fail({ code: "rate_limited", message: "操作回数が多すぎます" });
  void h;

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  const storeId = meta.store_id as string | undefined;
  if (!storeId) return fail({ code: "forbidden", message: "店舗が未設定です" });

  if (parsed.data.budget != null) {
    const { error } = await supabase.from("daily_budgets").upsert(
      {
        store_id: storeId,
        business_date: parsed.data.business_date,
        amount: parsed.data.budget,
      },
      { onConflict: "store_id,business_date" },
    );
    if (error) return fail({ code: "unknown", message: error.message });
  }

  if (parsed.data.actual != null) {
    const { error } = await supabase.from("sales_actuals").upsert(
      {
        store_id: storeId,
        business_date: parsed.data.business_date,
        amount: parsed.data.actual,
        tax_included: parsed.data.tax_included,
        tax_rate: parsed.data.tax_rate,
        updated_by: user.id,
      },
      { onConflict: "store_id,business_date" },
    );
    if (error) return fail({ code: "unknown", message: error.message });
  }

  revalidateTag("kpi");
  revalidateTag("sales");
  return ok(null);
}
