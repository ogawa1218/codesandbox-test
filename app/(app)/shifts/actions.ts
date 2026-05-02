"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { check } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/result";
import { shiftSchema } from "@/lib/schemas";

type ManagerCtx =
  | { err: "unauthorized" | "forbidden" }
  | {
      err?: undefined;
      user: { id: string };
      supabase: Awaited<ReturnType<typeof createClient>>;
      storeId: string;
    };

async function ctxManager(): Promise<ManagerCtx> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { err: "unauthorized" };
  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  if (meta.role !== "manager" || !meta.store_id) return { err: "forbidden" };
  return { user: { id: user.id }, supabase, storeId: meta.store_id as string };
}

export async function upsertShift(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await ctxManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });

  const rl = await check("write", ctx.user.id);
  if (!rl.ok) return fail({ code: "rate_limited", message: "操作回数が多すぎます" });

  const parsed = shiftSchema.safeParse(input);
  if (!parsed.success) {
    return fail({
      code: "validation",
      message: "入力を確認してください",
      fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
  }

  const v = parsed.data;
  const { data, error } = await ctx.supabase
    .from("shifts")
    .upsert(
      {
        id: v.id,
        store_id: ctx.storeId,
        employee_id: v.employee_id,
        position_id: v.position_id,
        business_date: v.business_date,
        starts_at: v.starts_at,
        ends_at: v.ends_at,
        status: v.status,
        note: v.note ?? null,
        client_request_id: v.client_request_id,
        created_by: ctx.user.id,
      },
      { onConflict: "store_id,client_request_id" },
    )
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return fail({ code: "conflict", message: "確定済みシフトと時間が重複しています" });
    }
    return fail({ code: "unknown", message: error.message });
  }
  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/my-shifts");
  return ok({ id: data!.id });
}

const idSchema = z.object({ id: z.string().uuid() });

export async function deleteShift(id: string): Promise<ActionResult<null>> {
  const ctx = await ctxManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return fail({ code: "validation", message: "id 不正" });
  const { error } = await ctx.supabase.from("shifts").delete().eq("id", id);
  if (error) return fail({ code: "unknown", message: error.message });
  revalidatePath("/shifts");
  revalidatePath("/my-shifts");
  return ok(null);
}

export async function confirmShift(id: string): Promise<ActionResult<null>> {
  const ctx = await ctxManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });
  const { error } = await ctx.supabase
    .from("shifts")
    .update({ status: "confirmed" })
    .eq("id", id);
  if (error) {
    if (error.code === "23P01") {
      return fail({ code: "conflict", message: "確定済みシフトと時間が重複しています" });
    }
    return fail({ code: "unknown", message: error.message });
  }
  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/my-shifts");
  return ok(null);
}
