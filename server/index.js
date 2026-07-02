import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  initDb,
  getHistory,
  getHistoryItem,
  saveHistory,
  deleteHistoryItem,
  clearHistory,
  getStorageBackend,
} from './db/index.js';
import { searchSongs, getLyricsWithTranslation } from './lyrics.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

function lyricsHash(text) {
  return createHash('sha256').update(text.trim()).digest('hex').slice(0, 16);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: getStorageBackend() });
});

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await searchSongs(q || '');
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

app.post('/api/lyrics', async (req, res) => {
  try {
    const { title, artist, album, artworkUrl, save = true } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    const result = await getLyricsWithTranslation(title, artist);

    if (!result.found) {
      return res.status(404).json({ error: result.message || 'No lyrics found for this song.' });
    }

    let historyEntry = null;
    if (save) {
      historyEntry = await saveHistory({
        title,
        artist,
        album,
        artworkUrl,
        spanishLyrics: result.spanishLyrics,
        englishLyrics: JSON.stringify(result.pairs),
        lyricsHash: lyricsHash(result.spanishLyrics),
      });
    }

    return res.json({
      title,
      artist,
      album,
      artworkUrl,
      source: result.source,
      spanishLyrics: result.spanishLyrics,
      pairs: result.pairs,
      historyId: historyEntry?.id || null,
      fromCache: result.fromCache || false,
    });
  } catch (err) {
    console.error('Lyrics error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to fetch lyrics. Please try again.' });
    }
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const items = (await getHistory(limit)).map((item) => ({
      ...item,
      pairs: JSON.parse(item.english_lyrics),
      english_lyrics: undefined,
      spanish_lyrics: undefined,
    }));
    res.json({ items });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const item = await getHistoryItem(parseInt(req.params.id, 10));
    if (!item) return res.status(404).json({ error: 'Not found' });

    res.json({
      ...item,
      pairs: JSON.parse(item.english_lyrics),
      english_lyrics: undefined,
      spanish_lyrics: undefined,
    });
  } catch (err) {
    console.error('History item error:', err);
    res.status(500).json({ error: 'Failed to load history item' });
  }
});

app.delete('/api/history/:id', async (req, res) => {
  try {
    await deleteHistoryItem(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await clearHistory();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.get('*', (req, res, next) => {
  res.sendFile(join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Lyrica server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
