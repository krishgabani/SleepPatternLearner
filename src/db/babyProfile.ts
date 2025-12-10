import type { SQLiteDatabase } from 'expo-sqlite';
import type { BabyProfile } from '../types/models';

/** Ensure the baby_profiles table exists */
export async function initBabyProfileTable(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS baby_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      birthDateISO TEXT,
      createdAtISO TEXT,
      updatedAtISO TEXT
    );
  `);
}

interface BabyProfileRow {
  id: string;
  name: string | null;
  birthDateISO: string | null;
  createdAtISO: string | null;
  updatedAtISO: string | null;
}

/** Get the first (oldest) baby profile */
export async function getActiveBabyProfile(
  db: SQLiteDatabase
): Promise<BabyProfile | null> {
  const rows = await db.getAllAsync<BabyProfileRow>(`
    SELECT *
    FROM baby_profiles
    ORDER BY datetime(createdAtISO) ASC
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name ?? '',
    birthDateISO: row.birthDateISO ?? new Date().toISOString(),
    createdAtISO: row.createdAtISO ?? new Date().toISOString(),
    updatedAtISO: row.updatedAtISO ?? new Date().toISOString(),
  };
}

/** Upsert a baby profile safely */
export async function upsertBabyProfile(
  db: SQLiteDatabase,
  profile: BabyProfile
): Promise<void> {
  const now = new Date().toISOString();
  const safeProfile = {
    id: profile.id,
    name: profile.name ?? '',
    birthDateISO: profile.birthDateISO ?? now,
    createdAtISO: profile.createdAtISO ?? now,
    updatedAtISO: now,
  };

  try {
    await db.runAsync(
      `
      INSERT INTO baby_profiles (id, name, birthDateISO, createdAtISO, updatedAtISO)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        birthDateISO = excluded.birthDateISO,
        createdAtISO = COALESCE(baby_profiles.createdAtISO, excluded.createdAtISO),
        updatedAtISO = excluded.updatedAtISO
      `,
      [
        safeProfile.id,
        safeProfile.name,
        safeProfile.birthDateISO,
        safeProfile.createdAtISO,
        safeProfile.updatedAtISO,
      ]
    );
  } catch (e) {
    console.error('Failed to upsert baby profile', e);
  }
}
