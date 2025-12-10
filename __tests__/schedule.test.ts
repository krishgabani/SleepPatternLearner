import { generateSchedule } from '../src/schedule';
import type { LearnerState, SleepSession } from '../src/types/models';
import dayjs, { nowISO } from '../src/utils/time';

function makeSession(
  startISO: string,
  endISO: string
): SleepSession {
  return {
    id: `sess_${startISO}_${endISO}`,
    startISO,
    endISO,
    quality: 3,
    notes: undefined,
    source: 'manual',
    deleted: false,
    updatedAtISO: nowISO(),
  };
}

describe('generateSchedule', () => {
  it('creates nap and bedtime blocks based on learner state', () => {
    const today = dayjs('2024-07-02T09:00:00.000Z');

    const sessions: SleepSession[] = [
      // Last nap ended at 09:00
      makeSession(
        today.hour(7).minute(30).toISOString(),
        today.hour(9).minute(0).toISOString()
      ),
    ];

    const learner: LearnerState = {
      version: 1,
      ewmaNapLengthMin: 60, // 1h nap
      ewmaWakeWindowMin: 90, // 1.5h wake window
      lastUpdatedISO: today.toISOString(),
      confidence: 0.8,
    };

    const blocks = generateSchedule({
      learnerState: learner,
      sessions,
      nowISOOverride: today.toISOString(),
    });

    expect(blocks.length).toBeGreaterThan(0);

    // There should be at least one nap block
    const naps = blocks.filter((b) => b.kind === 'nap');
    expect(naps.length).toBeGreaterThan(0);

    // There should be at least one bedtime block
    const bedtimes = blocks.filter((b) => b.kind === 'bedtime');
    expect(bedtimes.length).toBeGreaterThan(0);

    // All blocks must have start < end and sorted order
    for (const b of blocks) {
      const start = dayjs(b.startISO);
      const end = dayjs(b.endISO);
      expect(end.isAfter(start)).toBe(true);
      expect(b.confidence).toBeGreaterThan(0);
      expect(b.confidence).toBeLessThanOrEqual(1);
    }

    const sorted = [...blocks].sort((a, b) =>
      a.startISO.localeCompare(b.startISO)
    );
    expect(blocks.map((b) => b.id)).toEqual(
      sorted.map((b) => b.id)
    );
  });
});
