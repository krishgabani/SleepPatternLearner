import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Check current DB version via PRAGMA
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    // Fresh DB: create our tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS baby_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        birthDateISO TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sleep_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        startISO TEXT NOT NULL,
        endISO TEXT NOT NULL,
        quality INTEGER,
        notes TEXT,
        source TEXT NOT NULL,
        deleted INTEGER DEFAULT 0,
        updatedAtISO TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learner_state (
        id TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        ewmaNapLengthMin REAL NOT NULL,
        ewmaWakeWindowMin REAL NOT NULL,
        lastUpdatedISO TEXT NOT NULL,
        confidence REAL NOT NULL
      );
    `);

    currentVersion = 1;
  }

  // If later we add migrations:
  // if (currentVersion === 1) { ... }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

// Dev-only helper; we’ll pass db from useSQLiteContext when we need it
export async function resetAllDataForDebug(db: SQLiteDatabase) {
  await db.execAsync(`
    DROP TABLE IF EXISTS sleep_sessions;
    DROP TABLE IF EXISTS learner_state;
    DROP TABLE IF EXISTS baby_profiles;
    PRAGMA user_version = 0;
  `);
}
