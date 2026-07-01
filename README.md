# Lyrica

A web app to search for Spanish song lyrics, display them with English translations, and export to PDF.

## Features

- **Intelligent search** — Autocomplete suggestions as you type (powered by iTunes Search API)
- **Lyrics lookup** — Fetches lyrics from LRCLIB and lyrics.ovh with automatic fallback
- **Line-by-line translation** — Spanish lyrics with English translation in parentheses below each line
- **Search history** — Previous searches saved locally for quick access
- **PDF export** — Export formatted lyrics to A1-sized PDF for large-format printing

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
- **Storage:** JSON file (`data/history.json`)
- **APIs:** iTunes Search, LRCLIB, lyrics.ovh, Google Translate (unofficial)

## Notes

- Lyrics availability depends on third-party sources; not all songs may be found
- Translation uses Google's free translate endpoint for demo purposes
- Search history is stored in `data/history.json`
