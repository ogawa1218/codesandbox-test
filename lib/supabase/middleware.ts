import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Refreshes the Supabase session cookies and returns:
 * - response: NextResponse with refreshed cookies
 * - user: the authenticated user (verified via getUser, NOT getSession)
 * - claims: app_metadata claims (role, store_id) injected by the Auth Hook
 */
export async function updateSession(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value } of toSet) {
            req.cookies.set(name, value);
          }
          response = NextResponse.next({ request: req });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options as CookieOptions);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let claims: { role?: "manager" | "employee"; store_id?: string } = {};
  if (user) {
    const { data } = await supabase.auth.getClaims();
    const meta =
      (data?.claims as { app_metadata?: Record<string, unknown> } | null)
        ?.app_metadata ?? {};
    claims = {
      role: meta.role as "manager" | "employee" | undefined,
      store_id: meta.store_id as string | undefined,
    };
  }

  return { response, user, claims };
}
