"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <h1 className="text-xl font-semibold text-white">問題が発生しました</h1>
        <p className="mt-2 text-sm text-white/60">
          時間を置いて再度お試しください。
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-white/10 px-5 text-sm text-white hover:bg-white/15"
        >
          再試行
        </button>
      </div>
    </main>
  );
}
