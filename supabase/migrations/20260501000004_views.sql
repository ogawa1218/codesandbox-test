-- =============================================================
-- 0004 profiles_public view (hides hourly_wage and line_id from
-- non-managers). Uses security_invoker so RLS still applies.
-- =============================================================
create or replace view public.profiles_public
with (security_invoker = true) as
select id, store_id, full_name, role, deleted_at, created_at
from public.profiles;

grant select on public.profiles_public to authenticated;
