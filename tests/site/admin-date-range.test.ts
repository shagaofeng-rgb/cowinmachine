import assert from "node:assert/strict";
import test from "node:test";
import { dateRangeSearchParams, readAdminDateRange } from "../../lib/admin-operations/date-range";

test("custom admin dates use Shanghai midnight and round-trip through the filter", () => {
  const range = readAdminDateRange({ preset: "custom", start: "2026-10-01", end: "2026-10-07" });
  assert.equal(range.preset, "custom");
  assert.equal(range.start, "2026-09-30T16:00:00.000Z");
  assert.equal(range.end, "2026-10-07T16:00:00.000Z");
  assert.deepEqual(dateRangeSearchParams(range), { preset: "custom", start: "2026-10-01", end: "2026-10-07" });
});

test("invalid calendar dates cannot enter the custom range", () => {
  assert.equal(readAdminDateRange({ preset: "custom", start: "2026-02-30", end: "2026-03-02" }).preset, "today");
});

test("this-week starts on the local Monday", () => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const day = new Date(`${today}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const monday = day.toISOString().slice(0, 10);
  assert.equal(readAdminDateRange({ preset: "this-week" }).start, new Date(`${monday}T00:00:00+08:00`).toISOString());
});
