import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

import { PlaylistFormContent } from './PlaylistModal';
import Button from './Button';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import closeIcon from '../assets/close-icon.svg';
import plusIcon from '../assets/plus-icon.svg';
import checkIcon from '../assets/check-circle.svg';

import '../styles/AuthModal.css';
import '../styles/Playlists.css';

export default function AddToPlaylistModal({ isOpen, onClose, track }) {
  // Состояния списка плейлистов, загрузки и текущего экрана внутри модального окна
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [errorMsg, setErrorMsg] = useState('');

  // Загрузка плейлистов пользователя
  const loadPlaylists = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.getMyPlaylists();
      if (res?.data) {
        setPlaylists(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Не удалось загрузить плейлисты');
    } finally {
      setLoading(false);
    }
  };

  // Сброс состояния при открытии модального окна
  useEffect(() => {
    if (isOpen && track) {
      loadPlaylists();
      setSearchQuery('');
      setActiveView('list');
    }
  }, [isOpen, track]);

  if (!isOpen || !track) return null;

  // Переключение наличия трека в выбранном плейлисте
  const handleToggleTrack = async (playlist) => {
    if (togglingId) return;
    setTogglingId(playlist.id);
    setErrorMsg('');

    try {
      const res = await apiClient.togglePlaylistTrack(playlist.id, track.id);
      if (res?.playlist) {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlist.id ? res.playlist : p)),
        );
      } else {
        await loadPlaylists();
      }
      window.dispatchEvent(new CustomEvent('playlists:updated'));
    } catch (err) {
      setErrorMsg(
        err.data?.error || err.message || 'Ошибка изменения плейлиста',
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Автоматическое добавление трека в созданный плейлист и возврат к списку
  const handleCreatedPlaylist = async (newPlaylist) => {
    if (newPlaylist && newPlaylist.id) {
      try {
        await apiClient.togglePlaylistTrack(newPlaylist.id, track.id);
        window.dispatchEvent(new CustomEvent('playlists:updated'));
      } catch (e) {
        console.warn('Ошибка добавления трека в новый плейлист:', e);
      }
    }
    await loadPlaylists();
    setActiveView('list');
  };

  const filteredPlaylists = playlists.filter((p) =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window" style={{ maxWidth: '480px' }}>
        {/* Шапка единого модального окна с переключением вкладок */}
        <div className="modal-window-top-buttons">
          <button
            type="button"
            className={`modal-window-top-button ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            Добавить в плейлист
          </button>
          <button
            type="button"
            className={`modal-window-top-button ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            Новый плейлист
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content">
          {/* Режим выбора плейлиста из списка */}
          {activeView === 'list' ? (
            <div className="add-to-playlist-container">
              <div className="add-to-playlist-track-preview">
                <img
                  src={track.cover || defaultCover}
                  alt={track.title}
                  className="add-to-playlist-track-img"
                />
                <div className="add-to-playlist-track-meta">
                  <span className="add-to-playlist-track-title">
                    {track.title}
                  </span>
                  <span className="add-to-playlist-track-artist">
                    {track.artist?.name || 'Исполнитель'}
                  </span>
                </div>
              </div>

              {errorMsg && <div className="auth-error-global">{errorMsg}</div>}

              <div className="add-to-playlist-top-bar">
                <input
                  type="text"
                  className="input-element add-to-playlist-search"
                  placeholder="Поиск плейлиста..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="add-to-playlist-new-btn"
                  onClick={() => setActiveView('create')}
                >
                  <img src={plusIcon} alt="Плюс" />
                  <span>Новый</span>
                </button>
              </div>

              <div className="add-to-playlist-list">
                {loading ? (
                  <p className="empty-text">Загрузка плейлистов...</p>
                ) : filteredPlaylists.length === 0 ? (
                  <div className="add-to-playlist-empty">
                    <p>Плейлисты не найдены</p>
                    <Button
                      type="button"
                      variant="primary"
                      fullWidth={false}
                      onClick={() => setActiveView('create')}
                    >
                      Создать первый плейлист
                    </Button>
                  </div>
                ) : (
                  filteredPlaylists.map((pl) => {
                    const trackIds = Array.isArray(pl.track_ids)
                      ? pl.track_ids.map((id) => Number(id))
                      : (pl.tracks || []).map((t) => Number(t.id));
                    const isAdded = trackIds.includes(Number(track.id));
                    const isBusy = togglingId === pl.id;

                    return (
                      <div
                        key={pl.id}
                        className={`add-to-playlist-item ${isAdded ? 'is-added' : ''}`}
                        onClick={() => handleToggleTrack(pl)}
                      >
                        <img
                          src={pl.cover || defaultCover}
                          alt={pl.title}
                          className="add-to-playlist-item-cover"
                        />
                        <div className="add-to-playlist-item-info">
                          <span className="add-to-playlist-item-title">
                            {pl.title}
                          </span>
                          <span className="add-to-playlist-item-sub">
                            {pl.tracks_count || 0} треков,{' '}
                            {pl.is_public ? 'В профиле' : 'По ссылке'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`add-to-playlist-status-btn ${isAdded ? 'added' : ''}`}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            '...'
                          ) : isAdded ? (
                            <>
                              <img src={checkIcon} alt="Добавлено" />
                              <span>Добавлено</span>
                            </>
                          ) : (
                            <>
                              <img src={plusIcon} alt="Добавить" />
                              <span>Добавить</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Режим создания нового плейлиста внутри этого же модального окна */
            <PlaylistFormContent
              onCancel={() => setActiveView('list')}
              onSuccess={handleCreatedPlaylist}
              cancelLabel="Назад к списку"
            />
          )}
        </div>
      </div>
    </div>
  );
}