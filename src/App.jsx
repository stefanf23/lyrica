import { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import LyricsDisplay from './components/LyricsDisplay';
import HistoryPanel from './components/HistoryPanel';
import './App.css';

export default function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.items || []);
    } catch {
      /* history is optional */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const fetchLyrics = async (song) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist,
          album: song.album,
          artworkUrl: song.artworkUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch lyrics');

      setCurrentSong(data);
      await loadHistory();
    } catch (err) {
      setError(err.message);
      setCurrentSong(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');

      setCurrentSong({
        title: data.title,
        artist: data.artist,
        album: data.album,
        artworkUrl: data.artwork_url,
        pairs: data.pairs,
        historyId: data.id,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    if (currentSong?.historyId === id) setCurrentSong(null);
    await loadHistory();
  };

  const handleClearHistory = async () => {
    await fetch('/api/history', { method: 'DELETE' });
    setCurrentSong(null);
    await loadHistory();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">♪</span>
          <div>
            <h1>Lyrica</h1>
            <p className="tagline">Spanish lyrics with English translation</p>
          </div>
        </div>
        <button
          className="history-toggle"
          onClick={() => setHistoryOpen((o) => !o)}
          aria-label="Toggle history"
        >
          {historyOpen ? 'Hide History' : 'Show History'}
        </button>
      </header>

      <div className="app-body">
        <main className="main-content">
          <SearchBar onSelect={fetchLyrics} loading={loading} />

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Finding lyrics and translating…</p>
            </div>
          )}

          {!loading && currentSong && (
            <LyricsDisplay song={currentSong} />
          )}

          {!loading && !currentSong && !error && (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h2>Search for a Spanish song</h2>
              <p>
                Start typing a song title or artist — suggestions appear as you type.
                Select a song to fetch lyrics and see the English translation line by line.
              </p>
            </div>
          )}
        </main>

        {historyOpen && (
          <HistoryPanel
            items={history}
            activeId={currentSong?.historyId}
            onSelect={loadFromHistory}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
          />
        )}
      </div>
    </div>
  );
}
