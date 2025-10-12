-- Ensure required UUID extension (uuid-ossp) is available
create extension if not exists "uuid-ossp";

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_table on public.audit_logs(table_name);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

alter table public.audit_logs enable row level security;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','IT_Support'))
  );
