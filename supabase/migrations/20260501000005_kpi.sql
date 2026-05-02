-- =============================================================
-- 0005 KPI helper functions
-- =============================================================
create or replace function public.net_amount(amount numeric, included boolean, rate numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case when included then amount / (1 + rate) else amount end
$$;

create or replace function public.kpi_monthly(p_store uuid, p_month date)
returns table(
  sales_actual numeric,
  sales_budget numeric,
  labor_cost numeric,
  labor_ratio numeric
)
language sql stable security invoker set search_path = '' as $$
  with month_range as (
    select date_trunc('month', p_month)::date as start_date,
           (date_trunc('month', p_month) + interval '1 month - 1 day')::date as end_date
  ),
  sales as (
    select coalesce(sum(public.net_amount(amount, tax_included, tax_rate)), 0) as sales_actual
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
    case when sales.sales_actual = 0 then 0 else round(labor.labor_cost / sales.sales_actual, 4) end
  from sales, budget, labor;
$$;

grant execute on function public.kpi_monthly(uuid, date) to authenticated;
grant execute on function public.net_amount(numeric, boolean, numeric) to authenticated;
