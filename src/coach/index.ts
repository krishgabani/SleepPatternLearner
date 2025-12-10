import type { CoachInsight, LearnerState, SleepSession } from '../types/models';
import dayjs, { nowISO } from '../utils/time';

function isLikelyNightSleep(startISO: string, endISO: string): boolean {
  const start = dayjs(startISO);
  const end = dayjs(endISO);
  const mid = start.add(end.diff(start, 'minute') / 2, 'minute');
  const hour = mid.hour();
  return hour >= 18 || hour < 6;
}

function getDaytimeNaps(sessions: SleepSession[]): SleepSession[] {
  return sessions.filter((s) => {
    if (s.deleted) return false;
    const start = dayjs(s.startISO);
    const end = dayjs(s.endISO);
    const durMin = end.diff(start, 'minute');
    if (durMin <= 0) return false;
    if (durMin < 15 || durMin > 240) return false;
    if (isLikelyNightSleep(s.startISO, s.endISO)) return false;
    return true;
  });
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface CoachInputs {
  sessions: SleepSession[];   // recent sessions (can be single-day for now)
  learnerState: LearnerState | null;
  nowISOOverride?: string;
}

/**
 * Given sessions + learner state, return a small set of human-readable insights.
 * This is intentionally conservative and simple.
 */
export function computeCoachInsights(input: CoachInputs): CoachInsight[] {
  const now = input.nowISOOverride ?? nowISO();
  const insights: CoachInsight[] = [];

  if (!input.sessions.length || !input.learnerState) {
    insights.push({
      id: 'coach_no_data',
      severity: 'info',
      title: 'Not enough data yet',
      message:
        'Log a few days of naps and nighttime sleep so I can spot patterns and tailor schedules.',
      tags: ['no_data'],
      createdAtISO: now,
    });
    return insights;
  }

  const naps = getDaytimeNaps(input.sessions);
  const learner = input.learnerState;

  if (!naps.length) {
    insights.push({
      id: 'coach_no_naps',
      severity: 'info',
      title: 'No daytime naps logged',
      message:
        'I only see nighttime or very short stretches. Add daytime naps so I can estimate wake windows and nap length.',
      tags: ['no_naps'],
      createdAtISO: now,
    });
    return insights;
  }

  // --- Rule 1: short naps vs learned nap length ---
  const napDurations = naps.map((s) => {
    const start = dayjs(s.startISO);
    const end = dayjs(s.endISO);
    return end.diff(start, 'minute');
  });
  const avgNap = avg(napDurations);

  if (avgNap !== null) {
    const target = learner.ewmaNapLengthMin;
    if (avgNap < 0.7 * target) {
      insights.push({
        id: 'coach_short_naps',
        severity: 'warn',
        title: 'Naps are running short',
        message:
          'Recent naps are much shorter than the pattern I learned. This can be a sign of overtiredness or too-long wake windows before naps.',
        tags: ['short_naps', 'overtired'],
        createdAtISO: now,
      });
    } else if (avgNap > 1.3 * target) {
      insights.push({
        id: 'coach_long_naps',
        severity: 'tip',
        title: 'Naps are on the long side',
        message:
          'Recent naps are longer than your usual pattern. That can be fine, but if bedtime is drifting later, consider gently waking from very long naps.',
        tags: ['long_naps'],
        createdAtISO: now,
      });
    }
  }

  // Compute wake windows between consecutive daytime naps
  const sortedNaps = [...naps].sort((a, b) =>
    dayjs(a.startISO).diff(dayjs(b.startISO))
  );
  const wakeWindows: number[] = [];
  for (let i = 0; i < sortedNaps.length - 1; i++) {
    const end = dayjs(sortedNaps[i].endISO);
    const nextStart = dayjs(sortedNaps[i + 1].startISO);
    const diff = nextStart.diff(end, 'minute');
    if (diff > 0 && diff <= 6 * 60) {
      wakeWindows.push(diff);
    }
  }
  const avgWake = avg(wakeWindows);

  // --- Rule 2: wake windows too long / too short ---
  if (avgWake !== null) {
    const target = learner.ewmaWakeWindowMin;
    if (avgWake > 1.3 * target) {
      insights.push({
        id: 'coach_long_wake',
        severity: 'warn',
        title: 'Wake windows may be too long',
        message:
          'Average time awake between naps is much longer than your usual pattern. This often leads to short, cranky naps and harder bedtimes.',
        tags: ['wake_long', 'overtired'],
        createdAtISO: now,
      });
    } else if (avgWake < 0.7 * target) {
      insights.push({
        id: 'coach_short_wake',
        severity: 'tip',
        title: 'Wake windows are on the short side',
        message:
          'Average wake windows are shorter than your usual pattern. If naps are still solid, this can be okay; otherwise you may have room to stretch awake time slightly.',
        tags: ['wake_short'],
        createdAtISO: now,
      });
    }
  }

  // --- Rule 3: many short naps in a day ---
  const shortNaps = napDurations.filter((d) => d < 40);
  if (shortNaps.length >= 3 && naps.length >= 4) {
    insights.push({
      id: 'coach_many_short_naps',
      severity: 'warn',
      title: 'Lots of short naps today',
      message:
        'There are several short naps in this period. That often means baby is playing catch-up on sleep. You may want to protect an early bedtime or shorter wake windows.',
      tags: ['short_naps_cluster'],
      createdAtISO: now,
    });
  }

  // --- Rule 4: high variability (schedule all over the place) ---
  if (wakeWindows.length >= 3) {
    const meanWW = avg(wakeWindows)!;
    const variance =
      wakeWindows.reduce((sum, v) => sum + (v - meanWW) ** 2, 0) /
      wakeWindows.length;
    const std = Math.sqrt(variance);
    if (std > 60) {
      insights.push({
        id: 'coach_variable_wake',
        severity: 'tip',
        title: 'Wake windows are quite variable',
        message:
          'Time awake between naps is very up-and-down. That can make it harder for baby to settle into a predictable rhythm. A bit more consistency may help.',
        tags: ['variable_wake'],
        createdAtISO: now,
      });
    }
  }

  if (!insights.length) {
    insights.push({
      id: 'coach_all_good',
      severity: 'tip',
      title: 'Current pattern looks reasonable',
      message:
        'Based on recent naps and wake windows, I don\'t see any strong red flags. You can use the schedule and what-if slider to fine-tune as needed.',
      tags: ['ok'],
      createdAtISO: now,
    });
  }

  return insights;
}
