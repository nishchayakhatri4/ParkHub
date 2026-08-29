-- ============================================================
-- ParkHub Database Schema
-- Supabase PostgreSQL
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- 1. ACCOUNTS
-- ============================================================

create table if not exists public.accounts (
    id uuid primary key default gen_random_uuid(),

    role text not null
        check (role in ('user', 'owner')),

    first_name text not null
        check (length(trim(first_name)) > 0),

    last_name text not null
        check (length(trim(last_name)) > 0),

    email text not null unique
        check (email = lower(email)),

    password_hash text not null
        check (password_hash ~ '^[0-9a-f]{64}$'),

    created_at timestamptz not null default now()
);


-- ============================================================
-- 2. USER PROFILES
-- Additional information for drivers
-- ============================================================

create table if not exists public.user_profiles (
    account_id uuid primary key
        references public.accounts(id)
        on delete cascade,

    license_plate text not null
        check (length(trim(license_plate)) > 0),

    car_model text not null
        check (length(trim(car_model)) > 0)
);


-- ============================================================
-- 3. GARAGES / PARKING SPACES
-- ============================================================

create table if not exists public.garages (
    parking_id text primary key
        check (parking_id ~ '^PARK-[0-9]{3,}$'),

    owner_id uuid not null
        references public.accounts(id)
        on delete cascade,

    parking_name text not null
        check (length(trim(parking_name)) > 0),

    location text not null
        check (length(trim(location)) > 0),

    address text not null
        check (length(trim(address)) > 0),

    hourly_rate numeric(10,2) not null
        check (hourly_rate >= 0),

    -- Average public rating from 0 to 5.
    -- Seed data can set this directly.
    score numeric(2,1) not null default 0
        check (score between 0 and 5),

    -- Whether the owner currently has this listing enabled.
    is_open boolean not null default true,

    latitude double precision not null
        check (latitude between -90 and 90),

    longitude double precision not null
        check (longitude between -180 and 180),

    -- Convenience / safety attributes
    has_lighting boolean not null default false,
    has_cctv boolean not null default false,
    is_covered boolean not null default false,

    description text,

    created_at timestamptz not null default now()
);


create index if not exists garages_owner_id_idx
    on public.garages(owner_id);

create index if not exists garages_open_idx
    on public.garages(is_open);

create index if not exists garages_location_idx
    on public.garages(location);


-- ============================================================
-- 4. GARAGE AVAILABILITY
--
-- 0 = Monday
-- 1 = Tuesday
-- 2 = Wednesday
-- 3 = Thursday
-- 4 = Friday
-- 5 = Saturday
-- 6 = Sunday
-- ============================================================

create table if not exists public.garage_availability (
    id bigint generated always as identity primary key,

    parking_id text not null
        references public.garages(parking_id)
        on delete cascade,

    day_of_week integer not null
        check (day_of_week between 0 and 6),

    start_time time not null,

    end_time time not null,

    check (end_time > start_time),

    unique (
        parking_id,
        day_of_week,
        start_time,
        end_time
    )
);


create index if not exists garage_availability_parking_idx
    on public.garage_availability(parking_id);

create index if not exists garage_availability_day_idx
    on public.garage_availability(day_of_week);


-- ============================================================
-- 5. BOOKINGS
-- ============================================================

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.accounts(id)
        on delete cascade,

    parking_id text not null
        references public.garages(parking_id)
        on delete cascade,

    booking_date date not null,

    start_time time not null,

    end_time time not null,

    total_price numeric(10,2) not null
        check (total_price >= 0),

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'confirmed',
                'checked_in',
                'completed',
                'cancelled'
            )
        ),

    checked_in_at timestamptz,

    checked_out_at timestamptz,

    created_at timestamptz not null default now(),

    check (end_time > start_time)
);


create index if not exists bookings_user_idx
    on public.bookings(user_id);

create index if not exists bookings_parking_idx
    on public.bookings(parking_id);

create index if not exists bookings_parking_date_idx
    on public.bookings(parking_id, booking_date);

create index if not exists bookings_status_idx
    on public.bookings(status);


-- ============================================================
-- 6. REVIEWS
--
-- One review per completed booking.
-- ============================================================

create table if not exists public.reviews (
    id bigint generated always as identity primary key,

    booking_id uuid not null unique
        references public.bookings(id)
        on delete cascade,

    user_id uuid not null
        references public.accounts(id)
        on delete cascade,

    parking_id text not null
        references public.garages(parking_id)
        on delete cascade,

    rating integer not null
        check (rating between 1 and 5),

    comment text
        check (
            comment is null
            or length(comment) <= 1000
        ),

    created_at timestamptz not null default now()
);


create index if not exists reviews_parking_idx
    on public.reviews(parking_id);

create index if not exists reviews_user_idx
    on public.reviews(user_id);


-- ============================================================
-- 7. FAVOURITES
-- ============================================================

create table if not exists public.favourites (
    id bigint generated always as identity primary key,

    user_id uuid not null
        references public.accounts(id)
        on delete cascade,

    parking_id text not null
        references public.garages(parking_id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique (
        user_id,
        parking_id
    )
);


create index if not exists favourites_user_idx
    on public.favourites(user_id);

create index if not exists favourites_parking_idx
    on public.favourites(parking_id);


-- ============================================================
-- 8. PAYMENTS
-- ============================================================

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),

    booking_id uuid not null
        references public.bookings(id)
        on delete cascade,

    user_id uuid not null
        references public.accounts(id)
        on delete cascade,

    stripe_session_id text unique,

    stripe_payment_intent_id text unique,

    amount numeric(10,2) not null
        check (amount >= 0),

    currency text not null default 'aud',

    status text not null
        check (
            status in (
                'pending',
                'paid',
                'failed',
                'refunded'
            )
        ),

    created_at timestamptz not null default now()
);


create index if not exists payments_booking_idx
    on public.payments(booking_id);

create index if not exists payments_user_idx
    on public.payments(user_id);


-- ============================================================
-- 9. APPLICATION SESSIONS
-- ============================================================

create table if not exists public.app_sessions (
    token uuid primary key default gen_random_uuid(),

    account_id uuid not null
        references public.accounts(id)
        on delete cascade,

    expires_at timestamptz not null
        default now() + interval '8 hours',

    created_at timestamptz not null
        default now()
);


create index if not exists app_sessions_account_idx
    on public.app_sessions(account_id);

create index if not exists app_sessions_expiry_idx
    on public.app_sessions(expires_at);


-- ============================================================
-- FUNCTIONS
-- ============================================================


-- ============================================================
-- LOGIN
-- ============================================================

create or replace function public.login_account(
    p_role text,
    p_email text,
    p_password text
)
returns table(
    first_name text,
    email text,
    role text,
    session_token uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_account public.accounts;
    v_token uuid;
begin

    select *
    into v_account
    from public.accounts a
    where
        a.email = lower(trim(p_email))
        and a.role = lower(trim(p_role))
        and a.password_hash =
            encode(
                digest(p_password, 'sha256'),
                'hex'
            );

    if not found then
        return;
    end if;

    delete from public.app_sessions
    where expires_at <= now();

    insert into public.app_sessions(account_id)
    values (v_account.id)
    returning token into v_token;

    return query
    select
        v_account.first_name,
        v_account.email,
        v_account.role,
        v_token;

end;
$$;


-- ============================================================
-- GET ACCOUNT FROM SESSION
-- ============================================================

create or replace function public.session_account(
    p_session_token uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select a.id
    from public.app_sessions s
    join public.accounts a
        on a.id = s.account_id
    where
        s.token = p_session_token
        and s.expires_at > now()
    limit 1;
$$;


-- ============================================================
-- GET OWNER FROM SESSION
-- ============================================================

create or replace function public.session_owner(
    p_session_token uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select a.id
    from public.app_sessions s
    join public.accounts a
        on a.id = s.account_id
    where
        s.token = p_session_token
        and s.expires_at > now()
        and a.role = 'owner'
    limit 1;
$$;


-- ============================================================
-- GET USER FROM SESSION
-- ============================================================

create or replace function public.session_user(
    p_session_token uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select a.id
    from public.app_sessions s
    join public.accounts a
        on a.id = s.account_id
    where
        s.token = p_session_token
        and s.expires_at > now()
        and a.role = 'user'
    limit 1;
$$;


-- ============================================================
-- LIST ALL OPEN GARAGES
-- ============================================================

create or replace function public.list_garages()
returns table(
    parking_id text,
    owner_email text,
    name text,
    location text,
    address text,
    hourly_rate numeric,
    score numeric,
    is_open boolean,
    latitude double precision,
    longitude double precision,
    has_lighting boolean,
    has_cctv boolean,
    is_covered boolean,
    description text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        g.parking_id,
        a.email,
        g.parking_name,
        g.location,
        g.address,
        g.hourly_rate,
        g.score,
        g.is_open,
        g.latitude,
        g.longitude,
        g.has_lighting,
        g.has_cctv,
        g.is_covered,
        g.description
    from public.garages g
    join public.accounts a
        on a.id = g.owner_id
    where g.is_open = true
    order by g.parking_id;
$$;


-- ============================================================
-- LIST OWNER GARAGES
-- ============================================================

create or replace function public.list_owner_garages(
    p_session_token uuid
)
returns table(
    parking_id text,
    parking_name text,
    address text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        g.parking_id,
        g.parking_name,
        g.address
    from public.garages g
    where
        g.owner_id =
            public.session_owner(p_session_token)
    order by g.parking_id;
$$;


-- ============================================================
-- ADD GARAGE
-- ============================================================

create or replace function public.add_garage(
    p_session_token uuid,
    p_parking_name text,
    p_location text,
    p_address text,
    p_hourly_rate numeric,
    p_score numeric,
    p_is_open boolean,
    p_latitude double precision,
    p_longitude double precision
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owner uuid :=
        public.session_owner(p_session_token);

    v_id text;
begin

    if v_owner is null then
        raise exception
            'Invalid or expired owner session';
    end if;

    perform pg_advisory_xact_lock(8712401);

    select
        'PARK-' ||
        lpad(
            (
                coalesce(
                    max(
                        substring(parking_id from 6)::int
                    ),
                    0
                ) + 1
            )::text,
            3,
            '0'
        )
    into v_id
    from public.garages;

    insert into public.garages (
        parking_id,
        owner_id,
        parking_name,
        location,
        address,
        hourly_rate,
        score,
        is_open,
        latitude,
        longitude
    )
    values (
        v_id,
        v_owner,
        trim(p_parking_name),
        trim(p_location),
        trim(p_address),
        p_hourly_rate,
        p_score,
        p_is_open,
        p_latitude,
        p_longitude
    );

    return v_id;

end;
$$;


-- ============================================================
-- REMOVE GARAGE
-- ============================================================

create or replace function public.remove_garage(
    p_session_token uuid,
    p_parking_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

    delete from public.garages
    where
        parking_id =
            upper(trim(p_parking_id))
        and owner_id =
            public.session_owner(p_session_token);

    return found;

end;
$$;


-- ============================================================
-- AUTOMATIC GARAGE RATING UPDATE
--
-- Recalculate garage.score whenever reviews change.
-- ============================================================

create or replace function public.update_garage_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_parking_id text;
begin

    v_parking_id :=
        coalesce(
            new.parking_id,
            old.parking_id
        );

    update public.garages
    set score = coalesce(
        (
            select round(
                avg(r.rating)::numeric,
                1
            )
            from public.reviews r
            where
                r.parking_id =
                    v_parking_id
        ),
        0
    )
    where
        parking_id = v_parking_id;

    return coalesce(new, old);

end;
$$;


drop trigger if exists reviews_update_garage_score
on public.reviews;

create trigger reviews_update_garage_score
after insert or update or delete
on public.reviews
for each row
execute function public.update_garage_rating();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.accounts
    enable row level security;

alter table public.user_profiles
    enable row level security;

alter table public.garages
    enable row level security;

alter table public.garage_availability
    enable row level security;

alter table public.bookings
    enable row level security;

alter table public.reviews
    enable row level security;

alter table public.favourites
    enable row level security;

alter table public.payments
    enable row level security;

alter table public.app_sessions
    enable row level security;


-- ============================================================
-- REMOVE DIRECT TABLE ACCESS
--
-- Backend should interact through controlled functions
-- or the Supabase service-role connection.
-- ============================================================

revoke all on public.accounts
    from anon, authenticated;

revoke all on public.user_profiles
    from anon, authenticated;

revoke all on public.garages
    from anon, authenticated;

revoke all on public.garage_availability
    from anon, authenticated;

revoke all on public.bookings
    from anon, authenticated;

revoke all on public.reviews
    from anon, authenticated;

revoke all on public.favourites
    from anon, authenticated;

revoke all on public.payments
    from anon, authenticated;

revoke all on public.app_sessions
    from anon, authenticated;


-- ============================================================
-- RPC PERMISSIONS
-- ============================================================

grant execute
on function public.login_account(
    text,
    text,
    text
)
to anon, authenticated;


grant execute
on function public.list_garages()
to anon, authenticated;


grant execute
on function public.list_owner_garages(uuid)
to anon, authenticated;


grant execute
on function public.add_garage(
    uuid,
    text,
    text,
    text,
    numeric,
    numeric,
    boolean,
    double precision,
    double precision
)
to anon, authenticated;


grant execute
on function public.remove_garage(
    uuid,
    text
)
to anon, authenticated;