// SAMPLE content for the home page (MASTER-PLAN decision 11). None of this is a
// real listing, person or result: every section that shows it carries a
// "Sample" tag, and each one switches to real data when it exists (listings in
// Part 5, reviews from completed bookings only). Copied from
// docs/build-kit/reference/desktop/SiteHome.html, with the bakkie swapped for a
// PA speaker because vehicles are not listed at launch (decision 4).

import type { ListingCardData } from "@/lib/types";

export const POPULAR_LISTINGS: ListingCardData[] = [
  {
    title: "Camera with 2 lenses",
    category: "Electronics",
    area: "Klein Windhoek",
    rating: 4.9,
    reviews: 17,
    price: 650,
    unit: "day",
    availability: "Free this weekend",
    badge: "Popular",
  },
  {
    title: "PA speaker",
    category: "Electronics",
    area: "Windhoek West",
    rating: 5.0,
    reviews: 21,
    price: 400,
    unit: "day",
    availability: "Only 1 weekend left in Nov",
  },
  {
    title: "Wedding marquee 10 × 30 m",
    category: "Events",
    area: "Olympia, Windhoek",
    rating: 5.0,
    reviews: 21,
    price: 6500,
    unit: "event",
    availability: "2 weekends left in Nov",
    badge: "Popular for weddings",
  },
  {
    title: "4-person dome tent with camping kit",
    category: "Camping",
    area: "Eros, Windhoek",
    rating: 4.9,
    reviews: 12,
    price: 220,
    unit: "day",
    availability: "Free this weekend",
  },
];

/** The four tilted photo cards in the hero collage: size, place and tilt from the kit. */
export const HERO_CARDS = [
  { label: "Camera with 2 lenses", price: "N$650 / day", w: 320, h: 240, top: 20, left: 0, rotate: -3 },
  { label: "PA speaker", price: "N$400 / day", w: 220, h: 180, top: 0, left: 310, rotate: 4 },
  { label: "Marquee", price: "N$6,500 / event", w: 220, h: 165, top: 305, left: 10, rotate: -4 },
  { label: "Dome tent", price: "N$220 / day", w: 260, h: 195, top: 290, left: 270, rotate: 3 },
];

export const REVIEW_PLACEHOLDERS = [
  { quote: "[Quote from a renter after a completed booking]", initial: "R", role: "Renter · Windhoek" },
  { quote: "[Quote from an owner about earning from their camera]", initial: "O", role: "Owner · Walvis Bay" },
  { quote: "[Quote from a hire business about bookings]", initial: "H", role: "Hire business · Swakopmund" },
];

/** The earnings card in the Earn section. */
export const SAMPLE_EARNINGS = { total: "N$2,090", listings: 2, bookings: 4, bars: [20, 30, 26, 42, 58, 70] };

export const LIVE_CARDS = [
  { title: "Camera with 2 lenses", price: "N$650" },
  { title: "4-person dome tent", price: "N$220" },
];
