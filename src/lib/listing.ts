// List an item (build kit Part 9, SiteList.html, rule 22): category, details
// and price, photos and place. The form checks these in the browser; the
// server action checks again before saving.

import { CONDITIONS } from "./requests";
import { CATEGORIES } from "./site-links";
import type { Errors } from "./signup";

export const MAX_TITLE = 70;
export const MAX_PHOTOS = 5;
/** Towns an owner can collect from (every launch town plus the bigger northern towns). */
export const COLLECTION_TOWNS = ["Windhoek", "Swakopmund", "Walvis Bay", "Oshakati", "Rundu", "Other"];

export type ListingInput = {
  category: string;
  title: string;
  description: string;
  condition: string;
  price: string;
  deposit: string;
  minDays: string;
  quantity: string;
  town: string;
  area: string;
  street: string;
  photos: string[];
};

export type ListingValues = {
  category: string;
  name: string;
  description: string | null;
  condition: string;
  daily_price: number;
  deposit: number;
  min_days: number;
  quantity_owned: number;
  town: string;
  area: string;
  street_address: string | null;
  photo_path: string | null;
  gallery_paths: string[];
};

/** "N$1,250" or "1 250" give 1250. NaN when it isn't a number. */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/N\$|,|\s/gi, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

/** Publishing needs everything; a draft only needs a category and a title. */
export function validateListing(input: ListingInput, publish: boolean): { errors: Errors<keyof ListingInput>; values: ListingValues } {
  const errors: Errors<keyof ListingInput> = {};
  const price = parseAmount(input.price);
  const deposit = input.deposit.trim() === "" ? 0 : parseAmount(input.deposit);
  const minDays = Number(input.minDays || 1);
  const quantity = Number(input.quantity || 1);

  if (!CATEGORIES.some((c) => c.slug === input.category)) errors.category = "Choose what you are renting out.";
  if (!input.title.trim()) errors.title = "Give your item a title, for example Camera with 2 lenses.";
  else if (input.title.trim().length > MAX_TITLE) errors.title = `Keep the title to ${MAX_TITLE} characters.`;

  if (publish) {
    if (!(input.condition in CONDITIONS)) errors.condition = "Choose the condition.";
    if (!Number.isFinite(price) || price <= 0) errors.price = "Enter the price per day in N$.";
    if (!Number.isFinite(deposit) || deposit < 0) errors.deposit = "Enter the deposit in N$, or 0.";
    if (!Number.isInteger(minDays) || minDays < 1 || minDays > 30) errors.minDays = "Between 1 and 30 days.";
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) errors.quantity = "At least 1.";
    if (!COLLECTION_TOWNS.includes(input.town)) errors.town = "Choose the town.";
    if (!input.area.trim()) errors.area = "Enter the area or suburb renters collect from.";
  }
  if (input.photos.length > MAX_PHOTOS) errors.photos = `Add up to ${MAX_PHOTOS} photos.`;

  return {
    errors,
    values: {
      category: input.category,
      name: input.title.trim(),
      description: input.description.trim() || null,
      condition: input.condition in CONDITIONS ? input.condition : "good",
      daily_price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : 0,
      deposit: Number.isFinite(deposit) && deposit > 0 ? Math.round(deposit * 100) / 100 : 0,
      min_days: Number.isInteger(minDays) && minDays >= 1 && minDays <= 30 ? minDays : 1,
      quantity_owned: Number.isInteger(quantity) && quantity >= 1 ? quantity : 1,
      town: input.town,
      area: input.area.trim().slice(0, 80),
      street_address: input.street.trim().slice(0, 200) || null,
      photo_path: input.photos[0] ?? null,
      gallery_paths: input.photos.slice(1, MAX_PHOTOS),
    },
  };
}
