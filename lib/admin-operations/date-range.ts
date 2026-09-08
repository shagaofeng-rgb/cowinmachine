import type { AdminDatePreset, AdminDateRange } from "@/types/admin-operations";

const timeZone = "Asia/Shanghai";
const presetValues = new Set<AdminDatePreset>(["today", "this-week", "this-month", "custom"]);

function dayParts(date: Date) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => values.find((item) => item.type === type)?.value ?? "";
  return { year: Number(part("year")), month: Number(part("month")), day: Number(part("day")) };
}

function dayText(date: Date) {
  const { year, month, day } = dayParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromDayText(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

function addDays(value: string, days: number) {
  const date = fromDayText(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dayText(date);
}

function startOfWeek(value: string) {
  const date = fromDayText(value);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addDays(value, -weekday);
}

function rangeFor(startDay: string, endInclusiveDay: string, preset: AdminDatePreset, label: string): AdminDateRange {
  return {
    preset,
    start: fromDayText(startDay).toISOString(),
    end: fromDayText(addDays(endInclusiveDay, 1)).toISOString(),
    label,
  };
}

export function readAdminDateRange(values: { preset?: string; start?: string; end?: string }): AdminDateRange {
  const today = dayText(new Date());
  const preset = presetValues.has(values.preset as AdminDatePreset) ? values.preset as AdminDatePreset : "today";

  if (preset === "custom" && values.start && values.end && /^\\d{4}-\\d{2}-\\d{2}$/.test(values.start) && /^\\d{4}-\\d{2}-\\d{2}$/.test(values.end)) {
    const start = fromDayText(values.start);
    const end = fromDayText(values.end);
    const maximumEnd = fromDayText(addDays(values.start, 366));
    if (start <= end && end <= maximumEnd) return rangeFor(values.start, values.end, "custom", `${values.start} 至 ${values.end}`);
  }

  if (preset === "this-week") return rangeFor(startOfWeek(today), today, "this-week", "本周");
  if (preset === "this-month") return rangeFor(`${today.slice(0, 7)}-01`, today, "this-month", "本月");
  return rangeFor(today, today, "today", "今日");
}

export function dateRangeSearchParams(range: AdminDateRange) {
  const end = new Date(new Date(range.end).getTime() - 86_400_000);
  return { preset: range.preset, start: dayText(new Date(range.start)), end: dayText(end) };
}
