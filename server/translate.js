import { createHash } from 'crypto';

import { fetchWithTimeout } from './fetchUtils.js';

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const DEEPL_API_URL = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';

const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const CONCURRENCY = 3;
const TRANSLATE_TIMEOUT = 15000;

/** @type {Map<string, string>} */
const lineCache = new Map();
const MAX_CACHE = 2000;

function cacheKey(text, from, to) {
  return `${from}:${to}:${text}`;
}

function getCached(text, from, to) {
  return lineCache.get(cacheKey(text, from, to));
}

function setCached(text, from, to, translation) {
  if (lineCache.size >= MAX_CACHE) {
    const first = lineCache.keys().next().value;
    lineCache.delete(first);
  }
  lineCache.set(cacheKey(text, from, to), translation);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Lines that should pass through untranslated */
function isPassthroughLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^[\-*_~♪♫\.…]+$/.test(trimmed)) return true;
  if (/^\(\d+x\)$/i.test(trimmed)) return true;
  if (/^x{2,}$/i.test(trimmed)) return true;
  return false;
}

export function splitLyricLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function numberedPayload(lines) {
  return lines.map((line, i) => `[${i + 1}] ${line}`).join('\n');
}

function parseNumberedResponse(text, expectedCount) {
  const results = new Array(expectedCount).fill(null);
  const pattern = /^\[(\d+)\]\s*(.*)$/;

  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const match = line.match(pattern);
    if (!match) return;
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < expectedCount) {
      results[idx] = match[2].trim();
    }
  });

  return results;
}

async function translateGoogleText(text, from = 'es', to = 'en') {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    dt: 't',
    q: text,
  });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const res = await fetchWithTimeout(`${GOOGLE_TRANSLATE_URL}?${params}`, {}, TRANSLATE_TIMEOUT);
    if (!res.ok) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(350 * (attempt + 1));
        continue;
      }
      throw new Error('Translation failed');
    }

    const data = await res.json();
    if (Array.isArray(data?.[0])) {
      return data[0].map((part) => (part?.[0] ?? '')).join('');
    }
  }

  throw new Error('Translation failed');
}

async function translateGoogleSingle(line, from, to) {
  const cached = getCached(line, from, to);
  if (cached !== undefined) return cached;

  const translation = await translateGoogleText(line, from, to);
  setCached(line, from, to, translation);
  await sleep(60);
  return translation;
}

async function translateGoogleNumberedBatch(lines, from = 'es', to = 'en') {
  const results = new Array(lines.length);
  const toTranslate = [];

  lines.forEach((line, idx) => {
    if (isPassthroughLine(line)) {
      results[idx] = line;
      return;
    }

    const cached = getCached(line, from, to);
    if (cached !== undefined) {
      results[idx] = cached;
      return;
    }

    toTranslate.push({ idx, line });
  });

  if (toTranslate.length === 0) return results;

  const batchLines = toTranslate.map(({ line }) => line);
  const payload = numberedPayload(batchLines);

  try {
    const translated = await translateGoogleText(payload, from, to);
    const parsed = parseNumberedResponse(translated, batchLines.length);

    if (parsed.every((t) => t !== null)) {
      toTranslate.forEach(({ idx, line }, i) => {
        results[idx] = parsed[i];
        setCached(line, from, to, parsed[i]);
      });
      return results;
    }
  } catch {
    /* fall through to per-line */
  }

  for (const { idx, line } of toTranslate) {
    results[idx] = await translateGoogleSingle(line, from, to);
  }

  return results;
}

async function translateDeepLBatch(lines, from = 'es', to = 'en') {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return null;

  const results = new Array(lines.length);
  const toTranslate = [];

  lines.forEach((line, idx) => {
    if (isPassthroughLine(line)) {
      results[idx] = line;
      return;
    }

    const cached = getCached(line, from, to);
    if (cached !== undefined) {
      results[idx] = cached;
      return;
    }

    toTranslate.push({ idx, line });
  });

  if (toTranslate.length === 0) return results;

  const body = {
    text: toTranslate.map(({ line }) => line),
    source_lang: from.toUpperCase(),
    target_lang: to.toUpperCase(),
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const res = await fetchWithTimeout(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, TRANSLATE_TIMEOUT);

    if (!res.ok) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      return null;
    }

    const data = await res.json();
    const translations = data.translations?.map((t) => t.text) || [];

    if (translations.length === toTranslate.length) {
      toTranslate.forEach(({ idx, line }, i) => {
        results[idx] = translations[i];
        setCached(line, from, to, translations[i]);
      });
      return results;
    }

    return null;
  }

  return null;
}

async function translateBatch(lines, from, to) {
  if (process.env.DEEPL_API_KEY) {
    const deepl = await translateDeepLBatch(lines, from, to);
    if (deepl) return deepl;
  }

  return translateGoogleNumberedBatch(lines, from, to);
}

async function runPool(items, worker, limit) {
  const results = new Array(items.length);

  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index;
      index += 1;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

/**
 * Translate lyric lines one-to-one with Spanish, preserving alignment.
 * Uses numbered batch markers for Google, or DeepL array API when configured.
 */
export async function translateLines(lines, from = 'es', to = 'en') {
  if (!lines.length) return [];

  const batches = [];
  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    batches.push({ start: i, lines: lines.slice(i, i + BATCH_SIZE) });
  }

  const batchResults = await runPool(
    batches,
    async (batch) => {
      const translated = await translateBatch(batch.lines, from, to);
      await sleep(120);
      return { start: batch.start, translated };
    },
    CONCURRENCY
  );

  batchResults.sort((a, b) => a.start - b.start);
  const allTranslated = batchResults.flatMap((b) => b.translated);

  return lines.map((spanish, idx) => ({
    spanish,
    english: allTranslated[idx]?.trim() || spanish,
  }));
}

export function lyricsHash(lyrics) {
  return createHash('sha256').update(lyrics.trim()).digest('hex').slice(0, 16);
}

export function getTranslateProvider() {
  return process.env.DEEPL_API_KEY ? 'deepl' : 'google';
}
