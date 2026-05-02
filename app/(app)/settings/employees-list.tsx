"use client";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { updateWage } from "./actions";
import { toast } from "sonner";
import { formatYen } from "@/lib/utils";

interface Employee {
  id: string;
  full_name: string;
  role: "manager" | "employee";
  hourly_wage: number | null;
  created_at: string;
  deleted_at: string | null;
}

export function EmployeesList({ employees }: { employees: Employee[] }) {
  const [pending, start] = useTransition();
  if (employees.length === 0) {
    return <p className="text-xs text-white/50">まだ従業員が登録されていません。</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {employees.map((emp) => (
        <li key={emp.id} className="flex items-center gap-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-medium text-white">
            {emp.full_name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white">{emp.full_name}</div>
            <div className="text-[11px] uppercase tracking-wider text-white/50">
              {emp.role}
            </div>
          </div>
          <label className="text-xs text-white/60">時給</label>
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={emp.hourly_wage ?? ""}
            placeholder={emp.hourly_wage == null ? "未設定" : ""}
            className="h-8 max-w-[120px]"
            onBlur={(e) => {
              const v = Number(e.target.value || 0);
              if (v !== emp.hourly_wage) {
                const fd = new FormData();
                fd.set("id", emp.id);
                fd.set("hourly_wage", String(v));
                start(async () => {
                  const r = await updateWage(fd);
                  if (!r.ok) toast.error(r.error.message);
                  else toast.success(`時給を ${formatYen(v)} に更新`);
                });
              }
            }}
            disabled={pending}
          />
        </li>
      ))}
    </ul>
  );
}
