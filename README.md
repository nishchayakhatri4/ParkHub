# ParkHub

## Watch the pitch

<a href="https://youtu.be/YcTpffHbx14?si=9BTni3reZ6PZNEXC">
  <img src="https://img.youtube.com/vi/YcTpffHbx14/hqdefault.jpg" alt="Watch the ParkHub pitch on YouTube" width="420">
</a>

[Watch the ParkHub pitch on YouTube](https://youtu.be/YcTpffHbx14?si=9BTni3reZ6PZNEXC)

> **"Can't park there, mate!"**

ParkHub is a peer-to-peer parking space sharing platform that connects drivers looking for affordable parking with people who have unused private parking spaces.

Instead of simply showing nearby parking spaces, ParkHub aims to recommend the **best parking option** based on price, distance, availability, ratings, safety, and convenience.

## Project Overview

Finding affordable parking in busy areas of Sydney can be difficult, especially around universities, CBD areas, and transport hubs. At the same time, many private driveways and parking spaces remain unused for large portions of the day.

ParkHub connects these two sides:

**Drivers**

* Find available private parking spaces
* Compare price, distance, ratings, safety, and convenience
* Book parking for specific time periods
* Pay securely
* Check in and check out through the app

**Parking Owners**

* List unused parking spaces
* Set availability
* Set pricing
* Receive bookings
* Track earnings

## Core Features

### Smart Parking Recommendation

ParkHub ranks available parking spaces instead of simply displaying them.

The ranking considers:

* Price
* Walking distance
* Availability
* Customer rating
* Safety
* Convenience

Users receive a short list of the best available options.

Example:

```text
Best Overall
$8/day
4 min walk
4.9/5 stars (47 reviews)

Cheapest
$6/day
8 min walk
4.6/5 stars (31 reviews)

Closest
$10/day
2 min walk
4.8/5 stars (22 reviews)
```

### Five-Star Ratings and Reviews

Drivers can rate completed parking bookings from **0 to 5 stars** and leave a written review. Listings show their average star rating and review count so users can compare previous customer experiences.

Listings also display useful trust and accessibility information, including:

* Owner verification
* Lighting
* CCTV/security
* Accessibility notes
* Reviews from previous bookings

Example:

```text
4.9/5 stars from 47 reviews
Verified owner
Well-lit
CCTV available
```

### Time-Based Parking

Owners can make their parking spaces available only when they are not using them.

Example:

```text
Monday - Friday
9:00 AM - 4:00 PM
$7/day
```

This allows unused parking capacity to become a source of income.

### Booking

Users can select a parking space and book it for a specific date and time.

```text
Search
   ↓
Select parking
   ↓
Review booking
   ↓
Payment
   ↓
Booking confirmed
```

### Check-In and Check-Out

Users receive a simple interface with large actions:

```text
[ CHECK IN ]
```

and later:

```text
[ CHECK OUT ]
```

This provides a fast experience when arriving at or leaving a parking space.

### Stripe Payments

The prototype uses **Stripe Test Mode** to demonstrate a realistic payment workflow without processing real money.

```text
BOOK NOW
   ↓
Stripe Checkout
   ↓
Payment Successful
   ↓
Booking Confirmed
```

### User and Owner Dashboards

Users can view:

* Upcoming bookings
* Previous bookings
* Favourite locations
* Favourite owners
* Profile information

Owners can view:

* Parking listings
* Upcoming bookings
* Earnings
* Availability
* Profile information

### Favourite Locations and Owners

Users can save frequently used:

* Parking spaces
* Locations
* Owners

### Authentication

ParkHub supports separate user and owner accounts.

The prototype may also include a demonstration MFA flow.

## Tech Stack

| Component       | Technology                |
| --------------- | ------------------------- |
| Frontend        | React                     |
| UI              | shadcn/ui                 |
| Backend         | FastAPI                   |
| Database        | Supabase PostgreSQL       |
| Maps            | Nominatim / OpenStreetMap |
| Payments        | Stripe                    |
| Version Control | Git + GitHub              |

## Architecture

```text
                React Frontend
                + shadcn/ui
                     |
                     | REST API
                     v
                FastAPI Backend
                     |
          +----------+----------+
          |          |          |
          v          v          v
      Supabase   Nominatim   Stripe
      PostgreSQL OpenStreetMap Payments
```

## Project Structure

```text
parkhub/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── lib/
│
├── backend/
│   ├── app/
│   ├── routers/
│   ├── services/
│   └── models/
│
├── database/
│   └── schema.sql
│
├── README.md
└── .gitignore
```

## Database Structure

The main database entities are:

```text
users
owners
parking_spaces
parking_availability
bookings
payments
reviews
favourites
check_ins
```

Basic relationships:

```text
User
 ├── Bookings
 ├── Favourites
 └── Reviews

Owner
 ├── Parking Spaces
 └── Bookings

Parking Space
 ├── Availability
 ├── Bookings
 └── Reviews
```

## Main API Endpoints

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/mfa/verify
GET  /users/me
```

### Parking

```text
GET    /parking/search
GET    /parking/{id}
POST   /parking
PUT    /parking/{id}
DELETE /parking/{id}
```

### Bookings

```text
POST /bookings
GET  /bookings/{id}
GET  /users/me/bookings

POST /bookings/{id}/check-in
POST /bookings/{id}/check-out
POST /bookings/{id}/cancel
```

### Payments

```text
POST /payments/create-checkout
POST /payments/webhook
```

## Demo Workflow

The final hackathon demo should show one complete end-to-end journey:

```text
LOGIN
  ↓
SEARCH LOCATION
  ↓
SELECT DATE AND TIME
  ↓
GET TOP 5 PARKING SPACES
  ↓
VIEW RATINGS AND REVIEWS
  ↓
SELECT PARKING
  ↓
BOOK
  ↓
STRIPE TEST PAYMENT
  ↓
BOOKING CONFIRMED
  ↓
CHECK IN
  ↓
CHECK OUT
  ↓
OWNER SEES BOOKING AND EARNINGS
```

## Demo Data

To make the application immediately usable during the presentation, the database should be seeded with realistic data.

Suggested demo data:

```text
20 parking spaces
5 owners
10 users
30 reviews
Multiple availability windows
Past bookings
Future bookings
```

Suggested Sydney locations:

```text
University of Sydney
Broadway
Redfern
Central
Newtown
Glebe
Ultimo
```

## Run ParkHub Locally

### Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) 20 or later, including npm
- [Python](https://www.python.org/downloads/) 3.11 or later
- A PostgreSQL database. The project is designed for Supabase PostgreSQL.
- Stripe test credentials only if you want to exercise the payment flow

Run every command below from a terminal opened in the repository root.

### Option 1: Run the frontend only

The interface includes demo content and can be explored without starting the API. Features that save or retrieve live data will not work in this mode.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Option 2: Run the complete application

The frontend and backend must run at the same time. Use two terminal windows.

#### 1. Configure the backend

Copy the environment template:

**Windows PowerShell**

```powershell
Copy-Item backend/.env.example backend/.env
```

**macOS or Linux**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and provide your own values:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_test_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

`DATABASE_URL` is required for data-backed features. Stripe values are optional unless you use payments. Use test-mode Stripe keys during local development.

Initialize a new database by running [`database/schema.sql`](database/schema.sql) in the Supabase SQL editor or against your PostgreSQL database.

#### 2. Start the backend

Create the virtual environment from the repository root:

```bash
python -m venv .venv
```

Activate it:

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**

```bat
.venv\Scripts\activate.bat
```

**macOS or Linux**

```bash
source .venv/bin/activate
```

Install the Python dependencies and start FastAPI:

```bash
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend --port 8000
```

Confirm the API is running:

- Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Interactive API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:8000` as its default API URL. To change it, create or update `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Open [http://localhost:5173](http://localhost:5173) and keep both terminals running.

### Useful development commands

Run these inside `frontend/`:

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build locally
npm run lint     # Check the frontend source with ESLint
```

To stop either development server, press `Ctrl+C` in its terminal.

### Troubleshooting

- If port `5173` is already in use, Vite will display the alternate URL it selected.
- If the UI cannot reach the API, verify that FastAPI is running on port `8000` and that `VITE_API_URL` matches it.
- If API requests return `503 Database is not configured`, check `DATABASE_URL` in `backend/.env` and restart FastAPI.
- If PowerShell blocks virtual-environment activation, run `Set-ExecutionPolicy -Scope Process Bypass`, then activate the environment again.
- Never commit `.env` files, database passwords, or API keys.

## What We Are Not Building

To keep the hackathon prototype focused, the following are outside the initial scope:

```text
Real-time GPS tracking
Complex insurance infrastructure
Production-grade MFA
Real-time navigation
Complex tax infrastructure
Native mobile applications
Full review moderation
Boat marketplace implementation
```

## Future Expansion

The long-term vision is to extend ParkHub beyond parking into a broader marketplace for unused private space.

Potential categories:

```text
Parking
   ↓
Driveways
   ↓
Garages
   ↓
Boat Spaces
   ↓
Storage Spaces
```

The broader concept becomes:

> **A peer-to-peer marketplace for unused private space.**

For the hackathon, parking remains the primary use case.

## Team Goal

The goal is not to build every possible feature.

The goal is to deliver one **polished, working end-to-end experience** that clearly demonstrates the value of ParkHub:

> **ParkHub does not just find parking. It finds the best parking for you, makes private parking more trustworthy, and lets unused spaces become useful.**

---

## License

This project is being developed as a hackathon prototype.
