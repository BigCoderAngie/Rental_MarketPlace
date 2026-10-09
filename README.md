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
| **Bookings** | Staff create bookings for phone, walk-in or WhatsApp customers. They see what is free for the dates first, then accept, decline, cancel (with a reason), check out, return and close. Requests nobody answers expire after 24 hours (you can change this in Settings). Every change is saved in the booking's history. |
| **WhatsApp quotes** | Staff build a quote (items, dates, delivery, setup, discount) and send it with one tap on WhatsApp. The customer opens the link without an account, sees the total, deposit and your terms, and accepts or asks a question. Accepting checks the items are still free and turns the quote into a booking request. |
| **Payment records** | Each booking shows what is due, paid and outstanding, and how much deposit you hold. Staff record payments, refunds, deposits received, returned or kept (with a reason) by cash, EFT, eWallet or card. Mistakes are voided with a reason, never deleted. Recorded only: the money goes to you directly. |
| **Checkout and return** | At handover, staff count what goes out, tick that they checked the customer's ID, and take condition photos with the phone camera. At return they count, per item, how many came back fine, damaged or missing. Late returns are marked, and every night bookings past their end date that are still out become **Overdue**. |
| **Customer booking link** | Send the customer their booking on WhatsApp. They see what they booked, what they still owe and the payments you recorded, and can confirm each one. They also see the checkout and return records and tap "This is correct" or say what is wrong. Disputing a return opens a problem on the booking. |
| **Business details** | Settings page for your WhatsApp number, payment terms, rental terms, how long quotes stay valid and how long you have to answer a booking request. |
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
| `npm run test:db` | Checks the booking, quote, payment, checkout, return and request expiry rules against the **local** database |
| `npm run db:reset` | Rebuilds the local database from scratch (**deletes local data**) |
| `npx supabase migration new <name>` | Starts a new database change |

Run `lint`, `typecheck` and `test` before every push.

---

## Put it online

1. **Database:** create a Supabase project and push the tables (step 2 of
   [Option A](#option-a-online-database-recommended)).
   This also creates the photo storage bucket and two scheduled jobs: the
   nightly overdue check and a request expiry check every 15 minutes (see
   them in Supabase under **Integrations → Cron**).
2. **Website:** import this repository at [vercel.com/new](https://vercel.com/new)
   and add the settings from `.env.example`, using the values from your
   Supabase project's API settings. Set `NEXT_PUBLIC_SITE_URL` to your Vercel
   address so quote links sent on WhatsApp point to it.
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
| Database and logins | [Supabase](https://supabase.com) (Postgres, Auth, row level security, Storage for photos, Cron for nightly jobs) |
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
| `src/app/(app)/quotes` | Quote list, quote builder, quote page with the WhatsApp button |
| `src/app/(app)/settings` | Business details shown on quotes |
| `src/app/q/[token]` | The customer's quote page (no sign-in needed) |
| `src/app/b/[token]` | The customer's booking page, where they confirm payments and handover records (no sign-in needed) |
| `src/components` | Shared UI pieces |
| `src/lib` | Dates, money, booking states, quote totals, handover counts, WhatsApp links, Supabase clients |
| `src/proxy.ts` | Keeps the login fresh; sends signed-out visitors to `/login` |
| `supabase/migrations` | Database tables, rules and security |
| `supabase/tests` | Database rule checks (`npm run test:db`) |

---

## Rules to know before changing code

1. **Bookings only change through database functions:** `create_booking`,
   `accept_booking`, `decline_booking`, `cancel_booking`,
   `record_checkout`, `record_return` and `set_booking_status`. The website calls them with `supabase.rpc(...)`.
   Nobody can edit the bookings table directly, so the double-booking check
   can't be skipped.
2. **Booking states follow SRS section 4.2.** The database decides which
   changes are allowed. `src/lib/bookings.ts` keeps a copy only to decide
   which buttons to show, and a test fails if the two don't match.
3. **Every table has row level security:** each business only sees its own data.
   Customers reach a quote or booking only through its link, using
   `get_public_quote`, `accept_public_quote`, `get_public_booking`,
   `confirm_public_payment`, `get_public_handovers` and
   `respond_public_handover`; they can't read any table directly.
4. **Dates** are stored as `YYYY-MM-DD` in Namibian time. A booking includes
   both its first and last day.
5. **Payments are recorded through `record_payment` and corrected with
   `void_payment`.** Records are never edited or deleted, and the database
   refuses refunds above what was paid or deposit returns above what was
   received.
6. **Handover photos live in the private `handover-photos` storage bucket**,
   in a folder per business and booking (`<business id>/<booking id>/`).
   The phone uploads them straight to Supabase, so large photos never pass
   through Vercel. Only that business's staff can open them.

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
| 1 | **Phone sign-in** (FR-AC-01) | Once an SMS provider is chosen. Also staff invites and roles. | |
| 2 | **More** | Packages (FR-IN-03), item photos, editing a booking's dates or quantities (FR-BK-07), customer list and reports. | |

After that, test it with 2 or 3 real hire businesses before starting the
Phase 2 marketplace.
