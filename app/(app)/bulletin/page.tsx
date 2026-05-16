import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BulletinComposer } from "./composer";
import { BulletinFeed } from "./feed";

export const dynamic = "force-dynamic";

export default async function BulletinPage() {
  const session = await requireUser();
  const isManager = session.claims.role === "manager";
  const storeId = session.claims.store_id;
  if (!storeId) {
    return (
      <div className="text-white/60">店舗が未設定です。管理者にお問い合わせください。</div>
    );
  }

  const supabase = await createClient();
  const [{ data: announcements }, { data: reads }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, image_path, pdf_path, author_id, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", session.userId),
  ]);

  const readSet = new Set((reads ?? []).map((r) => r.announcement_id));

  // Resolve author names
  const authorIds = Array.from(
    new Set((announcements ?? []).map((a) => a.author_id)),
  );
  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", authorIds)
    : { data: [] };
  const authorMap = new Map(
    (authors ?? []).map((a) => [a.id ?? "", a.full_name ?? ""]),
  );

  const items = (announcements ?? []).map((a) => ({
    ...a,
    author_name: authorMap.get(a.author_id) ?? "—",
    is_read: readSet.has(a.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          掲示板
        </h1>
        <p className="text-sm text-white/60">店舗内のお知らせ</p>
      </header>

      {isManager ? (
        <Card>
          <CardHeader>
            <CardTitle>新規投稿</CardTitle>
            <CardDescription>
              タイトルと本文(必要に応じて画像)を入力してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulletinComposer storeId={storeId} />
          </CardContent>
        </Card>
      ) : null}

      <BulletinFeed items={items} storeId={storeId} userId={session.userId} />
    </div>
  );
}
