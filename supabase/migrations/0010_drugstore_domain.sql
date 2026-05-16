-- 0010_drugstore_domain.sql
-- Drugstore-specific domain data:
--  (a) sales category split (調剤 / OTC / 化粧品 / 食品・日用品) on sales_actuals
--  (b) prescription count (処方箋枚数) on sales_actuals
--  (c) staff license (薬剤師 / 登録販売者) on profiles
--  + kpi_monthly extended with Rx/OTC ratio and prescription unit price
-- MCP was unreachable at authoring time; apply via 'supabase db push'.

-- ---- (c) staff license ----
do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_license') then
    create type public.staff_license as enum ('pharmacist', 'registered_seller', 'none');
  end if;
end$$;

alter table public.profiles
  add column if not exists license public.staff_license not null default 'none';

-- carry the license through the invite → signup flow
alter table public.invitations
  add column if not exists license public.staff_license not null default 'none';

-- license is operationally useful (shift coverage) so expose it via the
-- public view, unlike hourly_wage which stays manager-only.
create or replace view public.profiles_public
with (security_invoker = true) as
select id, store_id, full_name, role, license, deleted_at, created_at
from public.profiles;

grant select on public.profiles_public to authenticated;

-- ---- (a)(b) sales category + prescription count ----
alter table public.sales_actuals
  add column if not exists amount_dispensing numeric(12,0) not null default 0,
  add column if not exists amount_otc        numeric(12,0) not null default 0,
  add column if not exists amount_cosmetics  numeric(12,0) not null default 0,
  add column if not exists amount_food        numeric(12,0) not null default 0,
  add column if not exists rx_count           integer       not null default 0;

alter table public.sales_actuals
  drop constraint if exists sales_actuals_nonneg_breakdown,
  add constraint sales_actuals_nonneg_breakdown check (
    amount_dispensing >= 0 and amount_otc >= 0
    and amount_cosmetics >= 0 and amount_food >= 0 and rx_count >= 0
  );

-- ---- kpi_monthly: add Rx/OTC metrics ----
create or replace function public.kpi_monthly(p_store uuid, p_month date)
returns table(
  sales_actual numeric,
  sales_budget numeric,
  labor_cost numeric,
  labor_ratio numeric,
  rx_sales numeric,
  otc_sales numeric,
  rx_count integer,
  rx_ratio numeric,
  rx_unit_price numeric
)
language sql stable security invoker set search_path = '' as $$
  with month_range as (
    select date_trunc('month', p_month)::date as start_date,
           (date_trunc('month', p_month) + interval '1 month - 1 day')::date as end_date
  ),
  sales as (
    select
      coalesce(sum(public.net_amount(amount, tax_included, tax_rate)), 0) as sales_actual,
      coalesce(sum(public.net_amount(amount_dispensing, tax_included, tax_rate)), 0) as rx_sales,
      coalesce(sum(public.net_amount(amount_otc, tax_included, tax_rate)), 0) as otc_sales,
      coalesce(sum(rx_count), 0)::integer as rx_count
    from public.sales_actuals, month_range
    where store_id = p_store and business_date between start_date and end_date
  ),
  budget as (
    select coalesce(sum(amount), 0) as sales_budget
    from public.daily_budgets, month_range
    where store_id = p_store and business_date between start_date and end_date
  ),
  labor as (
    select coalesce(sum(
      extract(epoch from (s.ends_at - s.starts_at)) / 3600.0 * coalesce(p.hourly_wage, 0)
    ), 0) as labor_cost
    from public.shifts s
    join public.profiles p on p.id = s.employee_id
    , month_range
    where s.store_id = p_store
      and s.status = 'confirmed'
      and s.business_date between start_date and end_date
  )
  select
    sales.sales_actual,
    budget.sales_budget,
    labor.labor_cost,
    case when sales.sales_actual = 0 then 0 else round(labor.labor_cost / sales.sales_actual, 4) end,
    sales.rx_sales,
    sales.otc_sales,
    sales.rx_count,
    case when sales.sales_actual = 0 then 0 else round(sales.rx_sales / sales.sales_actual, 4) end,
    case when sales.rx_count = 0 then 0 else round(sales.rx_sales / sales.rx_count, 0) end
  from sales, budget, labor;
$$;

grant execute on function public.kpi_monthly(uuid, date) to authenticated;
