import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const historyFile = join(dataDir, 'history.json');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

function readStore() {
  if (!existsSync(historyFile)) return { items: [], nextId: 1 };
  try {
    return JSON.parse(readFileSync(historyFile, 'utf-8'));
  } catch {
    return { items: [], nextId: 1 };
  }
}

function writeStore(store) {
  writeFileSync(historyFile, JSON.stringify(store, null, 2), 'utf-8');
}

export function getHistory(limit = 50) {
  const store = readStore();
  return [...store.items]
    .sort((a, b) => new Date(b.searched_at) - new Date(a.searched_at))
    .slice(0, limit);
}

export function getHistoryItem(id) {
  const store = readStore();
  return store.items.find((item) => item.id === id) || null;
}

export function saveHistory(entry) {
  const store = readStore();
  const item = {
    id: store.nextId++,
    title: entry.title,
    artist: entry.artist,
    album: entry.album || null,
    artwork_url: entry.artworkUrl || null,
    spanish_lyrics: entry.spanishLyrics,
    english_lyrics: entry.englishLyrics,
    searched_at: new Date().toISOString(),
  };
  store.items.push(item);
  writeStore(store);
  return item;
}

export function deleteHistoryItem(id) {
  const store = readStore();
  store.items = store.items.filter((item) => item.id !== id);
  writeStore(store);
}

export function clearHistory() {
  writeStore({ items: [], nextId: 1 });
}
