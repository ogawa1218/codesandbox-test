import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  const role = (meta.role as string | undefined) ?? "employee";
  const storeId = meta.store_id as string | undefined;

  if (role === "manager" && !storeId) redirect("/onboarding");
  redirect(role === "manager" ? "/dashboard" : "/my-shifts");
}
