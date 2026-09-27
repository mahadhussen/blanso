-- Facit för SQL-funktionen create_booking (rumstyper). Samma fall som
-- src/lib/inventory.test.ts och src/lib/store/store.test.ts — databasen och
-- motorn måste säga samma sak. Körs ENDAST mot en lokal engångsdatabas av
-- scripts/verify-room-types.sh, efter att migrationen körts. Varje fel kastar.

\set ON_ERROR_STOP 1

create or replace function pg_temp.expect(label text, res jsonb, ok boolean, err text default null, avail int default null)
returns void language plpgsql as $$
begin
  if (res->>'ok')::boolean is distinct from ok
     or (err is not null and res->>'error' is distinct from err)
     or (avail is not null and (res->>'available')::int is distinct from avail) then
    raise exception 'FEL %: fick %', label, res;
  end if;
  raise notice 'OK  %', label;
end $$;

-- Bokningsanrop med rimliga standardvärden.
create or replace function pg_temp.book(listing text, rt text, rooms int, ci date, co date, guests int default 1)
returns jsonb language sql as $$
  select public.create_booking(
    'bok_' || replace(gen_random_uuid()::text, '-', ''), md5(random()::text) || md5(random()::text),
    listing, rt, rooms, 'Verify Gäst', 'verify@blanso.example',
    ci, co, guests, (co - ci), 10000, 0, 800, 10800, 'USD', 'mock_pi_verify')
$$;

-- Testhotellets rumstyper: Deluxe 3 rum (2 gäster), Suite 1 rum (3 gäster).
insert into public.room_types (id, listing_id, name, size_sqm, bed_config, max_guests, units, nightly_price_cents, sort_order)
values ('t-deluxe', 'lst-hotel', 'Deluxe Double Room', 24, '1 king bed', 2, 3, 9500, 1),
       ('t-suite',  'lst-hotel', 'Suite',              45, '1 king bed', 3, 1, 18000, 2)
on conflict (id) do nothing;

-- Rygg-i-rygg på enda sviten.
select pg_temp.expect('suite 10–13 bokas',            pg_temp.book('lst-hotel','t-suite',1,'2027-01-10','2027-01-13'), true);
select pg_temp.expect('suite 13–15 rygg-i-rygg',      pg_temp.book('lst-hotel','t-suite',1,'2027-01-13','2027-01-15'), true);
select pg_temp.expect('suite 07–10 rygg-i-rygg före', pg_temp.book('lst-hotel','t-suite',1,'2027-01-07','2027-01-10'), true);
select pg_temp.expect('suite 12–14 överlapp vägras',  pg_temp.book('lst-hotel','t-suite',1,'2027-01-12','2027-01-14'), false, 'NOT_ENOUGH_ROOMS', 0);

-- Sista rummet: 3 Deluxe.
select pg_temp.expect('deluxe 2 av 3',                 pg_temp.book('lst-hotel','t-deluxe',2,'2027-02-01','2027-02-04',4), true);
select pg_temp.expect('deluxe 2 till vägras, 1 kvar',  pg_temp.book('lst-hotel','t-deluxe',2,'2027-02-02','2027-02-05'), false, 'NOT_ENOUGH_ROOMS', 1);
select pg_temp.expect('deluxe sista rummet',           pg_temp.book('lst-hotel','t-deluxe',1,'2027-02-03','2027-02-05'), true);
select pg_temp.expect('deluxe fullt, 0 kvar',          pg_temp.book('lst-hotel','t-deluxe',1,'2027-02-03','2027-02-04'), false, 'NOT_ENOUGH_ROOMS', 0);
select pg_temp.expect('deluxe natten efter är fri',    pg_temp.book('lst-hotel','t-deluxe',3,'2027-02-05','2027-02-06',6), true);

-- Avbokade räknas inte.
update public.bookings set status = 'cancelled'
 where room_type_id = 't-deluxe' and check_in = '2027-02-03';
select pg_temp.expect('avbokat rum frigörs',           pg_temp.book('lst-hotel','t-deluxe',1,'2027-02-03','2027-02-04'), true);

-- Stängd rumstyp och stängt hotell.
insert into public.availability_blocks (id, listing_id, room_type_id, check_in, check_out)
values ('blk-t1', 'lst-hotel', 't-deluxe', '2027-03-02', '2027-03-03'),
       ('blk-t2', 'lst-hotel', null,       '2027-03-10', '2027-03-12')
on conflict (id) do nothing;
select pg_temp.expect('stängd rumstyp vägras',         pg_temp.book('lst-hotel','t-deluxe',1,'2027-03-01','2027-03-04'), false, 'UNAVAILABLE');
select pg_temp.expect('annan typ påverkas inte',       pg_temp.book('lst-hotel','t-suite',1,'2027-03-01','2027-03-04'), true);
select pg_temp.expect('rygg-i-rygg mot stängning',     pg_temp.book('lst-hotel','t-deluxe',1,'2027-03-03','2027-03-05'), true);
select pg_temp.expect('stängt hotell stoppar suite',   pg_temp.book('lst-hotel','t-suite',1,'2027-03-11','2027-03-13'), false, 'UNAVAILABLE');
select pg_temp.expect('stängt hotell stoppar deluxe',  pg_temp.book('lst-hotel','t-deluxe',1,'2027-03-09','2027-03-11'), false, 'UNAVAILABLE');

-- Vakter.
select pg_temp.expect('rumstyp från annat boende',     pg_temp.book('lst-hotel','rt-lst-old',1,'2027-04-01','2027-04-02'), false, 'ROOM_TYPE_NOT_FOUND');
select pg_temp.expect('okänd rumstyp',                 pg_temp.book('lst-hotel','t-nope',1,'2027-04-01','2027-04-02'), false, 'ROOM_TYPE_NOT_FOUND');
select pg_temp.expect('0 rum',                         pg_temp.book('lst-hotel','t-deluxe',0,'2027-04-01','2027-04-02'), false, 'INVALID_ROOMS');
select pg_temp.expect('3 gäster i 1 deluxe',           pg_temp.book('lst-hotel','t-deluxe',1,'2027-04-01','2027-04-02',3), false, 'TOO_MANY_GUESTS');
select pg_temp.expect('4 gäster i 2 deluxe',           pg_temp.book('lst-hotel','t-deluxe',2,'2027-04-01','2027-04-02',4), true);
select pg_temp.expect('opublicerat boende',            pg_temp.book('lst-draft','rt-lst-draft',1,'2027-04-01','2027-04-02'), false, 'LISTING_NOT_PUBLISHED');
select pg_temp.expect('okänt boende',                  pg_temp.book('lst-nope','t-deluxe',1,'2027-04-01','2027-04-02'), false, 'LISTING_NOT_FOUND');

update public.room_types set archived_at = now() where id = 't-suite';
select pg_temp.expect('borttagen rumstyp',             pg_temp.book('lst-hotel','t-suite',1,'2027-05-01','2027-05-02'), false, 'ROOM_TYPE_NOT_FOUND');
update public.room_types set archived_at = null where id = 't-suite';

-- Den gamla 15-argumentssignaturen delegerar till standardtypen (1 rum).
select pg_temp.expect('gammal signatur krockar med backfillad bokning',
  public.create_booking('bok_old1', md5('old1') || md5('old1x'), 'lst-old', 'G', 'g@x', '2027-01-11', '2027-01-12', 1, 1, 1, 0, 0, 1, 'USD', 'mock'),
  false, 'NOT_ENOUGH_ROOMS', 0);
select pg_temp.expect('gammal signatur bokar standardtypen',
  public.create_booking('bok_old2', md5('old2') || md5('old2x'), 'lst-old', 'G', 'g@x', '2027-06-01', '2027-06-03', 1, 2, 1, 0, 0, 1, 'USD', 'mock'),
  true);
do $$ begin
  if (select room_type_id || ':' || rooms from public.bookings where id = 'bok_old2') <> 'rt-lst-old:1' then
    raise exception 'FEL gammal signatur: fel rumstyp/antal';
  end if;
  raise notice 'OK  gammal signatur skrev rt-lst-old × 1';
end $$;
