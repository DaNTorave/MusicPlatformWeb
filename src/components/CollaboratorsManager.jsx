import React, { useState } from 'react';

import close_icon from '../assets/close-icon.svg'

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
    <div className="auth-form-group">
      <label>Авторы и соавторы трека/релиза:</label>

      {!disabled && (
        <div className="collab-search-container">
          <input
            type="text"
            className="input-element"
            placeholder="Введите имя артиста для добавления в соавторы..."
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
                <div className="collab-dropdown-item" style={{ color: '#888' }}>
                  Артист не найден
                </div>
              ) : (
                filteredSuggestions.map((artist) => (
                  <div
                    key={artist.id}
                    className="collab-dropdown-item"
                    onClick={() => handleAddCollaborator(artist.id)}
                  >
                    + {artist.name} ({artist.genre})
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="collab-order-list">
        {mainArtist && (
          <div className="collab-order-item main-author">
            <span className="collab-order-name">
              #1 {mainArtist.name} (Основной исполнитель)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Основной автор</span>
          </div>
        )}

        {collaboratorIds.map((cId, idx) => {
          const artist = availableArtists.find((a) => String(a.id) === String(cId));
          if (!artist) return null;

          return (
            <div key={artist.id} className="collab-order-item">
              <span className="collab-order-name">
                #{idx + 2} {artist.name}
              </span>

              {!disabled && (
                <div className="collab-order-controls">
                  <button
                    type="button"
                    className="collab-arrow-btn"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    title="Переместить выше"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="collab-arrow-btn"
                    disabled={idx === collaboratorIds.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    title="Переместить ниже"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="collab-remove-btn"
                    onClick={() => handleRemoveCollaborator(artist.id)}
                    title="Удалить соавтора"
                  >
                    <img src={close_icon} alt='удалить'/>
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