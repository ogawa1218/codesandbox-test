-- =============================================================
-- 0001 init schema: enums, stores, profiles, positions, shifts,
-- sales, announcements, audit_logs, etc.
-- =============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------- ENUMS ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('manager', 'employee');
  end if;
  if not exists (select 1 from pg_type where typname = 'shift_status') then
    create type public.shift_status as enum ('draft', 'confirmed', 'canceled');
  end if;
end $$;

-- ---------- TABLES ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Tokyo',
  business_open_at time not null default '09:00',
  business_close_at time not null default '23:00',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  full_name text not null,
  role public.user_role not null default 'employee',
  hourly_wage numeric(8,2),
  line_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_store on public.profiles(store_id) where deleted_at is null;

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  color text not null default '#7c3aed',
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);
create index if not exists idx_positions_store on public.positions(store_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  email text,
  full_name text not null,
  role public.user_role not null default 'employee',
  hourly_wage numeric(8,2),
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_invitations_store on public.invitations(store_id);

create table if not exists public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create table if not exists public.template_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.shift_templates(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  required_count int not null default 1
);
create index if not exists idx_template_slots_template on public.template_slots(template_id);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  business_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.shift_status not null default 'draft',
  note text,
  client_request_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (store_id, client_request_id)
);
create index if not exists idx_shifts_store_date on public.shifts(store_id, business_date);
create index if not exists idx_shifts_employee_date on public.shifts(employee_id, business_date);

-- Prevent overlapping confirmed shifts for the same employee
alter table public.shifts drop constraint if exists no_overlap_confirmed;
alter table public.shifts add constraint no_overlap_confirmed
  exclude using gist (
    employee_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed');

create table if not exists public.shift_actuals (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  break_minutes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.shift_revisions (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  diff jsonb not null,
  changed_at timestamptz not null default now()
);

create table if not exists public.daily_budgets (
  store_id uuid not null references public.stores(id) on delete cascade,
  business_date date not null,
  amount numeric(12,0) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (store_id, business_date)
);

create table if not exists public.sales_actuals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  business_date date not null,
  amount numeric(12,0) not null default 0,
  tax_included boolean not null default true,
  tax_rate numeric(4,3) not null default 0.10,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (store_id, business_date)
);

create table if not exists public.sales_forecasts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  business_date date not null,
  predicted_amount numeric(12,0) not null default 0,
  budget_amount numeric(12,0) not null default 0,
  note text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (store_id, business_date)
);

create table if not exists public.hourly_forecasts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  business_date date not null,
  hour int not null check (hour between 0 and 23),
  predicted_amount numeric(12,0) not null default 0,
  actual_amount numeric(12,0) not null default 0,
  updated_at timestamptz not null default now(),
  unique (store_id, business_date, hour)
);

create table if not exists public.daily_kpi_snapshots (
  store_id uuid not null references public.stores(id) on delete cascade,
  business_date date not null,
  sales_actual numeric(12,0) not null default 0,
  sales_budget numeric(12,0) not null default 0,
  labor_cost numeric(12,0) not null default 0,
  labor_ratio numeric(6,4) not null default 0,
  generated_at timestamptz not null default now(),
  primary key (store_id, business_date)
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  date date not null,
  name text not null
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  image_path text,
  created_at timestamptz not null default now()
);
create index if not exists idx_announcements_store on public.announcements(store_id, created_at desc);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table if not exists public.manuals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  pdf_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid,
  store_id uuid,
  action text not null,
  target_table text not null,
  target_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_store_created on public.audit_logs(store_id, created_at desc);

-- updated_at touch helper
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.tg_touch_updated_at();
create trigger touch_shifts before update on public.shifts
  for each row execute function public.tg_touch_updated_at();
