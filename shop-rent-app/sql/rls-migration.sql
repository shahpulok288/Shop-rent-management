-- ============================================
-- RLS Migration
-- Run this if you already executed the old schema.sql
-- that had open "Allow all for development" policies.
-- ============================================

-- 1. Drop old open policies
drop policy if exists "Allow all for development" on public.shops;
drop policy if exists "Allow all for development" on public.rent_payments;
drop policy if exists "Allow all for development" on public.electricity_bills;

-- 2. Make sure RLS is enabled
alter table public.shops enable row level security;
alter table public.rent_payments enable row level security;
alter table public.electricity_bills enable row level security;

-- 3. Create secure policies (authenticated users only)

-- Shops
create policy "Authenticated users can view shops"
  on public.shops for select
  to authenticated
  using (true);

create policy "Authenticated users can insert shops"
  on public.shops for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update shops"
  on public.shops for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete shops"
  on public.shops for delete
  to authenticated
  using (true);

-- Rent payments
create policy "Authenticated users can view rent payments"
  on public.rent_payments for select
  to authenticated
  using (true);

create policy "Authenticated users can insert rent payments"
  on public.rent_payments for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update rent payments"
  on public.rent_payments for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete rent payments"
  on public.rent_payments for delete
  to authenticated
  using (true);

-- Electricity bills
create policy "Authenticated users can view electricity bills"
  on public.electricity_bills for select
  to authenticated
  using (true);

create policy "Authenticated users can insert electricity bills"
  on public.electricity_bills for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update electricity bills"
  on public.electricity_bills for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete electricity bills"
  on public.electricity_bills for delete
  to authenticated
  using (true);