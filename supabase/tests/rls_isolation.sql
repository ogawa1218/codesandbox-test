-- pgTAP RLS テスト: 別店舗ユーザーが他店舗データにアクセスできないこと
-- 実行: `npx supabase test db`
begin;
select plan(6);

-- ---- セットアップ: 2 店舗・2 マネージャー ----
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com');

insert into public.stores (id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Store A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Store B');

insert into public.profiles (id, store_id, full_name, role, hourly_wage)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Manager A', 'manager', 1200),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Manager B', 'manager', 1200);

insert into public.positions (id, store_id, name) values
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Hall A'),
  ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Hall B');

-- ---- Test as Manager A ----
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"role":"manager","store_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}}';

select results_eq(
  $$ select count(*)::int from public.positions where store_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  array[1],
  'Manager A sees own positions'
);
select results_eq(
  $$ select count(*)::int from public.positions where store_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  array[0],
  'Manager A sees zero foreign positions'
);
select results_eq(
  $$ select count(*)::int from public.profiles where store_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  array[0],
  'Manager A sees zero foreign profiles'
);

-- ---- Test as Manager B ----
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{"role":"manager","store_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}}';

select results_eq(
  $$ select count(*)::int from public.positions where store_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  array[1],
  'Manager B sees own positions'
);
select results_eq(
  $$ select count(*)::int from public.positions where store_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  array[0],
  'Manager B sees zero foreign positions'
);

-- profiles_public からは hourly_wage が引けない
select throws_ok(
  $$ select hourly_wage from public.profiles_public limit 1 $$,
  '42703',
  'column "hourly_wage" does not exist',
  'profiles_public hides hourly_wage from any reader'
);

select * from finish();
rollback;
