import pg from 'pg';

const { Pool } = pg;

/** @type {pg.Pool | null} */
let pool = null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    artwork_url TEXT,
    spanish_lyrics TEXT NOT NULL,
    english_lyrics TEXT NOT NULL,
    lyrics_hash TEXT,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_search_history_searched_at
    ON search_history (searched_at DESC);

  CREATE INDEX IF NOT EXISTS idx_search_history_song_cache
    ON search_history (LOWER(title), LOWER(artist), lyrics_hash);
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    artwork_url: row.artwork_url,
    spanish_lyrics: row.spanish_lyrics,
    english_lyrics: row.english_lyrics,
    lyrics_hash: row.lyrics_hash,
    searched_at: row.searched_at instanceof Date
      ? row.searched_at.toISOString()
      : row.searched_at,
  };
}

export function createPool(connectionString) {
  const useSsl =
    connectionString.includes('neon.tech') ||
    connectionString.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production';

  pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

  pool.on('error', (err) => {
    console.error('Postgres pool error:', err.message);
  });

  return pool;
}

export async function initPostgresDb() {
  if (!pool) throw new Error('Postgres pool not initialized');

  const client = await pool.connect();
  try {
    await client.query(SCHEMA_SQL);
  } finally {
    client.release();
  }
}

export async function getHistory(limit = 50) {
  const { rows } = await pool.query(
    `SELECT id, title, artist, album, artwork_url, spanish_lyrics, english_lyrics,
            lyrics_hash, searched_at
     FROM search_history
     ORDER BY searched_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(mapRow);
}

export async function getHistoryItem(id) {
  const { rows } = await pool.query(
    `SELECT id, title, artist, album, artwork_url, spanish_lyrics, english_lyrics,
            lyrics_hash, searched_at
     FROM search_history
     WHERE id = $1`,
    [id]
  );
  return mapRow(rows[0]);
}

export async function findCachedLyrics(title, artist, hash) {
  const { rows } = await pool.query(
    `SELECT id, title, artist, album, artwork_url, spanish_lyrics, english_lyrics,
            lyrics_hash, searched_at
     FROM search_history
     WHERE LOWER(title) = LOWER($1)
       AND LOWER(artist) = LOWER($2)
       AND lyrics_hash = $3
     ORDER BY searched_at DESC
     LIMIT 1`,
    [title.trim(), artist.trim(), hash]
  );
  return mapRow(rows[0]);
}

export async function saveHistory(entry) {
  const { rows } = await pool.query(
    `INSERT INTO search_history
       (title, artist, album, artwork_url, spanish_lyrics, english_lyrics, lyrics_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, artist, album, artwork_url, spanish_lyrics, english_lyrics,
               lyrics_hash, searched_at`,
    [
      entry.title,
      entry.artist,
      entry.album || null,
      entry.artworkUrl || null,
      entry.spanishLyrics,
      entry.englishLyrics,
      entry.lyricsHash || null,
    ]
  );
  return mapRow(rows[0]);
}

export async function deleteHistoryItem(id) {
  await pool.query('DELETE FROM search_history WHERE id = $1', [id]);
}

export async function clearHistory() {
  await pool.query('DELETE FROM search_history');
}

export async function getHistoryCount() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM search_history');
  return rows[0].count;
}

export async function importHistoryItems(items) {
  if (!items.length) return 0;

  const client = await pool.connect();
  let imported = 0;

  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query(
        `INSERT INTO search_history
           (title, artist, album, artwork_url, spanish_lyrics, english_lyrics, lyrics_hash, searched_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.title,
          item.artist,
          item.album || null,
          item.artwork_url || null,
          item.spanish_lyrics,
          item.english_lyrics,
          item.lyrics_hash || null,
          item.searched_at || new Date().toISOString(),
        ]
      );
      imported += 1;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return imported;
}

export async function closePostgres() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
