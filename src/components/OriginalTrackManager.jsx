import React, { useState } from 'react';
import closeIcon from '../assets/close-icon.svg';

export default function OriginalTrackManager({
  availableTracks = [],
  selectedTrackId,
  onChange,
  disabled = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedTrack = availableTracks.find(
    (t) => String(t.id) === String(selectedTrackId)
  );

  const filteredSuggestions = availableTracks.filter((track) => {
    if (String(track.id) === String(selectedTrackId)) return false;
    if (track.is_cover || track.original_track_id) return false;

    const query = searchQuery.toLowerCase().trim();
    const titleMatch = (track.title || '').toLowerCase().includes(query);
    const artistMatch = (track.artist?.name || '').toLowerCase().includes(query);
    return titleMatch || artistMatch;
  });

  const handleSelect = (trackId) => {
    onChange(trackId);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{
        fontSize: '0.78rem',
        color: '#64748b',
        lineHeight: '1.3',
        margin: '0 0 2px 0'
      }}>
        <em>Укажите оригинальный трек из каталога. Выбирать другие кавер-версии нельзя.</em>
      </p>

      {!selectedTrack && !disabled && (
        <div className="collab-search-container">
          <input
            type="text"
            className="input-element"
            style={{ padding: '9px 14px', fontSize: '0.9rem' }}
            placeholder="Поиск оригинального трека по названию или артисту..."
            value={searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
          />

          {isDropdownOpen && searchQuery.trim() && (
            <div className="collab-dropdown-menu">
              {filteredSuggestions.length === 0 ? (
                <div className="collab-dropdown-item" style={{ color: '#94a3b8' }}>
                  Оригинальные треки не найдены (каверы исключены)
                </div>
              ) : (
                filteredSuggestions.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="entity-dropdown-item"
                    onClick={() => handleSelect(t.id)}
                  >
                    <span style={{ fontWeight: 600 }}>{t.title}</span>
                    <span className="entity-genre-text">{t.artist?.name || 'Исполнитель'}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {selectedTrack && (
        <div className="entity-card-row is-cover">
          <div className="entity-card-left">
            <span className="entity-badge cover-badge">Оригинал</span>
            <span className="entity-name-text">{selectedTrack.title}</span>
            <span className="entity-genre-text">— {selectedTrack.artist?.name || 'Неизвестный'}</span>
          </div>

          {!disabled && (
            <div className="entity-card-actions">
              <button
                type="button"
                className="entity-icon-btn remove-btn"
                onClick={handleClear}
                title="Отвязать оригинал"
              >
                <img src={closeIcon} alt="Удалить" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}