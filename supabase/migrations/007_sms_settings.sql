-- Ensure required UUID extension (uuid-ossp) is available
create extension if not exists "uuid-ossp";

create table if not exists public.sms_settings (
  id uuid primary key default uuid_generate_v4()
);

-- Ensure required columns exist (idempotent)
alter table public.sms_settings
  add column if not exists provider text;

alter table public.sms_settings
  alter column provider set not null;

alter table public.sms_settings
  add column if not exists from_number text;

alter table public.sms_settings
  alter column from_number set not null;

alter table public.sms_settings
  add column if not exists active boolean;

alter table public.sms_settings
  alter column active set default true;

alter table public.sms_settings
  alter column active set not null;

alter table public.sms_settings
  add column if not exists created_at timestamptz;

alter table public.sms_settings
  alter column created_at set default now();

alter table public.sms_settings
  alter column created_at set not null;

alter table public.sms_settings
  add column if not exists updated_at timestamptz;

alter table public.sms_settings
  alter column updated_at set default now();

alter table public.sms_settings
  alter column updated_at set not null;

create index if not exists idx_sms_settings_active on public.sms_settings(active);
