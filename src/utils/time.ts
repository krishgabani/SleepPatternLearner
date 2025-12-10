import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// For now, use the device's timezone explicitly.
// Later we can store this per-baby if needed.
export const APP_TIMEZONE = dayjs.tz.guess();

export function toLocal(iso: string) {
  return dayjs(iso).tz(APP_TIMEZONE);
}

export function nowISO() {
  return dayjs().toISOString();
}

export default dayjs;
