const LRCLIB_BASE = 'https://lrclib.net/api';

export async function searchSongs(query) {
  if (!query || query.trim().length < 2) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=12&lang=es_es`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Song search failed');

  const data = await res.json();
  const seen = new Set();

  return (data.results || [])
    .filter((r) => r.trackName && r.artistName)
    .map((r) => ({
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName || '',
      artworkUrl: r.artworkUrl100?.replace('100x100', '300x300') || null,
      releaseDate: r.releaseDate || null,
    }))
    .filter((item) => {
      const key = `${item.title}|${item.artist}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function fetchFromLrclib(title, artist) {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  const res = await fetch(`${LRCLIB_BASE}/get?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const plain = data.plainLyrics || data.syncedLyrics?.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
  if (!plain) return null;

  return { lyrics: plain, source: 'lrclib' };
}

async function fetchFromLyricsOvh(title, artist) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.lyrics) return null;

  return { lyrics: data.lyrics.trim(), source: 'lyrics.ovh' };
}

async function searchLrclib(title, artist) {
  const params = new URLSearchParams({ q: `${title} ${artist}` });
  const res = await fetch(`${LRCLIB_BASE}/search?${params}`);
  if (!res.ok) return null;

  const results = await res.json();
  if (!results?.length) return null;

  const match =
    results.find(
      (r) =>
        r.trackName?.toLowerCase() === title.toLowerCase() &&
        r.artistName?.toLowerCase() === artist.toLowerCase()
    ) || results[0];

  if (match?.plainLyrics) {
    return { lyrics: match.plainLyrics.trim(), source: 'lrclib-search' };
  }

  if (match?.syncedLyrics) {
    return {
      lyrics: match.syncedLyrics.replace(/\[\d+:\d+\.\d+\]/g, '').trim(),
      source: 'lrclib-search',
    };
  }

  return null;
}

export async function fetchLyrics(title, artist) {
  const sources = [
    () => fetchFromLrclib(title, artist),
    () => searchLrclib(title, artist),
    () => fetchFromLyricsOvh(title, artist),
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result?.lyrics) return result;
    } catch {
      /* try next source */
    }
  }

  return null;
}

function splitLyricLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function translateChunk(text, from = 'es', to = 'en') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation failed');

  const data = await res.json();
  return data[0].map((part) => part[0]).join('');
}

export async function translateLyrics(spanishLyrics) {
  const lines = splitLyricLines(spanishLyrics);
  if (!lines.length) return [];

  const batchSize = 8;
  const translated = [];

  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    const combined = batch.join('\n');
    const result = await translateChunk(combined);
    const resultLines = result.split('\n').map((l) => l.trim());

    for (let j = 0; j < batch.length; j++) {
      translated.push(resultLines[j] || batch[j]);
    }
  }

  return lines.map((spanish, idx) => ({
    spanish,
    english: translated[idx] || '',
  }));
}

export async function getLyricsWithTranslation(title, artist) {
  const lyricsResult = await fetchLyrics(title, artist);
  if (!lyricsResult) {
    return { found: false, message: 'No lyrics found for this song.' };
  }

  const pairs = await translateLyrics(lyricsResult.lyrics);

  return {
    found: true,
    source: lyricsResult.source,
    spanishLyrics: lyricsResult.lyrics,
    pairs,
  };
}
