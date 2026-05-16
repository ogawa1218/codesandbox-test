-- =============================================================
-- 0006 audit triggers writing into audit_logs
-- =============================================================
create or replace function public.tg_audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_actor uuid := auth.uid();
  v_target_id text;
begin
  v_store := coalesce(
    (case when tg_op = 'DELETE' then (to_jsonb(old)->>'store_id')::uuid else (to_jsonb(new)->>'store_id')::uuid end),
    null
  );
  v_target_id := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old)->>'id' else to_jsonb(new)->>'id' end),
    null
  );
  insert into public.audit_logs (actor_id, store_id, action, target_table, target_id, before, after)
  values (
    v_actor,
    v_store,
    tg_op,
    tg_table_schema || '.' || tg_table_name,
    v_target_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end $$;

revoke all on function public.tg_audit_row() from public, anon, authenticated;

create trigger audit_shifts after insert or update or delete on public.shifts
  for each row execute function public.tg_audit_row();
create trigger audit_sales_actuals after insert or update or delete on public.sales_actuals
  for each row execute function public.tg_audit_row();
create trigger audit_announcements after insert or update or delete on public.announcements
  for each row execute function public.tg_audit_row();
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.tg_audit_row();
create trigger audit_invitations after insert or update or delete on public.invitations
  for each row execute function public.tg_audit_row();
