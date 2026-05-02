"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { setupStore } from "./actions";

export function OnboardingForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await setupStore(fd);
          if (r && !r.ok) setError(r.error.message);
        });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="store_name">店舗名</Label>
        <Input id="store_name" name="store_name" required maxLength={60} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="full_name">あなたのお名前(管理者)</Label>
        <Input id="full_name" name="full_name" required maxLength={40} />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "作成中…" : "店舗を作成して開始"}
      </Button>
      <p className="text-[11px] text-white/50">
        作成後、メニューから従業員を招待できます。
      </p>
    </form>
  );
}
