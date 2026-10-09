import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAYMENT_KINDS, PAYMENT_METHODS, paymentState } from "./payments";

const sql = readFileSync(join(__dirname, "../../supabase/migrations/20261009100000_payments.sql"), "utf8");
const enumValues = (name: string) =>
  [...sql.match(new RegExp(`create type public\\.${name} as enum \\(([\\s\\S]*?)\\);`))![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);

describe("payments", () => {
  it("matches the database's kinds and methods", () => {
    expect([...PAYMENT_KINDS].sort()).toEqual(enumValues("payment_kind").sort());
    expect([...PAYMENT_METHODS].sort()).toEqual(enumValues("payment_method").sort());
  });

  it("labels how much is paid", () => {
    expect(paymentState({ amount_due: 1500, amount_paid: 0, outstanding: 1500 })).toBe("Unpaid");
    expect(paymentState({ amount_due: 1500, amount_paid: 600, outstanding: 900 })).toBe("Part paid");
    expect(paymentState({ amount_due: 1500, amount_paid: 1500, outstanding: 0 })).toBe("Paid");
  });
});
