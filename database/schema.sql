-- ParkHub Supabase schema. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create type public.user_role as enum ('driver', 'owner');
create type public.booking_status as enum ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 2 and 100),
  role public.user_role not null default 'driver',
  verified_owner boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.parking_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  description text not null default '',
  price_per_day numeric(10,2) not null check (price_per_day > 0),
  lighting boolean not null default false,
  cctv boolean not null default false,
  covered boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.parking_availability (
  id uuid primary key default gen_random_uuid(),
  parking_space_id uuid not null references public.parking_spaces(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  constraint availability_time_order check (start_time < end_time),
  constraint unique_availability_window unique (parking_space_id, day_of_week, start_time, end_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  parking_space_id uuid not null references public.parking_spaces(id) on delete restrict,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  total_price numeric(10,2) not null check (total_price >= 0),
  status public.booking_status not null default 'pending',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_time_order check (start_time < end_time)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  parking_space_id uuid not null references public.parking_spaces(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  parking_space_id uuid not null references public.parking_spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_favourite unique (user_id, parking_space_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id text not null unique,
  amount integer not null check (amount >= 0),
  currency text not null default 'aud',
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index parking_spaces_location_idx on public.parking_spaces(latitude, longitude) where active;
create index availability_space_day_idx on public.parking_availability(parking_space_id, day_of_week);
create index bookings_conflict_idx on public.bookings(parking_space_id, booking_date, start_time, end_time, status);
create index bookings_user_idx on public.bookings(user_id, booking_date);
create index reviews_space_idx on public.reviews(parking_space_id);

-- Creates a profile from safe metadata supplied during Supabase sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'ParkHub User'), '@', 1)),
    case when new.raw_user_meta_data ->> 'role' = 'owner' then 'owner'::public.user_role else 'driver'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Atomic booking creation prevents two simultaneous requests from reserving one space.
create or replace function public.create_pending_booking(
  p_parking_space_id uuid, p_booking_date date, p_start_time time, p_end_time time
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_space public.parking_spaces;
  v_booking public.bookings;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'driver'
  ) then raise exception 'Driver account required'; end if;
  if p_start_time >= p_end_time then raise exception 'Invalid booking time range'; end if;
  select * into v_space from public.parking_spaces
    where id = p_parking_space_id and active = true for update;
  if not found then raise exception 'Parking space not found or inactive'; end if;
  if v_space.owner_id = auth.uid() then raise exception 'Owners cannot book their own parking space'; end if;
  if not exists (
    select 1 from public.parking_availability
    where parking_space_id = p_parking_space_id
      and day_of_week = extract(isodow from p_booking_date)::int - 1
      and start_time <= p_start_time and end_time >= p_end_time
  ) then raise exception 'Parking space is not available for the requested time'; end if;
  if exists (
    select 1 from public.bookings
    where parking_space_id = p_parking_space_id and booking_date = p_booking_date
      and status in ('pending', 'confirmed', 'checked_in')
      and p_start_time < end_time and p_end_time > start_time
  ) then raise exception 'Parking space is already booked for the requested time'; end if;
  insert into public.bookings (user_id, parking_space_id, booking_date, start_time, end_time, total_price)
    values (auth.uid(), p_parking_space_id, p_booking_date, p_start_time, p_end_time, v_space.price_per_day)
    returning * into v_booking;
  return v_booking;
end;
$$;

-- Authenticated users transition only bookings in which they participate.
-- Payment confirmation is deliberately excluded and is performed by the service-role webhook.
create or replace function public.transition_booking(p_booking_id uuid, p_action text)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings;
  v_owner_id uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  select owner_id into v_owner_id from public.parking_spaces where id = v_booking.parking_space_id;
  if auth.uid() <> v_booking.user_id and auth.uid() <> v_owner_id then
    raise exception 'You are not a participant in this booking';
  end if;

  if p_action = 'check_in' then
    if auth.uid() <> v_booking.user_id then raise exception 'Only the driver can check in'; end if;
    if v_booking.status <> 'confirmed' then raise exception 'Only confirmed bookings can check in'; end if;
    update public.bookings set status = 'checked_in', checked_in_at = now() where id = p_booking_id returning * into v_booking;
  elsif p_action = 'check_out' then
    if auth.uid() <> v_booking.user_id then raise exception 'Only the driver can check out'; end if;
    if v_booking.status <> 'checked_in' then raise exception 'Only checked-in bookings can check out'; end if;
    update public.bookings set status = 'completed', checked_out_at = now() where id = p_booking_id returning * into v_booking;
  elsif p_action = 'cancel' then
    if v_booking.status not in ('pending', 'confirmed') then raise exception 'Only pending or confirmed bookings can be cancelled'; end if;
    update public.bookings set status = 'cancelled' where id = p_booking_id returning * into v_booking;
  else
    raise exception 'Unknown booking action';
  end if;
  return v_booking;
end;
$$;

-- Review integrity is enforced even if a caller bypasses the API.
create or replace function public.validate_review()
returns trigger language plpgsql set search_path = public as $$
declare v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = new.booking_id;
  if not found or v_booking.user_id <> new.user_id
    or v_booking.parking_space_id <> new.parking_space_id
    or v_booking.status <> 'completed' then
    raise exception 'Review requires the user''s completed booking for this parking space';
  end if;
  return new;
end;
$$;

create trigger reviews_validate before insert or update on public.reviews
  for each row execute procedure public.validate_review();

alter table public.profiles enable row level security;
alter table public.parking_spaces enable row level security;
alter table public.parking_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.favourites enable row level security;
alter table public.payments enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "active spaces readable" on public.parking_spaces for select using (active or auth.uid() = owner_id);
create policy "owners insert spaces" on public.parking_spaces for insert with check (
  auth.uid() = owner_id and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);
create policy "owners update spaces" on public.parking_spaces for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete spaces" on public.parking_spaces for delete using (auth.uid() = owner_id);

create policy "availability readable" on public.parking_availability for select using (true);
create policy "owners insert availability" on public.parking_availability for insert with check (
  exists (select 1 from public.parking_spaces p where p.id = parking_space_id and p.owner_id = auth.uid())
);
create policy "owners update availability" on public.parking_availability for update using (
  exists (select 1 from public.parking_spaces p where p.id = parking_space_id and p.owner_id = auth.uid())
);
create policy "owners delete availability" on public.parking_availability for delete using (
  exists (select 1 from public.parking_spaces p where p.id = parking_space_id and p.owner_id = auth.uid())
);

create policy "booking participants read" on public.bookings for select using (
  auth.uid() = user_id or exists (select 1 from public.parking_spaces p where p.id = parking_space_id and p.owner_id = auth.uid())
);
create policy "drivers create bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "reviews readable" on public.reviews for select using (true);
create policy "users create own reviews" on public.reviews for insert with check (auth.uid() = user_id);

create policy "users read own favourites" on public.favourites for select using (auth.uid() = user_id);
create policy "users create own favourites" on public.favourites for insert with check (auth.uid() = user_id);
create policy "users delete own favourites" on public.favourites for delete using (auth.uid() = user_id);

create policy "users read own payments" on public.payments for select using (auth.uid() = user_id);

-- Profile emails remain server-only; clients can read only safe public profile columns.
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, role, verified_owner, created_at) on public.profiles to anon, authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke insert on public.bookings from authenticated;
revoke update on public.bookings from authenticated;
grant execute on function public.create_pending_booking(uuid, date, time, time) to authenticated;
grant execute on function public.transition_booking(uuid, text) to authenticated;
