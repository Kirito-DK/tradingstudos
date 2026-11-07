-- Store only the external download URL and the administrator's authorization flag.
-- The MP4 file itself is never uploaded to Supabase or to the TradeStudy server.
alter table public.lessons
  add column if not exists download_url text,
  add column if not exists download_authorized boolean not null default false;

comment on column public.lessons.download_url is
  'HTTPS URL of an externally hosted MP4 file whose download is permitted.';
comment on column public.lessons.download_authorized is
  'Explicit authorization confirmation for offering the external MP4 download.';
