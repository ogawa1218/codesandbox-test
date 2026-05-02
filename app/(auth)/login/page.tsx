import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/40">
            <span className="text-xl font-bold text-white">PL</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            店舗 PL 管理
          </h1>
          <p className="mt-1 text-sm text-white/60">
            シフト・売上・連絡を一つに
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>登録済みのメールアドレスでサインイン</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm next={sp.next} error={sp.error} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
