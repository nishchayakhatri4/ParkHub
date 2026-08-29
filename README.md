# ParkHub

> **"Can't park there, mate!"**

ParkHub is a peer-to-peer parking space sharing platform that connects drivers looking for affordable parking with people who have unused private parking spaces.

Instead of simply showing nearby parking spaces, ParkHub aims to recommend the **best parking option** based on price, distance, availability, safety, and convenience.

## Project Overview

Finding affordable parking in busy areas of Sydney can be difficult, especially around universities, CBD areas, and transport hubs. At the same time, many private driveways and parking spaces remain unused for large portions of the day.

ParkHub connects these two sides:

**Drivers**

* Find available private parking spaces
* Compare price, distance, safety, and convenience
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
* Safety
* Convenience

Users receive a short list of the best available options.

Example:

```text
Best Overall
$8/day
4 min walk
ParkScore: 92

Cheapest
$6/day
8 min walk
ParkScore: 86

Closest
$10/day
2 min walk
ParkScore: 84
```

### ParkScore

Every parking space receives a **0 to 100 ParkScore** to help users evaluate trust and convenience.

Potential factors include:

* Owner verification
* User reviews
* Lighting
* CCTV/security
* Location
* Booking history

Example:

```text
ParkScore: 92/100

✓ Verified Owner
✓ Well-lit
✓ CCTV
✓ 47 successful bookings
★ 4.9 rating
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

### AI Parking Assistant

An LLM-powered assistant is planned as a final priority feature.

Example:

```text
User:
Find me the cheapest parking near USYD tomorrow
from 9 AM to 4 PM.

ParkHub AI:
I found 3 suitable spaces.

1. $6/day
   8 minute walk
   ParkScore 86

2. $7/day
   5 minute walk
   ParkScore 91

3. $8/day
   4 minute walk
   ParkScore 92
```

The AI assistant should use ParkHub's existing search and recommendation APIs rather than maintaining a separate parking system.

## Tech Stack

| Component       | Technology                |
| --------------- | ------------------------- |
| Frontend        | React                     |
| UI              | shadcn/ui                 |
| Backend         | FastAPI                   |
| Database        | Supabase PostgreSQL       |
| Maps            | Nominatim / OpenStreetMap |
| Payments        | Stripe                    |
| AI              | LLM API                   |
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
                     |
                     v
                    LLM
              AI Assistant
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

## Recommended Development Priorities

The team should implement features in this order:

```text
P0
1. Project foundation
2. Authentication
3. Parking listings
4. Parking search
5. Availability
6. Smart recommendation
7. ParkScore
8. Parking details
9. Booking
10. Stripe test payment
11. Check-in / check-out
12. User dashboard
13. Owner dashboard

P1
14. Favourites
15. Demo MFA improvements

P2
16. AI chatbot
17. Boat marketplace extension
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
VIEW PARKSCORE
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

## Running the Project

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Environment Variables

Create a `.env` file for local development.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

STRIPE_SECRET_KEY=your_stripe_test_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

LLM_API_KEY=your_llm_api_key
```

Do not commit `.env` files or API keys to GitHub.

## Git Workflow

Use feature branches rather than working directly on `main`.

Example:

```text
main
│
├── feature/login
├── feature/search
├── feature/booking
├── feature/recommendation
├── feature/payments
├── feature/check-in
└── feature/dashboard
```

Typical workflow:

```bash
git checkout -b feature/search

git add .
git commit -m "Add parking search"

git push origin feature/search
```

Then create a pull request and merge into `main` after testing.

## What We Are Not Building

To keep the hackathon prototype focused, the following are outside the initial scope:

```text
Real-time GPS tracking
Complex insurance infrastructure
Production-grade MFA
Advanced AI agents
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

