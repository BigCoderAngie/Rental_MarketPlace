# 04 · Build in parts

Paste one part at a time into Claude Code. Don't move on until the part's checklist passes in your browser at **1440 px** and **390 px** wide.

---

## Part 0 · Read everything and ask questions (no code yet)

```
Read rentloop-build-kit/00-MASTER-PROMPT.md and follow it for the whole build.
Then read every file in rentloop-build-kit/ (open several reference HTML files fully), my SRS documents in this repo, and the existing project code.
Do not write code yet. Reply with:
1. A short summary of the existing project: stack, routing, styling, auth, database, components that already exist, and anything already built for RentLoop.
2. How you will map the kit onto this project (where tokens, components and pages will live).
3. A list of SRS requirements that add to the wireframes, and any conflicts with 02-BUSINESS-RULES.md.
4. Your questions for me, batched, each with options and your recommendation. Include at least: booking fee % (10% or N$0 launch), auth/SMS provider, database/storage for photos, Free plan listing limit, app store links, and the 768–1023 px layout.
```

## Part 1 · Design foundations

```
Part 1. Build the design foundations only, exactly from rentloop-build-kit/01-DESIGN-SYSTEM.md and rentloop-build-kit/assets/styles/*.css:
- Load Inter (400–800). Add every colour, radius and spacing token.
- Port the .b3 lit press-down lighting verbatim and build a shared Button component (variants green, yellow, white, mint, outline; sizes sm, md, lg; chip; full-width cta pill). Use background-color, never the background shorthand.
- Logo component using rentloop-build-kit/assets/brand/rentloop-logo.svg (flat, lit, no bottom edge, no shadow) + "RentLoop" wordmark lockup; Flag component from flag-namibia.svg.
- ImagePlaceholder component using assets/placeholders/item-photo-placeholder.svg with aspect-ratio and radius props.
- A /styleguide page showing every button variant and size (resting, hover, pressed), chips, the logo at 32/38/46 px, the flag, colours and type scale.
Then compare the buttons with any button in rentloop-build-kit/reference/desktop/SiteHome.html side by side and report.
```
**Check:** buttons look lit from above, sink 4 px when pressed and the edge disappears; logo matches exactly; no extra shadows.

## Part 2 · Shell: top strip, header, category bar, footer, help button

```
Part 2. Build the shared shell exactly as in reference/desktop/SiteHome.html and SiteExplore.html (signed-in) and reference/mobile/SiteHome.html:
TopStrip (flag + town, yellow motto, Get the app, For hire businesses, Help), Header (signed-out: Sign in + Sign up free, no List an item; signed-in: List an item + avatar; phone: logo, Sign up or avatar, menu button with a slide-in menu), CategoryBar (signed-in pages), Footer (desktop columns; phone accordions), floating Need help? button. Sticky header. Use placeholder links where pages don't exist yet.
```
**Check:** header switches correctly between signed-out and signed-in; phone header and footer match the phone reference.

## Part 3 · Home page

```
Part 3. Build the Home page (/) exactly as reference/desktop/SiteHome.html and reference/mobile/SiteHome.html, section by section as listed in 03-PAGES-AND-ROUTES.md §1.
Shared components to create: SearchBar (What/Where/When; the Search button must always stay inside the white bar and stay clickable at every width), CategoryTiles, BookingCard (Amazon-style, yellow Request to book pill), HowItWorks, EarnSection, Reviews (placeholder data), AppPromo (phone mockup, store buttons, QR placeholder), FAQ.
The hero collage is a fixed 540×550 box that sits beside the text and never overlaps it; hide or simplify it as in the phone reference below 768 px.
All photos use the ImagePlaceholder until real data exists. Use fixture data for cards, clearly marked as sample.
```
**Check:** nothing overlaps the search; category bar overlaps the hero bottom; phone version scrolls sideways where the reference does.

## Part 4 · Sign in, Join and both sign-ups

```
Part 4. Build /signin, /join, /signup/renter (+ /about) and /signup/owner (+ /details) exactly as the matching reference files, desktop and phone.
Rules from 02-BUSINESS-RULES.md §16–21: Mobile code (default) or Email sign in; two sign-up paths; required Terms and Privacy checkbox blocks submit; owner step 2 also requires the booking fee acknowledgement; validation messages in the same style; after sign-up go to /welcome (renters) or /owner/list (owners). Build /welcome (You're in) too.
Wire to the auth we agreed in Part 0; if not decided yet, ask me before connecting.
```
**Check:** can't create an account without ticking terms; both paths work; phone versions have the sticky bottom button.

## Part 5 · Explore

```
Part 5. Build /explore exactly as reference/desktop/SiteExplore.html and reference/mobile/SiteExplore.html: search, category chips, filters (desktop sidebar, phone bottom sheet), results count and sort, 3-column BookingCard grid (1 column on phone), Show more.
Availability line on each card must come from the item's calendar for the searched dates. Request to book goes to the item page with the dates kept; signed-out users are sent to sign up first and returned afterwards.
```

## Part 6 · Item page and sending a request

```
Part 6. Build /items/[id] exactly as reference/desktop/SiteItem.html and reference/mobile/SiteItem.html, including LockedDetails for the owner, the sticky Request to book panel (desktop) and sticky Send request bar (phone).
Implement the free request flow from 02-BUSINESS-RULES.md: renter pays N$0, owner identity hidden, "Others may ask for the same dates" note, request expires in 24 h.
```

## Part 7 · Renter bookings

```
Part 7. Build /bookings exactly as reference/desktop/SiteBookings.html and reference/mobile/SiteBookings.html: sidebar (desktop) / Renting–Lending toggle (phone), stats, tabs, Accepted card (owner unlocked, Call / WhatsApp / View) and Waiting card (LockedDetails, Cancel request), Recent activity.
```

## Part 8 · Owner dashboard, requests and fee

```
Part 8. Build /owner and /owner/requests exactly as reference/desktop/SiteOwner.html, SiteRequests.html and their phone versions.
Implement: requests grouped by dates, Renter A/B/C anonymity, Best match tag, expiry timer, Accept and pay the booking fee (percentage from config), auto-decline of same-date requests, quantity rule, unlock of both parties after payment, 30-day fee refund claim. Ask me about the payment provider before wiring real payments; use a clearly marked test mode until then.
```

## Part 9 · List an item

```
Part 9. Build /owner/list (3 steps) exactly as reference/desktop/SiteList.html and reference/mobile/SiteList.html: categories, details and price, condition, quantity, photos with Cover (real uploads, placeholder until uploaded), collection area (area public, street address private until a booking is accepted), live preview card, How you get paid, Publish my listing.
```

## Part 10 · Final polish and QA

```
Part 10. Do a full pass against every reference file at 1440, 1024, 768 and 390 px. Fix any spacing, colour, radius, copy or lighting differences. Check keyboard navigation, focus rings, alt text, contrast and touch targets. Check every link between pages. Give me a list of anything you could not match and why.
```

---

### If something looks off

Paste this:

```
Compare <page route> with rentloop-build-kit/reference/<desktop|mobile>/<File>.html at <1440|390> px, list every visual difference (spacing, size, colour, radius, shadow, copy, button lighting) and fix them. Don't change anything that already matches.
```
