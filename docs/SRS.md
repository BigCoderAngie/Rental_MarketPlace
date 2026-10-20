> **Being rewritten (20 Oct 2026):** the MVP is now a two-sided marketplace with individual and business owners. The changes to make are listed in `docs/MASTER-PLAN.md` under "Changes to the SRS" (items 4 to 8). Until the online SRS is updated, MASTER-PLAN.md wins where they disagree.
>
> Copy of the SRS (Claude Doc, rev 219, exported 19 Oct 2026). The original is the source of truth: https://claude.ai/code/artifact/53bc03dd-b135-487b-ada0-49254fd9d247 . Diagrams are only in the online version.

# Software Requirements Specification: Namibia Rental Platform

2026-10-05 · @ccvx

## 1. Introduction

This SRS defines version 1.0 of the platform: booking software for Namibian hire businesses that grows into a public rental marketplace. It replaces the marketplace-first plan in the master handoff with the rerouted direction agreed on 24 September 2026: software first, marketplace second, individuals third.

### 1.1 Purpose

The document tells developers, testers and partners what the system must do in each phase, and gives the business a baseline to price, build and test against.

### 1.2 Scope

- **In scope (Phase 1 and 2):** inventory, availability calendar, quotes, bookings, checkout and return records, payment records, customer history, reports, public search, marketplace booking requests, booking fees, subscription tiers (Free, Pro, Business), featured listings and admin tools.
- **Later (Phase 3):** individual owners, delivery, insurance, website booking widgets, the mobile app and regional expansion.
- **Never in scope for v1:** holding, splitting or paying out rental money or deposits. Customers pay businesses directly; the platform only records it.

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Business | A hire company (or later an individual owner) that lists and rents out items |
| Customer | A person or organisation that books items; renters pay no platform fee |
| Item | A rentable product with a quantity in stock, e.g. 300 chairs or 1 PA system |
| Booking | One rental of one or more items for a date range; the single source of truth for that rental |
| Quote | A priced proposal sent to a customer as a link, usually over WhatsApp |
| Marketplace booking | A booking that started from public search on the platform |
| Direct booking | A booking the business created itself (phone, walk-in, WhatsApp) |
| Booking fee | The capped fee a business pays when it accepts a marketplace booking; the rate depends on its tier (Free 10%, Pro 5%, Business 0%) |
| Checkout | The handover of items to the customer, with counts and condition photos |
| N$ | Namibian dollar |

### 1.4 References

- Master Project Handoff (sections 1 to 81), uploaded 24 September 2026
- Project chat "Continuing previous work", 24 September 2026 (payment model and reroute)
- Booking workflow summary posted in this project on 5 October 2026

### 1.5 Conventions

Requirements use "must" for mandatory and "should" for desirable. Each has an ID such as FR-BK-03 (functional, booking module, number 3) and a phase tag P1, P2 or P3.

## 2. Overall description

The product starts as the system Namibian hire businesses run on, turns their live inventory into a public marketplace, then opens to everyone.

### 2.1 Product perspective and phases

One platform API serves the website now and the mobile app later, so accounts, items and bookings are shared across both (handoff section 65).

| Phase | What ships | Who uses it | Gate to the next phase |
| --- | --- | --- | --- |
| P1: Business software | Inventory, calendar, WhatsApp quotes, bookings, checkout and return records, payment records, customers, reports | Hire businesses and their staff | 30 to 50 businesses keeping inventory and calendars in the app |
| P2: Marketplace | Public search by item, town and date; booking requests; booking fee by tier; reviews; featured listings | Customers, plus P1 businesses | Regular marketplace bookings accepted and paid for |
| P3: Open platform | Individual owners, delivery, insurance partners, website widgets, mobile app | Everyone | Not set |

### 2.2 User classes

| User | Main goals | Phase |
| --- | --- | --- |
| Business owner (admin) | Set up the business, items, prices, staff, plan and billing | P1 |
| Business staff | Create quotes and bookings, run checkout and return, record payments; limited by role | P1 |
| Customer | Find items, request bookings, accept quotes, confirm checkout and return, review | P1 via quote link, P2 via search |
| Platform admin | Verify businesses, moderate listings, set fees and plans, handle reports, view revenue | P1 |
| Individual owner | List personal items and accept bookings | P3 |

### 2.3 Operating environment

- Mobile-first responsive website on Android and iOS browsers and desktop; works on low-end phones and slow 3G connections.
- Quote and booking links open without an app install or account.
- Suggested stack from the handoff: Next.js frontend, Python FastAPI backend, PostgreSQL, cloud object storage for photos.

### 2.4 Constraints

- The platform must not accept, hold or pass on money owed to a business, so it stays outside Bank of Namibia payment-service rules. It only collects its own fees and subscriptions through a merchant account.
- No wallets, stored credit, escrow or deposit holding in any phase covered by this SRS.
- Prices in N$; dates in Namibian time (UTC+2).
- Personal data must be handled in line with Namibian privacy and electronic-transactions law.

### 2.5 Assumptions and dependencies

- A local payment gateway (for example DPO or PayToday) is available for card and online payments of platform fees.
- An SMS or WhatsApp messaging provider is available for notifications.
- A Namibian lawyer confirms the fee model and an accountant confirms VAT before fees switch on.

## 3. Business model

The platform earns from three things and never touches rental money: a yearly subscription tier (Free, Pro or Business), a capped booking fee on marketplace bookings whose rate the tier sets, and labelled featured listings. Customers always use the platform free.

| Revenue | Who pays | When | Rule |
| --- | --- | --- | --- |
| Subscription | Business | Yearly | Free, Pro and Business tiers; the tier sets the booking fee (10%, 5% or 0%) |
| Booking fee | Business | When it accepts a marketplace booking | Percentage of the rental with a minimum and a cap; refunded if the rental does not happen |
| Featured listing | Business | Upfront, per period | Always labelled "Featured"; never changes organic ranking |

### 3.1 Booking fee rules

- Charged only on marketplace bookings, never on direct bookings or quotes the business creates itself.
- Calculated on the rental amount only; deposits and delivery are excluded.
- Starting values, all admin-configurable: minimum N$20, maximum N$500 per booking; the rate depends on the business's tier (10% Free, 5% Pro, 0% Business, see 3.2). There is no repeat-booking discount.
- Paying the fee (or accepting, on a 0% tier) confirms the booking and unlocks the customer's contact details for the business.
- Fee states: NOT_DUE, PENDING, PAID, EARNED (at checkout), REFUNDED. Only EARNED fees count as revenue.
- Full refund if the rental does not happen: the customer cancels, nobody shows up, or the platform cancels.
- Trusted businesses (about 5 completed marketplace bookings, no unpaid fees) may be billed after checkout on a monthly statement; an unpaid statement pauses their marketplace listings.
- Launch period: the fee is set to 0% for the first three months of P2, with the end date announced up front; the accept step stays the same.

### 3.2 Subscription tiers

- A genuinely useful free tier always exists; trust features (verification, checkout and return records, reviews, Report a Problem) are never paywalled.
- Three tiers, billed yearly only. Prices and limits are admin settings; the launch prices below are founding prices, kept low so businesses join at launch, and checked with 20 to 30 businesses first.
- Paid by card or online through the gateway, or by bank deposit or eWallet with proof of payment approved by an admin.

| Tier | Price | Booking fee | Items | Users | Includes |
| --- | --- | --- | --- | --- | --- |
| Free | N$0 | 10% | 15 | 1 | Calendar, quotes, bookings, marketplace listing |
| Pro | N$199 a year (about N$17 a month) | 5% | 100 | 3 | Everything in Free, reports and CSV export |
| Business | N$499 a year (about N$42 a month) | 0% up to N$120,000 marketplace rentals a year, 5% above | Unlimited | Unlimited | Everything in Pro, 2 featured listings a month |

Business costs less than Free once a business rents about N$5,000 a year through the marketplace, and less than Pro from about N$6,000, so most active businesses should choose it. Founding prices stay locked for the first year for businesses that join at launch.

- MVP: a business picks a tier and pays by bank deposit or eWallet; an admin approves the proof of payment and switches the tier on for 12 months. Gateway payments can follow after the MVP.
- When a paid tier lapses, the business drops to Free; nothing is deleted, but items over the Free limit are hidden from the marketplace until it renews or removes items.

### 3.3 Featured listings

- Bought per category, per town, per period (for example N$50 for a week; price set by admin).
- Shown in a clearly separated, labelled slot; search ranking otherwise follows section 5.

### 3.4 Customer payments

Customers pay the business directly in cash, EFT, eWallet or card on the business's own terms. The business records the amount, method and date in the app, including the deposit taken and returned. The app never describes this as protected or secured money.

## 4. Booking workflow

Every booking, direct or marketplace, runs the same six steps: Request, Accept, Pay, Checkout, Return, Close. Marketplace bookings add one step at Accept, where the business pays the booking fee for its tier; on Business there is no fee and the step is skipped.

### 4.1 Flowchart


[diagram in the online SRS]

Items leave the available stock at Accept, and a cancellation before Checkout releases them and refunds any booking fee.

The same workflow split by side: the customer's actions on the left, the business owner's on the right.

[diagram in the online SRS]

Arrows across the lanes show each hand-off; the dashed fee step happens only on marketplace bookings, and not at all on the Business tier.

### 4.2 Booking states

| State | Entered when | Next states |
| --- | --- | --- |
| REQUESTED | Customer sends a request or accepts a quote | ACCEPTED, DECLINED, EXPIRED |
| ACCEPTED | Business accepts; items blocked on the calendar | CONFIRMED (direct bookings and 0% tier bookings go here at once), CANCELLED |
| FEE_PENDING | Marketplace booking accepted; fee awaiting payment | CONFIRMED, EXPIRED (fee unpaid in 24 hours, items released) |
| CONFIRMED | Direct booking accepted, marketplace fee paid, or accepted on a 0% tier; contacts unlock | CHECKED_OUT, CANCELLED |
| CHECKED_OUT | Both sides confirm checkout counts and photos; marketplace fee becomes EARNED | RETURNED, OVERDUE |
| OVERDUE | Return date passed without a return record | RETURNED |
| RETURNED | Both sides confirm the return record | CLOSED, PROBLEM_OPEN |
| PROBLEM_OPEN | A problem is reported at or after return | CLOSED |
| CLOSED | No open problem; reviews open for 14 days | None |
| DECLINED, EXPIRED, CANCELLED | End states before checkout; any paid fee refunded | None |

Payment is recorded alongside the states, not as a state: a booking can be CONFIRMED with the rental unpaid, part-paid or paid, because the customer often pays cash at checkout.

## 5. Functional requirements

There are 74 requirements across 14 modules; P1 items make the business software, P2 items add the marketplace.

### 5.1 Accounts and business setup (AC)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-AC-01 | Users must register with a phone number verified by one-time code; email is optional | P1 |
| FR-AC-02 | A business owner must create a business profile: name, logo, towns served, operating hours, contact details, BIPA number (optional) | P1 |
| FR-AC-03 | Platform admin must verify a business before its listings appear in public search; verified businesses show a badge | P2 |
| FR-AC-04 | Customers must be able to accept a quote or confirm checkout from a link without creating a full account | P1 |
| FR-AC-05 | Account states must follow: NEW, PHONE_VERIFIED, ACTIVE, UNDER_REVIEW, SUSPENDED, CLOSED | P1 |

### 5.2 Inventory (IN)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-IN-01 | Businesses must add items with name, category, photos, description, quantity owned, daily price, deposit and replacement value | P1 |
| FR-IN-02 | Items must support quantities, so one listing covers 300 identical chairs | P1 |
| FR-IN-03 | Businesses must be able to group items into packages (for example "Wedding 100": tent, 100 chairs, 10 tables) with a package price | P1 |
| FR-IN-04 | Staff must be able to mark units as under repair or retired, which removes them from available stock | P1 |
| FR-IN-05 | Each item must have a public flag; only public items from verified businesses appear in marketplace search | P2 |
| FR-IN-06 | Categories must follow handoff section 13, starting with Events, Tools, and Construction and Machinery | P1 |

### 5.3 Calendar and availability (CA)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-CA-01 | The system must calculate available quantity per item per day from stock minus booked, held and repair units | P1 |
| FR-CA-02 | The system must block any booking or acceptance that would exceed available quantity on any day of its range | P1 |
| FR-CA-03 | An accepted booking must reduce availability immediately; a pending request must not | P1 |
| FR-CA-04 | The calendar must show bookings per day and per item, with a warning on low stock | P1 |
| FR-CA-05 | Turnaround days for cleaning or setup should be configurable per item | P1 |

### 5.4 Quotes (QT)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-QT-01 | Staff must build a quote from items, quantities and dates, with optional delivery, setup and discount lines | P1 |
| FR-QT-02 | The system must generate a quote link and a one-tap WhatsApp share with a pre-filled message | P1 |
| FR-QT-03 | The quote page must show items, dates, total, deposit, payment terms and the business's terms, and let the customer accept or ask a question | P1 |
| FR-QT-04 | A quote must expire after a business-set period (default 7 days) and re-check availability when accepted | P1 |
| FR-QT-05 | An accepted quote must become a booking request for the business to accept | P1 |

### 5.5 Bookings (BK)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-BK-01 | Every booking must have a unique ID, source (direct or marketplace), customer, items and quantities, dates, prices, deposit, status and full event history | P1 |
| FR-BK-02 | Staff must be able to create a direct booking for phone, walk-in or WhatsApp customers | P1 |
| FR-BK-03 | Customers must be able to send a booking request from search for items, quantities and dates | P2 |
| FR-BK-04 | The business must accept or decline each request; a request not answered within 24 hours (configurable) must expire | P1 |
| FR-BK-05 | Booking states must follow section 4.2 | P1 |
| FR-BK-06 | Either side must be able to cancel before checkout, with a reason; cancellations count on both profiles | P1 |
| FR-BK-07 | Staff must be able to edit quantities or dates before checkout, with an availability re-check | P1 |

### 5.6 Booking fees and billing (FE)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-FE-01 | Accepting a marketplace booking must show the fee for the business's tier and require payment before the booking is confirmed; on a 0% tier the booking is confirmed on accept | P2 |
| FR-FE-02 | Fee rate per tier, minimum, cap, Business fair-use limit and launch period must be admin settings, not code | P2 |
| FR-FE-03 | The fee amount must be locked at acceptance, from the price in the app | P2 |
| FR-FE-04 | Fees and subscriptions must be payable by card or online through the gateway, or by eWallet or bank deposit with a proof-of-payment upload that an admin approves | P1 |
| FR-FE-05 | A paid fee must be refunded automatically when a marketplace booking ends in CANCELLED or EXPIRED before checkout | P2 |
| FR-FE-06 | Trusted businesses must be able to receive a monthly statement instead of paying at acceptance | P2 |
| FR-FE-07 | The system must issue a tax invoice for every fee and subscription payment | P1 |

### 5.7 Payment records (PY)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-PY-01 | Staff must record each customer payment: amount, method (cash, EFT, eWallet, card, other), date and who received it | P1 |
| FR-PY-02 | Staff must record deposit received, deductions with reasons, and deposit returned | P1 |
| FR-PY-03 | Each booking must show amount due, paid and outstanding | P1 |
| FR-PY-04 | The customer should be able to confirm a recorded payment from their link | P1 |

### 5.8 Checkout and return (CR)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-CR-01 | At checkout, staff must confirm quantities handed over per item and add condition photos | P1 |
| FR-CR-02 | The customer must confirm counts and condition from their link or on the staff member's phone; the record is timestamped | P1 |
| FR-CR-03 | Staff should confirm the customer's ID matches the booking name, without the platform storing the ID image | P1 |
| FR-CR-04 | At return, staff must record quantities returned, missing and damaged, with photos and a late-return flag | P1 |
| FR-CR-05 | The customer must confirm the return record; disagreement opens Report a Problem | P1 |
| FR-CR-06 | Overdue bookings must be flagged on the dashboard and trigger reminders | P1 |

### 5.9 Report a Problem (PR)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-PR-01 | Either side must be able to report damage, missing items, a no-show or a dispute on a booking, with description and photos | P1 |
| FR-PR-02 | Reports must link the checkout and return records as evidence | P1 |
| FR-PR-03 | Platform admin must be able to view, message both sides, record an outcome and close a marketplace report | P2 |
| FR-PR-04 | Problem states: OPEN, AWAITING_RESPONSE, UNDER_REVIEW, RESOLVED, CLOSED | P1 |

### 5.10 Search and marketplace (SR)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-SR-01 | Customers must search by item or category, town and date range, and see only items with enough available quantity | P2 |
| FR-SR-02 | Event search should accept a guest count and suggest packages (for example "150 guests, Oshakati, 14 March") | P2 |
| FR-SR-03 | Results must rank by availability, relevance, distance, price, rating and verification; featured listings appear in a labelled slot | P2 |
| FR-SR-04 | Listing pages must show photos, price, deposit, business name, town, badges, rating and reviews | P2 |
| FR-SR-05 | Each listing must have a public, search-engine-friendly URL by town and category | P2 |

### 5.11 Contact privacy (PV)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-PV-01 | For marketplace bookings, the customer's phone number and full name must be hidden from the business until the booking fee is paid, or until it accepts on a 0% tier; the backend must enforce this | P2 |
| FR-PV-02 | Before confirmation, both sides must message in the app; phone numbers and emails in messages must be masked, with a visible notice | P2 |
| FR-PV-03 | Customers must see the business's town before booking and the exact address after confirmation | P2 |
| FR-PV-04 | Identity documents must never be shown to the other party; only verification badges | P1 |

### 5.12 Reviews (RV)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-RV-01 | After a booking closes, the customer must be able to review the business and items, and the business the customer | P1 |
| FR-RV-02 | Only completed bookings must allow reviews; each review links to its booking | P1 |
| FR-RV-03 | Profiles must show rating, completed bookings, on-time return rate and cancellation rate | P2 |

### 5.13 Notifications, reports, admin and audit (NT, RP, AD, AU)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-NT-01 | The system must notify by SMS or WhatsApp and in the app for: new request, accepted, declined, expired, fee due, checkout tomorrow, return due, overdue, problem reported, review request | P1 |
| FR-RP-01 | Businesses must see revenue recorded, bookings, utilisation per item, outstanding payments, deposits held, and top customers, exportable to CSV | P1 |
| FR-RP-02 | Businesses must see fees paid and marketplace bookings received | P2 |
| FR-AD-01 | Admin must manage businesses, verification, listings, categories, plans, fee settings, featured slots, proof-of-payment approvals and suspensions | P1 |
| FR-AD-02 | Admin dashboard must show active businesses, bookings, completed marketplace bookings, EARNED fees, subscription revenue and open problems | P1 |
| FR-AU-01 | Every sensitive action (price, availability, booking state, payment record, fee change, suspension) must be written to an append-only audit log with user and time | P1 |

### 5.14 Plans (PL)

| ID | Requirement | Phase |
| --- | --- | --- |
| FR-PL-01 | Every business must start on Free and be able to move to Pro or Business, billed yearly | P1 |
| FR-PL-02 | The tier must set the item limit, user limit and marketplace fee rate; adding past a limit must show an upgrade prompt instead of an error | P1 |
| FR-PL-03 | A tier must be payable by bank deposit or eWallet with a proof-of-payment upload; an admin approves it and the tier runs 12 months from approval | P1 |
| FR-PL-04 | The system must remind the business 30, 7 and 1 days before renewal; an unpaid tier drops to Free, keeps all data, and hides items over the Free limit from the marketplace | P1 |
| FR-PL-05 | Businesses that join at launch must keep founding prices for their first year | P1 |
| FR-PL-06 | Business tier marketplace rentals must count against the fair-use limit, with 5% charged above it and the running total shown to the business | P2 |
| FR-PL-07 | The accept screen on a fee-paying tier should show what the same booking would cost on Business | P2 |

## 6. Non-functional requirements

The system must stay fast on cheap phones and slow networks, and protect customer data by default.

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-01 | Performance | Pages load in under 3 seconds on a 3G connection; search returns in under 2 seconds for 10,000 listings |
| NFR-02 | Data use | A quote page is under 500 KB; photos are compressed and resized on upload |
| NFR-03 | Availability | 99.5% monthly uptime; daily backups kept 30 days; restore tested quarterly |
| NFR-04 | Concurrency | Two staff accepting conflicting bookings at once must never both succeed (availability is checked inside one database transaction) |
| NFR-05 | Security | HTTPS everywhere; passwords hashed; one-time codes expire in 10 minutes; role checks on every API call |
| NFR-06 | Privacy | Contact fields are released only by the backend after the right booking state; ID documents stored encrypted and visible only to verifying admins |
| NFR-07 | Retention | Booking, checkout, return and audit records kept at least 5 years for tax and dispute evidence; personal data deleted or anonymised on account closure where the law allows |
| NFR-08 | Usability | A new staff member can create a quote in under 2 minutes without training; all actions reachable with one thumb on a phone |
| NFR-09 | Language | English at launch; text stored for later Afrikaans and Oshiwambo translation |
| NFR-10 | Offline tolerance | Checkout and return forms keep entered data if the connection drops and submit when it returns |
| NFR-11 | Scalability | One API serves web and the later mobile app; architecture supports 1,000 businesses without redesign |
| NFR-12 | Wording | No screen or message calls deposits or payments "protected", "secured" or "guaranteed" |

## 7. Data model and external interfaces

The booking is the single source of truth; every other record hangs off a business, an item or a booking.

### 7.1 Core entities

| Entity | Key fields | Phase |
| --- | --- | --- |
| users | id, phone, name, verification level, status | P1 |
| businesses | id, name, towns, verified, tier, tier expiry, founding price, billing status | P1 |
| business_members | user, business, role | P1 |
| customers | id, business, name, phone, notes, linked user (optional) | P1 |
| categories, towns, regions | name, parent | P1 |
| items | business, category, name, quantity owned, daily price, deposit, replacement value, public flag | P1 |
| item_units_out | item, quantity, reason (repair, retired), from, to | P1 |
| packages, package_items | package, item, quantity, price | P1 |
| quotes, quote_lines | business, customer, dates, lines, total, expiry, status | P1 |
| bookings, booking_items | business, customer, source, dates, status, totals, deposit; item, quantity, price | P1 |
| booking_events | booking, from state, to state, user, time | P1 |
| payment_records | booking, kind (rental, deposit in, deposit out, deduction), amount, method, date, recorded by | P1 |
| checkout_records, return_records | booking, per-item counts, photos, confirmations, timestamps | P1 |
| problems | booking, type, description, photos, status, outcome | P1 |
| reviews | booking, author, subject, rating, text | P1 |
| platform_charges | business, type (fee, subscription, featured), amount, status, gateway ref, proof upload | P1 |
| fee_settings, plans | rate per tier, minimum, cap, Business fair-use limit, launch end date; tier limits and yearly prices | P1 |
| featured_slots | business, item, category, town, start, end | P2 |
| messages | booking or request, sender, text, masked flag | P2 |
| notifications, audit_logs | recipient or actor, event, time, details | P1 |

### 7.2 External interfaces

| Interface | Use | Phase |
| --- | --- | --- |
| Payment gateway (for example DPO or PayToday) | Collect platform fees, subscriptions and featured listings only; webhooks mark charges paid | P1 |
| SMS provider | One-time codes and notifications | P1 |
| WhatsApp | Share links via wa.me links at P1; WhatsApp Business API notifications later | P1 |
| Maps | Town and area lookup and distance in search | P2 |
| Object storage | Item, checkout and return photos; proof-of-payment uploads | P1 |
| Email | Invoices and statements | P1 |

## 8. Open questions

These need an answer before the matching requirement is built; defaults in brackets are what the SRS assumes now.

- Booking fee values: rate per tier, minimum and cap (10% Free, 5% Pro, 0% Business; N$20 minimum, N$500 cap)
- Tier prices and limits (proposed: Free, Pro N$199 a year, Business N$499 a year; confirm in 20 to 30 business interviews)
- Fee refund when the business itself cancels after paying (full refund; cancellations count on the business profile)
- Customer cancellations and no-shows: full fee refund to the business always (yes, for launch)
- Payment gateway choice and its fees for card and online payments
- Lawyer's confirmation that collecting only platform fees stays outside payment-service licensing
- Accountant's advice on VAT for fees and subscriptions
- Launch towns for P2 (Windhoek and Erongo first)
- Delivery handled by businesses only at P2 (yes; platform delivery is P3)

### 8.1 Partner suggestions

Please add your view next to each question; type straight into the empty cells, or leave a comment on any line of the SRS.

| Question | Your suggestion |
| --- | --- |
| Booking fee rate, minimum and cap |  |
| Tier prices (proposed: Pro N$199, Business N$499 a year) |  |
| Refund when a business cancels |  |
| Refund on customer cancellations and no-shows |  |
| Payment gateway |  |
| Legal check on the fee model |  |
| VAT advice |  |
| Launch towns |  |
| Delivery |  |
| Anything else |  |

## 9. MVP scope

The MVP is the P1 business software plus the three tiers, sold at founding prices to businesses in Windhoek and Erongo. It needs no payment gateway and no marketplace: tiers are paid by bank deposit or eWallet and approved by an admin.

| Area | In the MVP | After the MVP |
| --- | --- | --- |
| Accounts and staff | Sign-up, business profile, staff roles | Verification badge, with the marketplace (P2) |
| Inventory and calendar | Items, stock counts, availability calendar, clash warnings | None |
| Quotes and bookings | WhatsApp quote links, direct bookings | Marketplace booking requests (P2) |
| Checkout and return | Counts and photos, confirmed by both sides | None |
| Payment records | Cash, EFT, eWallet and card records; customer receipts | None |
| Plans | Free, Pro and Business, yearly; proof-of-payment upload, admin approval, tax invoice, renewal reminders, item and user limits | Card and online payment through the gateway |
| Reports | Basic reports on every tier; full reports and CSV export on Pro and Business | None |
| Booking fees | None, because there is no marketplace yet | Fee by tier, refunds, monthly statements (P2) |
| Marketplace | None | Search, requests, reviews, featured listings (P2) |
| Admin | Approve proofs of payment, set tier prices and limits, suspend accounts | Fee settings, featured slots (P2) |

- **Why Business sells before the marketplace exists:** founding Business customers lock in 0% booking fees for when P2 opens, plus unlimited items and users now.
- **Launch period:** the 0% fee for the first three months of P2 (3.1) still applies to every tier; Business stays at 0% after it ends.
- **MVP is done when** 30 to 50 businesses keep their inventory and calendars in the app, the P1 gate in 2.1.
- **Before P2 opens:** choose the payment gateway and get the lawyer's confirmation on platform fees (section 8).
