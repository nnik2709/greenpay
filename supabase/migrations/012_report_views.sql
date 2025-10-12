-- Passport report view
create or replace view public.report_passports as
select
  p.id,
  p.passport_number,
  p.surname,
  p.given_name,
  p.nationality,
  p.date_of_birth,
  p.date_of_expiry,
  p.created_by,
  p.created_at
from public.passports p;

-- Individual purchase report view
create or replace view public.report_individual_purchases as
select
  i.id,
  i.voucher_code,
  i.passport_number,
  i.amount,
  i.payment_method,
  i.valid_from,
  i.valid_until,
  i.used_at,
  i.created_by,
  i.created_at
from public.individual_purchases i;

-- Corporate vouchers report view
create or replace view public.report_corporate_vouchers as
select
  c.id,
  c.voucher_code,
  c.company_name,
  c.amount,
  c.payment_method,
  c.valid_from,
  c.valid_until,
  c.used_at,
  c.created_by,
  c.created_at
from public.corporate_vouchers c;

-- Bulk uploads report view
create or replace view public.report_bulk_uploads as
select
  b.id,
  b.batch_id,
  b.file_name,
  b.total_records,
  b.successful_records,
  b.failed_records,
  b.status,
  b.created_by,
  b.created_at,
  b.completed_at
from public.bulk_uploads b;

-- Quotations report view
create or replace view public.report_quotations as
select
  q.id,
  q.quotation_number,
  q.company_name,
  q.contact_person,
  q.contact_email,
  q.number_of_passports,
  q.amount_per_passport,
  q.total_amount,
  q.valid_until,
  q.status,
  q.created_by,
  q.created_at
from public.quotations q;
