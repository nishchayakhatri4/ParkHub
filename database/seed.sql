
-- Seeds 3 owner accounts and 30 garages from the supplied mock data.
-- Safe to re-run: owners and garages are updated on conflict.

begin;

insert into public.accounts (
    role, first_name, last_name, email, password_hash
)
values
('owner','Olivia','Martin','olivia.owner@example.com','43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9'),
('owner','Michael','Lee','michael.owner@example.com','8ac22ad270f063c78075affaf65f1999703cd116583a41f5ae3e725b4d26bf06'),
('owner','Emma','Taylor','emma.owner@example.com','63f4d75c2c7aba0c91d817e05cbf1cca115431116297414dddd5f7f68af5ce7f')
on conflict (email) do update
set role=excluded.role,
    first_name=excluded.first_name,
    last_name=excluded.last_name,
    password_hash=excluded.password_hash;

insert into public.garages (
    parking_id, owner_id, parking_name, location, address,
    hourly_rate, score, is_open, latitude, longitude
)
values
('PARK-001',(select id from public.accounts where email='olivia.owner@example.com'),'SantaPark','Newtown','330 King Street, Newtown NSW 2042',10.00,4.2,true,-33.8976,151.1792),
('PARK-002',(select id from public.accounts where email='michael.owner@example.com'),'CatParking','Sydney CBD','187 Thomas Street, Haymarket NSW 2000',20.00,4.5,true,-33.8812,151.2028),
('PARK-003',(select id from public.accounts where email='emma.owner@example.com'),'ParkNow','Parramatta','20 Macquarie Street, Parramatta NSW 2150',50.00,3.8,false,-33.8141,151.0054),
('PARK-004',(select id from public.accounts where email='olivia.owner@example.com'),'HappyParking','Bondi','38 Hall Street, Bondi Beach NSW 2026',60.00,4.7,true,-33.8882,151.2708),
('PARK-005',(select id from public.accounts where email='michael.owner@example.com'),'MoonlightParking','Manly','25 Wentworth Street, Manly NSW 2095',30.00,4.4,true,-33.7992,151.2867),
('PARK-006',(select id from public.accounts where email='emma.owner@example.com'),'RomanticParking','Newtown','18 Enmore Road, Newtown NSW 2042',30.00,3.9,false,-33.8997,151.1745),
('PARK-007',(select id from public.accounts where email='olivia.owner@example.com'),'WorldPark','Sydney CBD','1 Eddy Avenue, Haymarket NSW 2000',25.00,4.1,true,-33.8830,151.2061),
('PARK-008',(select id from public.accounts where email='michael.owner@example.com'),'CentralParking','Parramatta','140 Marsden Street, Parramatta NSW 2150',35.00,4.6,true,-33.8168,151.0012),
('PARK-009',(select id from public.accounts where email='emma.owner@example.com'),'SmileParking','Bondi','180 Campbell Parade, Bondi Beach NSW 2026',40.00,4.0,false,-33.8910,151.2748),
('PARK-010',(select id from public.accounts where email='olivia.owner@example.com'),'FriendshipParking','Manly','12 Whistler Street, Manly NSW 2095',30.00,4.8,true,-33.7971,151.2862),
('PARK-011',(select id from public.accounts where email='michael.owner@example.com'),'MetroPark','Sydney CBD','50 Goulburn Street, Sydney NSW 2000',28.00,4.3,true,-33.8784,151.2058),
('PARK-012',(select id from public.accounts where email='emma.owner@example.com'),'HarbourGarage','Sydney CBD','100 Murray Street, Pyrmont NSW 2009',32.00,4.6,true,-33.8715,151.1977),
('PARK-013',(select id from public.accounts where email='olivia.owner@example.com'),'CitySquareParking','Sydney CBD','60 Elizabeth Street, Sydney NSW 2000',38.00,4.1,false,-33.8716,151.2105),
('PARK-014',(select id from public.accounts where email='michael.owner@example.com'),'DomainParking','Sydney CBD','1 St Marys Road, Sydney NSW 2000',24.00,4.7,true,-33.8712,151.2164),
('PARK-015',(select id from public.accounts where email='emma.owner@example.com'),'RiverPark','Parramatta','30 Phillip Street, Parramatta NSW 2150',22.00,4.2,true,-33.8113,151.0090),
('PARK-016',(select id from public.accounts where email='olivia.owner@example.com'),'WestGateParking','Parramatta','85 George Street, Parramatta NSW 2150',27.00,3.9,true,-33.8144,151.0080),
('PARK-017',(select id from public.accounts where email='michael.owner@example.com'),'CivicPlaceGarage','Parramatta','12 Darcy Street, Parramatta NSW 2150',18.00,4.5,false,-33.8171,151.0052),
('PARK-018',(select id from public.accounts where email='emma.owner@example.com'),'ChurchStreetParking','Parramatta','210 Church Street, Parramatta NSW 2150',25.00,4.3,true,-33.8111,151.0033),
('PARK-019',(select id from public.accounts where email='olivia.owner@example.com'),'BeachsideGarage','Bondi','90 Curlewis Street, Bondi Beach NSW 2026',45.00,4.6,true,-33.8879,151.2745),
('PARK-020',(select id from public.accounts where email='michael.owner@example.com'),'PacificParking','Bondi','152 Campbell Parade, Bondi Beach NSW 2026',55.00,4.2,true,-33.8901,151.2746),
('PARK-021',(select id from public.accounts where email='emma.owner@example.com'),'OceanViewParking','Bondi','16 O''Brien Street, Bondi Beach NSW 2026',35.00,3.8,false,-33.8874,151.2695),
('PARK-022',(select id from public.accounts where email='olivia.owner@example.com'),'JunctionPark','Bondi','80 Ebley Street, Bondi Junction NSW 2022',30.00,4.4,true,-33.8925,151.2473),
('PARK-023',(select id from public.accounts where email='michael.owner@example.com'),'KingStreetGarage','Newtown','198 King Street, Newtown NSW 2042',16.00,4.0,true,-33.8945,151.1834),
('PARK-024',(select id from public.accounts where email='emma.owner@example.com'),'EnmorePark','Newtown','110 Enmore Road, Newtown NSW 2042',14.00,4.5,true,-33.9000,151.1710),
('PARK-025',(select id from public.accounts where email='olivia.owner@example.com'),'StationParking','Newtown','2 Station Street, Newtown NSW 2042',20.00,4.1,false,-33.8971,151.1798),
('PARK-026',(select id from public.accounts where email='michael.owner@example.com'),'CamperdownGarage','Newtown','25 Missenden Road, Camperdown NSW 2050',18.00,4.3,true,-33.8885,151.1774),
('PARK-027',(select id from public.accounts where email='emma.owner@example.com'),'CorsoParking','Manly','45 The Corso, Manly NSW 2095',34.00,4.2,true,-33.7970,151.2872),
('PARK-028',(select id from public.accounts where email='olivia.owner@example.com'),'HarbourSideGarage','Manly','8 East Esplanade, Manly NSW 2095',28.00,4.6,true,-33.7997,151.2847),
('PARK-029',(select id from public.accounts where email='michael.owner@example.com'),'OceanBeachParking','Manly','95 North Steyne, Manly NSW 2095',38.00,4.0,false,-33.7927,151.2884),
('PARK-030',(select id from public.accounts where email='emma.owner@example.com'),'IvanhoePark','Manly','10 Sydney Road, Manly NSW 2095',26.00,4.4,true,-33.7973,151.2840)
on conflict (parking_id) do update
set owner_id=excluded.owner_id,
    parking_name=excluded.parking_name,
    location=excluded.location,
    address=excluded.address,
    hourly_rate=excluded.hourly_rate,
    score=excluded.score,
    is_open=excluded.is_open,
    latitude=excluded.latitude,
    longitude=excluded.longitude;

commit;

select count(*) as owner_count
from public.accounts
where role = 'owner';

select count(*) as garage_count
from public.garages;