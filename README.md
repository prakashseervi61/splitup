# Splitup

Expense splitting for group living — settle with one tap via UPI.

## Problem

Group living arrangements (PGs, hostels, shared flats) generate frequent shared expenses. Existing apps like Splitwise show who owes whom but don't help close the loop — users still manually remind each other, open a separate UPI app, and come back to mark it settled. This friction causes debts to linger and balances to go stale.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Postgres / Supabase (planned)
- **Payments:** UPI deep-linking (pre-filled amount + note)

## Setup

```bash
git clone https://github.com/prakashseervi61/splitup.git
cd splitup
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Status

**Scaffolding — no feature logic yet.** This is the initial project structure with type stubs, folder layout, and config placeholders.
