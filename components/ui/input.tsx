import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...rest }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40",
        "focus-visible:outline-none focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/30",
        "disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40",
        "focus-visible:outline-none focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/30",
        className,
      )}
      {...rest}
    />
  );
});

export function Label({ className, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-xs font-medium text-white/70", className)}
      {...rest}
    />
  );
}
