import { computeLearnerState } from '../src/learner';
import type { SleepSession } from '../src/types/models';
import dayjs, { nowISO } from '../src/utils/time';

const birthDateISO = '2024-01-01';

function makeSession(
  startISO: string,
  endISO: string,
  source: SleepSession['source'] = 'manual',
  quality: SleepSession['quality'] = 3
): SleepSession {
  return {
    id: `sess_${startISO}_${endISO}`,
    startISO,
    endISO,
    quality,
    notes: undefined,
    source,
    deleted: false,
    updatedAtISO: nowISO(),
  };
}

describe('computeLearnerState', () => {
  it('computes reasonable nap length and wake window from naps', () => {
    const baseDay = dayjs('2024-07-01T00:00:00.000Z');

    // 3 daytime naps, 60-90 min each, 90-120 min wake windows
    const sessions: SleepSession[] = [
      // Nap 1: 09:00-10:00
      makeSession(
        baseDay.hour(9).minute(0).toISOString(),
        baseDay.hour(10).minute(0).toISOString()
      ),
      // Nap 2: 12:00-13:30
      makeSession(
        baseDay.hour(12).minute(0).toISOString(),
        baseDay.hour(13).minute(30).toISOString()
      ),
      // Nap 3: 16:00-17:00
      makeSession(
        baseDay.hour(16).minute(0).toISOString(),
        baseDay.hour(17).minute(0).toISOString()
      ),

      // One long night stretch that should be ignored as "night sleep"
      makeSession(
        baseDay.hour(22).minute(0).toISOString(),
        baseDay.add(1, 'day').hour(6).minute(0).toISOString()
      ),
    ];

    const state = computeLearnerState({
      birthDateISO,
      sessions,
      nowISOOverride: baseDay.add(1, 'day').toISOString(),
    });

    // Learner state should produce finite, positive values
    expect(state.ewmaNapLengthMin).toBeGreaterThan(0);
    expect(state.ewmaWakeWindowMin).toBeGreaterThan(0);

    // Given our naps (~60-90m), learned nap length should be in that neighborhood
    expect(state.ewmaNapLengthMin).toBeGreaterThanOrEqual(50);
    expect(state.ewmaNapLengthMin).toBeLessThanOrEqual(100);

    // Wake windows around 90-120m
    expect(state.ewmaWakeWindowMin).toBeGreaterThanOrEqual(60);
    expect(state.ewmaWakeWindowMin).toBeLessThanOrEqual(150);

    // Confidence should be between 0 and 1 and non-trivial
    expect(state.confidence).toBeGreaterThan(0);
    expect(state.confidence).toBeLessThanOrEqual(1);
  });

  it('falls back to age baseline when no sessions given', () => {
    const now = nowISO();

    const state = computeLearnerState({
      birthDateISO,
      sessions: [],
      nowISOOverride: now,
    });

    // We at least should have some sane defaults > 0
    expect(state.ewmaNapLengthMin).toBeGreaterThan(0);
    expect(state.ewmaWakeWindowMin).toBeGreaterThan(0);
    // With zero data, confidence should be very low
    expect(state.confidence).toBeLessThanOrEqual(0.2);
  });
});
