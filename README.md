# Rental Marketplace

Booking software for Namibian hire businesses, growing into a public rental
marketplace later. This repository is **Phase 1**: the tools a hire business
uses every day. The requirements live in the
[SRS](https://claude.ai/code/artifact/53bc03dd-b135-487b-ada0-49254fd9d247).

The platform never holds rental money. Customers pay the business directly and
the app only records it.

## What works so far

- **Sign in** with a one-time email code, then set up your business.
- **Inventory**: items with quantities (one listing covers 300 identical
  chairs), price per day, deposit, replacement value, units under repair, a
  low stock warning and turnaround days for cleaning or setup.
- **Bookings**: staff create a booking for a phone, walk-in or WhatsApp
  customer, see what is free for the dates first, and move it through the
  SRS section 4.2 states (accept, decline, cancel with a reason, checkout,
  return, close). Every change is kept in the booking's history.
- **Calendar**: units free per item per day for a month, red when fully
  booked, amber when stock is low, with the bookings that hold the item.
- **Double-booking protection** in the database: accepting a booking that would
  leave fewer than zero units on any day is refused, even when two staff
  accept at the same moment. A pending request does not use stock until it is
  accepted.

## Stack

| Part | Choice |
| --- | --- |
| Website | [Next.js 16](https://nextjs.org) (App Router, Server Actions), TypeScript, Tailwind CSS. Mobile first. |
| Database and logins | [Supabase](https://supabase.com) (Postgres, Auth, row level security) |
| Hosting | [Vercel](https://vercel.com) |
| Tests | Vitest for TypeScript, a SQL script for database rules, both run in GitHub Actions |

Next.js 16 changed some conventions you may know from older versions (for
example `middleware.ts` is now `proxy.ts`, and `params` and `searchParams`
are promises). The docs for the installed version are in
`node_modules/next/dist/docs/`.

## Run it on your computer

You need Node.js 22 or newer and Docker Desktop (Supabase runs locally in
Docker).

```bash
npm install
npm run db:start            # starts Supabase locally and applies the migrations
cp .env.example .env.local  # then paste the API URL and publishable key it printed
npm run dev                 # http://localhost:3000
```

Sign in with any email address. Locally no email is sent: open Mailpit at
http://127.0.0.1:54324 to read the code. Supabase Studio, for browsing the
database, is at http://127.0.0.1:54323.

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run lint` / `npm run typecheck` / `npm test` | Fast checks; run before every push |
| `npm run test:db` | Checks the booking and availability rules against the local database |
| `npm run db:reset` | Rebuilds the local database from the migrations (deletes local data) |
| `npx supabase migration new <name>` | Starts a new database change |

## Put it online

1. Create a project at [supabase.com](https://supabase.com), then link and
   push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
2. Import this repository at [vercel.com/new](https://vercel.com/new) and add
   the two variables from `.env.example`, using the values in your Supabase
   project's API settings.
3. In Supabase, under Authentication, URL Configuration, set the Site URL to
   your Vercel address and add `https://<your-vercel-address>/auth/callback`
   as a redirect URL. To let people type the code instead of tapping the link,
   add `{{ .Token }}` to the Magic Link email template.

## How the code is organised

```
src/app/login, setup        Sign in and first-time business setup
src/app/(app)/calendar      Month view per item
src/app/(app)/bookings      Booking list, new booking, booking page
src/app/(app)/inventory     Item list, add and edit
src/components              Shared UI pieces
src/lib                     Dates, money, booking states, Supabase clients
src/proxy.ts                Keeps the login session fresh, sends signed-out visitors to /login
supabase/migrations         Database schema, rules and row level security
supabase/tests              Database rule checks (npm run test:db)
```

Rules worth knowing before you change anything:

- **Bookings are only changed through database functions** (`create_booking`,
  `accept_booking`, `decline_booking`, `cancel_booking`, `set_booking_status`).
  The website calls them with `supabase.rpc(...)`. Clients cannot update the
  bookings table directly, so the double-booking check cannot be skipped.
- **Booking states** follow SRS section 4.2. The database decides what is
  allowed; `src/lib/bookings.ts` keeps a copy only to choose which buttons to
  show, and a unit test fails if the two drift apart.
- **Every table has row level security**: people only see their own
  business's data.
- **Dates** are `YYYY-MM-DD` strings in Namibian time, and both ends of a
  booking are included.

## Working as two partners

The cleanest split is by layer, so you rarely edit the same files:

| | Partner A: screens | Partner B: data and rules |
| --- | --- | --- |
| Owns | `src/app`, `src/components` | `supabase/migrations`, `supabase/tests`, `src/lib` |
| Does | Pages, forms, mobile layout, WhatsApp links, wording | Tables, database functions, permissions, tests, background jobs |

For each feature, Partner B adds the migration, the function and its tests
first and opens a pull request; Partner A builds the screen on top of it. Agree
on the function names and inputs at the start, in the pull request or an issue,
so both can work at once.

Day to day:

1. Pull the latest `main`, then make a branch per feature: `git switch -c quotes-whatsapp`.
2. Keep pull requests small (one feature). CI runs lint, typecheck, unit tests,
   the build and the database checks on every pull request.
3. The other partner reviews and merges. Never push straight to `main`.
4. Never edit a migration that is already on `main`; add a new one instead.

## What to build next (rest of Phase 1)

In SRS order, with a suggested owner:

1. **Quotes and WhatsApp links** (FR-QT): quote builder, public quote page,
   one-tap WhatsApp share, accept turns it into a request. B: `quotes` tables
   and `accept_quote`. A: builder and public page.
2. **Payment records** (FR-PY): amounts, methods, deposits taken and returned,
   due, paid and outstanding on each booking. Recorded only, never collected.
3. **Checkout and return records** (FR-CR): counts per item, photos (Supabase
   Storage), customer confirmation from a link, late-return flag.
4. **Scheduled jobs**: expire unanswered requests after 24 hours (FR-BK-04)
   and mark overdue bookings (FR-CR-06), for example with Supabase Cron.
5. **Phone sign-in** (FR-AC-01) once an SMS provider is chosen, plus staff
   invites and roles.
6. **Packages** (FR-IN-03), item photos, editing a booking's dates or
   quantities (FR-BK-07), customers list and reports.

Then pilot with 2 or 3 hire businesses before starting the Phase 2 marketplace.
