import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

export type DatePreset = "today" | "7d" | "30d" | "month" | "custom";

export function rangeFromPreset(
  preset: DatePreset,
  from?: string | null,
  to?: string | null,
) {
  const now = new Date();

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return {
        from: from ? startOfDay(new Date(from)) : startOfMonth(now),
        to: to ? endOfDay(new Date(to)) : endOfDay(now),
      };
    default:
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}
