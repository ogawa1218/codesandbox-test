import { describe, expect, it } from "vitest";
import {
  announcementSchema,
  dailyBudgetSchema,
  inviteSchema,
  positionSchema,
  salesActualSchema,
  shiftSchema,
} from "./index";

const uuid = "00000000-0000-4000-8000-000000000001";
const uuid2 = "00000000-0000-4000-8000-000000000002";
const uuid3 = "00000000-0000-4000-8000-000000000003";
const uuid4 = "00000000-0000-4000-8000-000000000004";

describe("positionSchema", () => {
  it("accepts a valid position", () => {
    const r = positionSchema.parse({
      name: "ホール",
      color: "#7c3aed",
      sort_order: 0,
    });
    expect(r.name).toBe("ホール");
  });
  it("rejects unknown keys (.strict)", () => {
    expect(() =>
      positionSchema.parse({ name: "X", color: "#7c3aed", sort_order: 0, evil: 1 }),
    ).toThrow();
  });
  it("rejects invalid color", () => {
    expect(() => positionSchema.parse({ name: "X", color: "red", sort_order: 0 })).toThrow();
  });
});

describe("shiftSchema", () => {
  const base = {
    employee_id: uuid,
    position_id: uuid2,
    business_date: "2026-05-02",
    starts_at: "2026-05-02T00:00:00.000Z",
    ends_at: "2026-05-02T08:00:00.000Z",
    status: "draft" as const,
    note: null,
    client_request_id: uuid3,
  };
  it("accepts a valid shift", () => {
    expect(() => shiftSchema.parse(base)).not.toThrow();
  });
  it("rejects when ends_at <= starts_at", () => {
    expect(() =>
      shiftSchema.parse({ ...base, ends_at: base.starts_at }),
    ).toThrow(/終了/);
  });
  it("rejects unknown fields", () => {
    expect(() => shiftSchema.parse({ ...base, foo: "bar" })).toThrow();
  });
});

describe("salesActualSchema", () => {
  it("defaults tax to 10%", () => {
    const r = salesActualSchema.parse({
      business_date: "2026-05-02",
      amount: 100000,
    });
    expect(r.tax_rate).toBe(0.1);
    expect(r.tax_included).toBe(true);
  });
  it("rejects negative amount", () => {
    expect(() =>
      salesActualSchema.parse({ business_date: "2026-05-02", amount: -1 }),
    ).toThrow();
  });
});

describe("dailyBudgetSchema", () => {
  it("requires integer amount", () => {
    expect(() =>
      dailyBudgetSchema.parse({ business_date: "2026-05-02", amount: 100.5 }),
    ).toThrow();
  });
});

describe("announcementSchema", () => {
  it("accepts minimal", () => {
    expect(
      announcementSchema.parse({ title: "お知らせ", body: "本文" }).title,
    ).toBe("お知らせ");
  });
  it("rejects empty title", () => {
    expect(() => announcementSchema.parse({ title: "", body: "x" })).toThrow();
  });
});

describe("inviteSchema", () => {
  it("defaults role to employee", () => {
    expect(inviteSchema.parse({ full_name: "Alice" }).role).toBe("employee");
  });
  it("uuid example", () => {
    expect(uuid4).toMatch(/^[0-9a-f-]+$/);
  });
});
