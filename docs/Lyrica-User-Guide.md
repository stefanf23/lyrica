# Lyrica — User Guide

**A simple guide for using Lyrica (no coding experience needed)**

---

## Welcome to Lyrica!

Lyrica helps you find **Spanish song lyrics** and see **English translations** right underneath each line. It's perfect if you're learning Spanish, teaching a class, or just curious about what your favorite songs actually mean.

You don't need to create an account or sign in. Just open the app, search for a song, and start reading.

---

## What You'll Need

- A computer, tablet, or phone with a web browser (Chrome, Firefox, Safari, or Edge)
- An internet connection
- If you're running Lyrica on your own computer: the app must be started first (see "Running Lyrica on Your Computer" at the end)

---

## Opening Lyrica

If someone has already set up Lyrica for you:

1. Open your web browser
2. Go to the address they gave you (for example: `http://localhost:5173` on your own computer, or a web address like `https://lyrica.example.com` if it's hosted online)

You should see the Lyrica home screen with a search bar at the top and a **Search History** panel on the side.

---

## How to Search for a Song

### Step 1: Type in the search bar

Click the search box that says **"Search for a Spanish song or artist…"** and start typing.

- You can type a **song title** (e.g. "Despacito")
- Or an **artist name** (e.g. "Shakira")
- Or both together

**Tip:** Wait a moment after typing—suggestions will appear automatically after you've typed at least two letters.

### Step 2: Pick a song from the list

A dropdown list will appear showing matching songs. Each item shows:

- **Album cover** (small picture on the left)
- **Song title** (in bold)
- **Artist name**
- **Album name** (if available)

Click the song you want, or use the **arrow keys** on your keyboard to highlight one and press **Enter**.

### Step 3: Wait while Lyrica works

You'll see a loading message: *"Finding lyrics and translating…"*

Lyrica is:
1. Looking up the lyrics online
2. Translating each line from Spanish to English

This usually takes a few seconds. Longer songs may take a little more time.

---

## Reading the Lyrics

Once loading finishes, you'll see:

### Song information at the top
- Album artwork (larger image)
- Song title
- Artist name
- Album name

### The lyrics below
Each section of the song is shown as a **pair of lines**:

- **Blue text** = the original **Spanish** lyric
- **Green text in parentheses** = the **English** translation

Example:

> **Sí, sabes que ya llevo un rato mirándote**
>
> *(Yes, you know I've been looking at you for a while)*

Scroll down to read the full song.

### Color legend
Above the lyrics you'll see a small legend:
- **Español** (blue) = Spanish
- **English** (green) = English translation

---

## Exporting to PDF

Want to print the lyrics or share them?

1. After a song is displayed, look for the **Export PDF** button in the top-right area of the lyrics section
2. Click it
3. A PDF file will download to your computer

The PDF is formatted for **A1 size**—a very large paper size (great for classroom posters or wall displays). You can still print it on smaller paper; your printer will scale it down.

The file will be named something like: `Despacito_Luis_Fonsi_lyrics.pdf`

---

## Using Search History

Every song you look up is saved in the **Search History** panel on the right side of the screen.

### Reopening a past song
Click any item in the history list. The lyrics appear instantly—no waiting—because Lyrica saved them from your previous search.

### Deleting one item
Click the **×** button next to a history entry to remove just that song.

### Clearing all history
Click the **Clear** button at the top of the history panel to remove everything.

### Hiding the history panel
Click **Hide History** in the top-right corner of the page. Click **Show History** to bring it back.

---

## If Something Goes Wrong

### "No songs found" when searching
- Check your spelling
- Try searching by artist name instead of song title (or vice versa)
- Make sure you have an internet connection

### Error message: "No lyrics found for this song"
Not every song has lyrics available online. Try:
- A different version of the same song (live vs. studio)
- Searching for a more popular recording of the song
- A different song by the same artist

### Error message: "Failed to fetch lyrics" or similar
- Check your internet connection
- Wait a moment and try again
- If you're running Lyrica locally, make sure the app is still running (see below)

### Translations look odd or wrong
Lyrica uses automatic translation (like Google Translate). It works well for general meaning but may not capture poetry, slang, or wordplay perfectly. For learning purposes, treat translations as a helpful guide, not a perfect literary translation.

### History disappeared
If Lyrica was reinstalled or moved to a new server without saving its data folder, history may be lost. History is stored on the computer or server where Lyrica runs—not in the cloud.

---

## Tips for Language Learners

1. **Listen while you read** — Play the song on Spotify, YouTube, or Apple Music while following along in Lyrica
2. **Read line by line** — Compare the Spanish and English one pair at a time
3. **Export for study** — Print a PDF and highlight words you want to learn
4. **Revisit songs** — Use history to return to songs you're practicing without searching again

---

## Tips for Teachers

1. **Export A1 PDFs** for classroom walls or projector-free display
2. **Search before class** so lyrics are ready in history when students arrive
3. **Discuss translation limits** — automated translation is a starting point for conversation about nuance and culture

---

## Running Lyrica on Your Computer

*This section is only needed if you're running Lyrica yourself—not if someone gave you a web link.*

### What you need installed
- **Node.js** (version 18 or newer) — download free from https://nodejs.org

### Starting the app

1. Open a terminal or command prompt
2. Navigate to the Lyrica folder
3. Run these commands (only needed the first time):

   ```
   npm install
   ```

4. Every time you want to use Lyrica:

   ```
   npm run dev
   ```

5. Open your browser and go to: **http://localhost:5173**

6. When you're done, go back to the terminal and press **Ctrl+C** to stop the app

### What do those commands mean?
- `npm install` — downloads the pieces Lyrica needs to run (one-time setup)
- `npm run dev` — starts Lyrica so you can use it in your browser

You don't need to understand programming to use these commands—just copy and paste them exactly.

---

## Privacy & Data

- Lyrica does **not** ask for your name, email, or password
- Your search history is saved **locally** on the computer or server running Lyrica
- When you search for a song, Lyrica sends the song title and artist to external websites to find lyrics and translations
- Lyrics are copyrighted; use Lyrica for personal learning and education, not for republishing lyrics commercially

---

## Quick Reference

| I want to… | Do this… |
|------------|----------|
| Find a song | Type in the search bar, pick from suggestions |
| Read lyrics | Select a song and scroll the lyrics area |
| Save for later | Automatic—check Search History |
| Open a past song | Click it in Search History |
| Print lyrics | Click **Export PDF** |
| Remove one saved song | Click **×** next to it in history |
| Remove all saved songs | Click **Clear** in history |
| Hide the history panel | Click **Hide History** |

---

## Getting Help

If you're using Lyrica at school or work, ask whoever installed it for help with connection issues or missing songs.

If you're running it yourself and something won't start, make sure:
1. Node.js is installed (`node --version` should show v18 or higher)
2. You ran `npm install` in the Lyrica folder
3. You ran `npm run dev` and see no error messages in the terminal
4. You're visiting **http://localhost:5173** (not just opening a file from your desktop)

---

*Thank you for using Lyrica — enjoy exploring Spanish music!*
