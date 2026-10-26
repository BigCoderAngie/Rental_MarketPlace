# 02 · Business rules

These are the product decisions behind the wireframes. Build the UI states for all of them. Where the SRS adds detail, follow the SRS; where it conflicts, ask.

## Money

1. **Renters never pay RentLoop.** Sending a request is free. The item page shows "Booking fee for you: N$0".
2. **Rent and deposit are paid to the owner directly**, at collection or as they agree. The deposit is returned after the rental.
3. **The owner pays the booking fee**, and only when they accept a renter. It is a percentage of the rental total — **10% is a placeholder**. Show it as "Your booking fee (10%) N$195" and "You keep from the rental N$1,755" (N$1,950 example). Make the % a single config value. **Ask me** before final: the old desktop screens showed "N$0 during launch period".
4. **Refunds:** if the renter cancels or doesn't show, the owner can claim a full refund of the booking fee within **30 days**.
5. **Listing is free** (N$0 to list). Free plan has a listing limit (wireframe: "2 listings · 13 more on the Free plan") — confirm the number with me.
6. Motto everywhere it appears: **"We only earn when you earn."**
7. Currency: Namibian dollar, written `N$650`, thousands with a comma (`N$6,500`).

## Privacy until booked

8. Before the owner accepts **and** pays the fee, **neither side sees the other's identity**:
   - The renter sees only the product: photos, price, deposit, town/area, rating, reviews, "Verified owner · ID checked".
   - The owner sees requests as **Renter A, Renter B, Renter C** with rating, number of rentals, ID checked and their message.
   - Names, phone numbers, street addresses and chat stay hidden (LockedDetails bars).
9. When the owner pays, both unlock at once: the owner gets the renter's name and phone; the renter gets the owner's name, phone and collection address, plus Call / WhatsApp buttons.

## Several renters, same item

10. All requests for an item land in one list, grouped by dates ("Same dates · 14–16 Nov", "No clash · 21–22 Nov").
11. Same dates: the owner picks one. Accepting declines the others automatically; they're told the dates are taken; their details are never shown.
12. Different dates: the owner can accept each one, paying a fee per accepted booking.
13. If the owner owns several of an item, they can accept up to that quantity for the same dates.
14. Unanswered requests **expire after 24 hours** (show "Expires in 21 h").
15. A "Best match · most rentals" tag can mark the strongest request.

## Accounts

16. **Two sign-up paths** from "Sign up free" → **Join** page:
    - **Sign up to rent**: Account (name, email, mobile +264, password, confirm) → About you (town, "What do you want to do first?", optional "I run a hire business", **required terms**, optional WhatsApp updates).
    - **Sign up to list**: Account → Owner details (Individual / Hire business, business name optional, town, verify-ID-later note, **required** "I understand I pay a small booking fee only when I accept a renter", **required terms**).
    - One account can do both.
17. **Everyone must tick "I agree to the Terms and Conditions and Privacy Policy"** before the account is created. Block submit until ticked.
18. **Sign in**: "Mobile code" (default; we text a 6-digit code, no password) or "Email" (email + password). Confirm the auth provider and SMS provider with me.
19. Owners verify their ID after sign-up (photo in the app). Verified owners rank first.
20. Signed-out visitors can browse Home, Explore and item pages. "Request to book" or "List an item" sends them to sign up/sign in, then back to what they were doing.
21. "List an item" is **not** in the signed-out header. It appears for signed-in users.

## Listings and requests

22. Listing steps: 1 Category · 2 Details and price (title, description, condition, price per day, deposit, minimum days, how many you own) · 3 Photos and place (photos, collection area — renters see the area only; street address unlocks on acceptance).
23. Categories: Vehicles, Homes, Rooms, Tools, Electronics, Events, Camping (and outdoor), Building/Construction, Other.
24. Booking cards show availability for the searched dates ("✓ Free on Fri 14 – Sun 16 Nov"); this must come from the owner's calendar, never hard-coded.
25. Towns list includes Windhoek, Swakopmund, Walvis Bay, Oshakati, Rundu, Other (extend from SRS).

## App downloads

26. Push people to the mobile app: "Get the app" in the top strip, AppPromo section on Home, store buttons in the footer, on Sign in, on sign-up step 2 and on "You're in". Store links and QR code are placeholders until you give me the real links.
