create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  invoice_number text unique not null,
  invoice_date date not null default (now() at time zone 'utc')::date,
  due_date date,
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  payment_date date,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_number on public.invoices(invoice_number);
create index if not exists idx_invoices_status on public.invoices(status);

alter table public.invoices enable row level security;
create policy "Authenticated users can view invoices" on public.invoices
  for select using (auth.role() = 'authenticated');
create policy "Finance managers and admins can manage invoices" on public.invoices
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','Finance_Manager'))
  );

create trigger update_invoices_updated_at before update on public.invoices
for each row execute function public.update_updated_at_column();
