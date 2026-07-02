#!/usr/bin/env node
/**
 * One-time migration: import data/history.json into Neon Postgres.
 * Requires DATABASE_URL to be set.
 */
import 'dotenv/config';
import { existsSync } from 'fs';
import { initDb, getStorageBackend } from '../server/db/index.js';
import * as jsonDb from '../server/db/json.js';
import * as postgresDb from '../server/db/postgres.js';

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  await initDb();

  if (getStorageBackend() !== 'postgres') {
    console.error('Postgres backend not active.');
    process.exit(1);
  }

  const jsonPath = jsonDb.getJsonHistoryPath();
  if (!existsSync(jsonPath)) {
    console.log('No history.json found — nothing to migrate.');
    process.exit(0);
  }

  const items = await jsonDb.readAllForMigration();
  if (!items.length) {
    console.log('history.json is empty — nothing to migrate.');
    process.exit(0);
  }

  const existing = await postgresDb.getHistoryCount();
  if (existing > 0) {
    console.log(`Postgres already has ${existing} item(s). Skipping migration to avoid duplicates.`);
    console.log('Clear the table first if you want to re-import.');
    process.exit(0);
  }

  const imported = await postgresDb.importHistoryItems(items);
  console.log(`Imported ${imported} item(s) from history.json into Postgres.`);
  await postgresDb.closePostgres();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
