import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PositionsManager } from "./positions-manager";
import { InviteForm } from "./invite-form";
import { EmployeesList } from "./employees-list";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { storeId } = await requireManager();
  const supabase = await createClient();

  const [positionsRes, employeesRes, invitesRes] = await Promise.all([
    supabase
      .from("positions")
      .select("id, name, color, sort_order, archived")
      .eq("store_id", storeId)
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("id, full_name, role, license, hourly_wage, created_at, deleted_at")
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .order("full_name"),
    supabase
      .from("invitations")
      .select("id, full_name, role, hourly_wage, token, expires_at, consumed_at")
      .eq("store_id", storeId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">設定</h1>
        <p className="text-sm text-white/60">ポジション・従業員・招待リンクの管理</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>ポジション</CardTitle>
          <CardDescription>シフト割当に使う役割を管理します。</CardDescription>
        </CardHeader>
        <CardContent>
          <PositionsManager initial={positionsRes.data ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>従業員</CardTitle>
          <CardDescription>{(employeesRes.data ?? []).length} 名</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeesList employees={employeesRes.data ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>招待リンク</CardTitle>
          <CardDescription>
            URL を共有することで従業員アカウントを作成できます(7日間有効)。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InviteForm />
          {(invitesRes.data ?? []).length === 0 ? (
            <p className="text-xs text-white/50">未使用の招待はありません。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(invitesRes.data ?? []).map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/2 p-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-white">{inv.full_name}</div>
                    <div className="text-xs text-white/50">
                      {inv.role} / 期限 {new Date(inv.expires_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <code className="rounded-md bg-black/40 px-2 py-1 text-[11px] text-white/80">
                    /signup?token={inv.token.slice(0, 12)}…
                  </code>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
