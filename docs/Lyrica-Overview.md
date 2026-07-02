# Lyrica — High-Level Overview

**Version 1.0 · Spanish Lyrics with English Translation**

---

## What Is Lyrica?

Lyrica is a web application that helps you find Spanish song lyrics and read them alongside English translations, line by line. It is designed for language learners, music lovers, and anyone who wants to understand Spanish songs more deeply.

You search for a song, pick it from a list of suggestions, and Lyrica fetches the lyrics, translates them, and displays both languages together. You can also export the result as a printable PDF or revisit past searches from your history.

---

## Who Is It For?

| Audience | How Lyrica Helps |
|----------|------------------|
| **Language learners** | See Spanish and English side by side while listening to music |
| **Teachers & tutors** | Create large-format lyric sheets for classroom display |
| **Music enthusiasts** | Understand songs you love even if you don't speak Spanish fluently |
| **Casual users** | Quickly look up lyrics without switching between multiple websites |

---

## Core Features

### 1. Intelligent Search
Type a song title or artist name and get autocomplete suggestions as you type. Results include album art, artist name, and album title to help you pick the right track.

### 2. Lyrics Lookup
Lyrica automatically searches multiple online lyrics databases. If one source doesn't have the song, it tries others until it finds a match—or tells you honestly that lyrics aren't available.

### 3. Line-by-Line Translation
Each Spanish lyric line is shown in blue, with the English translation in green directly below it. This format makes it easy to follow along while the song plays.

### 4. Search History
Every song you look up is saved locally on your computer (or server). You can reopen past searches instantly without waiting for lyrics or translation again.

### 5. PDF Export
Export formatted lyrics to an A1-sized PDF—ideal for printing large posters for classrooms, events, or wall displays.

---

## How It Works (Conceptual)

```
You search  →  Lyrica finds the song  →  Lyrics are fetched  →  Text is translated
     →  Results displayed  →  Optional: save to history or export PDF
```

Lyrica does not store a catalog of songs itself. Instead, it connects to trusted external services at the moment you search:

- **iTunes** — to find songs and show artwork
- **LRCLIB & lyrics.ovh** — to retrieve lyrics text
- **Google Translate** — to convert Spanish lines into English

Your search history is kept in a simple local file, not in a cloud account. There is no login required.

---

## System Architecture (Summary)

Lyrica is built as a **two-part web application** that runs together:

| Part | Role |
|------|------|
| **Frontend (what you see)** | Search bar, lyrics display, history panel, PDF export button |
| **Backend (behind the scenes)** | Talks to external APIs, translates lyrics, saves history |

In everyday use, both parts feel like one website. During development they run on two ports; in production they are combined into a single server.

---

## Technology Summary

| Layer | Technology |
|-------|------------|
| User interface | React (JavaScript UI framework) |
| Build tool | Vite (fast development and bundling) |
| Server | Express.js (Node.js web server) |
| Storage | JSON file on disk (`data/history.json`) |
| PDF generation | jsPDF (runs in the browser) |

---

## Strengths & Limitations

### Strengths
- Simple, focused purpose—no clutter
- Works without creating an account
- Remembers your past searches
- Handles missing lyrics gracefully with multiple fallback sources
- PDF export tailored for large-format printing

### Limitations
- Not every song has lyrics available online
- Translation quality depends on automated translation (not human-reviewed)
- History is stored locally—if you deploy without persistent storage, history may reset on redeploy
- Lyrics are copyrighted material; use responsibly for personal and educational purposes

---

## Deployment Overview

Lyrica can run on your computer for personal use (`npm run dev`) or be hosted on the internet as a single Node.js application. Production hosting requires:

1. Building the frontend (`npm run build`)
2. Running the Express server (`npm start`)
3. Optionally attaching persistent disk storage so search history survives restarts

Suitable hosting platforms include Render, Railway, Fly.io, or a traditional VPS (DigitalOcean, Hetzner, etc.).

---

## Document Map

| Document | Audience | Contents |
|----------|----------|----------|
| **Lyrica-Overview.pdf** (this document) | Stakeholders, product owners | Purpose, features, architecture summary |
| **Lyrica-Technical.pdf** | Developers | API routes, file structure, data flow, hosting details |
| **Lyrica-User-Guide.pdf** | End users with little coding experience | Step-by-step usage, troubleshooting |

---

## Getting Started (Quick Reference)

**Requirements:** Node.js 18 or newer

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

For production:

```bash
npm run build
npm start
```

The app will be available at **http://localhost:3001**.

---

*Lyrica — Spanish lyrics with English translation*
