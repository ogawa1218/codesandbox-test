import * as React from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  className?: string;
}

export function Stat({ label, value, hint, trend, className }: StatProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4",
        className,
      )}
    >
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>
      {hint != null ? (
        <div
          className={cn(
            "mt-1 text-xs",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-rose-400",
            !trend && "text-white/50",
          )}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
