"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatYen } from "@/lib/utils";
import { saveDayBudgetAndSales } from "./actions";
import { toast } from "sonner";

interface Day {
  date: string;
  budget: number;
  actual: number | null;
  dispensing: number;
  otc: number;
  cosmetics: number;
  food: number;
  rxCount: number;
}

type SalesField = "dispensing" | "otc" | "cosmetics" | "food" | "rxCount";

export function SalesEditor({ days }: { days: Day[] }) {
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Day[]>(days);

  const submitBudget = (date: string, value: number) => {
    const fd = new FormData();
    fd.set("business_date", date);
    fd.set("budget", String(value));
    start(async () => {
      const r = await saveDayBudgetAndSales(fd);
      if (r.ok) toast.success(`${date} 予算を保存`);
      else toast.error(r.error.message);
    });
  };

  // Sales fields share one row; persist the whole group together so the
  // sales_actuals upsert never wipes a sibling column.
  const submitSales = (row: Day) => {
    const fd = new FormData();
    fd.set("business_date", row.date);
    fd.set("actual", String(row.actual ?? 0));
    fd.set("amount_dispensing", String(row.dispensing));
    fd.set("amount_otc", String(row.otc));
    fd.set("amount_cosmetics", String(row.cosmetics));
    fd.set("amount_food", String(row.food));
    fd.set("rx_count", String(row.rxCount));
    fd.set("tax_included", "true");
    fd.set("tax_rate", "0.10");
    start(async () => {
      const r = await saveDayBudgetAndSales(fd);
      if (r.ok) toast.success(`${row.date} 実績を保存`);
      else toast.error(r.error.message);
    });
  };

  const numCell = (
    row: Day,
    idx: number,
    field: "actual" | SalesField,
    width = "max-w-[120px]",
  ) => (
    <Input
      type="number"
      inputMode="numeric"
      defaultValue={
        field === "actual"
          ? (row.actual ?? "")
          : row[field] || ""
      }
      placeholder="0"
      disabled={pending}
      className={`h-8 ${width}`}
      onBlur={(e) => {
        const raw = e.target.value;
        const v = field === "actual" && raw === "" ? null : Number(raw || 0);
        const cur = field === "actual" ? row.actual : row[field];
        if (v === cur) return;
        const next = [...rows];
        const updated = { ...row, [field]: v ?? 0 } as Day;
        if (field === "actual") updated.actual = v;
        next[idx] = updated;
        setRows(next);
        submitSales(updated);
      }}
    />
  );

  const sum = (k: SalesField | "budget" | "actual") =>
    rows.reduce((a, b) => a + (Number(b[k] ?? 0) || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-white/50">
            <th className="px-2 py-2 font-medium">日</th>
            <th className="px-2 py-2 font-medium">曜</th>
            <th className="px-2 py-2 font-medium">予算</th>
            <th className="px-2 py-2 font-medium">実績合計</th>
            <th className="px-2 py-2 font-medium">調剤</th>
            <th className="px-2 py-2 font-medium">OTC</th>
            <th className="px-2 py-2 font-medium">化粧品</th>
            <th className="px-2 py-2 font-medium">食品</th>
            <th className="px-2 py-2 font-medium">処方箋枚数</th>
            <th className="px-2 py-2 font-medium">達成率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const d = new Date(row.date + "T00:00:00+09:00");
            const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
            const ratio =
              row.budget > 0 && row.actual != null
                ? (row.actual / row.budget) * 100
                : null;
            return (
              <tr
                key={row.date}
                className="border-t border-white/5 hover:bg-white/2.5"
              >
                <td className="px-2 py-2 text-white">{row.date.slice(8)}</td>
                <td
                  className={
                    dow === "日"
                      ? "px-2 py-2 text-rose-300"
                      : dow === "土"
                        ? "px-2 py-2 text-cyan-300"
                        : "px-2 py-2 text-white/60"
                  }
                >
                  {dow}
                </td>
                <td className="px-2 py-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    defaultValue={row.budget || ""}
                    placeholder="0"
                    disabled={pending}
                    className="h-8 max-w-[120px]"
                    onBlur={(e) => {
                      const v = Number(e.target.value || 0);
                      if (v === row.budget) return;
                      const next = [...rows];
                      next[idx] = { ...row, budget: v };
                      setRows(next);
                      submitBudget(row.date, v);
                    }}
                  />
                </td>
                <td className="px-2 py-1">{numCell(row, idx, "actual")}</td>
                <td className="px-2 py-1">{numCell(row, idx, "dispensing", "max-w-[110px]")}</td>
                <td className="px-2 py-1">{numCell(row, idx, "otc", "max-w-[110px]")}</td>
                <td className="px-2 py-1">{numCell(row, idx, "cosmetics", "max-w-[110px]")}</td>
                <td className="px-2 py-1">{numCell(row, idx, "food", "max-w-[110px]")}</td>
                <td className="px-2 py-1">{numCell(row, idx, "rxCount", "max-w-[90px]")}</td>
                <td className="px-2 py-2">
                  {ratio != null ? (
                    <span
                      className={
                        ratio >= 100 ? "text-emerald-300" : "text-rose-300"
                      }
                    >
                      {ratio.toFixed(0)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10 text-white/70">
            <td colSpan={2} className="px-2 py-3 font-medium">
              合計
            </td>
            <td className="px-2 py-3">{formatYen(sum("budget"))}</td>
            <td className="px-2 py-3">{formatYen(sum("actual"))}</td>
            <td className="px-2 py-3">{formatYen(sum("dispensing"))}</td>
            <td className="px-2 py-3">{formatYen(sum("otc"))}</td>
            <td className="px-2 py-3">{formatYen(sum("cosmetics"))}</td>
            <td className="px-2 py-3">{formatYen(sum("food"))}</td>
            <td className="px-2 py-3">{sum("rxCount").toLocaleString("ja-JP")}枚</td>
            <td className="px-2 py-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => location.reload()}
              >
                再読込
              </Button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
