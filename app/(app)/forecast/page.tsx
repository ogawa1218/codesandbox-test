import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/utils";
import { SalesEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { storeId } = await requireManager();
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
  const [{ data: sales }, { data: budgets }] = await Promise.all([
    supabase
      .from("sales_actuals")
      .select("business_date, amount, tax_included, tax_rate")
      .eq("store_id", storeId)
      .gte("business_date", startISO)
      .lte("business_date", endISO),
    supabase
      .from("daily_budgets")
      .select("business_date, amount")
      .eq("store_id", storeId)
      .gte("business_date", startISO)
      .lte("business_date", endISO),
  ]);

  const days: Array<{ date: string; budget: number; actual: number | null }> = [];
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    const iso = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const sale = sales?.find((s) => s.business_date === iso);
    const budget = budgets?.find((b) => b.business_date === iso);
    days.push({
      date: iso,
      budget: budget ? Number(budget.amount) : 0,
      actual: sale
        ? sale.tax_included
          ? Math.round(Number(sale.amount) / (1 + Number(sale.tax_rate)))
          : Number(sale.amount)
        : null,
    });
  }

  const totalBudget = days.reduce((a, b) => a + b.budget, 0);
  const totalActual = days.reduce((a, b) => a + (b.actual ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          予算 / 売上実績
        </h1>
        <p className="text-sm text-white/60">
          {monthStart.getFullYear()}年{monthStart.getMonth() + 1}月 — 月予算 {formatYen(totalBudget)} / 実績 {formatYen(totalActual)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>日別予算 + 実績入力</CardTitle>
          <CardDescription>
            金額は税込で入力。税抜換算とKPI再計算は自動で行われます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesEditor days={days} />
        </CardContent>
      </Card>
    </div>
  );
}
