# 店舗 PL 管理アプリ — プロジェクト規約

シフト作成 + 業務連絡掲示板 + 売上ダッシュボードを統合した、店舗運営向け PL 管理 SPA。
Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase で構築。

詳細な計画書は `/root/.claude/plans/joyful-booping-glacier.md` を参照。

---

## ビルド・開発コマンド

| 用途 | コマンド |
|---|---|
| 開発サーバ | `npm run dev` → http://localhost:3000 |
| 型チェック | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Supabase 型生成 | `npx supabase gen types typescript --local > lib/database.types.ts` |
| RLS テスト | `npx supabase test db` |
| E2E | `npx playwright test` |

`.env.local` は `.env.example` をコピーし、`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` を設定する。

---

## 1. アーキテクチャ原則

- **Server Components がデフォルト**。`"use client"` はフォーム / DnD / Realtime 購読のみ
- **書き込みは必ず Server Action 経由**。クライアントから `supabase.from().insert()` を呼ばない
- **集計は Postgres function (RPC) に寄せる**。`kpi_monthly` 等を `supabase.rpc()` で Server Component から呼ぶ
- **キャッシュは `revalidateTag` ベース**。Server Action 後に該当タグを invalidate
- **Realtime は掲示板のみ**（Free Tier の 200 channel 制限を考慮）

## 2. TypeScript 規約

- `strict: true` 必須。`any` 禁止 (`unknown` + type guard で代替)
- Server Action の戻り値は **discriminated union**: `{ ok: true, data } | { ok: false, error: { code, message } }`。throw しない
- zod スキーマは `lib/schemas/` に一元化。Server Action と RHF で共有 (`.strict()` で未知キー拒否)
- DB 型は `lib/database.types.ts`（Supabase MCP 自動生成）から import

## 3. セキュリティ規約（厳守）

### Critical
- **`getUser()` のみ使用**。`getSession()` は禁止（cookie 改ざん検知不可）
- **JWT カスタムクレーム** (`role` / `store_id`) を Auth Hook (`custom_access_token_hook`) で注入。RLS は `auth.jwt()->>'store_id'` で参照
- **RLS は全テーブル `enable` + `force`、mutation は `with check` 必須**
- **`SECURITY DEFINER` 関数は `set search_path = ''` + 完全修飾**
- **Storage バケットは Private**。参照は短命の `createSignedUrl(path, 60〜600)` のみ
- **`SERVICE_ROLE_KEY` は `lib/supabase/admin.ts` のみ**。冒頭に `import 'server-only'`
- **MIME マジックバイト検証 + サイズ上限 + EXIF 除去** をアップロード API で必ず実施

### High
- CSP nonce を `middleware.ts` で発行、`'unsafe-inline'` 禁止
- `next.config.ts` で `serverActions.allowedOrigins` 限定、`bodySizeLimit: '2mb'`
- `hourly_wage` は `profiles_public` ビュー経由で従業員に隠蔽
- Upstash Rate Limit: ログイン 10/min/IP、書き込み 30/min/user、upload 10/min/user
- `?next=` パラメータは `new URL(next, origin).origin === origin` で検証（Open Redirect 対策）
- `dangerouslySetInnerHTML` 禁止（ESLint `react/no-danger`）
- 全 mutation に `client_request_id` (UUID) を付与し UPSERT で冪等化

## 4. ファイル配置

- `app/(auth)` 公開ルート（middleware で `/dashboard|/forecast|/shifts|/settings` を manager 限定）
- `app/(app)` 認証必須。layout で `getUser()` 再確認
- `app/api/upload/route.ts` でアップロード検証（MIME / size / EXIF / store_id 整合）
- `lib/supabase/{client,server,admin,middleware}.ts` で SDK ラッパを分離
- `lib/notifier/` で LINE 通知を抽象化（URL scheme / Messaging API 切替対応）
- `lib/schemas/` で zod スキーマを集約
- `supabase/migrations/` に DDL を timestamp prefix で配置

## 5. Git 運用

- 作業ブランチ: `claude/shift-management-app-KC1SW`
- Conventional Commits: `feat:` / `fix:` / `chore:` / `refactor:`
- 大きな変更は段階コミット（マイグレーション / 認証 / 各画面）
- PR は draft で作成、`gh` ではなく GitHub MCP を使用

## 6. テスト要件

- **RLS テスト必須**: 別店舗ユーザーで select → 0 行を `supabase test db` で検証
- **Playwright E2E**: ログイン → シフト作成 → ダッシュボード反映 / 売上入力 → KPI 更新 / 掲示板投稿 → 既読化 の 3 シナリオ
- 単体テスト (Vitest): zod スキーマ、KPI 計算、business_date 境界

## 7. デザイントークン

- 背景: `bg-[#0a0a0f]` + 紫→青→ティールの放射グラデ
- カード: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`
- アクセント: `from-violet-500 via-fuchsia-500 to-cyan-400`
- フォント: Inter + Noto Sans JP (`next/font`)
- カラーは Tailwind v4 `@theme` の `oklch()` トークン
- 金額: `Intl.NumberFormat('ja-JP', {style:'currency', currency:'JPY'})`、DB は `numeric(12,0)` 円整数

## 8. 注意事項

- `.codesandbox/workspace.json` は CodeSandbox 設定のため温存
- Free Tier 制約: DB 500MB / Storage 1GB / Realtime 200ch、画像 5MB / PDF 20MB
- Next.js は CVE-2025-29927 系 middleware バイパス CVE に追従するため最新パッチを使用
- LINE 連携は当面 URL scheme（`https://line.me/R/share?text=...`）。`Notifier` interface で抽象化済み
