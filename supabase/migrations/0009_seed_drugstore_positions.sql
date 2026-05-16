-- 0009_seed_drugstore_positions.sql
-- Auto-seed default drugstore positions when a new store is created.
-- Trigger fires AFTER INSERT on public.stores. Existing stores are not touched
-- (re-run safe via ON CONFLICT DO NOTHING).
create or replace function public.tg_seed_default_positions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.positions (store_id, name, color, sort_order) values
    (new.id, '薬剤師',       '#7c3aed', 0),
    (new.id, '登録販売者',   '#a855f7', 1),
    (new.id, 'レジ',         '#06b6d4', 2),
    (new.id, '品出し',       '#10b981', 3),
    (new.id, '化粧品',       '#ec4899', 4)
  on conflict do nothing;
  return new;
end
$$;

revoke all on function public.tg_seed_default_positions() from public, anon, authenticated;

drop trigger if exists seed_default_positions on public.stores;
create trigger seed_default_positions
  after insert on public.stores
  for each row execute function public.tg_seed_default_positions();
