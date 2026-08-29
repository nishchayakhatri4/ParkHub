# Supa parking app

The application stores accounts, user vehicle profiles, garages, and temporary
owner sessions in Supabase PostgreSQL. The original text files are retained only
as seed data; normal application reads and writes go through database functions.

## Create and seed the database

1. Create a Supabase project.
2. In its SQL Editor, run
   `supabase/migrations/20260829000000_initial_schema.sql`. Alternatively, from a
   linked Supabase CLI project run `supabase db push`.
3. Copy `.env.example` to `.env`. Fill in the project URL, anon/publishable key,
   and service-role key from the Supabase project settings. Never commit `.env`.
4. Import all existing records:

   ```powershell
   python seed_database.py
   ```

   The importer is idempotent: running it again updates rows with matching email
   addresses or parking IDs. After importing, remove the service-role key from
   `.env`; the normal app needs only the URL and anon key.

## Run

```powershell
python -m pip install -r requirements.txt
python login.py
```

Existing demonstration credentials still work, including
`bob@example.com / 1234` and `olivia.owner@example.com / owner123`.

## Security model

All tables have row-level security enabled and direct anon access is revoked.
Public garage listing and password verification happen in narrow database RPCs.
Owner mutations require an opaque, eight-hour session token returned after a
successful owner login. The service-role key is required only for initial import.

