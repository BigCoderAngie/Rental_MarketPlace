# 01 · Design system (exact values)

Everything here is taken directly from the approved wireframes. When in doubt, read the markup in `reference/` — it wins.

## 1. Colours

| Token | Hex | Used for |
|---|---|---|
| green | `#00743F` | Primary buttons, links, logo tile, active states, check circles |
| green-hover | `#005C32` | Link hover |
| green-edge | `#00502B` | 3D edge under green buttons |
| deep | `#06402F` | Top strip, hero, footer, dark panels, app section |
| deep-2 | `#0B5A3E` | Decorative circles and cards on deep green |
| yellow | `#FFC83D` | Accent words in headlines, "Sign up free", "Request to book", motto on dark |
| yellow-edge | `#D9A11F` | 3D edge under yellow buttons |
| mint | `#E3F1E8` | Light green fills, pills, icon tiles' active state |
| mint-line | `#B8DCC6` | Borders on mint fills |
| mint-text | `#0B4D2C` | Text on mint, category labels, logo wordmark on light |
| on-deep | `#CFE3D8` | Body text on deep green |
| on-deep-2 | `#9FE0B8` | Italic slogan "More sharing. Less buying.", highlights on deep |
| cream | `#F6F2EA` | Page background |
| ink | `#1A2420` | Main text |
| ink-2 | `#34403A` | Secondary text |
| muted | `#5B6670` | Muted text |
| line | `#E6E0D4` | Card borders, dividers |
| line-strong | `#CDC5B5` | Input borders, white-button edge |
| lock | `#DDD5C6` | Bars that stand in for hidden names, phones, addresses |
| star | `#E8A317` | Stars on cards; inline stars `#7A4D00` |
| red | `#B7472A` | Count badges ("3 new"), Decline text, required asterisk |
| warn | bg `#FFF8E6`, line `#F2DFA8`, text `#5C3A00` | "Others may ask for the same dates…" notes |
| info | bg `#E8F0FA`, text `#1F4A7A` | "Waiting for owner" pill |

Namibian flag colours (flag SVG only): blue `#003580`, red `#D21034`, green `#009543`, gold `#FFCE00`, white.

## 2. Typography

- **Inter** only (Google Fonts, weights 400, 500, 600, 700, 800).
- Hero headline: 66 px desktop / 42 px phone, weight 800, line-height 1.0, letter-spacing −0.035em. Second line in yellow.
- Page titles: 40–44 px, 800, −0.02em. Section titles: 22 px desktop / 21 px phone, 800.
- Body 14–17 px; muted text 13–14 px. Category kicker: 11 px, 700, uppercase, letter-spacing .06em, colour `#0B4D2C`.
- Logo wordmark: "RentLoop", Inter 800, 23 px desktop header, 19 px phone header, colour `#0B4D2C` (white on deep green).

## 3. Shape and spacing

- Radii: buttons 14 (sm 12, lg 16, chips/pills 999); inputs 14; cards 18; panels 22; hero 28; big sections 32.
- Content wrap: max-width 1360 px, padding 0 32 px (16 px on phones).
- Section gaps on Home: 72 px desktop, 40 px phone.
- Card shadow on hover: `0 14px 34px rgba(20,40,30,.12)` and lift 2 px.
- Floating panels (category bar, sign-in card): `0 16px 40px rgba(20,40,30,.10–.14)`.

## 4. The lit, press-down button — exact

Copy `.b3` from `assets/styles/rentloop-tokens.css` exactly. What it does:

1. Inset 1 px white highlight on the top edge (light hitting it).
2. Inset 1 px darker line on the bottom edge.
3. Solid 4 px edge in the button's darker shade (`--edge`) — the press depth.
4. Tight dark shadow where it meets the page.
5. Large soft glow in the button's own colour (`--glow`).
6. Gentle top-to-bottom gradient.
7. Hover: brightness 1.05. **Pressed:** moves down 4 px, edge disappears, gradient flips, the top highlight is replaced by a soft inner shadow.

Variants (`--edge` / `--glow` included in the CSS file):

| Variant | Fill | Text | Used for |
|---|---|---|---|
| green | `#00743F` | white | Search, Send request, Next, Create my account, List an item (signed in) |
| yellow | `#FFC83D` | `#06402F` | Sign up free, Request to book on cards, Publish, Create account and list |
| white | `#fff` + 1 px `#CDC5B5` border | ink | Sign in, Back, Previous, Reset, store buttons on dark |
| mint | `#E3F1E8` | `#0B4D2C` | View booking |
| outline | transparent + 1 px `#3E8E68` | white | Secondary buttons on deep green ("Look around first", "Set up a hire business") |

Sizes: sm 40 px, md 48 px, lg 56 px; chips 40 px pill; card CTA full width 46 px pill.

Category icon tiles (64×64 desktop, 58×58 phone, radius 18, white, 1 px `#E6E0D4`) use the same lighting with a light edge.

**Gotcha:** never set `background:` on a lit button — it removes the gradient. Use `background-color`.

## 5. Logo

- `assets/brand/rentloop-logo.svg`: rounded tile (rx 23 of 100) in `#00743F`, two yellow `#FFC83D` circular arrows (stroke 7, round caps), white **R** (Inter 800). Lighting: top-light gradient and a thin white highlight on the top edge. **No** dark bottom edge, **no** drop shadow — it is a flat solid logo, not a button.
- Sizes in use: 38 px desktop header, 32 px phone header, 36 px footer, 46 px sign-in panel.
- App icon: same SVG.

## 6. Namibian flag

- `assets/brand/flag-namibia.svg`, used small (18–26 px wide) with 3 px radius and a hairline outline.
- Where: top strip ("We only earn when you earn"), hero pill ("Namibia's rental marketplace · We only earn when you earn"), app section ("Made in Namibia, for Namibia"), footer ("Proudly Namibian"), sign-up headers. Nowhere else.

## 7. Components (see `reference-components.css` for exact CSS)

- **TopStrip** (deep green, 40 px desktop / 34 px phone): flag + "Windhoek, Namibia ▾", the motto in yellow, "Get the app", "For hire businesses", "Help".
- **Header** (white, 72 px desktop / 62 px phone, sticky): logo lockup, nav (Browse, How it works, For businesses, Help), search field, then:
  - signed out: **Sign in** (white) + **Sign up free** (yellow). No "List an item".
  - signed in: **List an item** (green) + avatar and name.
  - phone: logo, **Sign up** (yellow) or avatar, menu button.
- **CategoryBar** (signed-in pages): text links with ▾, "All categories →".
- **BookingCard** (Amazon-style): 4:3 photo (heart button top-right, optional dark badge top-left), category · area kicker, 2-line title, ★★★★★ + rating + (count), big price "N$650 / day", green availability line "✓ Free on Fri 14 – Sun 16 Nov", muted "Free to request · pay the owner at collection", full-width yellow pill **Request to book**. Whole card lifts on hover.
- **LockedDetails**: grey bars (`#DDD5C6`, 12 px high, radius 6) labelled Name / Phone / Address on a cream panel, with a lock icon and the line "Shows once the owner accepts your request."
- **Stepper** (sign-ups): 2 dots + line; done = green with tick, current = green, upcoming = white with grey border. Phone: 2 bars + labels.
- **Field**: 52 px, radius 14, 1 px `#CDC5B5`, label 13 px 600, red asterisk for required, optional `+264` prefix segment, eye toggle for passwords.
- **StoreButtons**: "Download on the App Store" / "Get it on Google Play", dark on light backgrounds, white on dark, lit buttons.
- **AppPromo** (deep green section with phone mockup, 3 checks, store buttons, QR placeholder).
- **FAQ**: `<details>` cards.
- **Footer** (deep green): logo, one-line description, motto in yellow, store buttons, three link columns, italic "More sharing. Less buying." in `#9FE0B8`, "Proudly Namibian" with flag, "Popular searches" link row, bottom bar with trust ticks.
- **Help button**: floating green pill "Need help?" bottom-right (desktop).
- **Sticky action bar** (phone): white bar pinned to the bottom with the page's main action.

## 8. Icons

Inline stroke icons, 24×24 viewBox, stroke-width 1.8–2.4, round caps and joins, `currentColor`. The exact paths are in the reference HTML. A library with matching outline style (for example Lucide) is fine **only** if every icon looks the same — ask first.
