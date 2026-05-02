import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ShiftScheduler } from "./scheduler";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = x.getDay(); // Sun=0
  x.setDate(x.getDate() - diff);
  return x;
}

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { storeId } = await requireManager();
  const sp = await searchParams;
  const today = new Date();
  const weekStart = startOfWeek(sp.week ? new Date(sp.week) : today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startISO = weekStart.toISOString().slice(0, 10);
  const endISO = weekEnd.toISOString().slice(0, 10);

  const supabase = await createClient();
  const [employeesRes, positionsRes, shiftsRes] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("id, full_name, role")
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .order("full_name"),
    supabase
      .from("positions")
      .select("id, name, color")
      .eq("store_id", storeId)
      .eq("archived", false)
      .order("sort_order"),
    supabase
      .from("shifts")
      .select(
        "id, employee_id, position_id, business_date, starts_at, ends_at, status, note",
      )
      .eq("store_id", storeId)
      .gte("business_date", startISO)
      .lte("business_date", endISO)
      .order("starts_at"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            シフト
          </h1>
          <p className="text-sm text-white/60">
            {weekStart.toLocaleDateString("ja-JP")} 〜 {weekEnd.toLocaleDateString("ja-JP")}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>週次スケジュール</CardTitle>
          <CardDescription>
            セルをクリックでシフト追加。確定状態で重なりがあると拒否されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShiftScheduler
            weekStart={startISO}
            employees={(employeesRes.data ?? [])
              .filter(
                (e): e is { id: string; full_name: string | null; role: "manager" | "employee" | null } =>
                  typeof e.id === "string",
              )}
            positions={positionsRes.data ?? []}
            shifts={shiftsRes.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
