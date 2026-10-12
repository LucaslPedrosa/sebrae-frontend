begin;

create extension if not exists pgcrypto with schema extensions;
create type public.device_type as enum ('generator', 'consumer');
create type public.device_status as enum ('online', 'offline');
create type public.ledger_entry_type as enum ('generation', 'consumption', 'transfer_in', 'transfer_out');
create type public.offer_status as enum ('open', 'cancelled', 'sold');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  type public.device_type not null,
  status public.device_status not null default 'offline',
  location text not null default '' check (char_length(location) <= 240),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default extensions.gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete restrict,
  amount_wh bigint not null check (amount_wh > 0 and amount_wh <= 1000000000000),
  price_per_kwh numeric(12, 2) not null check (price_per_kwh > 0 and price_per_kwh <= 1000000),
  status public.offer_status not null default 'open',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  sold_at timestamptz,
  constraint offers_status_timestamps_check check (
    (status = 'open' and cancelled_at is null and sold_at is null)
    or (status = 'cancelled' and cancelled_at is not null and sold_at is null)
    or (status = 'sold' and cancelled_at is null and sold_at is not null)
  )
);

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  offer_id uuid not null unique references public.offers(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  amount_wh bigint not null check (amount_wh > 0),
  price_per_kwh numeric(12, 2) not null check (price_per_kwh > 0),
  total_price numeric(18, 2) not null check (total_price >= 0),
  created_at timestamptz not null default now(),
  constraint orders_distinct_participants_check check (seller_id <> buyer_id)
);

create table public.ledger_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  type public.ledger_entry_type not null,
  amount_wh bigint not null,
  description text not null check (char_length(btrim(description)) between 1 and 240),
  device_id uuid references public.devices(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  counterparty_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint ledger_amount_sign_check check (
    (type in ('generation', 'transfer_in') and amount_wh > 0)
    or (type in ('consumption', 'transfer_out') and amount_wh < 0)
  ),
  constraint ledger_source_check check (type not in ('generation', 'consumption') or device_id is not null)
);

create index devices_owner_id_idx on public.devices(owner_id);
create index offers_open_created_at_idx on public.offers(created_at desc) where status = 'open';
create index offers_seller_id_idx on public.offers(seller_id, created_at desc);
create index ledger_owner_created_at_idx on public.ledger_entries(owner_id, created_at desc);
create unique index ledger_order_owner_idx on public.ledger_entries(order_id, owner_id) where order_id is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(btrim(left(new.raw_user_meta_data ->> 'full_name', 80)), ''), 'Usuario'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.reject_ledger_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception using errcode = 'P0001', message = 'ledger_entries_are_immutable';
end;
$$;

create trigger ledger_entries_immutable before update or delete on public.ledger_entries
for each row execute function public.reject_ledger_mutation();

create or replace function public.enforce_available_balance()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_balance numeric;
  v_reserved numeric;
begin
  if new.amount_wh >= 0 then return new; end if;
  perform 1 from public.profiles where id = new.owner_id for update;
  select coalesce(sum(amount_wh), 0) into v_balance from public.ledger_entries where owner_id = new.owner_id;
  select coalesce(sum(amount_wh), 0) into v_reserved from public.offers where seller_id = new.owner_id and status = 'open';
  if v_balance + new.amount_wh - v_reserved < 0 then
    raise exception using errcode = 'P0001', message = 'insufficient_available_energy';
  end if;
  return new;
end;
$$;

create trigger ledger_check_available_balance before insert on public.ledger_entries
for each row execute function public.enforce_available_balance();

create or replace function public.create_offer(p_amount_wh bigint, p_price_per_kwh numeric)
returns public.offers language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_reserved numeric;
  v_offer public.offers;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if p_amount_wh is null or p_amount_wh <= 0 or p_amount_wh > 1000000000000 then
    raise exception using errcode = '22023', message = 'invalid_amount_wh';
  end if;
  if p_price_per_kwh is null or p_price_per_kwh <= 0 or p_price_per_kwh > 1000000 or p_price_per_kwh <> round(p_price_per_kwh, 2) then
    raise exception using errcode = '22023', message = 'invalid_price_per_kwh';
  end if;
  perform 1 from public.profiles where id = v_user_id for update;
  select coalesce(sum(amount_wh), 0) into v_balance from public.ledger_entries where owner_id = v_user_id;
  select coalesce(sum(amount_wh), 0) into v_reserved from public.offers where seller_id = v_user_id and status = 'open';
  if v_balance - v_reserved < p_amount_wh then
    raise exception using errcode = 'P0001', message = 'insufficient_available_energy';
  end if;
  insert into public.offers (seller_id, amount_wh, price_per_kwh)
  values (v_user_id, p_amount_wh, p_price_per_kwh) returning * into v_offer;
  return v_offer;
end;
$$;

create or replace function public.cancel_offer(p_offer_id uuid)
returns public.offers language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_offer public.offers;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'offer_not_found'; end if;
  if v_offer.seller_id <> v_user_id then raise exception using errcode = '42501', message = 'offer_not_owned'; end if;
  if v_offer.status <> 'open' then raise exception using errcode = 'P0001', message = 'offer_not_open'; end if;
  update public.offers set status = 'cancelled', cancelled_at = now()
  where id = p_offer_id returning * into v_offer;
  return v_offer;
end;
$$;

create or replace function public.buy_offer(p_offer_id uuid)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare
  v_buyer_id uuid := auth.uid();
  v_offer public.offers;
  v_order public.orders;
  v_balance numeric;
  v_reserved numeric;
begin
  if v_buyer_id is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'offer_not_found'; end if;
  if v_offer.status <> 'open' then raise exception using errcode = 'P0001', message = 'offer_not_open'; end if;
  if v_offer.seller_id = v_buyer_id then raise exception using errcode = 'P0001', message = 'cannot_buy_own_offer'; end if;
  perform 1 from public.profiles where id in (v_offer.seller_id, v_buyer_id) order by id for update;
  select coalesce(sum(amount_wh), 0) into v_balance from public.ledger_entries where owner_id = v_offer.seller_id;
  select coalesce(sum(amount_wh), 0) into v_reserved from public.offers where seller_id = v_offer.seller_id and status = 'open';
  if v_balance < v_reserved then raise exception using errcode = 'P0001', message = 'seller_reservation_inconsistent'; end if;
  update public.offers set status = 'sold', sold_at = now() where id = v_offer.id;
  insert into public.orders (offer_id, seller_id, buyer_id, amount_wh, price_per_kwh, total_price)
  values (v_offer.id, v_offer.seller_id, v_buyer_id, v_offer.amount_wh, v_offer.price_per_kwh,
    round((v_offer.amount_wh::numeric / 1000) * v_offer.price_per_kwh, 2)) returning * into v_order;
  insert into public.ledger_entries (owner_id, type, amount_wh, description, order_id, counterparty_id)
  values
    (v_offer.seller_id, 'transfer_out', -v_offer.amount_wh, 'Venda de energia', v_order.id, v_buyer_id),
    (v_buyer_id, 'transfer_in', v_offer.amount_wh, 'Compra de energia', v_order.id, v_offer.seller_id);
  return v_order;
end;
$$;

create or replace function public.record_simulated_reading(p_device_id uuid, p_amount_wh bigint)
returns public.ledger_entries language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_device public.devices;
  v_entry public.ledger_entries;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if p_amount_wh is null or p_amount_wh <= 0 or p_amount_wh > 1000000000 then
    raise exception using errcode = '22023', message = 'invalid_amount_wh';
  end if;
  select * into v_device from public.devices where id = p_device_id and owner_id = v_user_id for update;
  if not found then raise exception using errcode = '42501', message = 'device_not_owned'; end if;
  insert into public.ledger_entries (owner_id, type, amount_wh, description, device_id)
  values (
    v_user_id,
    case when v_device.type = 'generator' then 'generation'::public.ledger_entry_type else 'consumption'::public.ledger_entry_type end,
    case when v_device.type = 'generator' then p_amount_wh else -p_amount_wh end,
    case when v_device.type = 'generator' then 'Geracao simulada' else 'Consumo simulado' end,
    v_device.id
  ) returning * into v_entry;
  update public.devices set status = 'online', last_seen_at = now() where id = v_device.id;
  return v_entry;
end;
$$;

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.ledger_entries enable row level security;

create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy devices_select_own on public.devices for select to authenticated using (owner_id = (select auth.uid()));
create policy devices_insert_own on public.devices for insert to authenticated with check (owner_id = (select auth.uid()));
create policy devices_update_own on public.devices for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy devices_delete_own on public.devices for delete to authenticated using (owner_id = (select auth.uid()));
create policy offers_select_market on public.offers for select to authenticated using (status = 'open' or seller_id = (select auth.uid()));
create policy orders_select_participant on public.orders for select to authenticated using (seller_id = (select auth.uid()) or buyer_id = (select auth.uid()));
create policy ledger_select_own on public.ledger_entries for select to authenticated using (owner_id = (select auth.uid()));

revoke all on table public.profiles, public.devices, public.offers, public.orders, public.ledger_entries from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.devices to authenticated;
grant select on table public.offers, public.orders, public.ledger_entries to authenticated;
revoke all on function public.handle_new_user(), public.reject_ledger_mutation(), public.enforce_available_balance() from public;
revoke all on function public.create_offer(bigint, numeric), public.cancel_offer(uuid), public.buy_offer(uuid), public.record_simulated_reading(uuid, bigint) from public, anon, authenticated;
grant execute on function public.create_offer(bigint, numeric), public.cancel_offer(uuid), public.buy_offer(uuid), public.record_simulated_reading(uuid, bigint) to authenticated;

commit;
