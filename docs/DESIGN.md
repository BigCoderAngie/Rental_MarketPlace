# RentLoop design

The mockups in `docs/design/` set the **look**. `docs/SRS.md` sets **what the app does**. Where they disagree, the SRS wins (see "Not from the mockups"). The name is **RentLoop** everywhere the mockups say "RentNow".

- `docs/design/design-home.jpeg`: the marketplace home page.
- `docs/design/design-screens.jpeg`: home, item page, List an Item, Owner Dashboard, Customer Dashboard, Payment page.

The mockups only show desktop. Every screen below also gets a 390 px phone layout, because most customers open RentLoop from a WhatsApp link on a phone (SRS 2.3, NFR-08).

## 1. Design tokens

Colours are CSS variables in `src/app/globals.css` and Tailwind classes (`bg-primary`, `text-muted-foreground` and so on). Never hard-code a colour in a component. Hex values were measured from the mockup pixels, then adjusted where a text colour fell short of 4.5:1.

### Colours

| Token | Hex | Measured in the mockups | Use it for |
| --- | --- | --- | --- |
| `deep` | `#06402f` | footer strip `#084838`, sidebar `#003828` | Top band on customer pages, footer strip, dashboard sidebar, promo banners |
| `deep-foreground` | `#ffffff` | sidebar text | Text on `deep` (11.8:1) |
| `deep-muted` | `#b9d3c5` | sidebar labels | Quiet text on `deep` (7.4:1) |
| `highlight` | `#3dd15f` | headline "Earn from what you have." | The accent words of a headline, **only on `deep` or a dark photo** (5.9:1). Never on white (2.0:1) |
| `primary` | `#00743f` | "List an Item", "Search", "Book Now" `#007440` | Buttons, links, active tab, the active sidebar item (white text 5.9:1) |
| `primary-strong` | `#005c32` | — | Button hover and pressed |
| `primary-soft` | `#e6f4ec` | "Why RentNow" panel `#e8f4ec`, icon circles `#e4f8f0` | Pale green panels, icon circles, confirmed notes |
| `primary-border` | `#b8dcc6` | — | Borders of pale green panels |
| `primary-ink` | `#0b4d2c` | — | Text on `primary-soft` (8.8:1) |
| `background` | `#ffffff` | page `#f8f8fc` | Page background (white, as briefed) |
| `card` | `#ffffff` | cards | Cards, inputs, sheets |
| `border` | `#e3e8eb` | card borders `#eaeef0` | Card and divider lines |
| `input` | `#cdd5da` | form fields | Input borders (darker than `border` so fields read as fields) |
| `muted` | `#f2f4f5` | grey fills | Hover rows, image placeholders, chart bars |
| `foreground` | `#0f1d17` | price and title text `#000307` | Main text (17.4:1) |
| `foreground-soft` | `#34403a` | — | Secondary headings, strong labels |
| `muted-foreground` | `#5b6670` | town, "Member since", captions | Meta text (5.9:1 on white, 5.3:1 on `muted`) |
| `accent` | `#f3b017` | star rating `#f3b017` | Star fill, "Featured" and upgrade badges, **fill only** (1.9:1 as text). Text on it is `accent-foreground` |
| `accent-foreground` | `#0f1d17` | — | Text on `accent` (9.1:1) |
| `accent-soft` | `#fdf3dc` | "Pending" pill `#f6e0c9` | Waiting and warning pills and notes |
| `accent-border` | `#f3d68a` | — | Borders of `accent-soft` notes |
| `accent-ink` | `#7a4d00` | Pending text | Text on `accent-soft` (6.6:1) |
| `danger` | `#b7472a` | — (not in the mockups) | Overdue, unpaid, problems, errors (5.3:1); white text on it 5.3:1 |
| `danger-soft` / `danger-border` / `danger-ink` | `#fbe9e4` / `#f0c4b8` / `#6e2716` | — | Problem and error notes (ink 9.1:1) |
| `info-soft` / `info-ink` | `#e3eef6` / `#1e4351` | — | Neutral notices such as plan reminders (9.0:1) |

### Type

One family: **Geist** (already loaded in `src/app/layout.tsx`). Sizes on a 4 px rhythm.

| Role | Phone | Desktop | Weight | Tailwind |
| --- | --- | --- | --- | --- |
| Hero headline | 32 / 36 px | 44 / 48 px | 700 | `text-[32px] leading-9 sm:text-[44px] sm:leading-[48px] font-bold` |
| Page title | 22 / 28 px | 24 / 32 px | 600 | `text-[22px] sm:text-2xl font-semibold` |
| Section title ("Popular Rentals") | 18 / 24 px | 20 / 28 px | 600 | `text-lg sm:text-xl font-semibold` |
| Stat number | 28 / 32 px | 28 / 32 px | 600 | `text-[28px] font-semibold` |
| Body | 16 / 24 px | 15 / 22 px | 400 | `text-base sm:text-[15px]` |
| Card title, label | 14 / 20 px | 14 / 20 px | 600 | `text-sm font-semibold` |
| Price ("N$ 350 / day") | 14 / 20 px | 14 / 20 px | 700 | `text-sm font-bold` |
| Meta (town, rating, captions) | 12 / 16 px | 12 / 16 px | 400 | `text-xs` |

Inputs stay at 16 px on phones so iOS doesn't zoom in.

### Shape, shadow, spacing

- **Corners:** cards, tiles and panels 12 px (`rounded-xl`); buttons and inputs 8 px (`rounded-lg`); hero, promo banners and the payment summary 16 px (`rounded-2xl`); pills, avatars and icon circles fully round.
- **Shadow:** cards `shadow-sm`. Hover lift (desktop only): `shadow-md` and `-translate-y-0.5`, under 200 ms, off with `motion-reduce`.
- **Spacing:** 4 px grid. Page side margin 16 px on phones, 24 px from 640 px. Gap between cards 12 px on phones, 16 px on desktop. Card padding 12 px (listing card body) or 16 px (other cards). Gap between page sections 32 px on phones, 48 px on desktop.
- **Content width:** 1280 px for marketplace pages; 768 px (`max-w-3xl`) for the staff app on phones and tablets; dashboards use the sidebar plus a fluid main column.
- **Tap targets:** at least 44 px tall (the phone tab bar is 56 px).

## 2. Shared parts

| Part | Looks like | Rules |
| --- | --- | --- |
| **Top bar** | White, 64 px, logo left, nav links, search field, town picker, bell, primary button, avatar | Phone: logo + bell + menu only; search moves under the bar. Public pages show "Sign in" instead of the avatar |
| **Footer strip** | `deep` band, white logo, tagline, three trust items, town picker | Trust items must be true and SRS-safe (see section 4). Phone: stacked, centred |
| **Category tile** | White card, icon in a `primary-soft` circle, label under it | SRS categories only: Events, Tools, Construction and Machinery, Other. Phone: 2 per row, or a sideways scroll row |
| **Listing card** | Photo (4:3) with heart and optional badge, title, "N$ x / day", town with pin, star + rating (count) | Price always via `formatNad`. Badges: "Featured" (`accent`), "Verified" (`primary`). No distance. Phone: 2 per row at 390 px, photo 4:3 |
| **Dashboard sidebar** | `deep` column, logo, menu with icons, active item filled `primary` | Desktop (1024 px and up) only. Phone keeps the bottom tab bar (`src/components/app-nav.tsx`) |
| **Stat card** | White card, small label, big number, quiet caption, optional trend | The Today cards already follow this. Overdue number in `danger` only when above 0 |
| **"View all →" link** | `primary`, 14 px, right of a section title | Goes to the full list. The arrow is part of the link text |
| **Status pill** | Rounded, 12 px semibold, word always shown | Use `StatusBadge` / `QuoteBadge` in `src/components/status-badge.tsx`. Waiting = `accent`, confirmed = `primary`, in progress = `primary` outline, needs action = `danger`, finished = `muted` |
| **Step indicator** | Numbered circles joined by a line, current step filled `primary`, labels beside | 4 steps for adding an item. Phone: circles only, plus "Step 2 of 4: Photos" under them |
| **Primary / secondary button** | Filled `primary` / white with `border` | `buttonClass` / `secondaryButtonClass` in `src/components/ui.tsx` |

## 3. Screens

| Mockup screen | Sections, top to bottom | SRS phase | What it becomes in RentLoop | Phone layout (390 px) |
| --- | --- | --- | --- | --- |
| **Home** (`design-home.jpeg`, and the top-left of `design-screens.jpeg`) | Top bar · hero on a photo with headline (second line in `highlight`) and search · category tiles · Popular Rentals row · Why panel + List your item card · Featured Rentals grid · Top Categories · promo banner · How It Works (3 numbered steps) · footer strip | P1 now, P2 later | **Now (P1):** the public homepage for hire business owners (`src/app/(marketing)/page.tsx`): hero, how it works, plans, FAQ; no listings or search yet. **P2:** the marketplace home with search by item, town and date (FR-SR-01), the SRS categories, popular and featured listings (labelled "Featured", 3.3) | Hero headline 32 px over a darkened photo, search full width under it · category tiles 2 per row · listings 2 per row · Why and How It Works stacked · footer stacked |
| **Item page** (top middle) | Breadcrumb · photo gallery · title, Verified badge, price · rating, town · specs row · About · Features / Availability / Reviews tabs · right column: owner card, Message, Book Now, dates, Check availability, price breakdown, Report listing | P2 | Listing page (FR-SR-04, FR-SR-05): photos, price per day, deposit, business name, town, badges, rating and reviews. The button is **"Request booking"** (FR-BK-03), not a payment. Message is P2 with masked contact details (FR-PV-02) | Gallery full width with swipe dots · title and price · dates and "Request booking" in a sticky bottom bar · tabs become stacked sections |
| **List an Item** (top right) | Sidebar · step indicator (Item details, Photos, Pricing & availability, Review) · Basic information (category, title, description, location) · Item details · Save as draft / Next | P1 | The 4-step add item flow for staff (FR-IN-01, FR-IN-02, FR-IN-04, FR-CA-05). Fields fit hire stock: category, name, description, photos, **quantity owned**, units out of service, price per day, deposit, replacement value, turnaround days, low-stock warning | One column · step indicator as circles plus "Step 2 of 4" · "Next" full width in a sticky bottom bar |
| **Owner Dashboard** (bottom left) | Sidebar · greeting and avatar · stat cards (listings, bookings, earnings with trend) · Earnings Overview bar chart · Recent Bookings with status pills · My Listings row | P1 | The staff app home (`/calendar` today). Stat cards = the Today cards plus month totals. "Earnings" is called **"Money recorded"**, because RentLoop only records what the business received (2.4, FR-RP-01). My Listings = inventory | Bottom tab bar instead of the sidebar · stat cards 2 per row · chart full width · lists stacked |
| **Customer Dashboard** (bottom middle) | Sidebar · greeting banner with Browse Now · stat cards (active, upcoming, past) · Upcoming Rentals with status pills · Recent Activity | P1 link pages, P2 accounts | **P1:** the customer booking link page `/b/[token]`, opened without an account (FR-AC-04): booking summary, status pill, items, money, payment and handover confirmations. **P2:** a real customer dashboard once customers have accounts (search, requests, reviews) | Single column, no sidebar · green header band · cards stacked |
| **Payment page** (bottom right) | Sidebar · booking summary on `deep` with "Awaiting payment" pill · payment method choice · Amount details with service fee · "Secure & Encrypted" box · Pay Now | P1 | Becomes the **money part of `/b/[token]`**: amount due, paid and still to pay, how to pay **the business directly** (its payment terms and bank details), and each recorded payment for the customer to confirm (FR-PY-03, FR-PY-04). No payment form | Summary card on `deep` at the top · totals box · payment records with Confirm buttons |

## 4. Not from the mockups

We leave these out, because the SRS says so.

| In the mockups | Why it stays out | SRS |
| --- | --- | --- |
| Card payment, "Pay Now", "Mobile Money", payment method choice | Customers pay the business directly; RentLoop never takes or holds rental money | 1.2, 2.4, 3.4 |
| "Wallet", "My Payments", "Transactions" | No wallets or stored credit in any phase | 2.4 |
| Renter "Service fee" in the price breakdown | Customers always use the platform free; only businesses pay a booking fee | 1.3, 3 |
| "Secure & Encrypted", "Your payment is protected", "Secure payments" | No screen may call payments protected, secured or guaranteed | NFR-12 |
| Distance in km ("2.1 km away") | Not in the MVP; distance needs the P2 maps interface. Show the town only | FR-PV-03, 7.2 |
| Individual owners: "Earn from what you have", "List what you own", homes and cars per night | Businesses first; individuals are Phase 3 | 2.1, 2.2 |
| Instant "Book Now" | Customers send a booking request the business accepts | FR-BK-03, FR-BK-04 |
| "Verified" badges and "Verified users" before P2 | Business verification arrives with the marketplace | FR-AC-03 |
| Messages and Wishlist before P2 | In-app messages with masked contacts are P2 | FR-PV-02 |
| "24/7 Support" | Not a commitment in the SRS | — |

## 5. Components

| Part | Existing component | Status |
| --- | --- | --- |
| Buttons, inputs, page header, empty state | `src/components/ui.tsx` (`buttonClass`, `secondaryButtonClass`, `inputClass`, `PageHeader`, `EmptyState`) | Keep; restyle through tokens |
| Status pill | `src/components/status-badge.tsx` (`Badge`, `StatusBadge`, `QuoteBadge`) | Keep |
| Phone tab bar, top nav | `src/components/app-nav.tsx` (`BottomTabs`, `TopNav`) | Keep for phones; desktop gets the sidebar |
| Stat cards | `src/components/today-section.tsx` | Keep; split out a reusable `StatCard` when the dashboard needs more |
| Customer page header, line cards, totals | `src/components/customer-page.tsx` (`BusinessHeader`, `LineCards`, `TotalsBox`) | Keep; `BusinessHeader` moves to `deep` |
| Item and package lines in forms | `src/components/item-lines.tsx`, `src/components/package-lines.tsx` | Keep |
| Photo upload | `src/components/photo-upload.tsx` | Keep; used by the Photos step |
| Copy and print buttons | `src/components/copy-button.tsx`, `src/components/print-button.tsx` | Keep |
| Top bar (public) | Inline in `src/app/(marketing)/layout.tsx` | **New** `TopBar` component |
| Footer strip | Inline in `src/app/(marketing)/layout.tsx` | **New** `SiteFooter` component |
| Dashboard sidebar | — | **New** `Sidebar` (desktop) |
| Category tile | — | **New** `CategoryTile` |
| Listing card | — | **New** `ListingCard` (P2) |
| "View all →" link | — | **New** `ViewAllLink` |
| Step indicator | — | **New** `StepIndicator` |
