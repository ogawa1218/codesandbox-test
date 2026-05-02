-- 0008_drop_legacy_function.sql
-- Removes a stale public.tg_set_updated_at() helper that was created during
-- early prototyping. Replaced by public.set_updated_at() (defined in 0001).
-- Drops with CASCADE because no triggers reference it; the linter flagged
-- it for a mutable search_path.
drop function if exists public.tg_set_updated_at() cascade;
