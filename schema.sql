-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Staff Table
create table if not exists public.staff (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    nationality text,
    total_earnings numeric default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Records Table
create table if not exists public.records (
    id uuid default uuid_generate_v4() primary key,
    customer_name text not null,
    phone text,
    amount numeric not null,
    staff_commission numeric not null,
    staff_id uuid references public.staff(id) on delete set null,
    nationality text,
    service_date date not null,
    service_time time without time zone not null,
    room_number text,
    service_timing text,
    body_size text check (body_size in ('BIG', 'NORMAL', 'SMALL')),
    behavior text,
    repeat_customer boolean default false,
    mallu_customer boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Update staff earnings trigger
create or replace function update_staff_earnings()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.staff
    set total_earnings = total_earnings + NEW.staff_commission
    where id = NEW.staff_id;
  elsif (TG_OP = 'UPDATE') then
    if (OLD.staff_id = NEW.staff_id) then
      update public.staff
      set total_earnings = total_earnings - OLD.staff_commission + NEW.staff_commission
      where id = NEW.staff_id;
    else
      -- Revert from old staff
      if OLD.staff_id is not null then
        update public.staff
        set total_earnings = total_earnings - OLD.staff_commission
        where id = OLD.staff_id;
      end if;
      -- Add to new staff
      if NEW.staff_id is not null then
        update public.staff
        set total_earnings = total_earnings + NEW.staff_commission
        where id = NEW.staff_id;
      end if;
    end if;
  elsif (TG_OP = 'DELETE') then
    update public.staff
    set total_earnings = total_earnings - OLD.staff_commission
    where id = OLD.staff_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists tr_update_staff_earnings on public.records;
create trigger tr_update_staff_earnings
after insert or update or delete on public.records
for each row execute procedure update_staff_earnings();

-- Allow all for demonstration purposes (to be refined in a full auth setup)
alter table public.staff enable row level security;
alter table public.records enable row level security;

drop policy if exists "Allow all operations for staff" on public.staff;
create policy "Allow all operations for staff" on public.staff for all using (true);

drop policy if exists "Allow all operations for records" on public.records;
create policy "Allow all operations for records" on public.records for all using (true);
