-- Ensure required UUID extension (uuid-ossp) is available
create extension if not exists "uuid-ossp";

create table if not exists public.login_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.login_events enable row level security;
create policy "Users can view own login events" on public.login_events
  for select using (user_id = auth.uid());
create policy "Admins can view all login events" on public.login_events
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','IT_Support'))
  );

create index if not exists idx_login_events_user on public.login_events(user_id);
create index if not exists idx_login_events_created_at on public.login_events(created_at);
