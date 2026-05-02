import { describe, expect, it } from "vitest";
import { businessDate, formatPct, formatYen, safeNext } from "./utils";

describe("formatYen", () => {
  it("formats integers with currency", () => {
    expect(formatYen(1234567)).toMatch(/[¥￥]1,234,567/);
  });
  it("returns dash on null", () => {
    expect(formatYen(null)).toBe("—");
  });
});

describe("formatPct", () => {
  it("formats with one fraction digit by default", () => {
    expect(formatPct(0.1234)).toBe("12.3%");
  });
  it("returns dash on undefined", () => {
    expect(formatPct(undefined)).toBe("—");
  });
});

describe("safeNext", () => {
  const origin = "https://app.example.com";
  it("falls back to /dashboard for empty", () => {
    expect(safeNext(null, origin)).toBe("/dashboard");
  });
  it("rejects external origins", () => {
    expect(safeNext("https://evil.example.com/x", origin)).toBe("/dashboard");
  });
  it("accepts internal pathnames", () => {
    expect(safeNext("/shifts?week=2026-05-01", origin)).toBe(
      "/shifts?week=2026-05-01",
    );
  });
});

describe("businessDate", () => {
  it("rolls 02:00 JST back to previous day when openAt=5", () => {
    const at = new Date("2026-05-02T17:00:00Z"); // 2026-05-03 02:00 JST
    expect(businessDate(at, { tz: "Asia/Tokyo", openAtHour: 5 })).toBe(
      "2026-05-02",
    );
  });
  it("keeps 12:00 JST in same business day", () => {
    const at = new Date("2026-05-02T03:00:00Z"); // 2026-05-02 12:00 JST
    expect(businessDate(at, { tz: "Asia/Tokyo", openAtHour: 5 })).toBe(
      "2026-05-02",
    );
  });
});
