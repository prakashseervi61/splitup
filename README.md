# Splitup

Expense splitting for group living — settle with one tap via UPI.

## Problem

Group living arrangements (PGs, hostels, shared flats) generate frequent shared expenses. Existing apps like Splitwise show who owes whom but don't help close the loop — users still manually remind each other, open a separate UPI app, and come back to mark it settled. This friction causes debts to linger and balances to go stale.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Postgres / Supabase
- **Auth:** Mock OTP (phone + 6-digit code)
- **Payments:** UPI deep-linking (pre-filled amount + note)

## Features

- **Mock OTP auth** — phone to OTP to name; test user +919999999999 with any 6-digit OTP
- **Groups** — create groups (PG/Hostel/Trip), invite members by phone, rename, delete
- **Expenses** — add expenses with equal/custom/percentage splits
- **Balances** — real-time net balance computation with simplified debt recommendations
- **Settlements** — settle up with one tap, UPI deep-link integration
- **Invite system** — inbox-style with Received/Sent tabs, accept/reject
- **Recurring expenses** — template-based monthly/weekly/daily recurring expenses
- **Responsive** — mobile-first with hamburger nav, works on all breakpoints

## Performance

- **Server components** — all pages are async server components with data fetched server-side
- **Parallel fetching** — Promise.all for all independent queries; no waterfalls
- **N+1 elimination** — batch queries for group members, expense splits, user enrichment
- **Caching** — revalidatePath on writes, Cache-Control headers on API responses
- **Optimistic UI** — instant feedback for add expense and rename group
- **Lazy loading** — expense list paginates (20 at a time) with IntersectionObserver
- **DB indexes** — performance indexes on foreign key columns

## Setup

```bash
git clone https://github.com/prakashseervi61/splitup.git
cd splitup
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Project Structure

```
src/
├── app/          # Next.js App Router pages and API routes
├── components/   # React client components
├── lib/          # Auth, DB, and utility functions
└── types/        # TypeScript interfaces
```
