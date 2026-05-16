"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  date: string;
  actual: number;
  budget: number;
}

export function DashboardChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.21 296)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="rgba(255,255,255,0.4)"
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          stroke="rgba(255,255,255,0.4)"
          fontSize={11}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(20,20,30,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v) => `¥${Math.round(Number(v)).toLocaleString("ja-JP")}`}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="oklch(0.78 0.18 200)"
          strokeWidth={2}
          fill="url(#sales)"
          name="売上(税抜)"
        />
        <Line
          type="monotone"
          dataKey="budget"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          strokeDasharray="4 4"
          dot={false}
          name="予算"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
