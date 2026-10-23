> **In this repo:** the kit lives in `docs/build-kit/` without `reference/assets/` (stock photos with unknown licences), so the reference pages show broken images here. Open the original kit folder on your computer to see them with photos. Decisions that change the kit are in `docs/MASTER-PLAN.md`, "Build kit decisions".

# RentLoop website build kit

This kit hands the RentLoop website design to Claude Code (in VS Code) so it can build it **exactly** as designed, one part at a time.

## What's inside

| Path | What it is |
|---|---|
| `00-MASTER-PROMPT.md` | Paste this first. It tells Claude Code who it is, the rules, and how to work with you. |
| `01-DESIGN-SYSTEM.md` | Colours, type, spacing, the lit press-down buttons, cards, logo, flag, icons. Exact values. |
| `02-BUSINESS-RULES.md` | How RentLoop works: free requests, owner pays the booking fee, details hidden until booked, several renters, refunds. |
| `03-PAGES-AND-ROUTES.md` | Every page, desktop and phone, section by section, with routes. |
| `04-BUILD-PARTS.md` | The build split into Parts 0–10. Each part has a ready-to-paste command and a checklist. |
| `reference/` | The approved wireframes as plain HTML files. Open `reference/index.html` in a browser. **Source of truth.** |
| `assets/brand/` | `rentloop-logo.svg` (yellow arrows, green tile, lit) and `flag-namibia.svg`. |
| `assets/styles/` | `rentloop-tokens.css` (tokens + button lighting) and `reference-components.css` (every component class used in the wireframes). |
| `assets/placeholders/` | The image placeholder shown until owners upload real photos. |

## How to use it

1. Copy the whole `rentloop-build-kit` folder into the root of your existing RentLoop project in VS Code (so it sits at `./rentloop-build-kit`).
2. Put your SRS documents in the project too if they are not already there (for example `./docs/`).
3. Open Claude Code in VS Code.
4. Paste the command from **Part 0** in `04-BUILD-PARTS.md`. Claude Code will read the kit and your project and come back with questions. Answer them.
5. Then paste Part 1, check the result in your browser, and only then move to Part 2, and so on.

One part at a time is what keeps the result faithful: each part ends with a side-by-side check against the reference HTML before moving on.

## Notes

- Photos in `reference/assets/` are **only for previewing the wireframes**. The real site shows owners' uploaded photos and falls back to `assets/placeholders/item-photo-placeholder.svg`.
- Prices, ratings, names and counts in the wireframes are sample data. The real site reads them from the database.
- Review quotes in the wireframes are placeholders on purpose. Only show real reviews from completed bookings.
