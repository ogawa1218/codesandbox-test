import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl shadow-2xl">
        <h1 className="text-5xl font-semibold tracking-tight text-white">404</h1>
        <p className="mt-3 text-sm text-white/60">
          お探しのページが見つかりませんでした。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 px-5 text-sm font-medium text-white"
        >
          ホームへ
        </Link>
      </div>
    </main>
  );
}
