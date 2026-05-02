import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  const role = (meta.role as "manager" | "employee" | undefined) ?? "employee";
  const storeId = meta.store_id as string | undefined;

  if (role === "manager" && !storeId) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles_public")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const { data: store } = storeId
    ? await supabase.from("stores").select("name").eq("id", storeId).maybeSingle()
    : { data: null };

  const managerNav: Array<{ href: string; label: string }> = [
    { href: "/dashboard", label: "ダッシュボード" },
    { href: "/forecast", label: "予算 / 予測" },
    { href: "/shifts", label: "シフト" },
    { href: "/bulletin", label: "掲示板" },
    { href: "/settings", label: "設定" },
  ];
  const employeeNav: Array<{ href: string; label: string }> = [
    { href: "/my-shifts", label: "マイシフト" },
    { href: "/bulletin", label: "掲示板" },
  ];
  const nav = role === "manager" ? managerNav : employeeNav;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-md shadow-violet-500/40">
            <span className="text-sm font-bold text-white">PL</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-white/50">{store?.name ?? "店舗 PL"}</div>
            <div className="text-sm font-medium text-white">
              {profile?.full_name ?? user.email}
            </div>
          </div>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                ログアウト
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
