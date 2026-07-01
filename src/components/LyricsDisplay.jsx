import { exportLyricsPdf } from '../utils/pdfExport';
import './LyricsDisplay.css';

export default function LyricsDisplay({ song }) {
  const { title, artist, album, artworkUrl, pairs } = song;

  const handleExport = () => {
    exportLyricsPdf({ title, artist, album, pairs });
  };

  return (
    <div className="lyrics-display">
      <div className="song-header">
        {artworkUrl && (
          <img src={artworkUrl} alt={`${title} cover`} className="song-artwork" />
        )}
        <div className="song-meta">
          <h2 className="song-title">{title}</h2>
          <p className="song-artist">{artist}</p>
          {album && <p className="song-album">{album}</p>}
        </div>
        <button className="export-btn" onClick={handleExport} title="Export to PDF (A1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          Export PDF
        </button>
      </div>

      <div className="lyrics-legend">
        <span className="legend-item legend-spanish">Español</span>
        <span className="legend-item legend-english">English</span>
      </div>

      <div className="lyrics-body" id="lyrics-content">
        {pairs.map((pair, idx) => (
          <div key={idx} className="lyric-block">
            <p className="lyric-spanish">{pair.spanish}</p>
            <p className="lyric-english">({pair.english})</p>
          </div>
        ))}
      </div>
    </div>
  );
}
