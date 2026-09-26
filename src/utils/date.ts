/**
 * Helpers for calendar dates.
 *
 * Giras use a calendar date (YYYY-MM-DD), not an instant in time.
 * Never parse these values with new Date('YYYY-MM-DD'), because JavaScript
 * interprets that format as UTC and can display the previous day in Brazil.
 */

export const parseDateOnly = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const dateOnlyTimestamp = (value: string): number => parseDateOnly(value).getTime();

export const todayDateOnly = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const isDateOnlyPast = (value: string): boolean =>
  dateOnlyTimestamp(value) < todayDateOnly().getTime();

export const isDateOnlyToday = (value: string): boolean =>
  dateOnlyTimestamp(value) === todayDateOnly().getTime();
