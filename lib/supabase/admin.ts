import "server-only";
import { createClient as createSupaClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let _admin: ReturnType<typeof createSupaClient<Database>> | null = null;

export function admin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Missing Supabase admin credentials");
  }
  _admin = createSupaClient<Database>(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
