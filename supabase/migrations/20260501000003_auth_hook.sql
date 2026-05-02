-- =============================================================
-- 0003 custom_access_token_hook injects role + store_id into JWT.
-- Configure in Dashboard → Authentication → Hooks → Access Token.
-- =============================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := event->'claims';
  app_meta jsonb := coalesce(claims->'app_metadata', '{}'::jsonb);
  uid uuid := (event->>'user_id')::uuid;
  prof record;
begin
  select role::text as role, store_id
  into prof
  from public.profiles
  where id = uid;

  if prof.role is not null then
    app_meta := app_meta || jsonb_build_object('role', prof.role);
  end if;
  if prof.store_id is not null then
    app_meta := app_meta || jsonb_build_object('store_id', prof.store_id::text);
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta, true);
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke all on function public.custom_access_token_hook from public, anon, authenticated;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;
