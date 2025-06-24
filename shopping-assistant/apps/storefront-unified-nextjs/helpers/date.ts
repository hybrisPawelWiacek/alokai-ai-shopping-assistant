/**
 * @description Function to add days to a date.
 * @param date - The date to add days to.
 * @param days - The number of days to add. It can be a negative number to subtract days.
 * @returns The new date.
 *
 * @example
 * addDaysToDate(new Date(), 1); // Tomorrow
 */
export function addDaysToDate(date: Date | number | string, days: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
