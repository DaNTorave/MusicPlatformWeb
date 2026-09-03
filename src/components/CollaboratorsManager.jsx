import React, { useState } from 'react';
import close_icon from '../assets/close-icon.svg';

export default function CollaboratorsManager({
  mainArtist,
  availableArtists = [],
  collaboratorIds = [],
  onChange,
  disabled = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredSuggestions = availableArtists.filter((artist) => {
    const isMain = String(artist.id) === String(mainArtist?.id);
    const isAlreadySelected = collaboratorIds.includes(artist.id);
    const matchesQuery = artist.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return !isMain && !isAlreadySelected && matchesQuery;
  });

  const handleAddCollaborator = (artistId) => {
    onChange([...collaboratorIds, artistId]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveCollaborator = (artistId) => {
    onChange(collaboratorIds.filter((id) => id !== artistId));
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= collaboratorIds.length) return;
    const updated = [...collaboratorIds];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    onChange(updated);
  };

  return (
    <div className="meta-box-card">
      <div className="meta-box-header">
        <span className="meta-box-title">Авторы и соавторы</span>
      </div>

      {!disabled && (
        <div className="collab-search-container">
          <input
            type="text"
            className="input-element"
            style={{ padding: '9px 14px', fontSize: '0.9rem' }}
            placeholder="Поиск артиста для добавления в соавторы..."
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
                  Артист не найден
                </div>
              ) : (
                filteredSuggestions.map((artist) => (
                  <div
                    key={artist.id}
                    className="entity-dropdown-item"
                    onClick={() => handleAddCollaborator(artist.id)}
                  >
                    <span>+ {artist.name}</span>
                    {artist.genre && <span className="entity-genre-text">{artist.genre}</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {mainArtist && (
          <div className="entity-card-row is-main">
            <div className="entity-card-left">
              <span className="entity-order-index">#1</span>
              <span className="entity-name-text">{mainArtist.name}</span>
            </div>
            <span className="entity-badge main-badge">Основной</span>
          </div>
        )}

        {collaboratorIds.map((cId, idx) => {
          const artist = availableArtists.find((a) => String(a.id) === String(cId));
          if (!artist) return null;

          return (
            <div key={artist.id} className="entity-card-row">
              <div className="entity-card-left">
                <span className="entity-order-index">#{idx + 2}</span>
                <span className="entity-name-text">{artist.name}</span>
                {artist.genre && <span className="entity-genre-text">({artist.genre})</span>}
              </div>

              {!disabled && (
                <div className="entity-card-actions">
                  <button
                    type="button"
                    className="entity-icon-btn"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    title="Выше"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="entity-icon-btn"
                    disabled={idx === collaboratorIds.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    title="Ниже"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="entity-icon-btn remove-btn"
                    onClick={() => handleRemoveCollaborator(artist.id)}
                    title="Удалить"
                  >
                    <img src={close_icon} alt="Удалить" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}