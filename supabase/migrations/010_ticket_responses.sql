create table if not exists public.ticket_responses (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_staff_response boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ticket_responses enable row level security;
create policy "Users can view responses for visible tickets" on public.ticket_responses
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and (
        t.created_by = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','IT_Support'))
      )
    )
  );

create policy "Users can insert responses on own or admin tickets" on public.ticket_responses
  for insert with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and (
        t.created_by = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','IT_Support'))
      )
    )
  );

create trigger update_ticket_responses_updated_at before update on public.ticket_responses
for each row execute function public.update_updated_at_column();
