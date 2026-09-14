import React, { useState } from 'react';
import closeIcon from '../assets/close-icon.svg';

export default function OriginalTrackManager({
  availableTracks = [],
  selectedTrackId,
  onChange,
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedTrack = availableTracks.find(
    (t) => String(t.id) === String(selectedTrackId),
  );

  const filteredSuggestions = availableTracks.filter((track) => {
    if (String(track.id) === String(selectedTrackId)) return false;
    if (track.is_cover || track.original_track_id) return false;

    const query = searchQuery.toLowerCase().trim();
    const titleMatch = (track.title || '').toLowerCase().includes(query);
    const artistMatch = (track.artist?.name || '')
      .toLowerCase()
      .includes(query);
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
    <div className="original-track-manager">
      <p className="original-track-hint">
        <em>
          Укажите оригинальный трек из каталога. Выбирать другие кавер-версии
          нельзя.
        </em>
      </p>

      {!selectedTrack && !disabled && (
        <div className="collab-search-container">
          <input
            type="text"
            className="input-element collab-search-input"
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
                <div className="collab-dropdown-item collab-dropdown-empty">
                  Оригинальные треки не найдены (каверы исключены)
                </div>
              ) : (
                filteredSuggestions.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="entity-dropdown-item"
                    onClick={() => handleSelect(t.id)}
                  >
                    <span className="entity-name-bold">{t.title}</span>
                    <span className="entity-genre-text">
                      {t.artist?.name || 'Исполнитель'}
                    </span>
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
            <span className="entity-genre-text">
              — {selectedTrack.artist?.name || 'Неизвестный'}
            </span>
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
