import './HistoryPanel.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPanel({ items, activeId, onSelect, onDelete, onClear }) {
  return (
    <aside className="history-panel">
      <div className="history-header">
        <h3>Search History</h3>
        {items.length > 0 && (
          <button className="clear-btn" onClick={onClear} title="Clear all history">
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="history-empty">No searches yet. Find a song to get started.</p>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`history-item ${item.id === activeId ? 'active' : ''}`}
            >
              <button
                className="history-item-btn"
                onClick={() => onSelect(item.id)}
              >
                {item.artwork_url && (
                  <img src={item.artwork_url} alt="" className="history-art" />
                )}
                <div className="history-text">
                  <span className="history-title">{item.title}</span>
                  <span className="history-artist">{item.artist}</span>
                  <span className="history-date">{formatDate(item.searched_at)}</span>
                </div>
              </button>
              <button
                className="history-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                aria-label="Delete"
                title="Remove from history"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
