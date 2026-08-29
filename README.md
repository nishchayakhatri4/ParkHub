# ParkHub

## Watch the pitch

<a href="https://youtu.be/YcTpffHbx14?si=9BTni3reZ6PZNEXC">
  <img src="https://img.youtube.com/vi/YcTpffHbx14/hqdefault.jpg" alt="Watch the ParkHub pitch on YouTube" width="420">
</a>

[Watch the ParkHub pitch on YouTube](https://youtu.be/YcTpffHbx14?si=9BTni3reZ6PZNEXC)

> **"Can't park there, mate!"**

ParkHub is a peer-to-peer parking space sharing platform that connects drivers looking for affordable parking with people who have unused private parking spaces.

Instead of simply showing parking spaces, ParkHub recommends the **best available option** for a selected area, date, and time based on hourly price, ratings, and convenience features.

## Project Overview

Finding affordable parking in busy areas of Sydney can be difficult, especially around universities, CBD areas, and transport hubs. At the same time, many private driveways and parking spaces remain unused for large portions of the day.

ParkHub connects these two sides:

**Drivers**

* Find available private parking spaces
* Compare hourly prices, ratings, and safety features
* Book parking for specific time periods
* Complete a Stripe test checkout
* Check in and check out through the app

**Parking Owners**

* List unused parking spaces
* Set availability
* Set pricing
* Receive bookings
* Track earnings

## Core Features

### Smart Parking Recommendation

ParkHub first filters spaces by exact location, date, time, availability, and booking conflicts. It then ranks the matching spaces.

The ranking considers:

* Hourly price
* Customer rating
* Lighting
* CCTV
* Covered parking

Users receive a short list of the best available options.

Example:

```text
Best Overall
$14/hour
4.9/5 stars (47 reviews)

Cheapest
$10/hour
4.6/5 stars (31 reviews)

Highest Rated
$18/hour
5.0/5 stars (22 reviews)

Best Value
$12/hour
4.8/5 stars (22 reviews)
```

### Five-Star Ratings and Reviews

The reviews API accepts **1 to 5 stars** and an optional comment after a booking is completed. Each booking can receive one persisted review. Listing ratings are recalculated when persisted reviews change.

The checkout page also contains a **0 to 5 star demo control**. Its submit action currently updates the interface only and does not save the selection to the API.

Listings display useful information including:

* Lighting
* CCTV/security
* Covered parking
* Accessibility notes
* Reviews from previous bookings

The verified badges, host details, policies, accessibility notes, and filler reviews currently shown in the frontend are presentation content rather than verified backend data.

Example:

```text
4.9/5 stars from 47 reviews
Well-lit
CCTV available
Covered parking
```

### Time-Based Parking

Owners can make their parking spaces available only when they are not using them.

Example:

```text
Monday - Friday
9:00 AM - 4:00 PM
$7/hour
```

This allows unused parking capacity to become a source of income.

### Booking

Users can select a parking space and book it for a specific date and time.

```text
Search
   |
   v
Select parking
   |
   v
Review booking
   |
   v
Payment
   |
   v
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
   |
   v
Stripe Checkout
   |
   v
Payment Successful
   |
   v
Booking Confirmed
```

### User and Owner Dashboards

Users can view:

* Upcoming bookings
* Previous bookings
* Total booking count
* Check-in and check-out actions

Owners can view:

* Parking-space summaries
* Weekly paid booking count
* Weekly earnings
* Average rating
* Active-space count

### Favourite Parking Spaces

The backend API supports listing, adding, and removing favourite parking spaces. A favourites interface is not currently connected in the frontend.

### Authentication

ParkHub supports registration and login for separate driver and owner roles using database-backed application sessions.

## Tech Stack

| Component | Technology |
| --- | --- |
| Frontend | React 19 and Vite 8 |
| Styling and UI | Tailwind CSS 4, shadcn/ui, and Base UI |
| Typography | Inter |
| Backend | FastAPI |
| Database | PostgreSQL through psycopg; compatible with Supabase-hosted PostgreSQL |
| Maps | Folium with OpenStreetMap tiles |
| Payments | Stripe Test Mode |
| Version Control | Git and GitHub |

## Architecture

```text
React + Vite frontend
        |
        | REST API and Folium map HTML
        v
FastAPI backend
        |
        +---- PostgreSQL via psycopg
        +---- Folium + OpenStreetMap tiles
        `---- Stripe Test Mode
```

## Project Structure

```text
parkhub/
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- lib/
|   |   `-- pages/
|   |-- package.json
|   `-- vite.config.js
|-- backend/
|   |-- app/
|   |-- models/
|   |-- routers/
|   |-- services/
|   `-- requirements.txt
|-- database/
|   |-- schema.sql
|   `-- seed.sql
|-- README.md
`-- .gitignore
```

## Database Structure

The main database entities are:

```text
accounts
user_profiles
garages
garage_availability
bookings
reviews
favourites
payments
app_sessions
```

Basic relationships:

```text
Account (role: user or owner)
|-- User profile
|-- Owned garages
|-- Bookings
|-- Reviews
|-- Favourites
|-- Payments
`-- Application sessions

Garage
|-- Availability windows
|-- Bookings
|-- Reviews
`-- Favourites

Booking
|-- Check-in and check-out timestamps
|-- Payment
`-- Review
```

## Main API Endpoints

### Authentication

```text
POST /auth/register
POST /auth/login
```

### Users

```text
GET   /users/me
PATCH /users/me
GET   /users/me/owner-dashboard
```

### Parking

```text
GET    /parking/search
GET    /parking/map
GET    /parking
GET    /parking/{parking_id}
POST   /parking
PUT    /parking/{parking_id}
DELETE /parking/{parking_id}
```

### Bookings

```text
POST /bookings
GET  /bookings/me
GET  /bookings/{booking_id}

POST /bookings/{booking_id}/check-in
POST /bookings/{booking_id}/check-out
POST /bookings/{booking_id}/cancel
```

### Reviews

```text
GET  /parking/{parking_id}/reviews
POST /parking/{parking_id}/reviews
```

### Favourites

```text
GET    /favourites
POST   /favourites/{parking_id}
DELETE /favourites/{parking_id}
```

### Payments

```text
POST /payments/create-checkout
POST /payments/verify-session
POST /payments/webhook
```

## Demo Workflow

The final hackathon demo should show one complete end-to-end journey:

```text
LOGIN
  |
  v
SEARCH LOCATION
  |
  v
SELECT DATE AND TIME
  |
  v
GET TOP 5 PARKING SPACES
  |
  v
VIEW RATINGS AND REVIEWS
  |
  v
SELECT PARKING
  |
  v
BOOK
  |
  v
STRIPE TEST PAYMENT
  |
  v
BOOKING CONFIRMED
  |
  v
CHECK IN
  |
  v
CHECK OUT
  |
  v
OWNER SEES BOOKING AND EARNINGS
```

## Demo Data

[`database/seed.sql`](database/seed.sql) contains the current demonstration dataset:

- 3 owner accounts
- 30 parking garages
- Seeded 0-to-5 listing ratings
- A mix of open and closed listings

It does not create driver accounts, bookings, persisted reviews, favourites, payments, or availability windows. Register a driver through the app before testing the booking flow. A garage without availability rows is treated as available unless it conflicts with a booking.

The API and seed data currently support these exact search areas:

```text
Newtown
Sydney CBD
Parramatta
Bondi
Manly
```

## Run ParkHub Locally

### Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) 20.19+ on the Node 20 release line, or Node 22.12+, including npm
- [Python](https://www.python.org/downloads/) 3.11 or later
- A PostgreSQL database. The project is designed for Supabase PostgreSQL.
- Stripe test credentials only if you want to exercise the payment flow

Run every command below from a terminal opened in the repository root.

### Option 1: Run the frontend only

The frontend can run by itself for visual inspection. Login, registration, search results, bookings, dashboards, payments, and other data-backed flows require the backend and database.

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

Initialize a new database by running [`database/schema.sql`](database/schema.sql) in the Supabase SQL editor or against your PostgreSQL database. To load the current demonstration listings, run [`database/seed.sql`](database/seed.sql) afterward.

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
   |
   v
Driveways
   |
   v
Garages
   |
   v
Boat Spaces
   |
   v
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
