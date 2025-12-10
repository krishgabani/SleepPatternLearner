import type { SQLiteDatabase } from 'expo-sqlite';
import type { SleepSession } from '../types/models';
import dayjs, { nowISO } from '../utils/time';

export async function insertSleepSession(
  db: SQLiteDatabase,
  session: SleepSession
) {
  await db.runAsync(
    `
    INSERT INTO sleep_sessions (
      id,
      startISO,
      endISO,
      quality,
      notes,
      source,
      deleted,
      updatedAtISO
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      session.id,
      session.startISO,
      session.endISO,
      session.quality ?? null,
      session.notes ?? null,
      session.source,
      session.deleted ? 1 : 0,
      session.updatedAtISO,
    ]
  );
}

type SleepSessionRow = {
  id: string;
  startISO: string;
  endISO: string;
  quality: number | null;
  notes: string | null;
  source: string;
  deleted: number;
  updatedAtISO: string;
};

export async function getSessionsForDay(
  db: SQLiteDatabase,
  date: dayjs.Dayjs
): Promise<SleepSession[]> {
  const startOfDay = date.startOf('day').toISOString();
  const endOfDay = date.endOf('day').toISOString();

  const rows = await db.getAllAsync<SleepSessionRow>(
    `
    SELECT *
    FROM sleep_sessions
    WHERE deleted = 0
      AND startISO <= ?
      AND endISO >= ?
    ORDER BY startISO ASC
    `,
    [endOfDay, startOfDay]
  );

  return rows.map((row) => ({
    id: row.id,
    startISO: row.startISO,
    endISO: row.endISO,
    quality: (row.quality ?? undefined) as SleepSession['quality'],
    notes: row.notes ?? undefined,
    source: row.source as SleepSession['source'],
    deleted: row.deleted === 1,
    updatedAtISO: row.updatedAtISO,
  }));
}

export async function updateSleepSession(
  db: SQLiteDatabase,
  session: SleepSession
) {
  await db.runAsync(
    `
    UPDATE sleep_sessions
    SET
      startISO = ?,
      endISO = ?,
      quality = ?,
      notes = ?,
      source = ?,
      deleted = ?,
      updatedAtISO = ?
    WHERE id = ?
    `,
    [
      session.startISO,
      session.endISO,
      session.quality ?? null,
      session.notes ?? null,
      session.source,
      session.deleted ? 1 : 0,
      session.updatedAtISO,
      session.id,
    ]
  );
}

export async function softDeleteSleepSession(
  db: SQLiteDatabase,
  id: string
) {
  await db.runAsync(
    `
    UPDATE sleep_sessions
    SET deleted = 1,
        updatedAtISO = ?
    WHERE id = ?
    `,
    [nowISO(), id]
  );
}