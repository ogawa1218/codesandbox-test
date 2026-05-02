import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/30 hover:opacity-95 active:opacity-90",
  secondary:
    "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
  ghost: "bg-transparent text-white/80 hover:bg-white/5 hover:text-white",
  danger:
    "bg-rose-500/90 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      />
    );
  },
);
