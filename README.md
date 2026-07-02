# Lyrica

A web app to search for Spanish song lyrics, display them with English translations, and export to PDF.

## Features

- **Intelligent search** — Autocomplete suggestions as you type (powered by iTunes Search API)
- **Lyrics lookup** — Fetches lyrics from LRCLIB and lyrics.ovh with automatic fallback
- **Line-by-line translation** — Spanish lyrics with English translation in parentheses below each line
- **Search history** — Saved to Neon PostgreSQL (or local JSON fallback when `DATABASE_URL` is not set)
- **PDF export** — Export formatted lyrics to A1-sized PDF for large-format printing

## Project location

**Develop from the local copy:**

```
C:\cursor_projects\lyrica
```

Do not use the `U:\cursor_projects\Lyrica` network path — `npm install` and Vite are unreliable on mapped network drives.

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The dev server runs the Vite frontend (port 5173) and Express API (port 3001) concurrently.

### Production

```bash
npm run build
npm start
```

Serves the built frontend and API on port 3001.

## Usage

1. Type a song title or artist name in the search bar
2. Select a song from the autocomplete suggestions
3. View Spanish lyrics (blue) with English translations (green) below each line
4. Click **Export PDF** to download an A1-formatted PDF
5. Browse previous searches in the **Search History** panel

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Express.js
- **Storage:** Neon PostgreSQL (recommended) or JSON file (`data/history.json`) as fallback
- **APIs:** iTunes Search, LRCLIB, lyrics.ovh, Google Translate (unofficial)

## Database (Neon PostgreSQL)

Search history persists in **Neon Postgres** when `DATABASE_URL` is set. Without it, the app falls back to `data/history.json` (fine for local-only use).

### Setup Neon

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string from the Neon dashboard
3. Create a `.env` file (see `.env.example`):

```bash
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

4. Install dependencies and start:

```bash
npm install
npm run dev
```

On first startup with an empty Postgres database, any existing `data/history.json` is **automatically imported**.

### Deploy on Render

1. Deploy the Lyrica web service on Render
2. Add environment variable: `DATABASE_URL` = your Neon pooled connection string
3. History survives redeploys — data lives in Neon, not on Render's ephemeral disk

### Manual migration

```bash
npm run db:migrate
```

## Notes

- Lyrics availability depends on third-party sources; not all songs may be found
- Translation uses Google's free translate endpoint for demo purposes
- Without `DATABASE_URL`, search history is stored in `data/history.json`
- With `DATABASE_URL`, history is stored in Neon PostgreSQL
