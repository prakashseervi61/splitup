<div align="center">

# `// SplitUP`

### Expense splitting for group living. Settle with one tap via UPI.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

[![CI](https://github.com/prakashseervi61/splitup/actions/workflows/ci.yml/badge.svg)](https://github.com/prakashseervi61/splitup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<br/>

**SplitUP** doesn't just tell you who owes whom — it generates a UPI payment link so you can settle instantly. No switching apps. No awkward reminders. Just tap, pay, done.

<br/>

[Get Started](#quick-start) · [Features](#features) · [Architecture](#architecture) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## Why SplitUP?

> Group living in India runs on UPI. Yet every expense-splitting app stops at showing the balance and leaves the actual payment to you.

**Splitwise** shows you ₹247.00. **SplitUP** shows you ₹247.00 — and a button that opens Google Pay with the amount, note, and recipient pre-filled.

| | Traditional Apps | SplitUP |
|---|---|---|
| Track expenses | Yes | Yes |
| Show balances | Yes | Yes |
| Debt simplification | Rarely | Built-in |
| **One-tap UPI settlement** | No | **Yes** |
| QR code for cross-device | No | **Yes** |
| India-first (INR, +91, VPA) | Partial | **Native** |

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### `Groups`
Create groups for your **PG**, **Hostel**, or **Trip**. Invite roommates via phone number. Rename, delete, manage members — all with role-based permissions.

### `Expenses`
Three split modes: **Equal**, **Custom amounts**, and **Percentage**. Toggle members in and out. Eight categories from Food to Utilities. Optimistic UI for instant feedback.

### `Settlements`
Debt simplification algorithm minimizes the number of transactions. Multi-step confirmation flow. Status tracking — pending, confirmed, disputed.

</td>
<td width="50%" valign="top">

### `UPI Deep-Linking`
Generate `upi://pay` links with VPA, amount, note, and transaction reference. Works with **Google Pay**, **PhonePe**, **Paytm**, and every UPI app.

### `QR Codes`
Scan a QR to settle from another device. Perfect for when your roommate's phone is right there.

### `Recurring Expenses`
Template-based monthly rent, WiFi, electricity. Set it once, trigger it every month. Pause, resume, or delete anytime.

</td>
</tr>
</table>

### Plus

- **Invite Inbox** — Accept/reject group invitations with a clean inbox UI
- **Onboarding Walkthrough** — First-time guided tour with spotlight cutouts
- **PWA Ready** — Install on your home screen, works offline-ready
- **Responsive** — Mobile-first design, tested at 375px / 768px / 1280px

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│  Next.js 16 App Router · React 19 · Tailwind CSS v4        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Landing  │  │ Dashboard│  │  Groups  │  │   Inbox    │  │
│  │  /login   │  │    /     │  │  /groups │  │  /inbox    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                         │                                   │
│                    Server Components                        │
│                    (async data fetch)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                        SERVER                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes (16 endpoints)                          │    │
│  │  /api/auth/*  /api/groups/*  /api/invites/*         │    │
│  │  /api/profile  /api/onboarding  /api/users/batch    │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │  Data Access Layer (store.ts)                       │    │
│  │  • Batch queries (N+1 elimination)                  │    │
│  │  • Balance computation + debt simplification        │    │
│  │  • UPI link generation (NPCI spec)                  │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │  Supabase (PostgreSQL)                              │    │
│  │  • 8 tables with RLS policies                      │    │
│  │  • Performance indexes on FKs                       │    │
│  │  • Migrations versioned in /supabase/migrations     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, streaming, `proxy.ts` for auth |
| **Language** | TypeScript 5 | End-to-end type safety |
| **UI** | React 19 + Tailwind CSS v4 | Hooks, `useOptimistic`, utility-first styling |
| **Database** | PostgreSQL (Supabase) | RLS, real-time, managed infra |
| **Auth** | Mock OTP (swap-ready for Supabase Auth) | Clean architecture — single file swap |
| **Payments** | UPI deep-linking | `upi://pay` — no gateway, no fees |
| **Testing** | Vitest + Testing Library | 68 tests, fast execution |
| **CI** | GitHub Actions | Lint → Typecheck → Test → Build |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- A **Supabase** project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/prakashseervi61/splitup.git
cd splitup
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Set up the database

Run the migrations in your Supabase SQL Editor (in order):

```
supabase/migrations/00001_initial_schema.sql
supabase/migrations/00002_performance_indexes.sql
supabase/migrations/00003_onboarding_completed.sql
```

### 4. Start developing

```bash
npm run dev
```

Open **http://localhost:3000** — login with `+919999999999` and any 6-digit OTP.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## API Reference

<details>
<summary><strong>Auth</strong> (5 routes)</summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send OTP to phone number |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP |
| `POST` | `/api/auth/create-profile` | Create user profile (new users) |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Clear session |

</details>

<details>
<summary><strong>Groups</strong> (4 routes)</summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/groups` | Create a new group |
| `GET` | `/api/groups` | List user's groups |
| `GET` | `/api/groups/[id]` | Get group details |
| `PATCH` | `/api/groups/[id]` | Rename group |
| `DELETE` | `/api/groups/[id]` | Delete group (creator only) |

</details>

<details>
<summary><strong>Group Sub-resources</strong> (6 routes)</summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/groups/[id]/expenses` | Add expense with splits |
| `GET` | `/api/groups/[id]/expenses` | List expenses (paginated) |
| `POST` | `/api/groups/[id]/settlements` | Create settlement |
| `GET` | `/api/groups/[id]/settlements` | List settlements |
| `PATCH` | `/api/groups/[id]/settlements/[sid]` | Confirm/dispute |
| `GET` | `/api/groups/[id]/balances` | Compute balances + simplified debts |
| `POST` | `/api/groups/[id]/recurring` | Create recurring template |
| `GET` | `/api/groups/[id]/recurring` | List recurring templates |
| `PATCH` | `/api/groups/[id]/recurring/[tid]` | Update template |
| `POST` | `/api/groups/[id]/recurring/[tid]` | Trigger expense from template |
| `DELETE` | `/api/groups/[id]/recurring/[tid]` | Delete template |

</details>

<details>
<summary><strong>Other</strong> (4 routes)</summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/invites` | Send invite |
| `GET` | `/api/invites` | List invites (received/sent) |
| `PATCH` | `/api/invites/[id]` | Accept/reject invite |
| `GET` | `/api/invites/count` | Count pending invites |
| `GET` | `/api/users/batch` | Batch fetch users |
| `GET` | `/api/profile` | Get profile |
| `PATCH` | `/api/profile` | Update profile |
| `GET/PATCH` | `/api/onboarding` | Onboarding status |

</details>

---

## Database Schema

```
users ──────────┐
                 │
groups ──────── group_members
  │                  │
  ├── expenses ── expense_splits
  │
  └── settlements
```

**8 tables** with Row Level Security (RLS) policies. Performance indexes on all foreign key columns. See [`supabase/migrations/`](supabase/migrations/) for the full DDL.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── login/              # 3-step auth flow
│   ├── dashboard/          # Group list
│   ├── groups/[id]/        # Group detail + expenses
│   │   └── recurring/      # Recurring expense mgmt
│   ├── inbox/              # Invite inbox
│   ├── profile/            # User profile
│   └── api/                # 16 API routes
├── components/
│   ├── ui/                 # Shared components (NavBar, Modal, Toast, QR, Walkthrough)
│   ├── groups/             # Group-related components
│   ├── settlements/        # Settlement flow + list
│   ├── expenses/           # Recurring form
│   └── landing/            # Hero illustration
├── lib/
│   ├── auth/               # Session management
│   ├── supabase/           # Client + Admin clients
│   ├── db/store.ts         # Data access layer (700+ lines)
│   ├── upi/                # UPI link generator
│   └── utils/              # Split algorithms + tests
├── types/                  # TypeScript interfaces
└── proxy.ts                # Next.js 16 auth proxy
```

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-thing`)
3. **Commit** your changes (`git commit -m 'add amazing thing'`)
4. **Push** to the branch (`git push origin feature/amazing-thing`)
5. **Open** a Pull Request

Please ensure:
- `npm run lint` passes
- `npm test` passes
- `npm run build` succeeds

---

## Author

**Prakash Seervi** — [GitHub](https://github.com/prakashseervi61)

---

<div align="center">

**Built for Indian PGs, hostels, and shared flats.**

SplitUP is open source under the [MIT License](LICENSE).

</div>
