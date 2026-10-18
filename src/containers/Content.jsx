import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import CreateArtistModal from '../components/CreateArtistModal';
import EditEntityModal from '../components/EditEntityModal';
import TrackRow from '../components/TrackRow';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AgeBadge from '../components/AgeBadge';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import edit_icon from '../assets/edit-icon.svg';
import close_icon from '../assets/close-icon.svg';
import playIcon from '../assets/play-icon.svg';
import searchIcon from '../assets/search-icon.svg';

import '../styles/Content.css';

export default function Content() {
  // Состояния для модальных окон и данных
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artists, setArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState(null);
  const [chartLimit, setChartLimit] = useState(10);

  // Состояния поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();
  const isStaff =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'moderator');

  // Загрузка артистов и треков чарта
  const fetchData = async () => {
    setLoading(true);
    try {
      const [artistsRes, tracksRes] = await Promise.all([
        apiClient.request('/api/artists'),
        apiClient.request('/api/charts/tracks'),
      ]);
      if (artistsRes?.data) setArtists(artistsRes.data);
      if (tracksRes?.data) setTopTracks(tracksRes.data);
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Закрытие выпадающего списка при клике вне области поиска
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Задержка поискового запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Результаты поиска по артистам и трекам
  const searchResults = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return { artists: [], tracks: [] };

    const matchedArtists = artists.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(query)) ||
        (a.genre && a.genre.toLowerCase().includes(query)),
    );

    const matchedTracks = topTracks.filter((t) => {
      const titleMatch = t.title && t.title.toLowerCase().includes(query);
      const artistMatch =
        t.artist &&
        t.artist.name &&
        t.artist.name.toLowerCase().includes(query);
      const collabsMatch =
        Array.isArray(t.collaborators) &&
        t.collaborators.some(
          (c) => c.name && c.name.toLowerCase().includes(query),
        );

      return Boolean(titleMatch || artistMatch || collabsMatch);
    });

    return { artists: matchedArtists, tracks: matchedTracks };
  }, [debouncedQuery, artists, topTracks]);

  // Удаление артиста
  const handleDeleteArtist = async (e, artistId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этого исполнителя?')) return;
    try {
      await apiClient.request(`/api/artists/${artistId}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      fetchData();
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const displayedTracks = topTracks.slice(0, chartLimit);
  const isDropdownOpen = isSearchFocused && debouncedQuery.trim().length > 0;
  const hasResults =
    searchResults.artists.length > 0 || searchResults.tracks.length > 0;

  return (
    <>
      <CreateArtistModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        onSuccess={() => fetchData()}
      />
      <EditEntityModal
        isOpen={Boolean(editingArtist)}
        onClose={() => setEditingArtist(null)}
        item={editingArtist}
        type="artist"
        onSuccess={fetchData}
      />

      <div className="content-page">
        {/* Панель поиска */}
        <div className="content-search" ref={searchContainerRef}>
          <div className="search-bar-wrapper">
            <InputField
              type="text"
              placeholder="Поиск по трекам, авторам или жанрам..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              clearable
              onClear={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              leftIcon={<img src={searchIcon} alt="Поиск" />}
            />

            {/* Выпадающий список результатов поиска */}
            {isDropdownOpen && (
              <div
                className="search-dropdown-menu"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {!hasResults ? (
                  <div className="search-dropdown-empty">
                    Ничего не найдено по запросу: <strong>{debouncedQuery}</strong>
                  </div>
                ) : (
                  <>
                    {/* Результаты по трекам */}
                    {searchResults.tracks.length > 0 && (
                      <div className="search-category-group">
                        <div className="search-category-header">
                          <span>Треки</span>
                          <span className="search-category-count">
                            {searchResults.tracks.length}
                          </span>
                        </div>
                        <div className="search-category-items">
                          {searchResults.tracks.map((track) => {
                            const isCurrentPlaying =
                              currentTrack &&
                              String(currentTrack.id) === String(track.id) &&
                              isPlaying;

                            return (
                              <div
                                key={`track-${track.id}`}
                                className={`search-item-track ${isCurrentPlaying ? 'is-playing' : ''}`}
                                onClick={() => {
                                  playTrack(track, searchResults.tracks);
                                  setIsSearchFocused(false);
                                }}
                              >
                                <div className="search-track-cover-wrapper">
                                  <img
                                    src={track.cover || defaultAvatar}
                                    alt={track.title}
                                    className="search-track-cover"
                                  />
                                  <div className="search-track-play-overlay">
                                    <img src={playIcon} alt="play" />
                                  </div>
                                </div>
                                <div className="search-track-info">
                                  <div className="search-track-title-row">
                                    <span className="search-track-title">
                                      {track.title}
                                    </span>
                                    {track.age_restriction && (
                                      <AgeBadge size="small" />
                                    )}
                                    {track.is_cover && (
                                      <span className="search-track-cover-tag">
                                        кавер
                                      </span>
                                    )}
                                  </div>
                                  <span className="search-track-artist">
                                    {track.artist?.name ||
                                      'Неизвестный исполнитель'}
                                    {Array.isArray(track.collaborators) &&
                                      track.collaborators.length > 0 && (
                                        <>
                                          {' '}
                                          feat.{' '}
                                          {track.collaborators
                                            .map((c) => c.name)
                                            .join(', ')}
                                        </>
                                      )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Результаты по исполнителям */}
                    {searchResults.artists.length > 0 && (
                      <div className="search-category-group">
                        <div className="search-category-header">
                          <span>Исполнители</span>
                          <span className="search-category-count">
                            {searchResults.artists.length}
                          </span>
                        </div>
                        <div className="search-category-items">
                          {searchResults.artists.map((artist) => (
                            <div
                              key={`artist-${artist.id}`}
                              className="search-item-artist"
                              onClick={() => {
                                setIsSearchFocused(false);
                                navigate(`/artists/${artist.id}`);
                              }}
                            >
                              <img
                                src={artist.avatar || defaultAvatar}
                                alt={artist.name}
                                className="search-artist-avatar"
                              />
                              <div className="search-artist-info">
                                <span className="search-artist-name">
                                  {artist.name}
                                </span>
                                <span className="search-artist-genre">
                                  {artist.genre}
                                </span>
                              </div>
                              <span className="search-badge">Исполнитель</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="content-container">
          {/* Панель действий */}
          <div className="content-actions-panel">
            {currentUser && (
              <>
                <Button
                  variant="primary"
                  onClick={() => setIsArtistModalOpen(true)}
                >
                  Добавить исполнителя
                </Button>
                <Button variant="secondary">Алгоритмы</Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/favorites')}
                >
                  Избранное
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/playlists')}
                >
                  Плейлисты
                </Button>
                <div className="content-actions-panel-block" />
              </>
            )}
          </div>

          <div className="artists-catalog-section">
            {/* Секция чарта треков */}
            <div>
              <div className="chart-header-row">
                <h2 className="section-heading section-heading-flush">
                  Топ чарт треков
                </h2>
                <div className="chart-filter-buttons">
                  {[10, 50, 100].map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      className={`chart-filter-btn ${chartLimit === limit ? 'active' : ''}`}
                      onClick={() => setChartLimit(limit)}
                    >
                      Топ-{limit}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="status-message">Загрузка чарта...</p>
              ) : topTracks.length === 0 ? (
                <p className="empty-catalog-text">Пока нет треков в чарте.</p>
              ) : (
                <div className="album-tracks-container scrollable-chart-list">
                  {displayedTracks.map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      index={idx}
                      track={track}
                      isPlaying={
                        currentTrack &&
                        String(currentTrack.id) === String(track.id) &&
                        isPlaying
                      }
                      onPlay={() => playTrack(track, displayedTracks)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Секция популярных исполнителей */}
            <div>
              <h2 className="section-heading section-heading-spaced">
                Популярные исполнители
              </h2>
              {loading ? (
                <p className="status-message">Загрузка каталога...</p>
              ) : artists.length === 0 ? (
                <p className="empty-catalog-text">
                  Список исполнителей пуст или находится на модерации.
                </p>
              ) : (
                <div className="artists-grid">
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="artist-card"
                      onClick={() => navigate(`/artists/${artist.id}`)}
                    >
                      {isStaff && (
                        <div
                          className="card-staff-controls"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="staff-btn edit"
                            onClick={() => setEditingArtist(artist)}
                            title="Редактировать артиста"
                          >
                            <img src={edit_icon} alt="изменить" width="14px" />
                          </button>
                          <button
                            type="button"
                            className="staff-btn delete"
                            onClick={(e) => handleDeleteArtist(e, artist.id)}
                            title="Удалить артиста"
                          >
                            <img src={close_icon} alt="удалить" width="14px" />
                          </button>
                        </div>
                      )}
                      <img
                        src={artist.avatar || defaultAvatar}
                        alt={artist.name}
                        className="artist-card-avatar"
                      />
                      <div className="artist-card-info">
                        <h3 className="artist-card-name">{artist.name}</h3>
                        <span className="artist-card-genre">
                          {artist.genre}
                        </span>
                        <span className="artist-card-plays">
                          {artist.plays_count || 0} прослушиваний
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}