# RentLoop master plan

Agreed in the interview on 20 October 2026. `docs/SRS.md` is the rulebook; this plan records the decisions that change or narrow it. `docs/DESIGN.md` sets the look. Check every new task against this file and say when something drifts from it.

## Change of direction (20 October 2026)

**The MVP is a two-sided marketplace from day one.** Renters and owners are both in it. Owners can be **individuals or businesses**. This replaces "software first, marketplace second, individuals third" (SRS 1, 2.1).

Why: owners won't sign up where there are no renters, and renters won't come where there is nothing to rent. Both sides have to arrive together.

What stays the same:
- RentLoop never takes or holds rental money. Renters pay the owner directly; the app only records it (SRS 2.4, NFR-12).
- Renters never pay a platform fee (SRS 1.3).
- The staff tools already built (stock, calendar, quotes, bookings, checkout and return, payment records, reports, plans) stay. They become the owner's side of the marketplace.

The sections below were written before this change. Where they say "Phase 2" for search, listings, booking requests, customer accounts or verification, read "MVP". Each will be re-checked as its tasks are planned.

## Goal

Build RentLoop as a simple two-sided marketplace in the design from `docs/DESIGN.md`: renters find and request items without friction, and anyone (a person or a business) can list things for rent in minutes.

## Who it's for

- **Renters:** anyone who needs to hire something. They browse and search without an account, and sign up with an email code only when they send a request.
- **Owners:** individuals who list their own things, and hire businesses with staff. Both sign up with an email code; a business owner can invite staff.
- The platform admin.

## The MVP, in order (replaces the order further down)

1. **Look:** the shared parts and staff pages already in progress (waves 1 to 3 of `docs/TASKS.md`).
2. **Marketplace home:** the mockup's home page for both audiences: search by item, town and date, category tiles, popular items, "How it works" for renters and owners, and "List your item" for owners.
3. **Owner sign-up as a person or a business.** A person lists in a few taps (no staff, no business profile needed). A business gets everything built so far.
4. **Public listings:** every listed item has a public page (photos, price per day, deposit, owner name and town, rating) that works without signing in.
5. **Search and browse:** by item or category, town and dates, showing only items with enough free stock (FR-SR-01). Categories widen beyond events and tools to what individuals rent.
6. **Booking requests from listings:** the renter picks dates and quantity and signs up with an email code; the owner accepts or declines in the app they already have. Contact details stay private until the owner accepts (FR-PV-01 to 03).
7. **Renter account:** "My bookings", with the existing booking link pages as each booking's detail.
8. **Trust for strangers:** verified owners, reviews shown publicly, and Report a Problem.
9. The remaining earlier MVP features (staff invites, notifications, audit log, admin tools, reminders, offline forms) are re-ordered around these.

## Marketplace decisions (answered 20 October 2026)

1. **Verifying individual owners:** the admin checks a phone number and an ID before an individual's items show in search. Only the admin sees the ID; it is stored encrypted and never shown to renters (FR-PV-04, NFR-06). Renters see a "Verified" badge.
2. **Booking fee:** 0% during the launch period (SRS 3.1). Rates are decided before it ends.
3. **Plans for individuals:** Free plan only at first, with its item limit. Paid tiers for individuals come later, once we see how they use it.
4. **Categories at launch:** Events, Tools, Construction and Machinery, Electronics, Camping and Outdoor, Other. No vehicles or homes at launch, because of insurance and legal questions. The admin can add more later.
5. **Launch towns:** Windhoek and Erongo first.
6. **Renter sign-up:** email code plus a required phone number. The phone stays hidden from the owner until the booking is confirmed (FR-PV-01).

## Build kit decisions (answered 22 October 2026)

The website is now built from the RentLoop build kit in `docs/build-kit/` (reference pages, design system, business rules, routes, build parts 0 to 10). The kit's reference HTML sets the look; these answers settle where the kit, the SRS and the earlier decisions disagreed. Where they differ from "Marketplace decisions" above, these win.

1. **Booking fee: 10% from day one**, one setting in the database (not code). The owner sees "Your booking fee (10%)" and "Accept and pay". This replaces decision 2 (0% at launch) and SRS 3.1's launch period.
2. **The fee is paid through PayToday.** Contact details unlock only after the fee is paid (FR-PV-01), so PayToday must work before launch. Until it is connected, payment runs in a clearly marked test mode.
3. **Sign in with email and password, as in the kit** (changed 23 October 2026; this was "email code"). Sign-up asks for a password and confirm, as the kit shows, and the Email tab signs in with email and password. "Forgot password?" emails a reset link, and "Email me a sign-in code instead" stays for accounts made before passwords. The kit's "Mobile code" tab is built but stays off until an SMS provider is chosen. Sign-up details (name, town, owner type, business name, when Terms and the booking fee box were ticked) are saved on the profile.
4. **Supabase** stays the database and photo storage.
5. **Free plan: 15 listings**, the database value today ("2 listings · 13 more").
6. **App Store and Google Play buttons** show as in the design with a "Coming soon" label and are not clickable. There is no store app in the MVP.
7. **768 to 1023 px:** the desktop structure with fewer columns. The nav folds into the menu button, cards show 2 per row, sidebars become the phone toggle, and the hero photo collage is hidden.
8. **Routes:** the kit's routes for the marketplace: `/signin` (with `/login` forwarding to it), `/join`, `/signup/renter`, `/signup/renter/about`, `/signup/owner`, `/signup/owner/details`, `/welcome`, `/explore`, `/items/[id]`, `/owner`, `/owner/requests`, `/owner/list`. The renter's bookings live at `/my/bookings`, because `/bookings` is the business bookings page. The business tools keep their routes.
9. **One owner area.** Individuals see the kit's owner dashboard. Hire businesses see the same dashboard plus Calendar, Quotes, Customers and Reports in the sidebar.
10. **Launch categories and towns stay** (decisions 4 and 5): 6 category tiles, no Vehicles, Homes or Rooms; search covers Windhoek, Swakopmund and Walvis Bay. Sign-up's home-town list can include every town.
11. **Sample content is shown as clearly marked placeholders**, so the sections are visible: the hero notes, the earnings card, the "LIVE" cards, "What people say" and "ID-checked owners". Each switches to real data when it exists (reviews from completed bookings only; ID checks from M5). Placeholder text is never presented as a real person or a real result.
12. **No messaging before a booking:**
    - The item page has no "Message to the owner" box. The renter picks dates and taps "Send request".
    - Owner requests show Renter A, B, C with only rating, number of rentals, ID checked, dates, quantity and price. No typed message.
    - After the owner pays, both sides get a "Chat on WhatsApp" button (their number and a ready-made first message) and a Call button.
    - No Messages page: "Messages" is left out of the sidebar and phone menus.
13. **The rough look branch is dropped** (kept as a git stash). Part 1 builds the look exactly from the kit, and draft PR #19 is folded into Part 3. The business pages keep working throughout.
14. **The kit lives in `docs/build-kit/`**, without its stock photos (`reference/assets/`, unknown licences). Pages show the kit's placeholder image until owners upload photos.

## Build kit Parts 5 to 10 (built 23 October 2026, recommended choices taken while away)

These choices were made while building Parts 5 to 10 without stopping to ask. Each can be changed.

1. **Every owner lists through a business row.** An individual owner gets one made on their first listing (`kind = 'individual'`), so calendars, stock checks and the Free plan's 15 items work the same for everyone. "Run a hire business?" on the owner dashboard turns it into a hire business, which adds Calendar, Quotes, Customers and Reports to the sidebar (decision 9).
2. **Marketplace requests live in their own table** (`listing_requests`), not in bookings, so owners never see a renter's name or phone before paying the fee (rule 8). Accept and pay creates a confirmed booking that holds the units, then declines other open requests that no longer fit (rules 11 and 13).
3. **The booking fee is the plan's `booking_fee_rate`** (Free 10%, Pro 5%, Business 0%), one database setting as decision 1 asks. Payment runs in a clearly marked **test mode** (TEST reference, no money moves) until PayToday is connected (decision 2).
4. **Fee refunds are a claim**: the owner can claim once, until 30 days after the start date; RentLoop reviews and refunds by hand for now (rule 4).
5. **Explore shows the kit's cards as marked samples only while nothing is listed**; real searches show only items free on the searched dates (FR-SR-01). Without dates, cards say "Free this weekend" or "Booked this weekend" from the calendar.
6. **Item pages hide the owner's name and street** until the fee is paid; renters see the area and town. The "Verified owner · ID checked" line shows as "ID check soon" until M5.
7. **No reviews are shown yet** ("No reviews yet. Reviews come from completed bookings only.") and no Favourites or Identity check pages, because those features don't exist yet.
8. **Owner links** ("For businesses", "List an item") go to owner sign-up for visitors; signed-in owners land on their dashboard. After sign-in, hire businesses go to their calendar, individual owners to /owner, renters to the home page.
9. **768 to 1023 px**: the header nav folds into the menu button and the Explore filters open as the bottom sheet (decision 7). From 1024 to 1279 px the header search hides to make room for the nav.

## In scope: the MVP, in this order

1. **Restyle.** Shared parts first (top bar, sidebar, footer strip, stat cards, step indicator), then each staff page, then the customer pages, then the public homepage.
2. **First demo.** Right after the restyle, on Vercel's free plan, with demo data that loads with one command and can be reset.
3. **The missing P1 features:**
   - email login, with each user's phone number collected (FR-AC-01, changed)
   - staff invites by email, and roles
   - notifications: bell, push and email; the app becomes installable (FR-NT-01, changed)
   - business profile fields and account states (FR-AC-02, FR-AC-05)
   - the 4-step add item flow with up to 5 photos (FR-IN-01)
   - repair and retired units (FR-IN-04)
   - customer cancel and withdraw (FR-BK-06)
   - Report a Problem (FR-PR-01, 02, 04)
   - reviews, saved but not shown yet (FR-RV-01, 02)
   - the audit log (FR-AU-01)
   - admin tools (FR-AD-01, FR-AD-02)
   - renewal reminders (FR-PL-04)
   - offline checkout and return forms (NFR-10)

## Out of scope for the MVP

- SMS or WhatsApp login and messages, and any paid messaging.
- The payment gateway and card payments (fees and plans stay on proof of payment).
- Translations (NFR-09).
- Public reviews and profile stats (Phase 2).
- Everything else in Phase 2 and Phase 3.

## Decisions and why

### Login (FR-AC-01)
- Users sign in with an email code. Every user also gives a phone number.
- Resend or Brevo (free tier) becomes Supabase's email sender. Why: Supabase's built-in email allows only 2 emails an hour, and SMS costs money.

### Staff invites and roles
- The owner invites staff by email. Phone invites come with phone login.
- Two roles. Staff create quotes and bookings, run checkout and return, and record payments. Staff see prices to build quotes but can't change them.
- Only the owner sees reports, the plan and settings, changes prices, and invites or removes staff.
- The plan's user limit applies to invites; going over it shows the upgrade prompt (FR-PL-02).

### Notifications (FR-NT-01)
- Every FR-NT-01 event shows in the app under a bell.
- Urgent events (new request, checkout tomorrow, overdue) also send a free web push and an email.
- The app gets a web app manifest, so it installs to the home screen and push works on iPhone.
- Customers keep getting their links by one-tap WhatsApp from the business. No paid messaging in the MVP.

### Reviews (FR-RV-01, FR-RV-02)
- Both sides can review after a booking closes. Reviews are saved now and shown publicly in Phase 2. Why: there is nowhere to show them before the marketplace.

### Report a Problem (FR-PR-01, 02, 04)
- Staff report from the booking page; customers report from their link. Type (damage, missing items, no-show, dispute), description and photos.
- Each report links the checkout and return records as evidence.
- The database stores all five states (OPEN, AWAITING_RESPONSE, UNDER_REVIEW, RESOLVED, CLOSED). UNDER_REVIEW is used by the admin from Phase 2. Why: no extra migration later.
- When the business marks a report resolved, the customer sees the outcome on their link and can accept it or reopen it once.
- Customer photo uploads from the link are limited to that booking's folder, like handover photos.

### Repair and retired units (FR-IN-04)
- Units out are a list: quantity, reason (repair or retired), start date, and an end date for repairs.
- Repaired units come back by themselves on the end date. Retired units lower the stock in service for good.
- The migration turns each item's current "out of service" number into a repair entry, so no stock data is lost.
- The double-booking check keeps working with the list, with a new database test.

### Audit log (FR-AU-01)
- One add-only log, written by the database: price changes, units out, booking status, payment records and voids, plan changes, suspensions.
- The owner sees their own business's log; the admin sees all.
- The booking history (`booking_events`) stays as it is, alongside the audit log.

### Add item (FR-IN-01)
- Four steps: Details, Photos (up to 5, the first is the cover), Price and stock, Review. No drafts; Back keeps what was typed.
- Photos are compressed and resized on the phone before upload (NFR-02).
- The migration keeps each item's existing photo as its cover. Editing an item stays one page.

### Owner Dashboard
- A new Home page is where staff land after sign-in: Today cards, money recorded this month, recent bookings, next checkouts.
- Desktop gets the deep green sidebar. Phone tabs: Home, Calendar, Bookings, Quotes, More (Customers moves into More).

### Customer link pages (FR-AC-04, FR-PY-03, FR-PY-04)
- Both pages open with a deep green summary card: business, dates, status pill, "Still to pay" or the quote total.
- A "How to pay {business}" box shows the business's own payment details.
- Those details reach `/b` only through the public booking function, never by reading the table, and only for that business's own bookings.
- No "secure", "protected" or "guaranteed" anywhere (NFR-12). Each page stays under 500 KB on a phone (NFR-02).

### Customer cancel (FR-BK-06)
- Customers can cancel from their link until checkout, with a reason, through the same database rule as staff.
- If they have paid anything, the cancel screen tells them to contact the business about a refund. Why: RentLoop holds no money (2.4).
- Customers can withdraw a request that hasn't been accepted yet.
- The business gets the bell, a push and an email. Cancellations count on both sides for the Phase 2 profiles.

### Categories (FR-IN-06)
- Launch list: Events, Tools, Construction and Machinery, Electronics, Camping and Outdoor, Other. The admin can add more. The homepage shows them as tiles. No vehicles or homes at launch.

### Business profile and account states (FR-AC-02, FR-AC-05)
- Settings adds a logo, opening hours (one line), the BIPA number (optional) and "How customers pay you".
- All six account states are stored. The MVP uses NEW, ACTIVE (after the first login with a phone number added), SUSPENDED and CLOSED. PHONE_VERIFIED waits for phone login; UNDER_REVIEW for Phase 2 verification.

### Admin (FR-AD-01, FR-AD-02)
- A dashboard with counts: active businesses, bookings this month, subscription revenue, open problems.
- A business list with each plan, and suspend or unsuspend with a reason (written to the audit log).
- Category management.
- The existing pages for approving plan payments and setting plan prices move into the same admin layout.
- Verification, listings, fee settings and featured slots wait for Phase 2.

### Renewal reminders (FR-PL-04)
- 30, 7 and 1 days before the plan ends: a bell notification and an email; the 1-day reminder also sends a push. The banner stays.
- Each reminder is sent once only (the database stores which were sent), from a nightly Supabase Cron job.

### Offline forms (NFR-10)
- Checkout and return forms save counts and notes on the phone as staff type, and restore them after a reload or a dropped connection.
- Photos wait with "Waiting for connection". The submit button says "No connection" until the connection is back.

### Demo
- A 5-minute demo on two phones (owner and customer), written in `docs/DEMO.md`, using "Kalahari Tent & Chair Hire": Home, a quote from "Wedding 100" on WhatsApp, the customer accepts, a double booking is refused, an EFT is recorded and confirmed, checkout and return with one damaged chair and a deposit deduction, reports.
- It happens right after the restyle, before the remaining P1 features, so what businesses say shapes them.
- `npm run demo:reset` deletes and recreates the demo business for a dedicated demo account. The admin key stays only in `.env.local`. The script refuses any business other than the demo one, and refuses to run unless the Supabase URL is the demo/development project.

### Hosting
- The demo runs on Vercel's free plan with the current Supabase project and `NEXT_PUBLIC_SITE_URL` set.
- Vercel's free plan doesn't allow commercial use. Before the first paying business, move to Vercel Pro (or another host) and a separate production Supabase project. Demo and development stay on the current project.

## Earlier Phase 2 order (now folded into the MVP above)

The launch waits for the SRS gate: 30 to 50 businesses keeping their inventory and calendars in the app.

1. Customer accounts (email login, like staff).
2. Verification of businesses and the public flag on items (FR-AC-03, FR-IN-05). Why first: only public items from verified businesses may appear in search.
3. Public listing pages and search by item, town and date (FR-SR-01, FR-SR-04, FR-SR-05).
4. Event search with a guest count that suggests packages (FR-SR-02).
5. Booking requests from search with masked messages, built together with contact privacy enforced in the database (FR-BK-03, FR-PV-01, FR-PV-02, FR-PV-03).
6. The booking fee step at Accept, at 0% for the first three months (FR-FE-01 to FR-FE-06, SRS 3.1).
7. Public reviews and profile stats (FR-RV-03).
8. Featured listings (SRS 3.3).

## Changes to the SRS

Copy these into the online SRS before sales begin. **Done on 20 Oct 2026:** all three are in the online SRS and in `docs/SRS.md`.

1. **FR-AC-01:** email login for the MVP; phone login later.
2. **FR-NT-01:** push and email instead of SMS or WhatsApp for the MVP.
3. **NFR-09:** translations after the MVP.

**New changes from 20 October 2026 (not yet in the online SRS):**

4. **Sections 1, 2.1 and 9:** the MVP is a two-sided marketplace. Public search, listing pages, booking requests, customer accounts, contact privacy, verification and public reviews move from P2 into the MVP.
5. **Sections 2.1 and 2.2:** individual owners move from P3 into the MVP. "Business" becomes "Owner (individual or business)" wherever the SRS means the person who lists items.
6. **Section 2.1:** the gate "30 to 50 businesses before the marketplace" is removed.
7. **FR-IN-06:** categories at launch are Events, Tools, Construction and Machinery, Electronics, Camping and Outdoor, Other; no vehicles or homes.
8. **Section 9 (MVP scope):** rewritten to match the MVP order above.

**New changes from 22 October 2026 (build kit decisions above):**

9. **Section 3.1:** no 0% launch period; the booking fee is 10% from day one.
10. **Section 7.2:** PayToday is the payment gateway for booking fees.
11. **FR-PV-02:** no in-app messaging before confirmation; after the fee is paid, both sides get WhatsApp and Call.

## Decide before the marketplace tasks (SRS section 8)

Booking fee values, refunds when a business cancels, refunds on customer cancellations and no-shows, the payment gateway, the lawyer's check on the fee model, launch towns, delivery.

Only VAT advice blocks the MVP. Until the accountant answers, invoices say "Tax invoice" only when a VAT number is set.

## How we'll know the MVP is done

- Every task in `docs/TASKS.md` is ticked off.
- Every staff and customer page is restyled to `docs/DESIGN.md`.
- The two-phone demo runs cleanly 3 times in a row on the Vercel address.
- Lint, typecheck, unit tests, database tests and the build pass on `main`.
- The SRS changes list is copied into the online SRS before sales begin.
