"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="dark"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-white",
        },
      }}
    />
  );
}
