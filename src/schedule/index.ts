import type { LearnerState, ScheduleBlock, SleepSession } from '../types/models';
import dayjs, { nowISO } from '../utils/time';

export interface ScheduleConfig {
  // how far ahead to schedule, in days
  horizonDays: number;
  // how many nap cycles per day to simulate
  maxNapCyclesPerDay: number;
  // minutes before nap start to start wind-down
  windDownLeadMin: number;
  // factor to stretch last wake window into bedtime
  bedtimeWakeFactor: number;
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  horizonDays: 2, // today + tomorrow
  maxNapCyclesPerDay: 4,
  windDownLeadMin: 20,
  bedtimeWakeFactor: 1.25,
};

export interface ScheduleInputs {
  learnerState: LearnerState;
  sessions: SleepSession[]; // recent sessions; should already be filtered by baby
  nowISOOverride?: string; // for tests
  config?: Partial<ScheduleConfig>;
}

/**
 * Core entry point:
 * Given learner state + sessions, generate schedule blocks for
 * the rest of today and tomorrow.
 */
export function generateSchedule(
  input: ScheduleInputs
): ScheduleBlock[] {
  const now = dayjs(input.nowISOOverride ?? nowISO());
  const cfg: ScheduleConfig = {
    ...DEFAULT_SCHEDULE_CONFIG,
    ...(input.config || {}),
  };

  const blocks: ScheduleBlock[] = [];

  // Normalize sessions: non-deleted only, sorted by time
  const orderedSessions = [...input.sessions]
    .filter((s) => !s.deleted)
    .sort((a, b) =>
      dayjs(a.startISO).diff(dayjs(b.startISO))
    );

  // Find last session that ends before "now"
  const lastSessionBeforeNow = getLastSessionEndingBefore(
    orderedSessions,
    now
  );

  // If currently sleeping (a session where start <= now < end), we treat
  // the "anchor" as that session's end.
  const currentSleep = orderedSessions.find((s) => {
    const start = dayjs(s.startISO);
    const end = dayjs(s.endISO);
    return start.isBefore(now) && end.isAfter(now);
  });

  const anchorTime = currentSleep
    ? dayjs(currentSleep.endISO)
    : lastSessionBeforeNow
    ? dayjs(lastSessionBeforeNow.endISO)
    : now;

  const wwMin = input.learnerState.ewmaWakeWindowMin;
  const napLenMin = input.learnerState.ewmaNapLengthMin;

  // Generate for each day in horizon
  for (let dayOffset = 0; dayOffset < cfg.horizonDays; dayOffset++) {
    const dayStart = now.add(dayOffset, 'day').startOf('day');
    const dayEnd = now.add(dayOffset, 'day').endOf('day');

    const isToday = dayOffset === 0;
    const dayNowAnchor = isToday
      ? anchorTime.isAfter(dayStart)
        ? anchorTime
        : dayStart
      : dayStart;

    const dayBlocks = generateDayScheduleBlocks({
      dayStart,
      dayEnd,
      anchor: dayNowAnchor,
      wwMin,
      napLenMin,
      learnerConfidence: input.learnerState.confidence,
      config: cfg,
      isToday,
    });

    blocks.push(...dayBlocks);
  }

  // Ensure deterministic ordering
  return blocks.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

function getLastSessionEndingBefore(
  sessions: SleepSession[],
  now: dayjs.Dayjs
): SleepSession | null {
  let last: SleepSession | null = null;
  for (const s of sessions) {
    const end = dayjs(s.endISO);
    if (end.isBefore(now) || end.isSame(now)) {
      if (!last || end.isAfter(dayjs(last.endISO))) {
        last = s;
      }
    }
  }
  return last;
}

interface DayScheduleParams {
  dayStart: dayjs.Dayjs;
  dayEnd: dayjs.Dayjs;
  anchor: dayjs.Dayjs;
  wwMin: number;
  napLenMin: number;
  learnerConfidence: number;
  config: ScheduleConfig;
  isToday: boolean;
}

function generateDayScheduleBlocks(params: DayScheduleParams): ScheduleBlock[] {
  const {
    dayStart,
    dayEnd,
    anchor,
    wwMin,
    napLenMin,
    learnerConfidence,
    config,
    isToday,
  } = params;

  const blocks: ScheduleBlock[] = [];

  let cursor = anchor;

  // bump cursor into this day if it's before
  if (cursor.isBefore(dayStart)) {
    cursor = dayStart;
  }

  // Simulate nap cycles
  for (let i = 0; i < config.maxNapCyclesPerDay; i++) {
    const napStart = cursor.add(wwMin, 'minute');
    const napEnd = napStart.add(napLenMin, 'minute');
    const windDownStart = napStart.subtract(config.windDownLeadMin, 'minute');

    if (napStart.isAfter(dayEnd)) {
      break;
    }

    if (windDownStart.isBefore(dayStart)) {
      // clamp wind-down at day start if it spills
      addWindDownBlock(
        blocks,
        dayStart,
        napStart,
        learnerConfidence,
        isToday,
        i
      );
    } else {
      addWindDownBlock(
        blocks,
        windDownStart,
        napStart,
        learnerConfidence,
        isToday,
        i
      );
    }

    if (napEnd.isAfter(dayEnd)) {
      // clamp nap within day
      addNapBlock(blocks, napStart, dayEnd, learnerConfidence, isToday, i);
      break;
    } else {
      addNapBlock(blocks, napStart, napEnd, learnerConfidence, isToday, i);
    }

    cursor = napEnd;
  }

  // Add bedtime near evening if within this day
  const bedtimeStart = cursor.add(wwMin * config.bedtimeWakeFactor, 'minute');
  const earliestBed = dayStart.hour(18).minute(0);
  const latestBed = dayStart.hour(22).minute(0);

  // We aim for bedtime in [18:00, 22:00], if possible
  let btStart = bedtimeStart;
  if (btStart.isBefore(earliestBed)) {
    btStart = earliestBed;
  }
  if (btStart.isAfter(latestBed)) {
    btStart = latestBed;
  }

  const btEnd = btStart.add(10, 'minute'); // bedtime "window" marker, not full night

  if (btStart.isAfter(dayStart) && btStart.isBefore(dayEnd)) {
    addBedtimeBlock(blocks, btStart, btEnd, learnerConfidence, isToday);
  }

  return blocks;
}

let scheduleIdCounter = 0;
function nextScheduleId(kind: ScheduleBlock['kind']): string {
  scheduleIdCounter += 1;
  return `sched_${kind}_${scheduleIdCounter}`;
}

function attenuateConfidence(
  learnerConfidence: number,
  isToday: boolean,
  cycleIndex?: number
): number {
  let conf = learnerConfidence;
  if (!isToday) {
    conf *= 0.8; // less certain about tomorrow
  }
  if (cycleIndex !== undefined && cycleIndex > 0) {
    // further cycles slightly less certain
    conf *= 1 - Math.min(cycleIndex * 0.05, 0.2);
  }
  return Math.max(0, Math.min(1, conf));
}

function addWindDownBlock(
  blocks: ScheduleBlock[],
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  learnerConfidence: number,
  isToday: boolean,
  cycleIndex: number
) {
  blocks.push({
    id: nextScheduleId('windDown'),
    kind: 'windDown',
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    confidence: attenuateConfidence(learnerConfidence, isToday, cycleIndex),
    rationale: isToday
      ? 'Wind-down before nap based on current wake window (EWMA + age baseline).'
      : 'Wind-down before projected nap (tomorrow) using current patterns.',
  });
}

function addNapBlock(
  blocks: ScheduleBlock[],
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  learnerConfidence: number,
  isToday: boolean,
  cycleIndex: number
) {
  blocks.push({
    id: nextScheduleId('nap'),
    kind: 'nap',
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    confidence: attenuateConfidence(learnerConfidence, isToday, cycleIndex),
    rationale: isToday
      ? 'Nap time derived from learned nap length and wake window.'
      : 'Projected nap for tomorrow using learned nap length and wake window.',
  });
}

function addBedtimeBlock(
  blocks: ScheduleBlock[],
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  learnerConfidence: number,
  isToday: boolean
) {
  blocks.push({
    id: nextScheduleId('bedtime'),
    kind: 'bedtime',
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    confidence: attenuateConfidence(learnerConfidence, isToday),
    rationale: isToday
      ? 'Bedtime anchored to last nap and wake window (evening range).'
      : 'Projected bedtime for tomorrow evening from current pattern.',
  });
}
