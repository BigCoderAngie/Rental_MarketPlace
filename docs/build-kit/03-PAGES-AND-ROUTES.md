# 03 · Pages and routes

Each page has a desktop reference (`reference/desktop/<File>.html`, 1440 px) and a phone reference (`reference/mobile/<File>.html`, 390 px). Copy text exactly from those files. Suggested routes — adapt to the project's router and ask if it already uses different paths.

| # | Page | Route | Reference file | Signed in? |
|---|---|---|---|---|
| 1 | Home / landing | `/` | `SiteHome.html` | No |
| 2 | Sign in | `/signin` | `SiteLogin.html` | No |
| 3 | Join (rent or earn) | `/join` | `SiteJoin.html` | No |
| 4 | Renter sign up, step 1 | `/signup/renter` | `SiteSignUp.html` | No |
| 5 | Renter sign up, step 2 | `/signup/renter/about` | `SiteSignUp2.html` | No |
| 6 | Owner sign up, step 1 | `/signup/owner` | `SiteOwnerSignUp.html` | No |
| 7 | Owner sign up, step 2 | `/signup/owner/details` | `SiteOwnerSignUp2.html` | No |
| 8 | You're in | `/welcome` | `SiteAllSet.html` | Yes |
| 9 | Explore | `/explore` (`?q=&town=&from=&to=&cat=`) | `SiteExplore.html` | Either |
| 10 | Item page | `/items/[id]` | `SiteItem.html` | Either |
| 11 | Renter bookings | `/bookings` | `SiteBookings.html` | Yes |
| 12 | Owner dashboard | `/owner` | `SiteOwner.html` | Yes |
| 13 | Owner requests | `/owner/requests` (`/[itemId]`) | `SiteRequests.html` | Yes |
| 14 | List an item | `/owner/list` (3 steps) | `SiteList.html` | Yes |

Phone layout applies below 768 px. Desktop from 1024 px.

---

## 1 · Home (`SiteHome.html`)

**Desktop, top to bottom**
1. TopStrip (deep green): flag + "Windhoek, Namibia ▾" · motto in yellow "We only earn when you earn. Renting and listing are free." · Get the app · For hire businesses · Help.
2. Header (signed out): logo lockup, nav, search, **Sign in**, **Sign up free**.
3. Hero (deep green, big decorative circle top-right), two columns:
   - Left: pill (flag + "Namibia's rental marketplace · We only earn when you earn"), H1 "Why buy it? / Rent it nearby." (second line yellow), subline, **3-part search** (What / Where / When + green Search button inside the white bar — the button must always stay inside the bar), "Popular:" chips (Bakkie hire, Cameras, Wedding marquees, Camping gear, Power tools), proof row (✓ Free to request · ✓ No fees for renters · ✓ ID-checked owners).
   - Right: fixed-size 540×550 collage of 4 tilted photo cards with white price pills, plus 2 floating notes ("Request accepted · Camera with 2 lenses · 14–16 Nov" and "+ N$1,950 this weekend · An owner in Klein Windhoek earned"). The collage must never overlap the left column.
4. Category icon bar: white floating card overlapping the hero bottom, 9 lit icon tiles.
5. "Popular near you" — 4 BookingCards in a row.
6. "How RentLoop works" — 3 white step cards with yellow numbers.
7. Earn section (green, radius 32): "N$0 to list, always" pill, H2 "Earn with what you own. / We only earn when you earn.", copy, 3 checks, buttons **List an item free →** (yellow, goes to owner sign-up) and **Set up a hire business** (outline); right side earnings card (N$2,090, mini bar chart) and two "● LIVE" listing cards.
8. "What people say" — 3 review cards (placeholders until real reviews exist).
9. AppPromo (deep green, phone mockup, store buttons, QR placeholder).
10. "Got questions?" FAQ (6 items, 2 columns).
11. Footer.

**Phone:** top strip (flag + motto), header (logo, Sign up, menu). Hero stacks: pill, H1 42 px, subline, search as 3 stacked rows + full-width Search, chips scroll sideways, proof list, small 2-photo collage with "Request accepted". Category tiles and Popular cards scroll sideways. Everything else stacks. FAQ single column. Footer with accordions and stacked store buttons.

## 2 · Sign in (`SiteLogin.html`)
Desktop: centred split card. Left deep green (faint hero photo, logo 46 px, "Rent it today. / Skip buying it.", 3 benefits, flag + motto). Right: "Welcome back", tabs **Mobile code** (active) / **Email**, +264 field, "Text me a code", divider, store buttons, "← Back to home", "New to RentLoop? Create an account" (→ Join).
Phone: green header block, white card overlapping it with the same form.

## 3 · Join (`SiteJoin.html`)
Two big cards: **I want to rent** (green, → renter sign-up) and **I want to earn** (yellow, → owner sign-up). "One account does both."
Phone: cards stacked.

## 4–7 · Sign-ups
Renter: Account → About you. Owner: Account → Owner details. Exact fields in `02-BUSINESS-RULES.md` §16–17 and the reference files. Required terms checkbox on step 2 of both. Owner step 2 primary button is yellow "Create account and list my first item →".
Phone: back header with "Step n of 2", progress bars, stacked fields, sticky bottom action (← icon + main button).

## 8 · You're in (`SiteAllSet.html`)
Deep green page: yellow check tile, "You're in, Tangeni!", 3 how-it-works cards, **Start exploring** (yellow) + **List my first item** (outline), "Get the RentLoop app" with store buttons.

## 9 · Explore (`SiteExplore.html`)
Signed-in header + category bar. Big search with Search button, category chips (All + 9). Left Filters card (Town, From/To, price chips, "Verified owners only" toggle, Reset / Show results). Right: "9 items in Windhoek · Fri 14 – Sun 16 Nov", Sort, **3-column grid of BookingCards** with yellow **Request to book**, "Show more".
Phone: search + Filters button (filters open as a bottom sheet), chips scroll, count/sort row, cards full width.

## 10 · Item page (`SiteItem.html`)
Breadcrumb, 16:9 gallery + 4 thumbs (placeholders), category + "Like new", title, rating line, price card (N$650 / day, minimum days, deposit), **owner card with LockedDetails**, About, Reviews, "Similar near you". Right sticky card "Request to book" (Free to send pill, dates, availability, quantity stepper, Pay-the-owner-at-collection box, "Booking fee for you N$0", "You pay the owner N$6,950", message, warning note, **Send request**).
Phone: full-bleed photo with back/save/share, the same blocks stacked, "Your dates" card inline, sticky bottom bar (price + **Send request**).

## 11 · Renter bookings (`SiteBookings.html`)
Desktop: deep-green sidebar (logo, Renter/Owner toggle, nav). Stats (Active / Upcoming / Past), tabs, booking cards: **Accepted** (owner name, address, Call / WhatsApp / View) and **Waiting for owner** (LockedDetails, Cancel request), Recent activity.
Phone: Renting/Lending toggle, stat cards scroll, tabs, stacked cards.

## 12 · Owner dashboard (`SiteOwner.html`)
Sidebar (Owner active). "Recorded this month N$2,090" dark card, Bookings and Listings stats, "Money recorded" 6-month bar chart, Booking requests (Renter A/B/C), My listings + "Run a hire business?" card, **+ List a new item**.
Phone: toggle, stacked cards, sticky **+ List a new item**.

## 13 · Owner requests (`SiteRequests.html`)
Left: item header ("You own 1 · 3 renters want it"), yellow note about clashing dates, grouped request cards (Renter A selected, "Best match"). Right: Renter A's request (expiry pill, message, LockedDetails, dates, money, **Your booking fee (10%) N$195**, **You keep N$1,755**, Decline / **Accept and pay N$195**), and the deep-green "After you pay · renter unlocked" preview.
Phone: list, then detail card, sticky Decline + Accept and pay.

## 14 · List an item (`SiteList.html`)
Desktop: stepper column (Category ✓, Details and price, Photos and place), form cards (category tiles, details, condition chips, price/deposit/min days, quantity stepper, photos with Cover, collection area), right preview card + "How you get paid" + yellow **Publish my listing**.
Phone: progress bars "Step 2 of 3", category chips scroll, stacked form, mini preview, sticky **Continue to photos →**.
