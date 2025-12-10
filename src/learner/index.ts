import type { LearnerState, SleepSession } from '../types/models';
import dayjs, { nowISO } from '../utils/time';
import { getAgeBaseline } from './baseline';
import { ewma } from './ewma';

export interface LearnerConfig {
  // how many past days to look at
  lookbackDays: number;
  // EWMA smoothing factor for naps
  alphaNap: number;
  // EWMA smoothing factor for wake windows
  alphaWake: number;
  // minimum number of valid sessions for high confidence
  minSamplesForHighConfidence: number;
}

export const DEFAULT_LEARNER_CONFIG: LearnerConfig = {
  lookbackDays: 14,
  alphaNap: 0.35,
  alphaWake: 0.35,
  minSamplesForHighConfidence: 20,
};

// basic filters: we only learn from naps between 20m and 3h
function isValidNapDuration(mins: number): boolean {
  return mins >= 20 && mins <= 180;
}

// treat nighttime as anything where midpoint falls between 18:00-06:00
function isLikelyNightSleep(startISO: string, endISO: string): boolean {
  const start = dayjs(startISO);
  const end = dayjs(endISO);
  const mid = start.add(end.diff(start, 'minute') / 2, 'minute');
  const hour = mid.hour();
  return hour >= 18 || hour < 6;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface LearnerInputs {
  birthDateISO: string;
  sessions: SleepSession[];
  nowISOOverride?: string; // for tests
  config?: Partial<LearnerConfig>;
}

export function computeLearnerState(
  input: LearnerInputs
): LearnerState {
  const now = input.nowISOOverride ?? nowISO();
  const cfg: LearnerConfig = {
    ...DEFAULT_LEARNER_CONFIG,
    ...(input.config || {}),
  };

  const cutoff = dayjs(now).subtract(cfg.lookbackDays, 'day');

  // filter recent, non-deleted, likely naps
  const recentNaps = input.sessions
    .filter((s) => !s.deleted)
    .filter((s) => dayjs(s.endISO).isAfter(cutoff))
    .filter((s) => !isLikelyNightSleep(s.startISO, s.endISO));

  const napDurationsMin: number[] = [];
  const wakeWindowsMin: number[] = [];

  // Sort by start time so wake windows are in order
  const sorted = [...recentNaps].sort((a, b) =>
    dayjs(a.startISO).diff(dayjs(b.startISO))
  );

  for (let i = 0; i < sorted.length; i++) {
    const nap = sorted[i];
    const start = dayjs(nap.startISO);
    const end = dayjs(nap.endISO);
    const dur = end.diff(start, 'minute');

    if (isValidNapDuration(dur)) {
      napDurationsMin.push(dur);
    }

    // wake window = time between end of this nap and start of next nap
    if (i < sorted.length - 1) {
      const nextNap = sorted[i + 1];
      const ww = dayjs(nextNap.startISO).diff(end, 'minute');
      if (ww > 0 && ww <= 6 * 60) {
        // ignore absurdly long windows
        wakeWindowsMin.push(ww);
      }
    }
  }

  const ageBaseline = getAgeBaseline(
    input.birthDateISO,
    now
  );

  const napEwma = ewma(napDurationsMin, cfg.alphaNap);
  const wakeEwma = ewma(wakeWindowsMin, cfg.alphaWake);

  // If we have no data, fall back to mid-range baselines
  const baselineNap = (ageBaseline.napLengthMin + ageBaseline.napLengthMax) / 2;
  const baselineWake =
    (ageBaseline.wakeWindowMin + ageBaseline.wakeWindowMax) / 2;

  const ewmaNapLengthMin =
    napEwma !== null
      ? clamp(napEwma, ageBaseline.napLengthMin, ageBaseline.napLengthMax)
      : baselineNap;

  const ewmaWakeWindowMin =
    wakeEwma !== null
      ? clamp(wakeEwma, ageBaseline.wakeWindowMin, ageBaseline.wakeWindowMax)
      : baselineWake;

  // Confidence heuristic:
  //  - base on number of samples
  //  - penalize high variance
  const sampleCount = Math.min(
    napDurationsMin.length + wakeWindowsMin.length,
    cfg.minSamplesForHighConfidence
  );
  const baseConfidence =
    sampleCount / cfg.minSamplesForHighConfidence; // 0..1

  const allVals = [...napDurationsMin, ...wakeWindowsMin];
  let variancePenalty = 0;
  if (allVals.length >= 3) {
    const mean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
    const variance =
      allVals.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      (allVals.length - 1);
    const std = Math.sqrt(variance);
    // std roughly more than 60min → lower confidence
    variancePenalty = clamp(std / 60, 0, 0.6);
  }

  const confidence = clamp(baseConfidence * (1 - variancePenalty), 0, 1);

  const state: LearnerState = {
    version: 1, // learner schema version
    ewmaNapLengthMin,
    ewmaWakeWindowMin,
    lastUpdatedISO: now,
    confidence,
  };

  return state;
}
