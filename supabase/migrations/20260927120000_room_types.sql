-- Blanso: rumstyper (booking.com-/QloApps-modellen: rumstyp × antal rum × natt).
--
-- ADDITIV och IDEMPOTENT: säker att köra flera gånger, rör ingen befintlig
-- kolumn, tappar ingen data. Körs i EN transaktion — antingen allt eller inget.
--
--   1. Tabell room_types (FK listings, RLS deny-all som övriga tabeller).
--   2. bookings.room_type_id + bookings.rooms (default 1);
--      availability_blocks.room_type_id (null = hela boendet stängt).
--   3. Backfill: varje boende utan rumstyp får en härledd ur sina egna fält
--      (units = 1, listpris, maxGuests) med id 'rt-<boendets id>', och varje
--      befintlig bokning pekas på den. Därefter room_type_id NOT NULL.
--   4. create_booking med rumstyp + antal: radlås på rumstypen serialiserar
--      samtidiga försök, sedan per-natt-kontroll via generate_series.
--   5. Den gamla 15-argumentsversionen av create_booking finns kvar som
--      delegat (standardrumstypen, 1 rum) så den kod som kör i produktion
--      medan migrationen och den nya koden rullas ut aldrig får fel.
--
-- Samma regel som den deterministiska motorn i src/lib/inventory.ts; bevisad
-- mot samma facitfall i scripts/verify-room-types.sql.

begin;

-- 1. Rumstyper ----------------------------------------------------------------
create table if not exists public.room_types (
  id                  text primary key,
  listing_id          text not null references public.listings(id),
  name                text not null,
  size_sqm            integer check (size_sqm is null or size_sqm > 0),
  bed_config          text not null default '',
  max_guests          integer not null check (max_guests >= 1),
  units               integer not null check (units >= 1),
  nightly_price_cents integer not null check (nightly_price_cents >= 0),
  images              jsonb not null default '[]'::jsonb,
  sort_order          integer not null default 0,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists room_types_listing_idx on public.room_types(listing_id);

alter table public.room_types enable row level security;

-- 2. Bokningar och stängningar får rumstyp ------------------------------------
alter table public.bookings
  add column if not exists room_type_id text references public.room_types(id);
alter table public.bookings
  add column if not exists rooms integer not null default 1;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_rooms_positive') then
    alter table public.bookings add constraint bookings_rooms_positive check (rooms >= 1);
  end if;
end $$;
create index if not exists bookings_room_type_idx on public.bookings(room_type_id, status);

alter table public.availability_blocks
  add column if not exists room_type_id text references public.room_types(id);
create index if not exists blocks_room_type_idx on public.availability_blocks(room_type_id);

-- 3. Backfill ---------------------------------------------------------------
-- Ger boendet dess första aktiva rumstyp; skapar en härledd om den saknas.
-- Returnerar null om boendet inte finns.
create or replace function public.ensure_default_room_type(p_listing_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  l public.listings%rowtype;
begin
  select id into v_id from public.room_types
   where listing_id = p_listing_id and archived_at is null
   order by sort_order, created_at, id
   limit 1;
  if v_id is not null then
    return v_id;
  end if;

  select * into l from public.listings where id = p_listing_id;
  if not found then
    return null;
  end if;

  v_id := 'rt-' || p_listing_id;
  if exists (select 1 from public.room_types where id = v_id) then
    -- Standard-id:t upptaget av en arkiverad typ: ta ett nytt unikt.
    v_id := 'rt_' || replace(gen_random_uuid()::text, '-', '');
  end if;

  insert into public.room_types (
    id, listing_id, name, size_sqm, bed_config, max_guests, units,
    nightly_price_cents, images, sort_order
  ) values (
    v_id, l.id, 'Standard Room', null,
    case when l.beds = 1 then '1 bed' else l.beds || ' beds' end,
    greatest(l.max_guests, 1), 1, l.nightly_price_cents, '[]'::jsonb, 0
  );
  return v_id;
end;
$$;

select public.ensure_default_room_type(l.id)
  from public.listings l
 where not exists (select 1 from public.room_types rt where rt.listing_id = l.id);

update public.bookings b
   set room_type_id = public.ensure_default_room_type(b.listing_id)
 where b.room_type_id is null;

alter table public.bookings alter column room_type_id set not null;

-- 4. Atomisk bokning per rumstyp -----------------------------------------------
-- Ordningen på kontrollerna är densamma som i MemoryStore.createBooking.
create or replace function public.create_booking(
  p_id text, p_access_token text, p_listing_id text,
  p_room_type_id text, p_rooms int,
  p_guest_name text, p_guest_email text,
  p_check_in date, p_check_out date, p_guests int, p_nights int,
  p_subtotal_cents int, p_cleaning_fee_cents int, p_service_fee_cents int,
  p_total_cents int, p_currency text, p_payment_ref text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l  public.listings%rowtype;
  rt public.room_types%rowtype;
  b  public.bookings%rowtype;
  v_available int;
begin
  select * into l from public.listings where id = p_listing_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'LISTING_NOT_FOUND');
  end if;
  if l.status <> 'published' then
    return jsonb_build_object('ok', false, 'error', 'LISTING_NOT_PUBLISHED');
  end if;

  -- Radlåset på rumstypen serialiserar alla samtidiga bokningar av typen:
  -- nästa transaktion väntar här tills denna har committat sin insert.
  select * into rt from public.room_types
   where id = p_room_type_id and listing_id = p_listing_id and archived_at is null
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ROOM_TYPE_NOT_FOUND');
  end if;
  if p_rooms is null or p_rooms < 1 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_ROOMS');
  end if;
  if p_guests > rt.max_guests * p_rooms then
    return jsonb_build_object('ok', false, 'error', 'TOO_MANY_GUESTS');
  end if;
  if p_check_out <= p_check_in then
    return jsonb_build_object('ok', false, 'error', 'UNAVAILABLE');
  end if;

  -- Stängd natt (hela boendet eller just typen) ⇒ UNAVAILABLE.
  if exists (
    select 1 from public.availability_blocks y
     where y.listing_id = p_listing_id
       and (y.room_type_id is null or y.room_type_id = rt.id)
       and y.check_in < p_check_out and p_check_in < y.check_out
  ) then
    return jsonb_build_object('ok', false, 'error', 'UNAVAILABLE');
  end if;

  -- Minsta lediga över vistelsens nätter [check_in, check_out).
  select min(rt.units - coalesce((
           select sum(x.rooms) from public.bookings x
            where x.room_type_id = rt.id and x.status = 'confirmed'
              and x.check_in <= n.night and n.night < x.check_out
         ), 0))::int
    into v_available
    from generate_series(p_check_in, p_check_out - 1, interval '1 day') as n(night);

  if v_available < p_rooms then
    return jsonb_build_object('ok', false, 'error', 'NOT_ENOUGH_ROOMS',
                              'available', greatest(v_available, 0));
  end if;

  insert into public.bookings (
    id, access_token, listing_id, room_type_id, rooms, guest_name, guest_email,
    check_in, check_out, guests, nights,
    subtotal_cents, cleaning_fee_cents, service_fee_cents, total_cents,
    currency, status, payment_ref
  ) values (
    p_id, p_access_token, p_listing_id, rt.id, p_rooms, p_guest_name, p_guest_email,
    p_check_in, p_check_out, p_guests, p_nights,
    p_subtotal_cents, p_cleaning_fee_cents, p_service_fee_cents, p_total_cents,
    p_currency, 'confirmed', p_payment_ref
  ) returning * into b;

  return jsonb_build_object('ok', true, 'booking', to_jsonb(b));
end;
$$;

-- 5. Den gamla signaturen delegerar: standardrumstypen, ett rum. ----------------
create or replace function public.create_booking(
  p_id text, p_access_token text, p_listing_id text,
  p_guest_name text, p_guest_email text,
  p_check_in date, p_check_out date, p_guests int, p_nights int,
  p_subtotal_cents int, p_cleaning_fee_cents int, p_service_fee_cents int,
  p_total_cents int, p_currency text, p_payment_ref text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rt text;
begin
  v_rt := public.ensure_default_room_type(p_listing_id);
  if v_rt is null then
    return jsonb_build_object('ok', false, 'error', 'LISTING_NOT_FOUND');
  end if;
  return public.create_booking(
    p_id, p_access_token, p_listing_id, v_rt, 1,
    p_guest_name, p_guest_email, p_check_in, p_check_out, p_guests, p_nights,
    p_subtotal_cents, p_cleaning_fee_cents, p_service_fee_cents, p_total_cents,
    p_currency, p_payment_ref
  );
end;
$$;

-- Bara servern (service role) får köra funktionerna.
revoke all on function public.ensure_default_room_type(text) from public, anon, authenticated;
revoke all on function public.create_booking(text,text,text,text,int,text,text,date,date,int,int,int,int,int,int,text,text) from public, anon, authenticated;
revoke all on function public.create_booking(text,text,text,text,text,date,date,int,int,int,int,int,int,text,text) from public, anon, authenticated;

commit;

-- PostgREST (Supabase API) ska se de nya kolumnerna och funktionen direkt.
notify pgrst, 'reload schema';
