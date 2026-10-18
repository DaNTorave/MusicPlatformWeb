import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import PlaylistModal from '../components/PlaylistModal';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AgeBadge from '../components/AgeBadge';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import favoriteIcon from '../assets/favorite.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import editIcon from '../assets/edit-icon.svg';
import closeIcon from '../assets/close-icon.svg';
import searchIcon from '../assets/search-icon.svg';

import '../styles/ArtistPage.css';
import '../styles/Playlists.css';

export default function PlaylistsPage() {
  // Состояния плейлистов, избранного и модального окна
  const [playlists, setPlaylists] = useState([]);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    playlist: null,
  });

  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();

  // Загрузка плейлистов и избранных треков
  const fetchCollection = async () => {
    setLoading(true);
    try {
      const [playlistsRes, favRes] = await Promise.all([
        apiClient.getMyPlaylists(),
        apiClient.getFavorites(),
      ]);
      if (playlistsRes?.data) {
        setPlaylists(playlistsRes.data);
      }
      if (favRes?.data) {
        setFavoriteTracks(favRes.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки коллекции:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchCollection();

    const handleUpdate = () => fetchCollection();
    window.addEventListener('playlists:updated', handleUpdate);
    window.addEventListener('favorites:updated', handleUpdate);
    return () => {
      window.removeEventListener('playlists:updated', handleUpdate);
      window.removeEventListener('favorites:updated', handleUpdate);
    };
  }, []);

  // Запуск воспроизведения избранных треков
  const handlePlayFavorites = (e) => {
    e.stopPropagation();
    if (favoriteTracks.length === 0) {
      alert('В избранном пока нет треков');
      return;
    }
    playTrack(favoriteTracks[0], favoriteTracks);
  };

  // Запуск воспроизведения плейлиста
  const handlePlayPlaylist = (e, playlist) => {
    e.stopPropagation();
    const tracks = playlist.tracks || [];
    if (tracks.length === 0) {
      alert('В этом плейлисте пока нет треков');
      return;
    }
    playTrack(tracks[0], tracks);
  };

  // Удаление плейлиста
  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этот плейлист?')) return;
    try {
      await apiClient.deletePlaylist(playlistId);
      fetchCollection();
    } catch (err) {
      alert(err.message || 'Ошибка удаления плейлиста');
    }
  };

  const filteredPlaylists = playlists.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (p.title || '').toLowerCase().includes(q);
  });

  const favTrackIds = favoriteTracks.map((t) => String(t.id));
  const isFavoritesPlaying =
    currentTrack &&
    favTrackIds.includes(String(currentTrack.id)) &&
    isPlaying;

  return (
    <div className="artist-page">
      <PlaylistModal
        isOpen={modalState.isOpen}
        playlist={modalState.playlist}
        onClose={() => setModalState({ isOpen: false, playlist: null })}
        onSuccess={fetchCollection}
      />

      <div className="playlists-page-header">
        <div>
          <span className="artist-tag">Моя фонотека</span>
          <h1 className="artist-title">Плейлисты и избранное</h1>
          <p className="artist-meta-string" style={{ paddingLeft: 0 }}>
            Всего плейлистов: {playlists.length}
          </p>
        </div>

        <div className="playlists-header-actions">
          <Button
            type="button"
            variant="primary"
            fullWidth={false}
            onClick={() => setModalState({ isOpen: true, playlist: null })}
          >
            Создать плейлист
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
        </div>
      </div>

      <div className="content-search" style={{ marginBottom: '0.5rem' }}>
        <div className="search-bar-wrapper">
          <InputField
            type="text"
            placeholder="Поиск по названию плейлиста..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            clearable
            onClear={() => setSearchQuery('')}
            leftIcon={<img src={searchIcon} alt="Поиск" />}
          />
        </div>
      </div>

      <div className="artist-section">
        {loading ? (
          <p className="empty-text">Загрузка коллекции...</p>
        ) : (
          <div className="media-cards-grid">
            {/* Первая карточка: Избранное */}
            <div
              className="media-card favorites-special-card"
              onClick={() => navigate('/favorites')}
            >
              <div className="media-card-cover-wrapper favorites-cover-box">
                <img
                  src={favoriteIcon}
                  alt="Избранное"
                  className="favorites-card-heart-icon"
                />
                {favoriteTracks.length > 0 && (
                  <button
                    type="button"
                    className={`media-card-play-btn ${isFavoritesPlaying ? 'visible' : ''}`}
                    onClick={handlePlayFavorites}
                    title={isFavoritesPlaying ? 'Пауза' : 'Слушать избранное'}
                  >
                    <img
                      src={isFavoritesPlaying ? pauseIcon : playIcon}
                      alt="Play"
                      className="player-main-icon"
                    />
                  </button>
                )}
              </div>

              <div className="media-card-info">
                <span className="media-card-title">Избранное</span>
                <span className="media-card-subtitle">
                  {favoriteTracks.length} треков
                </span>
                <span className="playlist-privacy-badge private">
                  Личная коллекция
                </span>
              </div>
            </div>

            {/* Остальные карточки: Плейлисты пользователя */}
            {filteredPlaylists.map((playlist) => {
              const pTrackIds = (playlist.track_ids || []).map((id) =>
                String(id),
              );
              const isCurrentInPlaylist =
                currentTrack && pTrackIds.includes(String(currentTrack.id));
              const isPlaylistPlaying = isCurrentInPlaylist && isPlaying;

              return (
                <div
                  key={playlist.id}
                  className="media-card"
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                >
                  <div className="media-card-cover-wrapper">
                    <img
                      src={playlist.cover || defaultCover}
                      alt={playlist.title}
                      className="media-card-cover"
                    />
                    <button
                      type="button"
                      className={`media-card-play-btn ${isPlaylistPlaying ? 'visible' : ''}`}
                      onClick={(e) => handlePlayPlaylist(e, playlist)}
                      title={
                        isPlaylistPlaying ? 'Пауза' : 'Слушать плейлист'
                      }
                    >
                      <img
                        src={isPlaylistPlaying ? pauseIcon : playIcon}
                        alt="Play"
                        className="player-main-icon"
                      />
                    </button>
                  </div>

                  <div className="media-card-info">
                    <div className="playlist-card-title-row">
                      <span
                        className="media-card-title"
                        title={playlist.title}
                      >
                        {playlist.title}
                      </span>
                      {playlist.has_age_restriction && (
                        <AgeBadge size="small" />
                      )}
                    </div>
                    <span className="media-card-subtitle">
                      {playlist.tracks_count || 0} треков
                    </span>
                    <span
                      className={`playlist-privacy-badge ${playlist.is_public ? 'public' : 'private'}`}
                    >
                      {playlist.is_public
                        ? 'Публичный'
                        : 'Доступ по ссылке'}
                    </span>
                  </div>

                  <div
                    className="card-staff-controls"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="staff-btn edit"
                      onClick={() =>
                        setModalState({ isOpen: true, playlist })
                      }
                      title="Редактировать плейлист"
                    >
                      <img src={editIcon} alt="Изменить" width="14px" />
                    </button>
                    <button
                      type="button"
                      className="staff-btn delete"
                      onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                      title="Удалить плейлист"
                    >
                      <img src={closeIcon} alt="Удалить" width="14px" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}