import type { ScheduleBlock } from '../types/models';
import dayjs from '../utils/time';

// What we’ll show in the in-app Notification Log
export interface NotificationPlan {
  id: string;
  blockId: string;
  kind: ScheduleBlock['kind'];
  fireTimeISO: string;
  title: string;
  body: string;
}

/**
 * Build the list of local notifications we would schedule
 * from schedule blocks (within next 36h).
 */
export function buildNotificationPlan(
  blocks: ScheduleBlock[]
): NotificationPlan[] {
  const now = dayjs();

  const upcoming = blocks
    .filter((b) => dayjs(b.startISO).isAfter(now))
    .filter((b) => dayjs(b.startISO).diff(now, 'hour') <= 36);

  return upcoming.map((b) => {
    const start = dayjs(b.startISO);
    let title = '';
    let body = '';

    if (b.kind === 'windDown') {
      title = 'Time to start winding down';
      body =
        'Based on recent patterns, this is a good time to start the pre-nap routine.';
    } else if (b.kind === 'nap') {
      title = 'Nap window starting';
      body =
        'Your baby’s nap window is starting based on their wake window and nap length.';
    } else if (b.kind === 'bedtime') {
      title = 'Bedtime window';
      body =
        'This is an age-appropriate bedtime window given recent naps.';
    }

    return {
      id: `notif_${b.id}`,
      blockId: b.id,
      kind: b.kind,
      fireTimeISO: start.toISOString(),
      title,
      body,
    };
  });
}
