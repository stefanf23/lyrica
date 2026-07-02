import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
const historyFile = join(dataDir, 'history.json');

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function readStore() {
  ensureDataDir();
  if (!existsSync(historyFile)) return { items: [], nextId: 1 };
  try {
    return JSON.parse(readFileSync(historyFile, 'utf-8'));
  } catch {
    return { items: [], nextId: 1 };
  }
}

function writeStore(store) {
  ensureDataDir();
  writeFileSync(historyFile, JSON.stringify(store, null, 2), 'utf-8');
}

export async function initJsonDb() {
  ensureDataDir();
}

export function getJsonHistoryPath() {
  return historyFile;
}

export async function getHistory(limit = 50) {
  const store = readStore();
  return [...store.items]
    .sort((a, b) => new Date(b.searched_at) - new Date(a.searched_at))
    .slice(0, limit);
}

export async function getHistoryItem(id) {
  const store = readStore();
  return store.items.find((item) => item.id === id) || null;
}

export async function findCachedLyrics(title, artist, hash) {
  const store = readStore();
  const key = `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}`;

  return (
    [...store.items]
      .reverse()
      .find((item) => {
        const itemKey = `${item.title.trim().toLowerCase()}|${item.artist.trim().toLowerCase()}`;
        return itemKey === key && item.lyrics_hash === hash;
      }) || null
  );
}

export async function saveHistory(entry) {
  const store = readStore();
  const item = {
    id: store.nextId++,
    title: entry.title,
    artist: entry.artist,
    album: entry.album || null,
    artwork_url: entry.artworkUrl || null,
    spanish_lyrics: entry.spanishLyrics,
    english_lyrics: entry.englishLyrics,
    lyrics_hash: entry.lyricsHash || null,
    searched_at: new Date().toISOString(),
  };
  store.items.push(item);
  writeStore(store);
  return item;
}

export async function deleteHistoryItem(id) {
  const store = readStore();
  store.items = store.items.filter((item) => item.id !== id);
  writeStore(store);
}

export async function clearHistory() {
  writeStore({ items: [], nextId: 1 });
}

export async function readAllForMigration() {
  return readStore().items;
}
