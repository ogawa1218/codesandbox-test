# 店舗 PL 管理アプリ

シフト作成 + 業務連絡掲示板 + 売上ダッシュボードを統合した、店舗運営向け PL 管理 SPA。

**Stack**: Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + Supabase (Postgres / Auth / Realtime / Storage) + Upstash Redis (rate limit)

---

## ローカル開発

```bash
cp .env.example .env.local   # 値を埋める
npm install
npm run dev                  # http://localhost:3000
```

| 用途 | コマンド |
|---|---|
| 型チェック | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| 単体テスト | `npx vitest run` |
| RLS テスト (pgTAP) | `npx supabase test db` |
| E2E | `npx playwright test` |
| Supabase 型再生成 | `npx supabase gen types typescript --local > lib/database.types.ts` |

---

## Vercel デプロイ手順

1. **Import Project**: <https://vercel.com/new> → `ogawa1218/codesandbox-test` を選択 → Framework は Next.js が自動検出される
2. **Environment Variables** (Production / Preview 両方に設定):

   | Key | 値の出処 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 (anon public) |
   | `SUPABASE_SERVICE_ROLE_KEY` | 同上 (service_role) — **Production のみ** |
   | `UPSTASH_REDIS_REST_URL` | Upstash Console → REST API |
   | `UPSTASH_REDIS_REST_TOKEN` | 同上 |
   | `NEXT_PUBLIC_APP_ORIGIN` | デプロイ後の URL (例: `https://codesandbox-test.vercel.app`) |

3. **Deploy** → URL が払い出される
4. **Supabase 側の設定**: Dashboard → Authentication → URL Configuration
   - Site URL: 上記 Vercel URL
   - Redirect URLs: `https://<vercel-url>/**`
5. `NEXT_PUBLIC_APP_ORIGIN` をデプロイ URL に更新して再デプロイ（Server Actions の `allowedOrigins` と middleware CSP `connect-src` がこれを参照）

> **Free Tier 制約**: Supabase DB 500MB / Storage 1GB / Realtime 200ch、画像 5MB / PDF 20MB

---

## アーキテクチャ要点

- **Server Components がデフォルト**、`"use client"` はフォーム / DnD / Realtime のみ
- 書き込みは **Server Action 経由のみ**（discriminated union 戻り値、zod `.strict()`、`client_request_id` で UPSERT 冪等化）
- 集計は Postgres function (`kpi_monthly` ほか) → `supabase.rpc()`
- 認証は **`getUser()` のみ**、`getSession()` 禁止 (ESLint で強制)
- RLS は全テーブル `enable + force`、`auth.jwt()->>'store_id'` で評価
- CSP nonce を middleware で発行、`'unsafe-inline'` 排除
- Realtime は掲示板のみ（200ch 制限を考慮）
- 詳細規約は `CLAUDE.md` 参照

---

## ディレクトリ

```
app/(auth)        ログイン・オンボーディング
app/(app)         認証必須ルート (dashboard / forecast / shifts / settings / bulletin / my-shifts)
app/api           upload / line-share / health
components/ui     プリミティブ (Card / Button / Input / Stat)
lib/supabase      client / server / admin / middleware ラッパ
lib/schemas       zod スキーマ (Server Action と RHF で共有)
lib/notifier      LINE 通知抽象
supabase/migrations  DDL (timestamp prefix)
supabase/tests    pgTAP RLS テスト
tests/e2e         Playwright
```
