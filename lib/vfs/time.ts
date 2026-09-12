const SYDNEY_TZ = "Australia/Sydney";

/** Format an instant as `dd-mm-yyyy hh:mm` in Australia/Sydney (processing / agent). */
export function formatSydneyDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SYDNEY_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}`;
}

export function toIsoCreatedAt(date: Date): string {
  return date.toISOString();
}
