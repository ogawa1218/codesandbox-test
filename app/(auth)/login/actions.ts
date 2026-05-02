"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { check } from "@/lib/rate-limit";
import { fail, type ActionResult } from "@/lib/result";
import { safeNext } from "@/lib/utils";

const loginSchema = z
  .object({
    email: z.string().email().max(160),
    password: z.string().min(8).max(200),
  })
  .strict();

export async function signIn(
  formData: FormData,
  next: string | null,
): Promise<ActionResult<null> | void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fail({
      code: "validation",
      message: "入力を確認してください",
      fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await check("login", ip);
  if (!rl.ok) {
    return fail({
      code: "rate_limited",
      message: "試行回数が多すぎます。しばらくしてから再度お試しください。",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return fail({
      code: "unauthorized",
      message: "メールアドレスまたはパスワードが正しくありません",
    });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? `https://${h.get("host") ?? "localhost"}`;
  redirect(safeNext(next, origin));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
