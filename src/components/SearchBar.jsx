import { useState, useEffect, useRef, useCallback } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSelect, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (song) => {
    setQuery(`${song.title} — ${song.artist}`);
    setOpen(false);
    setSuggestions([]);
    onSelect(song);
  };

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-input-wrap">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search for a Spanish song or artist…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
          aria-label="Search songs"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
        {(searching || loading) && <div className="search-spinner" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.map((song, idx) => (
            <li
              key={`${song.title}-${song.artist}-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              className={`suggestion-item ${idx === activeIndex ? 'active' : ''}`}
              onMouseDown={() => handleSelect(song)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {song.artworkUrl && (
                <img src={song.artworkUrl} alt="" className="suggestion-art" />
              )}
              <div className="suggestion-text">
                <span className="suggestion-title">{song.title}</span>
                <span className="suggestion-artist">{song.artist}</span>
                {song.album && <span className="suggestion-album">{song.album}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && !searching && suggestions.length === 0 && (
        <div className="suggestions suggestions-empty">No songs found</div>
      )}
    </div>
  );
}
