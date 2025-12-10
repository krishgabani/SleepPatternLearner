// export interface BabyProfile {
//   id: string;
//   name: string;
//   birthDateISO: string; // ISO date
// }

export interface BabyProfile {
  id: string;
  name: string;
  birthDateISO: string;
  createdAtISO: string;
  updatedAtISO: string;
}

export interface SleepSession {
  id: string; // UUID
  startISO: string; // inclusive
  endISO: string; // exclusive
  quality?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  source: 'manual' | 'timer'; // provenance
  deleted?: boolean; // tombstone
  updatedAtISO: string; // audit
}

export interface LearnerState {
  version: number; // schema/migration
  ewmaNapLengthMin: number; // smoothed features
  ewmaWakeWindowMin: number;
  lastUpdatedISO: string;
  confidence: number; // 0..1
}

export interface ScheduleBlock {
  id: string; // UUID
  kind: 'nap' | 'bedtime' | 'windDown';
  startISO: string;
  endISO: string;
  confidence: number; // 0..1
  rationale: string; // brief explanation
}

export type CoachSeverity = 'info' | 'tip' | 'warn' | 'alert';

export interface CoachInsight {
  id: string;
  severity: CoachSeverity;
  title: string;
  message: string;
  tags?: string[]; // e.g. ['short_naps', 'wake_window_long']
  createdAtISO: string;
}

