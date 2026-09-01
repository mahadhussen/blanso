-- Blanso: initialt schema för Balaanso (Supabase/Postgres).
-- Idempotent: säker att köra flera gånger. Speglar src/lib/domain.ts exakt.
-- Åtkomstmodell: ENDAST servern (service role) rör datan. RLS är på med noll
-- policies = anon/authenticated når ingenting. App-auktorisering sker i
-- DataStore-lagret (hostId-ägarskap), precis som i MemoryStore.

create table if not exists public.hosts (
  id         text primary key,
  name       text not null,
  email      text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id                  text primary key,
  host_id             text not null references public.hosts(id),
  host_name           text not null,
  slug                text not null unique,
  status              text not null default 'published'
                      check (status in ('draft','published','unlisted')),
  title               text not null,
  city                text not null,
  country             text not null,
  description         text not null,
  nightly_price_cents integer not null check (nightly_price_cents >= 0),
  cleaning_fee_cents  integer not null default 0 check (cleaning_fee_cents >= 0),
  currency            text not null default 'USD',
  max_guests          integer not null check (max_guests >= 1),
  bedrooms            integer not null default 1,
  beds                integer not null default 1,
  baths               integer not null default 1,
  rating              double precision not null default 0,
  reviews_count       integer not null default 0,
  images              jsonb not null default '[]'::jsonb,
  amenities           jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_host_idx on public.listings(host_id);

create table if not exists public.bookings (
  id                 text primary key,
  access_token       text not null unique,
  listing_id         text not null references public.listings(id),
  guest_name         text not null,
  guest_email        text not null,
  check_in           date not null,
  check_out          date not null,
  guests             integer not null check (guests >= 1),
  nights             integer not null check (nights >= 1),
  subtotal_cents     integer not null,
  cleaning_fee_cents integer not null,
  service_fee_cents  integer not null,
  total_cents        integer not null,
  currency           text not null default 'USD',
  status             text not null default 'confirmed'
                     check (status in ('confirmed','cancelled')),
  payment_ref        text not null,
  created_at         timestamptz not null default now(),
  check (check_out > check_in)
);
create index if not exists bookings_listing_idx on public.bookings(listing_id);
create index if not exists bookings_status_idx on public.bookings(status);

create table if not exists public.availability_blocks (
  id         text primary key,
  listing_id text not null references public.listings(id),
  check_in   date not null,
  check_out  date not null,
  note       text,
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index if not exists blocks_listing_idx on public.availability_blocks(listing_id);

-- RLS på, inga policies: anon/authenticated förnekas allt; service role går förbi.
alter table public.hosts enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_blocks enable row level security;

-- Atomisk bokning: radlås på listningen serialiserar samtidiga försök, sedan
-- överlappskoll (halvöppna intervall: utcheckningsdagen är ledig) mot både
-- bekräftade bokningar och värdens blockeringar, sedan insert. Allt i ett steg
-- så dubbelbokning inte kan smyga emellan — samma garanti som MemoryStore.
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
  l public.listings%rowtype;
  b public.bookings%rowtype;
begin
  select * into l from public.listings where id = p_listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'LISTING_NOT_FOUND');
  end if;
  if l.status <> 'published' then
    return jsonb_build_object('ok', false, 'error', 'LISTING_NOT_PUBLISHED');
  end if;
  if p_guests > l.max_guests then
    return jsonb_build_object('ok', false, 'error', 'TOO_MANY_GUESTS');
  end if;

  if exists (
    select 1 from public.bookings x
    where x.listing_id = p_listing_id and x.status = 'confirmed'
      and x.check_in < p_check_out and p_check_in < x.check_out
  ) or exists (
    select 1 from public.availability_blocks y
    where y.listing_id = p_listing_id
      and y.check_in < p_check_out and p_check_in < y.check_out
  ) then
    return jsonb_build_object('ok', false, 'error', 'UNAVAILABLE');
  end if;

  insert into public.bookings (
    id, access_token, listing_id, guest_name, guest_email,
    check_in, check_out, guests, nights,
    subtotal_cents, cleaning_fee_cents, service_fee_cents, total_cents,
    currency, status, payment_ref
  ) values (
    p_id, p_access_token, p_listing_id, p_guest_name, p_guest_email,
    p_check_in, p_check_out, p_guests, p_nights,
    p_subtotal_cents, p_cleaning_fee_cents, p_service_fee_cents, p_total_cents,
    p_currency, 'confirmed', p_payment_ref
  ) returning * into b;

  return jsonb_build_object('ok', true, 'booking', to_jsonb(b));
end;
$$;

-- Bara servern får köra funktionen.
revoke all on function public.create_booking(text,text,text,text,text,date,date,int,int,int,int,int,int,text,text) from public, anon, authenticated;

-- Demovärden (samma id som MemoryStore så värdpanelen fungerar identiskt).
insert into public.hosts (id, name, email)
values ('host-demo', 'Blanso Demo Värd', 'vard@blanso.example')
on conflict (id) do nothing;
