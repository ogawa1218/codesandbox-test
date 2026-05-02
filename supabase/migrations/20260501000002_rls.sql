-- =============================================================
-- 0002 Row Level Security: enable + force on every table.
-- All policies key off auth.jwt()->>'store_id' (set by Auth Hook).
-- =============================================================

-- Helper: store_id from JWT
create or replace function public.jwt_store_id()
returns uuid language sql stable security invoker set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,store_id}', '')::uuid
$$;

create or replace function public.jwt_role()
returns text language sql stable security invoker set search_path = '' as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,role}', 'employee')
$$;

grant execute on function public.jwt_store_id() to authenticated;
grant execute on function public.jwt_role() to authenticated;

-- ENABLE + FORCE on every table
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename in (
        'stores','profiles','positions','invitations',
        'shift_templates','template_slots','shifts','shift_actuals','shift_revisions',
        'daily_budgets','sales_actuals','sales_forecasts','hourly_forecasts','daily_kpi_snapshots',
        'holidays','announcements','announcement_reads','manuals',
        'notification_outbox','audit_logs'
      )
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------- stores ----------
create policy stores_select on public.stores for select to authenticated
  using (id = public.jwt_store_id());
create policy stores_update_manager on public.stores for update to authenticated
  using (id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- profiles ----------
create policy profiles_select_same_store on public.profiles for select to authenticated
  using (store_id = public.jwt_store_id());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and store_id = public.jwt_store_id());
create policy profiles_manage_manager on public.profiles for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- positions ----------
create policy pos_select on public.positions for select to authenticated
  using (store_id = public.jwt_store_id());
create policy pos_manage_manager on public.positions for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- invitations ----------
create policy inv_manage_manager on public.invitations for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- shift_templates / template_slots ----------
create policy tpl_select on public.shift_templates for select to authenticated
  using (store_id = public.jwt_store_id());
create policy tpl_manage on public.shift_templates for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy tplslot_select on public.template_slots for select to authenticated
  using (store_id = public.jwt_store_id());
create policy tplslot_manage on public.template_slots for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- shifts ----------
-- managers manage all; employees see only their own
create policy shifts_select_self on public.shifts for select to authenticated
  using (
    store_id = public.jwt_store_id()
    and (public.jwt_role() = 'manager' or employee_id = auth.uid())
  );
create policy shifts_manage_manager on public.shifts for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy shift_actuals_select on public.shift_actuals for select to authenticated
  using (store_id = public.jwt_store_id());
create policy shift_actuals_manage on public.shift_actuals for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy shift_rev_select on public.shift_revisions for select to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');
create policy shift_rev_insert on public.shift_revisions for insert to authenticated
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- budgets / sales / forecasts ----------
create policy budget_select on public.daily_budgets for select to authenticated
  using (store_id = public.jwt_store_id());
create policy budget_manage on public.daily_budgets for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy sa_select on public.sales_actuals for select to authenticated
  using (store_id = public.jwt_store_id());
create policy sa_manage on public.sales_actuals for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy sf_select on public.sales_forecasts for select to authenticated
  using (store_id = public.jwt_store_id());
create policy sf_manage on public.sales_forecasts for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy hf_select on public.hourly_forecasts for select to authenticated
  using (store_id = public.jwt_store_id());
create policy hf_manage on public.hourly_forecasts for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy kpi_select on public.daily_kpi_snapshots for select to authenticated
  using (store_id = public.jwt_store_id());
create policy kpi_manage on public.daily_kpi_snapshots for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- holidays ----------
create policy hol_select on public.holidays for select to authenticated
  using (store_id is null or store_id = public.jwt_store_id());
create policy hol_manage on public.holidays for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- announcements ----------
create policy ann_select on public.announcements for select to authenticated
  using (store_id = public.jwt_store_id());
create policy ann_manage on public.announcements for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

create policy ann_read_self_select on public.announcement_reads for select to authenticated
  using (user_id = auth.uid());
create policy ann_read_self_insert on public.announcement_reads for insert to authenticated
  with check (user_id = auth.uid());

-- ---------- manuals ----------
create policy man_select on public.manuals for select to authenticated
  using (store_id = public.jwt_store_id());
create policy man_manage on public.manuals for all to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager')
  with check (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');

-- ---------- notifications ----------
create policy outbox_select_self on public.notification_outbox for select to authenticated
  using (user_id = auth.uid());

-- ---------- audit_logs ----------
create policy audit_select_manager on public.audit_logs for select to authenticated
  using (store_id = public.jwt_store_id() and public.jwt_role() = 'manager');
