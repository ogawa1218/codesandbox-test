"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signIn } from "./actions";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(error ?? null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await signIn(fd, next ?? null);
          if (res && !res.ok) setServerError(res.error.message);
        });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>
      {serverError ? (
        <p className="text-xs text-rose-300" role="alert">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} size="lg">
        {isPending ? "サインイン中…" : "ログイン"}
      </Button>
    </form>
  );
}
