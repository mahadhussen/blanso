-- Storage-hink för värdarnas boendefoton.
-- Publik läsning: annonssidor visar bilderna via publika URL:er utan auth.
-- Skrivning sker ENBART med service role (server), som förbigår RLS — därför
-- behövs ingen extra policy på storage.objects för uppladdning.
-- Idempotent: kan köras om utan att något går sönder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880, -- 5 MB, speglar MAX_BYTES i src/lib/imageStore.ts
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
