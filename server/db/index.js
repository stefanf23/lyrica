import { existsSync } from 'fs';
import * as jsonDb from './json.js';
import * as postgresDb from './postgres.js';

/** @type {'postgres' | 'json'} */
let backend = 'json';

export function getStorageBackend() {
  return backend;
}

export async function initDb() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    postgresDb.createPool(connectionString);
    await postgresDb.initPostgresDb();
    backend = 'postgres';

    const count = await postgresDb.getHistoryCount();
    const jsonPath = jsonDb.getJsonHistoryPath();

    if (count === 0 && existsSync(jsonPath)) {
      const items = await jsonDb.readAllForMigration();
      if (items.length > 0) {
        const imported = await postgresDb.importHistoryItems(items);
        console.log(`Migrated ${imported} history item(s) from JSON to Postgres`);
      }
    }

    console.log('Storage: Neon PostgreSQL');
    return;
  }

  await jsonDb.initJsonDb();
  backend = 'json';
  console.log('Storage: JSON file (data/history.json)');
  console.log('Tip: set DATABASE_URL to use Neon PostgreSQL');
}

export async function getHistory(limit) {
  return backend === 'postgres'
    ? postgresDb.getHistory(limit)
    : jsonDb.getHistory(limit);
}

export async function getHistoryItem(id) {
  return backend === 'postgres'
    ? postgresDb.getHistoryItem(id)
    : jsonDb.getHistoryItem(id);
}

export async function findCachedLyrics(title, artist, hash) {
  if (!hash) return null;
  return backend === 'postgres'
    ? postgresDb.findCachedLyrics(title, artist, hash)
    : jsonDb.findCachedLyrics(title, artist, hash);
}

export async function saveHistory(entry) {
  return backend === 'postgres'
    ? postgresDb.saveHistory(entry)
    : jsonDb.saveHistory(entry);
}

export async function deleteHistoryItem(id) {
  return backend === 'postgres'
    ? postgresDb.deleteHistoryItem(id)
    : jsonDb.deleteHistoryItem(id);
}

export async function clearHistory() {
  return backend === 'postgres'
    ? postgresDb.clearHistory()
    : jsonDb.clearHistory();
}
