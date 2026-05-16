import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppClaims = {
  role: "manager" | "employee";
  store_id: string | null;
};

export type SessionContext = {
  userId: string;
  email: string | null;
  claims: AppClaims;
};

/**
 * Reads the verified user via getUser() (NOT getSession()) and the app_metadata
 * claims injected by the custom_access_token_hook. Throws redirect on failure.
 */
export async function requireUser(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claimsRes } = await supabase.auth.getClaims();
  const meta =
    (claimsRes?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};

  return {
    userId: user.id,
    email: user.email ?? null,
    claims: {
      role: (meta.role as "manager" | "employee" | undefined) ?? "employee",
      store_id: (meta.store_id as string | undefined) ?? null,
    },
  };
}

export async function requireManager(): Promise<SessionContext & { storeId: string }> {
  const session = await requireUser();
  if (session.claims.role !== "manager") redirect("/my-shifts");
  if (!session.claims.store_id) redirect("/onboarding");
  return { ...session, storeId: session.claims.store_id };
}
