# Rental Marketplace

Booking software for hire businesses in Namibia.

- **Now (Phase 1):** the everyday tools a hire business needs: stock, bookings
  and a calendar.
- **Later (Phase 2):** a public marketplace where customers find and book
  rentals.

> The platform never holds rental money. Customers pay the business directly;
> the app only records the payment.

Full requirements: [SRS document](https://claude.ai/code/artifact/53bc03dd-b135-487b-ada0-49254fd9d247)

**Contents**

1. [What works so far](#what-works-so-far)
2. [Run it on your computer](#run-it-on-your-computer)
3. [Put it online](#put-it-online)
4. [How the code is organised](#how-the-code-is-organised)
5. [Rules to know before changing code](#rules-to-know-before-changing-code)
6. [Working as two partners](#working-as-two-partners)
7. [What to build next](#what-to-build-next)

---

## What works so far

| Feature | What it does |
| --- | --- |
| **Sign in** | Log in with a one-time email code, then set up your business. |
| **Inventory** | Add items with a quantity (one listing can cover 300 identical chairs), price per day, deposit, replacement value, units under repair, a low stock warning, and turnaround days for cleaning or setup. |
| **Bookings** | Staff create bookings for phone, walk-in or WhatsApp customers. They see what is free for the dates first, then accept, decline, cancel (with a reason), check out, return and close. Every change is saved in the booking's history. |
| **Calendar** | Shows how many units of each item are free on each day of the month. Red means fully booked, amber means stock is low. |
| **No double bookings** | The database refuses to accept a booking if it would leave less than zero units on any day, even if two staff click "accept" at the same moment. Pending requests don't use stock until accepted. |

---

## Run it on your computer

### What you need

- **Node.js 22** or newer
- **A Supabase database**, either:
  - **Online (easiest):** a free project at [supabase.com](https://supabase.com).
    Best for computers with less than 8 GB of RAM.
  - **Local:** runs inside [Docker Desktop](https://www.docker.com/products/docker-desktop/).
    Needs about 8 GB of RAM or more. On Windows, Docker also needs WSL
    (run `wsl --install` as administrator, then restart).

### Option A: online database (recommended)

1. Create a free project at [supabase.com](https://supabase.com).
2. Set up the tables (run these in the VS Code terminal):
   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   The project ref is the code in your Supabase dashboard address, for
   example `supabase.com/dashboard/project/`**`abcd1234`**.
3. Copy `.env.example` to `.env.local` and fill in your **Project URL** and
   **publishable key** from Supabase → Project Settings → API.
4. Start the website:
   ```bash
   npm run dev
   ```
5. Open <http://localhost:3000> and sign in with your email. Supabase emails
   you a login link. (See [Put it online](#put-it-online), step 3, to get a
   typed code instead.)

### Option B: local database (Docker)

```bash
npm install
npm run db:start            # starts Supabase in Docker and creates the tables
cp .env.example .env.local  # paste in the API URL and key that db:start printed
npm run dev                 # open http://localhost:3000
```

Nothing is really emailed when running locally:

| Tool | Address | Use it to |
| --- | --- | --- |
| Mailpit | <http://127.0.0.1:54324> | Read your login code |
| Supabase Studio | <http://127.0.0.1:54323> | Browse the database |

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run lint` | Checks code style |
| `npm run typecheck` | Checks TypeScript types |
| `npm test` | Runs the unit tests |
| `npm run test:db` | Checks the booking rules against the **local** database |
| `npm run db:reset` | Rebuilds the local database from scratch (**deletes local data**) |
| `npx supabase migration new <name>` | Starts a new database change |

Run `lint`, `typecheck` and `test` before every push.

---

## Put it online

1. **Database:** create a Supabase project and push the tables (step 2 of
   [Option A](#option-a-online-database-recommended)).
2. **Website:** import this repository at [vercel.com/new](https://vercel.com/new)
   and add the two settings from `.env.example`, using the values from your
   Supabase project's API settings.
3. **Login links:** in Supabase, go to **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel address.
   - Add `https://<your-vercel-address>/auth/callback` under **Redirect URLs**.
   - To let people type a code instead of clicking a link, add `{{ .Token }}`
     to the **Magic Link** email template.

---

## How the code is organised

### Tools used

| Part | Tool |
| --- | --- |
| Website | [Next.js 16](https://nextjs.org), TypeScript, Tailwind CSS (mobile first) |
| Database and logins | [Supabase](https://supabase.com) (Postgres, Auth, row level security) |
| Hosting | [Vercel](https://vercel.com) |
| Tests | Vitest for TypeScript, a SQL script for database rules. Both run on GitHub Actions. |

> **Note:** Next.js 16 works differently from older versions. For example,
> `middleware.ts` is now `proxy.ts`, and `params` / `searchParams` are
> promises. The docs for this version are in `node_modules/next/dist/docs/`.

### Folders

| Folder | What's inside |
| --- | --- |
| `src/app/login`, `src/app/setup` | Sign in and first-time business setup |
| `src/app/(app)/calendar` | Month view per item |
| `src/app/(app)/bookings` | Booking list, new booking, booking page |
| `src/app/(app)/inventory` | Item list, add and edit |
| `src/components` | Shared UI pieces |
| `src/lib` | Dates, money, booking states, Supabase clients |
| `src/proxy.ts` | Keeps the login fresh; sends signed-out visitors to `/login` |
| `supabase/migrations` | Database tables, rules and security |
| `supabase/tests` | Database rule checks (`npm run test:db`) |

---

## Rules to know before changing code

1. **Bookings only change through database functions:** `create_booking`,
   `accept_booking`, `decline_booking`, `cancel_booking` and
   `set_booking_status`. The website calls them with `supabase.rpc(...)`.
   Nobody can edit the bookings table directly, so the double-booking check
   can't be skipped.
2. **Booking states follow SRS section 4.2.** The database decides which
   changes are allowed. `src/lib/bookings.ts` keeps a copy only to decide
   which buttons to show, and a test fails if the two don't match.
3. **Every table has row level security:** each business only sees its own data.
4. **Dates** are stored as `YYYY-MM-DD` in Namibian time. A booking includes
   both its first and last day.

---

## Working as two partners

Split the work by layer so you rarely edit the same files:

| | Partner A: screens | Partner B: data and rules |
| --- | --- | --- |
| **Owns** | `src/app`, `src/components` | `supabase/migrations`, `supabase/tests`, `src/lib` |
| **Does** | Pages, forms, mobile layout, WhatsApp links, wording | Tables, database functions, permissions, tests, background jobs |

**For each feature:** agree on the function names and inputs first (in an
issue or pull request). Partner B then builds the database part and its tests
while Partner A builds the screen on top.

**Day to day:**

1. Pull the latest `main`, then make a branch for the feature:
   `git switch -c quotes-whatsapp`
2. Keep each pull request small (one feature). GitHub automatically runs lint,
   typecheck, tests, the build and the database checks.
3. The other partner reviews and merges. **Never push straight to `main`.**
4. **Never edit a migration that is already on `main`.** Add a new one instead.

---

## What to build next

The rest of Phase 1, in SRS order:

| # | Feature | Details | Who |
| --- | --- | --- | --- |
| 1 | **Quotes and WhatsApp links** (FR-QT) | Quote builder, public quote page, one-tap WhatsApp share. Accepting a quote turns it into a booking request. | B: `quotes` tables and `accept_quote`. A: builder and public page. |
| 2 | **Payment records** (FR-PY) | Amounts, methods, deposits taken and returned, and what's due, paid and outstanding on each booking. Recorded only, never collected. | |
| 3 | **Checkout and return records** (FR-CR) | Counts per item, photos (Supabase Storage), customer confirmation by link, late-return flag. | |
| 4 | **Scheduled jobs** | Expire unanswered requests after 24 hours (FR-BK-04) and mark overdue bookings (FR-CR-06), e.g. with Supabase Cron. | |
| 5 | **Phone sign-in** (FR-AC-01) | Once an SMS provider is chosen. Also staff invites and roles. | |
| 6 | **More** | Packages (FR-IN-03), item photos, editing a booking's dates or quantities (FR-BK-07), customer list and reports. | |

After that, test it with 2 or 3 real hire businesses before starting the
Phase 2 marketplace.
