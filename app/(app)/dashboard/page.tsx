import { Stat } from "@/components/ui/stat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPct, formatYen } from "@/lib/utils";
import { DashboardChart } from "./chart";

export const dynamic = "force-dynamic";

type KpiRow = {
  sales_actual: number;
  sales_budget: number;
  labor_cost: number;
  labor_ratio: number;
};

export default async function DashboardPage() {
  const session = await requireManager();
  const supabase = await createClient();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: kpiRaw } = await supabase.rpc("kpi_monthly", {
    p_store: session.storeId,
    p_month: monthStart,
  });
  const kpi: KpiRow = (kpiRaw?.[0] as KpiRow | undefined) ?? {
    sales_actual: 0,
    sales_budget: 0,
    labor_cost: 0,
    labor_ratio: 0,
  };

  const achievement =
    Number(kpi.sales_budget) > 0
      ? Number(kpi.sales_actual) / Number(kpi.sales_budget)
      : 0;

  // Last 30-day trend
  const trendStart = new Date(today.getTime() - 29 * 86400_000)
    .toISOString()
    .slice(0, 10);
  const trendEnd = today.toISOString().slice(0, 10);
  const [{ data: sales }, { data: budgets }] = await Promise.all([
    supabase
      .from("sales_actuals")
      .select("business_date, amount, tax_included, tax_rate")
      .eq("store_id", session.storeId)
      .gte("business_date", trendStart)
      .lte("business_date", trendEnd)
      .order("business_date"),
    supabase
      .from("daily_budgets")
      .select("business_date, amount")
      .eq("store_id", session.storeId)
      .gte("business_date", trendStart)
      .lte("business_date", trendEnd),
  ]);

  const byDate = new Map<string, { actual: number; budget: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - (29 - i) * 86400_000)
      .toISOString()
      .slice(0, 10);
    byDate.set(d, { actual: 0, budget: 0 });
  }
  for (const row of sales ?? []) {
    const cur = byDate.get(row.business_date);
    if (!cur) continue;
    const net = row.tax_included
      ? Number(row.amount) / (1 + Number(row.tax_rate))
      : Number(row.amount);
    cur.actual += net;
  }
  for (const row of budgets ?? []) {
    const cur = byDate.get(row.business_date);
    if (cur) cur.budget += Number(row.amount);
  }
  const series = Array.from(byDate.entries()).map(([date, v]) => ({
    date: date.slice(5),
    actual: Math.round(v.actual),
    budget: v.budget,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          ダッシュボード
        </h1>
        <p className="text-sm text-white/60">
          {today.getFullYear()}年{today.getMonth() + 1}月の累計
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="売上(税抜)"
          value={formatYen(kpi.sales_actual)}
          hint={`予算 ${formatYen(kpi.sales_budget)}`}
        />
        <Stat
          label="予算達成率"
          value={formatPct(achievement)}
          hint={achievement >= 1 ? "達成" : "未達"}
          trend={achievement >= 1 ? "up" : "down"}
        />
        <Stat
          label="人件費"
          value={formatYen(kpi.labor_cost)}
          hint="シフト確定分のみ"
        />
        <Stat
          label="人件費比率"
          value={formatPct(kpi.labor_ratio)}
          hint={Number(kpi.labor_ratio) > 0.3 ? "目安超過" : "良好"}
          trend={Number(kpi.labor_ratio) > 0.3 ? "down" : "up"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>売上推移(直近30日)</CardTitle>
          <CardDescription>税抜換算 / 予算と並べて表示</CardDescription>
        </CardHeader>
        <CardContent className="h-72 px-3 pb-4">
          <DashboardChart data={series} />
        </CardContent>
      </Card>
    </div>
  );
}
