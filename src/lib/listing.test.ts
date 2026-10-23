import { describe, expect, it } from "vitest";
import { hasErrors } from "./signup";
import { parseAmount, validateListing, type ListingInput } from "./listing";

const good: ListingInput = {
  category: "electronics", title: "Camera with 2 lenses", description: "Full-frame body", condition: "like_new",
  price: "N$650", deposit: "5,000", minDays: "2", quantity: "1", town: "Windhoek", area: "Klein Windhoek", street: "12 Nelson Mandela Ave",
  photos: ["b/items/1.jpg", "b/items/2.jpg"],
};

describe("parseAmount", () => {
  it("reads N$ amounts with commas and spaces", () => {
    expect(parseAmount("N$1,250")).toBe(1250);
    expect(parseAmount("6 500")).toBe(6500);
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
  });
});

describe("validateListing", () => {
  it("passes a complete listing and makes the first photo the cover", () => {
    const { errors, values } = validateListing(good, true);
    expect(hasErrors(errors)).toBe(false);
    expect(values).toMatchObject({ daily_price: 650, deposit: 5000, min_days: 2, photo_path: "b/items/1.jpg", gallery_paths: ["b/items/2.jpg"], street_address: "12 Nelson Mandela Ave" });
  });

  it("asks for everything renters need before publishing", () => {
    const { errors } = validateListing({ ...good, price: "", condition: "", area: " ", town: "Atlantis" }, true);
    expect(Object.keys(errors).sort()).toEqual(["area", "condition", "price", "town"]);
  });

  it("lets a draft be saved with just a category and title", () => {
    expect(hasErrors(validateListing({ ...good, price: "", area: "", condition: "" }, false).errors)).toBe(false);
    expect(validateListing({ ...good, title: "" }, false).errors.title).toBeDefined();
  });

  it("refuses categories that are not at launch and too many photos", () => {
    const { errors } = validateListing({ ...good, category: "vehicles", photos: ["1", "2", "3", "4", "5", "6"] }, true);
    expect(Object.keys(errors).sort()).toEqual(["category", "photos"]);
  });
});
