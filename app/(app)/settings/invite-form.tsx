"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { inviteEmployee } from "./actions";
import { toast } from "sonner";

export function InviteForm() {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(null);

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await inviteEmployee(fd);
          if (!r.ok) {
            toast.error(r.error.message);
          } else {
            setUrl(r.data.url);
            toast.success("招待リンクを発行しました");
          }
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="full_name">名前</Label>
        <Input id="full_name" name="full_name" required maxLength={40} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="role">ロール</Label>
        <select
          id="role"
          name="role"
          defaultValue="employee"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          <option value="employee">従業員</option>
          <option value="manager">マネージャー</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="license">資格</Label>
        <select
          id="license"
          name="license"
          defaultValue="none"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          <option value="none">資格なし</option>
          <option value="pharmacist">薬剤師</option>
          <option value="registered_seller">登録販売者</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="hourly_wage">時給(円)</Label>
        <Input id="hourly_wage" name="hourly_wage" type="number" min={0} max={99999} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">メール(任意)</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          招待リンクを発行
        </Button>
        {url ? (
          <button
            type="button"
            className="text-xs text-cyan-300 underline hover:text-cyan-200"
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("クリップボードにコピーしました");
            }}
          >
            URL をコピー
          </button>
        ) : null}
      </div>
    </form>
  );
}
