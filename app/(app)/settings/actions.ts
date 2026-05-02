"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { check } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/result";
import { positionSchema, inviteSchema } from "@/lib/schemas";

type ManagerCtx =
  | { err: "unauthorized" | "forbidden" }
  | {
      err?: undefined;
      user: { id: string };
      storeId: string;
      supabase: Awaited<ReturnType<typeof createClient>>;
    };

async function requireManager(): Promise<ManagerCtx> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { err: "unauthorized" };

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  const role = meta.role as string | undefined;
  const storeId = meta.store_id as string | undefined;
  if (role !== "manager" || !storeId) return { err: "forbidden" };
  return { user: { id: user.id }, storeId, supabase };
}

export async function savePosition(formData: FormData): Promise<ActionResult<null>> {
  const ctx = await requireManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });

  const rl = await check("write", ctx.user.id);
  if (!rl.ok) return fail({ code: "rate_limited", message: "操作回数が多すぎます" });

  const parsed = positionSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    color: formData.get("color") ?? "#7c3aed",
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (!parsed.success) {
    return fail({ code: "validation", message: "入力を確認してください" });
  }

  if (parsed.data.id) {
    const { error } = await ctx.supabase
      .from("positions")
      .update({
        name: parsed.data.name,
        color: parsed.data.color,
        sort_order: parsed.data.sort_order,
      })
      .eq("id", parsed.data.id);
    if (error) return fail({ code: "unknown", message: error.message });
  } else {
    const { error } = await ctx.supabase.from("positions").insert({
      store_id: ctx.storeId,
      name: parsed.data.name,
      color: parsed.data.color,
      sort_order: parsed.data.sort_order,
    });
    if (error) return fail({ code: "unknown", message: error.message });
  }
  revalidatePath("/settings");
  revalidatePath("/shifts");
  return ok(null);
}

export async function archivePosition(id: string): Promise<ActionResult<null>> {
  const ctx = await requireManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });
  const { error } = await ctx.supabase
    .from("positions")
    .update({ archived: true })
    .eq("id", id);
  if (error) return fail({ code: "unknown", message: error.message });
  revalidatePath("/settings");
  return ok(null);
}

export async function inviteEmployee(formData: FormData): Promise<ActionResult<{ token: string; url: string }>> {
  const ctx = await requireManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });

  const rl = await check("write", ctx.user.id);
  if (!rl.ok) return fail({ code: "rate_limited", message: "操作回数が多すぎます" });

  const parsed = inviteSchema.safeParse({
    full_name: formData.get("full_name"),
    role: formData.get("role") ?? "employee",
    hourly_wage: formData.get("hourly_wage")
      ? Number(formData.get("hourly_wage"))
      : null,
    email: formData.get("email") || null,
  });
  if (!parsed.success) {
    return fail({ code: "validation", message: "入力を確認してください" });
  }

  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 7 * 86400_000).toISOString();
  const { error } = await admin().from("invitations").insert({
    store_id: ctx.storeId,
    invited_by: ctx.user.id,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    hourly_wage: parsed.data.hourly_wage ?? null,
    email: parsed.data.email ?? null,
    token,
    expires_at: expires,
  });
  if (error) return fail({ code: "unknown", message: error.message });

  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";
  revalidatePath("/settings");
  return ok({ token, url: `${origin}/signup?token=${token}` });
}

const wageSchema = z.object({
  id: z.string().uuid(),
  hourly_wage: z.coerce.number().min(0).max(99_999),
});

export async function updateWage(formData: FormData): Promise<ActionResult<null>> {
  const ctx = await requireManager();
  if (ctx.err) return fail({ code: ctx.err, message: "権限がありません" });
  const parsed = wageSchema.safeParse({
    id: formData.get("id"),
    hourly_wage: formData.get("hourly_wage"),
  });
  if (!parsed.success) return fail({ code: "validation", message: "入力を確認してください" });
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ hourly_wage: parsed.data.hourly_wage })
    .eq("id", parsed.data.id);
  if (error) return fail({ code: "unknown", message: error.message });
  revalidatePath("/settings");
  return ok(null);
}
