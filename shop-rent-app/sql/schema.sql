-- Shop Rent Management System Schema
-- For Supabase (PostgreSQL)

-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Shops table
create table public.shops (
  id uuid primary key default uuid_generate_v4(),
  shop_number text not null unique,
  tenant_name text,
  tenant_phone text,
  monthly_rent numeric(12,2) not null default 0,
  electricity_meter text,
  security_deposit numeric(12,2) default 0,
  status text not null default 'active' check (status in ('active', 'vacant', 'maintenance')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rent payments
create table public.rent_payments (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  amount numeric(12,2) not null,
  collection_date date not null default current_date,
  payment_method text not null check (payment_method in ('cash', 'bkash', 'bank', 'other')),
  rent_month date not null, -- first day of the month being paid
  notes text,
  created_at timestamptz not null default now()
);

-- Electricity bills (separate per shop)
create table public.electricity_bills (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  previous_reading numeric(12,2) not null default 0,
  current_reading numeric(12,2) not null,
  units numeric(12,2) generated always as (current_reading - previous_reading) stored,
  bill_amount numeric(12,2) not null,
  bill_month date not null, -- first day of the billing month
  is_paid boolean not null default false,
  payment_date date,
  payment_method text check (payment_method in ('cash', 'bkash', 'bank', 'other')),
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_rent_payments_shop on public.rent_payments(shop_id);
create index idx_rent_payments_month on public.rent_payments(rent_month);
create index idx_electricity_shop on public.electricity_bills(shop_id);
create index idx_electricity_month on public.electricity_bills(bill_month);

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shops_updated_at
  before update on public.shops
  for each row execute function public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Strategy: Only authenticated users can access data.
-- Perfect for a single-owner application.
-- Later you can tighten further (e.g. per-owner ownership).

alter table public.shops enable row level security;
alter table public.rent_payments enable row level security;
alter table public.electricity_bills enable row level security;

-- Drop any old open policies if they exist
drop policy if exists "Allow all for development" on public.shops;
drop policy if exists "Allow all for development" on public.rent_payments;
drop policy if exists "Allow all for development" on public.electricity_bills;

-- Shops policies
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

-- Rent payments policies
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

-- Electricity bills policies
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

-- Seed the 13 shops
insert into public.shops (shop_number, tenant_name, monthly_rent, status) values
  ('Shop 01', null, 10000, 'vacant'),
  ('Shop 02', null, 10000, 'vacant'),
  ('Shop 03', null, 10000, 'vacant'),
  ('Shop 04', null, 10000, 'vacant'),
  ('Shop 05', null, 10000, 'vacant'),
  ('Shop 06', null, 10000, 'vacant'),
  ('Shop 07', null, 10000, 'vacant'),
  ('Shop 08', null, 10000, 'vacant'),
  ('Shop 09', null, 10000, 'vacant'),
  ('Shop 10', null, 10000, 'vacant'),
  ('Shop 11', null, 10000, 'vacant'),
  ('Shop 12', null, 10000, 'vacant'),
  ('Shop 13', null, 10000, 'vacant');