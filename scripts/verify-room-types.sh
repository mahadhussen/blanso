#!/usr/bin/env bash
# Bevisar rumstypsmigrationen mot en LOKAL engångs-Postgres — aldrig mot en
# riktig databas. Kör init-schemat, lägger in data i det gamla formatet, kör
# migrationen TVÅ gånger (idempotens), kontrollerar backfillen, kör
# create_booking-facit (scripts/verify-room-types.sql) och kapplöpningar där
# N samtidiga anslutningar slåss om K lediga rum.
#
#   PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres scripts/verify-room-types.sh
#
# Skapar en ny databas per körning (blanso_verify_<tid>); raderar ingenting.
set -euo pipefail

case "${PGHOST:-}" in
  127.0.0.1|localhost|::1) ;;
  *) echo "STOPP: PGHOST måste vara en lokal adress (127.0.0.1/localhost), fick '${PGHOST:-}'." >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="${MIG:-$ROOT/supabase/migrations/20260927120000_room_types.sql}"
DB="blanso_verify_$(date +%s)"
export PGDATABASE="$DB"
Q() { psql -X -q -v ON_ERROR_STOP=1 -tA "$@"; }

createdb "$DB"
echo "== Databas $DB på $PGHOST:$PGPORT"

# Supabase-rollerna som schemat refererar till (finns alltid i Supabase).
Q -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end \$\$;"

Q -f "$ROOT/supabase/migrations/20260901000000_init.sql" >/dev/null
echo "OK  init-schemat kört"

# Data i det GAMLA formatet (före rumstyper), skrivet med den gamla funktionen.
Q >/dev/null <<'SQL'
insert into public.listings (id, host_id, host_name, slug, status, title, city, country, description,
  nightly_price_cents, cleaning_fee_cents, max_guests, bedrooms, beds, baths)
values ('lst-old',   'host-demo', 'A', 'old',   'published', 'Old flat',   'Hargeisa', 'Somaliland', 'd', 10000, 2000, 3, 1, 2, 1),
       ('lst-hotel', 'host-demo', 'A', 'hotel', 'published', 'Test hotel', 'Nairobi',  'Kenya',      'd',  9500,    0, 2, 1, 1, 1),
       ('lst-draft', 'host-demo', 'A', 'draft', 'draft',     'Draft',      'Kigali',   'Rwanda',     'd',  5000,    0, 1, 1, 1, 1);
select public.create_booking('bok_b1','tok_b1','lst-old','G1','g@x','2027-01-10','2027-01-13',2,3,30000,2000,2400,34400,'USD','p1');
select public.create_booking('bok_b2','tok_b2','lst-old','G2','g@x','2027-01-13','2027-01-15',2,2,20000,2000,1600,23600,'USD','p2');
insert into public.bookings (id, access_token, listing_id, guest_name, guest_email, check_in, check_out, guests, nights,
  subtotal_cents, cleaning_fee_cents, service_fee_cents, total_cents, status, payment_ref)
values ('bok_b3','tok_b3','lst-old','G3','g@x','2027-01-11','2027-01-12',1,1,10000,0,800,10800,'cancelled','p3');
insert into public.availability_blocks (id, listing_id, check_in, check_out, note)
values ('blk-old', 'lst-old', '2027-08-01', '2027-08-05', 'underhåll');
SQL
echo "OK  gammal data: 3 boenden, 3 bokningar (1 avbokad), 1 stängning"

# Migrationen två gånger.
Q -f "$MIG" >/dev/null
Q -f "$MIG" >/dev/null
echo "OK  migrationen körd två gånger utan fel"

check() { # check <etikett> <sql> <förväntat>
  local got; got="$(Q -c "$2")"
  if [[ "$got" != "$3" ]]; then echo "FEL $1: fick '$got', väntade '$3'" >&2; exit 1; fi
  echo "OK  $1 ($got)"
}
check "en härledd rumstyp per boende, inga dubbletter" \
  "select string_agg(id || '=' || units || '/' || nightly_price_cents || '/' || max_guests, ',' order by id) from public.room_types" \
  "rt-lst-draft=1/5000/1,rt-lst-hotel=1/9500/2,rt-lst-old=1/10000/3"
check "härledd typ: namn, säng, ingen påhittad storlek" \
  "select name || '|' || bed_config || '|' || coalesce(size_sqm::text,'null') from public.room_types where id='rt-lst-old'" \
  "Standard Room|2 beds|null"
check "alla bokningar pekade på sin typ, rooms=1" \
  "select string_agg(id || '>' || room_type_id || 'x' || rooms, ',' order by id) from public.bookings" \
  "bok_b1>rt-lst-oldx1,bok_b2>rt-lst-oldx1,bok_b3>rt-lst-oldx1"
check "room_type_id är NOT NULL" \
  "select is_nullable from information_schema.columns where table_name='bookings' and column_name='room_type_id'" "NO"
check "befintlig stängning gäller hela boendet (null)" \
  "select coalesce(room_type_id,'null') from public.availability_blocks where id='blk-old'" "null"
check "RLS på room_types" \
  "select relrowsecurity from pg_class where relname='room_types'" "t"
check "anon får inte köra create_booking" \
  "select has_function_privilege('anon','public.create_booking(text,text,text,text,int,text,text,date,date,int,int,int,int,int,int,text,text)','execute')" "f"

# Facit för create_booking.
psql -X -q -v ON_ERROR_STOP=1 -f "$ROOT/scripts/verify-room-types.sql" 2>&1 | sed -n 's/^.*NOTICE:  //p'

# Kapplöpningar: N samtidiga anslutningar, var och en håller låset 300 ms.
race() { # race <etikett> <units> <n> <rooms> <förväntade vinnare>
  local rt="t-race-$1"
  Q -c "insert into public.room_types (id, listing_id, name, max_guests, units, nightly_price_cents)
        values ('$rt','lst-hotel','Race',4,$2,1000)" >/dev/null
  local out; out="$(mktemp)"
  for i in $(seq 1 "$3"); do
    ( psql -X -q -tA -c "begin;
        select (public.create_booking('bok_${rt}_$i','tok_${rt}_$i','lst-hotel','$rt',$4,'R','r@x',
          '2027-09-01','2027-09-04',1,3,1,0,0,1,'USD','p'))->>'ok';
        select pg_sleep(0.3); commit;" | head -1 >> "$out" ) &
  done
  wait
  local wins; wins="$(grep -c '^true$' "$out" || true)"
  local total; total="$(wc -l < "$out" | tr -d ' ')"
  rm -f "$out"
  if [[ "$wins" != "$5" || "$total" != "$3" ]]; then
    echo "FEL kapplöpning $1: $wins vinnare av $total svar, väntade $5 av $3" >&2; exit 1
  fi
  echo "OK  kapplöpning $1: $3 samtidiga × $4 rum mot $2 lediga ⇒ exakt $wins vinnare"
}
race k3 3 20 1 3
race k3x2 3 10 2 1
race k1 1 25 1 1

# Slutinvariant över HELA databasen: ingen natt, ingen rumstyp överbokad.
check "ingen natt överbokad någonstans" \
  "select count(*) from (
     select rt.id, n.night
       from public.room_types rt
       join public.bookings b on b.room_type_id = rt.id and b.status = 'confirmed'
       cross join lateral generate_series(b.check_in, b.check_out - 1, interval '1 day') n(night)
      group by rt.id, rt.units, n.night
     having sum(b.rooms) > rt.units) x" "0"

echo "ALLT GRÖNT: migrationen är idempotent, backfillen korrekt och create_booking håller lagret."
