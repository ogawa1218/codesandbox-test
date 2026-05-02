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
}

export function SalesEditor({ days }: { days: Day[] }) {
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Day[]>(days);

  const submit = (date: string, key: "budget" | "actual", value: string) => {
    const fd = new FormData();
    fd.set("business_date", date);
    fd.set(key, value);
    fd.set("tax_included", "true");
    fd.set("tax_rate", "0.10");
    start(async () => {
      const r = await saveDayBudgetAndSales(fd);
      if (!r.ok) {
        toast.error(r.error.message);
      } else {
        toast.success(`${date} を保存しました`);
      }
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-white/50">
            <th className="px-2 py-2 font-medium">日付</th>
            <th className="px-2 py-2 font-medium">曜日</th>
            <th className="px-2 py-2 font-medium">予算 (税込)</th>
            <th className="px-2 py-2 font-medium">実績 (税込)</th>
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
                <td className="px-2 py-2 text-white">
                  {row.date.slice(8)}
                </td>
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
                    onBlur={(e) => {
                      const v = Number(e.target.value || 0);
                      if (v !== row.budget) {
                        submit(row.date, "budget", String(v));
                        const next = [...rows];
                        next[idx] = { ...row, budget: v };
                        setRows(next);
                      }
                    }}
                    disabled={pending}
                    className="h-8 max-w-[140px]"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    defaultValue={row.actual ?? ""}
                    placeholder="0"
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      if (v !== row.actual) {
                        if (v != null) submit(row.date, "actual", String(v));
                        const next = [...rows];
                        next[idx] = { ...row, actual: v };
                        setRows(next);
                      }
                    }}
                    disabled={pending}
                    className="h-8 max-w-[140px]"
                  />
                </td>
                <td className="px-2 py-2 text-white/70">
                  {ratio != null ? (
                    <span className={ratio >= 100 ? "text-emerald-300" : "text-rose-300"}>
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
            <td colSpan={2} className="px-2 py-3 font-medium">合計</td>
            <td className="px-2 py-3">
              {formatYen(rows.reduce((a, b) => a + b.budget, 0))}
            </td>
            <td className="px-2 py-3">
              {formatYen(rows.reduce((a, b) => a + (b.actual ?? 0), 0))}
            </td>
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
