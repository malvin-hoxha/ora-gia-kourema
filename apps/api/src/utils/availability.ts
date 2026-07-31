import { DateTime } from "luxon";

export const SLOT_INTERVAL_MINUTES = 30;

type TimeRange = {
  startsAt: Date;
  endsAt: Date;
};

export function createZonedDateTime(
  date: string,
  time: string,
  timeZone: string,
): DateTime {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: timeZone,
  });
}

export function rangesOverlap(
  firstStart: DateTime,
  firstEnd: DateTime,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  const secondStartMillis = secondStart.getTime();
  const secondEndMillis = secondEnd.getTime();

  return (
    firstStart.toMillis() < secondEndMillis &&
    firstEnd.toMillis() > secondStartMillis
  );
}

export function slotOverlapsAnyRange(
  slotStart: DateTime,
  slotEnd: DateTime,
  ranges: TimeRange[],
): boolean {
  return ranges.some((range) =>
    rangesOverlap(
      slotStart,
      slotEnd,
      range.startsAt,
      range.endsAt,
    ),
  );
}

export function isAlignedToSlotInterval(
  dateTime: DateTime,
  intervalMinutes: number,
): boolean {
  return (
    dateTime.minute % intervalMinutes === 0 &&
    dateTime.second === 0 &&
    dateTime.millisecond === 0
  );
}