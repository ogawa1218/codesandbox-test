import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LineShareButton } from "./line-share";

export const dynamic = "force-dynamic";

export default async function MyShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;
  const today = new Date();
  const monthIso =
    sp.month ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthStart = new Date(monthIso);
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  );
  const startISO = monthStart.toISOString().slice(0, 10);
  const endISO = monthEnd.toISOString().slice(0, 10);

  const supabase = await createClient();
  const [{ data: shifts }, { data: positions }] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, position_id, business_date, starts_at, ends_at, status")
      .eq("employee_id", session.userId)
      .gte("business_date", startISO)
      .lte("business_date", endISO)
      .order("starts_at"),
    supabase.from("positions").select("id, name, color"),
  ]);

  const positionMap = new Map((positions ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          マイシフト
        </h1>
        <p className="text-sm text-white/60">
          {monthStart.getFullYear()}年{monthStart.getMonth() + 1}月
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>今月の予定</CardTitle>
          <CardDescription>確定済みのシフトには ✓ がつきます</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {(shifts ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-white/50">
              シフトはまだ登録されていません。
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {(shifts ?? []).map((s) => {
                const pos = positionMap.get(s.position_id);
                const start = new Date(s.starts_at);
                const end = new Date(s.ends_at);
                const range = `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
                const dt = new Date(s.business_date + "T00:00:00+09:00");
                const dow = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-3"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: pos?.color ?? "#7c3aed" }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-white">
                        {s.business_date.slice(5)}({dow}) {range}
                      </span>
                      <span className="text-[11px] text-white/50">
                        {pos?.name ?? "—"}
                      </span>
                    </div>
                    {s.status === "confirmed" ? (
                      <span className="ml-auto rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">
                        確定
                      </span>
                    ) : (
                      <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                        仮
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <LineShareButton
        shifts={(shifts ?? []).map((s) => {
          const pos = positionMap.get(s.position_id);
          return {
            date: s.business_date,
            label: pos?.name ?? "",
            range: `${s.starts_at.slice(11, 16)}-${s.ends_at.slice(11, 16)}`,
          };
        })}
      />
    </div>
  );
}
