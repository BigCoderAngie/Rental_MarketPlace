import { describe, expect, it } from "vitest";
import { isActive, isMoreActive, moreLinks } from "./nav";

describe("active tab", () => {
  it("matches a section and the pages below it", () => {
    expect(isActive("/bookings", "/bookings")).toBe(true);
    expect(isActive("/bookings/123", "/bookings")).toBe(true);
    expect(isActive("/bookings/123/edit", "/bookings")).toBe(true);
  });

  it("does not match a different section that starts the same way", () => {
    expect(isActive("/bookingsx", "/bookings")).toBe(false);
    expect(isActive("/calendar", "/bookings")).toBe(false);
    expect(isActive("/", "/calendar")).toBe(false);
  });

  it("lights up More on its own page and the pages behind it", () => {
    expect(isMoreActive("/more")).toBe(true);
    expect(isMoreActive("/inventory/new")).toBe(true);
    expect(isMoreActive("/reports")).toBe(true);
    expect(isMoreActive("/plan/pay")).toBe(true);
    expect(isMoreActive("/settings")).toBe(true);
  });

  it("leaves More off on the main tabs", () => {
    expect(isMoreActive("/calendar")).toBe(false);
    expect(isMoreActive("/bookings/123")).toBe(false);
    expect(isMoreActive("/")).toBe(false);
  });
});

describe("More links", () => {
  it("shows Admin to platform admins only", () => {
    expect(moreLinks(false).map((l) => l.label)).not.toContain("Admin");
    expect(moreLinks(true).map((l) => l.label)).toEqual(["Inventory", "Reports", "Settings", "Your plan", "Admin"]);
  });
});
