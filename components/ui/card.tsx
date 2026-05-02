import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40",
        className,
      )}
      {...rest}
    />
  );
});

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 px-6 pt-6", className)}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight text-white", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-white/60", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...rest} />;
}
