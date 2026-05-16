"use client";
import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertShift, deleteShift, confirmShift, moveShift } from "./actions";
import { formatYen } from "@/lib/utils";
import { toast } from "sonner";

interface Employee {
  id: string;
  full_name: string | null;
  role: "manager" | "employee" | null;
  hourly_wage: number | null;
}
interface Position {
  id: string;
  name: string;
  color: string;
}
interface Shift {
  id: string;
  employee_id: string;
  position_id: string;
  business_date: string;
  starts_at: string;
  ends_at: string;
  status: "draft" | "confirmed" | "canceled";
  note: string | null;
}

const DAY_MS = 86_400_000;

function hoursOf(s: Shift) {
  return (Date.parse(s.ends_at) - Date.parse(s.starts_at)) / 3_600_000;
}

export function ShiftScheduler({
  weekStart,
  employees,
  positions,
  shifts: initialShifts,
}: {
  weekStart: string;
  employees: Employee[];
  positions: Position[];
  shifts: Shift[];
}) {
  const [shifts, setShifts] = useState(initialShifts);
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<{
    employeeId: string;
    date: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const dates = useMemo(() => {
    const arr: string[] = [];
    const base = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, [weekStart]);

  const positionMap = useMemo(
    () => Object.fromEntries(positions.map((p) => [p.id, p])),
    [positions],
  );
  const wageMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.hourly_wage ?? 0])),
    [employees],
  );

  function shiftsFor(employeeId: string, date: string) {
    return shifts.filter(
      (s) => s.employee_id === employeeId && s.business_date === date,
    );
  }

  // Weekly hours / labor cost per employee (canceled shifts excluded).
  const laborByEmployee = useMemo(() => {
    const m = new Map<string, { hours: number; cost: number }>();
    for (const e of employees) m.set(e.id, { hours: 0, cost: 0 });
    for (const s of shifts) {
      if (s.status === "canceled") continue;
      const cur = m.get(s.employee_id);
      if (!cur) continue;
      const h = hoursOf(s);
      cur.hours += h;
      cur.cost += h * (wageMap[s.employee_id] ?? 0);
    }
    return m;
  }, [shifts, employees, wageMap]);

  const weekTotal = useMemo(() => {
    let hours = 0;
    let cost = 0;
    for (const v of laborByEmployee.values()) {
      hours += v.hours;
      cost += v.cost;
    }
    return { hours, cost };
  }, [laborByEmployee]);

  async function persist(input: {
    id?: string;
    employee_id: string;
    position_id: string;
    business_date: string;
    starts_at: string;
    ends_at: string;
    note: string | null;
  }) {
    const requestId = crypto.randomUUID();
    const optimistic: Shift = {
      id: input.id ?? requestId,
      employee_id: input.employee_id,
      position_id: input.position_id,
      business_date: input.business_date,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      status: "draft",
      note: input.note,
    };
    setShifts((s) => [...s.filter((x) => x.id !== optimistic.id), optimistic]);

    const r = await upsertShift({
      id: input.id,
      employee_id: input.employee_id,
      position_id: input.position_id,
      business_date: input.business_date,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      status: "draft",
      note: input.note ?? null,
      client_request_id: requestId,
    });
    if (!r.ok) {
      toast.error(r.error.message);
      setShifts((s) => s.filter((x) => x.id !== optimistic.id));
    } else {
      toast.success("シフトを保存しました");
      setShifts((s) =>
        s.map((x) => (x.id === optimistic.id ? { ...x, id: r.data.id } : x)),
      );
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const shiftId = String(e.active.id);
    const [targetEmp, targetDate] = String(e.over.id).split("|");
    if (!targetEmp || !targetDate) return;
    const moved = shifts.find((s) => s.id === shiftId);
    if (!moved) return;
    if (moved.employee_id === targetEmp && moved.business_date === targetDate) {
      return;
    }

    const diffDays =
      (Date.parse(targetDate) - Date.parse(moved.business_date)) / DAY_MS;
    const newStarts = new Date(
      Date.parse(moved.starts_at) + diffDays * DAY_MS,
    ).toISOString();
    const newEnds = new Date(
      Date.parse(moved.ends_at) + diffDays * DAY_MS,
    ).toISOString();

    const prev = shifts;
    setShifts((s) =>
      s.map((x) =>
        x.id === shiftId
          ? {
              ...x,
              employee_id: targetEmp,
              business_date: targetDate,
              starts_at: newStarts,
              ends_at: newEnds,
            }
          : x,
      ),
    );
    start(async () => {
      const r = await moveShift({
        id: shiftId,
        employee_id: targetEmp,
        business_date: targetDate,
        starts_at: newStarts,
        ends_at: newEnds,
      });
      if (!r.ok) {
        toast.error(r.error.message);
        setShifts(prev);
      } else {
        toast.success("シフトを移動しました");
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] table-fixed text-sm">
          <thead>
            <tr>
              <th className="w-40 px-2 py-2 text-left text-xs uppercase tracking-wider text-white/50">
                従業員
              </th>
              {dates.map((d) => {
                const dt = new Date(d + "T00:00:00+09:00");
                const dow = ["日", "月", "火", "水", "木", "金", "土"][
                  dt.getDay()
                ];
                return (
                  <th
                    key={d}
                    className="px-2 py-2 text-center text-xs font-medium text-white/70"
                  >
                    <div>{d.slice(5)}</div>
                    <div
                      className={
                        dow === "日"
                          ? "text-rose-300"
                          : dow === "土"
                            ? "text-cyan-300"
                            : "text-white/50"
                      }
                    >
                      {dow}
                    </div>
                  </th>
                );
              })}
              <th className="w-32 px-2 py-2 text-right text-xs uppercase tracking-wider text-white/50">
                人件費(週)
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const labor = laborByEmployee.get(emp.id) ?? {
                hours: 0,
                cost: 0,
              };
              return (
                <tr key={emp.id} className="border-t border-white/5">
                  <td className="px-2 py-2 text-white">{emp.full_name}</td>
                  {dates.map((d) => (
                    <DayCell key={d} employeeId={emp.id} date={d}>
                      {shiftsFor(emp.id, d).map((s) => (
                        <ShiftChip
                          key={s.id}
                          shift={s}
                          position={positionMap[s.position_id]}
                          disabled={pending}
                          onConfirm={() =>
                            start(async () => {
                              const r = await confirmShift(s.id);
                              if (r.ok) {
                                setShifts((arr) =>
                                  arr.map((x) =>
                                    x.id === s.id
                                      ? { ...x, status: "confirmed" }
                                      : x,
                                  ),
                                );
                                toast.success("確定しました");
                              } else toast.error(r.error.message);
                            })
                          }
                          onDelete={() =>
                            start(async () => {
                              const r = await deleteShift(s.id);
                              if (r.ok) {
                                setShifts((arr) =>
                                  arr.filter((x) => x.id !== s.id),
                                );
                                toast.success("削除しました");
                              } else toast.error(r.error.message);
                            })
                          }
                        />
                      ))}
                      {editing?.employeeId === emp.id &&
                      editing.date === d ? (
                        <ShiftCellForm
                          employeeId={emp.id}
                          date={d}
                          positions={positions}
                          onCancel={() => setEditing(null)}
                          onSubmit={async (v) => {
                            await persist(v);
                            setEditing(null);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className="rounded-md border border-dashed border-white/10 py-1 text-[11px] text-white/40 hover:border-white/30 hover:text-white/80"
                          onClick={() =>
                            setEditing({ employeeId: emp.id, date: d })
                          }
                          disabled={pending}
                        >
                          + 追加
                        </button>
                      )}
                    </DayCell>
                  ))}
                  <td className="px-2 py-2 text-right align-top">
                    <div className="text-white/90">{formatYen(labor.cost)}</div>
                    <div className="text-[11px] text-white/40">
                      {labor.hours.toFixed(1)}h
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-white/70">
              <td colSpan={8} className="px-2 py-3 text-right font-medium">
                週合計
              </td>
              <td className="px-2 py-3 text-right">
                <div className="text-white">{formatYen(weekTotal.cost)}</div>
                <div className="text-[11px] text-white/40">
                  {weekTotal.hours.toFixed(1)}h
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DndContext>
  );
}

function DayCell({
  employeeId,
  date,
  children,
}: {
  employeeId: string;
  date: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${employeeId}|${date}`,
  });
  return (
    <td
      ref={setNodeRef}
      className={`border-l border-white/5 align-top px-1 py-1 ${
        isOver ? "bg-violet-500/15" : ""
      }`}
    >
      <div className="flex flex-col gap-1">{children}</div>
    </td>
  );
}

function ShiftChip({
  shift,
  position,
  disabled,
  onConfirm,
  onDelete,
}: {
  shift: Shift;
  position?: Position;
  disabled: boolean;
  onConfirm: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: shift.id,
  });
  const startAt = new Date(shift.starts_at);
  const endAt = new Date(shift.ends_at);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const range = `${pad(startAt.getHours())}:${pad(startAt.getMinutes())}-${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`;
  const color = position?.color ?? "#7c3aed";
  return (
    <div
      className={`flex items-center justify-between gap-1 rounded-lg px-2 py-1 text-[11px] ${
        isDragging ? "opacity-40" : ""
      }`}
      style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
    >
      <span
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex-1 cursor-grab text-white/90 active:cursor-grabbing"
        aria-label={`${position?.name ?? "シフト"} ${range} をドラッグして移動`}
      >
        {position?.name ?? "?"} {range}
        {shift.status === "confirmed" ? (
          <span className="ml-1 rounded bg-emerald-500/20 px-1 text-[10px] text-emerald-300">
            確定
          </span>
        ) : null}
      </span>
      <div className="flex">
        {shift.status !== "confirmed" ? (
          <button
            type="button"
            className="text-emerald-300 hover:text-emerald-200"
            disabled={disabled}
            onClick={onConfirm}
            aria-label="確定"
          >
            ✓
          </button>
        ) : null}
        <button
          type="button"
          className="ml-1 text-rose-300 hover:text-rose-200"
          disabled={disabled}
          onClick={onDelete}
          aria-label="削除"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ShiftCellForm({
  employeeId,
  date,
  positions,
  onCancel,
  onSubmit,
}: {
  employeeId: string;
  date: string;
  positions: Position[];
  onCancel: () => void;
  onSubmit: (v: {
    employee_id: string;
    position_id: string;
    business_date: string;
    starts_at: string;
    ends_at: string;
    note: null;
  }) => void;
}) {
  const [positionId, setPositionId] = useState(positions[0]?.id ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!positionId) return;
        const starts_at = new Date(
          `${date}T${startTime}:00+09:00`,
        ).toISOString();
        const ends_at = new Date(`${date}T${endTime}:00+09:00`).toISOString();
        onSubmit({
          employee_id: employeeId,
          position_id: positionId,
          business_date: date,
          starts_at,
          ends_at,
          note: null,
        });
      }}
      className="flex flex-col gap-1 rounded-md border border-white/15 bg-white/5 p-1"
    >
      <select
        value={positionId}
        onChange={(e) => setPositionId(e.target.value)}
        className="h-7 rounded-md bg-black/40 px-2 text-[11px] text-white"
      >
        {positions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="h-7 px-1 text-[11px]"
          step={900}
        />
        <span className="text-white/40">-</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="h-7 px-1 text-[11px]"
          step={900}
        />
      </div>
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-7 flex-1 text-[11px]">
          保存
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[11px]"
          onClick={onCancel}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
