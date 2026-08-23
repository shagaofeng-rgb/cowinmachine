import type { AdminDatePreset, AdminDateRange } from "@/types/admin-operations";

const presetValues = new Set<AdminDatePreset>(["today", "yesterday", "last-7-days", "last-30-days", "this-month", "last-month", "custom"]);

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function atUtcDate(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export function readAdminDateRange(values: { preset?: string; start?: string; end?: string }): AdminDateRange {
  const today = atUtcDate(new Date());
  const preset = presetValues.has(values.preset as AdminDatePreset) ? values.preset as AdminDatePreset : "last-30-days";

  if (preset === "custom" && values.start && values.end && /^\d{4}-\d{2}-\d{2}$/.test(values.start) && /^\d{4}-\d{2}-\d{2}$/.test(values.end)) {
    const start = new Date(`${values.start}T00:00:00.000Z`);
    const end = addDays(new Date(`${values.end}T00:00:00.000Z`), 1);
    if (start < end) return { preset, start: start.toISOString(), end: end.toISOString(), label: `${values.start} to ${values.end}` };
  }

  switch (preset) {
    case "today":
      return { preset, start: today.toISOString(), end: addDays(today, 1).toISOString(), label: "Today" };
    case "yesterday": {
      const start = addDays(today, -1);
      return { preset, start: start.toISOString(), end: today.toISOString(), label: "Yesterday" };
    }
    case "last-7-days":
      return { preset, start: addDays(today, -6).toISOString(), end: addDays(today, 1).toISOString(), label: "Last 7 days" };
    case "this-month":
      return { preset, start: monthStart(today).toISOString(), end: addDays(today, 1).toISOString(), label: "This month" };
    case "last-month": {
      const current = monthStart(today);
      const previous = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1));
      return { preset, start: previous.toISOString(), end: current.toISOString(), label: "Last month" };
    }
    default:
      return { preset: "last-30-days", start: addDays(today, -29).toISOString(), end: addDays(today, 1).toISOString(), label: "Last 30 days" };
  }
}

export function dateRangeSearchParams(range: AdminDateRange) {
  return { preset: range.preset, start: formatDate(new Date(range.start)), end: formatDate(addDays(new Date(range.end), -1)) };
}
