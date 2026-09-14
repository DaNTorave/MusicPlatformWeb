import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Routes, Route } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import UploadMusicModal from '../components/UploadMusicModal';
import EditEntityModal from '../components/EditEntityModal';
import Button from '../components/Button';
import TrackRow from '../components/TrackRow';
import InputField from '../components/InputField';
import AgeBadge from '../components/AgeBadge';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import edit_icon from '../assets/edit-icon.svg';
import close_icon from '../assets/close-icon.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';

import '../styles/ArtistPage.css';

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null,
    type: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();
  const isStaff =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'moderator');

  const fetchArtist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request(`/api/artists/${id}`);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка загрузки артиста');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const handleDeleteArtist = async () => {
    if (!window.confirm('Удалить исполнителя и все его релизы?')) return;
    try {
      await apiClient.request(`/api/artists/${id}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      navigate('/');
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const handleDeleteAlbum = async (e, albumId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этот альбом и все треки в нем?')) return;
    try {
      await apiClient.request(`/api/albums/${albumId}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      fetchArtist();
    } catch (e) {
      alert(e.message || 'Ошибка удаления альбома');
    }
  };

  const handleDeleteTrack = async (e, trackId) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Удалить этот трек?')) return;
    try {
      await apiClient.request(`/api/tracks/${trackId}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      fetchArtist();
    } catch (e) {
      alert(e.message || 'Ошибка удаления трека');
    }
  };

  const popularTracks = useMemo(() => {
    if (!data) return [];

    const fromAlbums = (data.albums || []).flatMap((a) =>
      (a.tracks || []).map((t) => ({
        ...t,
        albumTitle: a.title,
        cover: t.cover || a.cover || data.artist.avatar,
        artist: t.artist || {
          id: data.artist.id,
          name: data.artist.name,
        },
      })),
    );

    const singles = (data.singles || []).map((s) => ({
      ...s,
      cover: s.cover || data.artist.avatar,
      artist: s.artist || { id: data.artist.id, name: data.artist.name },
    }));

    const collabs = (data.collab_tracks || []).map((c) => ({
      ...c,
      albumTitle: c.album?.title,
      cover: c.cover || c.album?.cover || data.artist.avatar,
      artist: c.artist,
    }));

    const allTracksMap = new Map();
    [...singles, ...fromAlbums, ...collabs].forEach((t) => {
      if (!allTracksMap.has(t.id)) {
        allTracksMap.set(t.id, t);
      }
    });

    return Array.from(allTracksMap.values()).sort(
      (a, b) => (b.plays_count || 0) - (a.plays_count || 0),
    );
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const searchResults = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return { tracks: [], albums: [] };

    const matchedTracks = popularTracks.filter(
      (t) => t.title && t.title.toLowerCase().includes(query),
    );

    const matchedAlbums = (data?.albums || []).filter(
      (a) => a.title && a.title.toLowerCase().includes(query),
    );

    return { tracks: matchedTracks, albums: matchedAlbums };
  }, [debouncedQuery, popularTracks, data]);

  const handlePlayAlbum = (e, album) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!album.tracks || album.tracks.length === 0) {
      alert('В этом альбоме нет доступных треков');
      return;
    }

    const albumQueue = album.tracks.map((t) => ({
      ...t,
      cover: album.cover || data.artist.avatar,
      artist: { id: data.artist.id, name: data.artist.name },
    }));

    playTrack(albumQueue[0], albumQueue);
  };

  if (loading) {
    return <div className="artist-page-state">Загрузка артиста...</div>;
  }

  if (error) {
    return <div className="artist-page-state error">{error}</div>;
  }

  if (!data || !data.artist) {
    return <div className="artist-page-state">Артист не найден</div>;
  }

  const { artist, albums = [], singles = [] } = data;

  return (
    <div className="artist-page">
      <UploadMusicModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artistId={artist.id}
        artistName={artist.name}
        onSuccess={fetchArtist}
      />

      <EditEntityModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null, type: null })}
        item={editModal.item}
        type={editModal.type}
        onSuccess={fetchArtist}
      />

      <div className="artist-header">
        <img
          src={artist.avatar || defaultCover}
          alt={artist.name}
          className="artist-avatar"
        />
        <div className="artist-info">
          <span className="artist-tag">Исполнитель</span>
          <h1 className="artist-title">{artist.name}</h1>
          <div className="artist-meta">
            <p className="artist-meta-string">Жанр: {artist.genre}</p>
            <p className="artist-meta-string">
              Прослушиваний: {artist.plays_count || 0}
            </p>
            <p className="artist-meta-string">
              Лайков: {artist.likes_count || 0}
            </p>
          </div>

          <div className="artist-actions">
            {currentUser && (
              <Button
                variant="primary"
                fullWidth={false}
                onClick={() => setIsUploadModalOpen(true)}
              >
                + Добавить музыку
              </Button>
            )}
            {isStaff && (
              <>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  onClick={() =>
                    setEditModal({ isOpen: true, item: artist, type: 'artist' })
                  }
                >
                  Редактировать
                </Button>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  onClick={handleDeleteArtist}
                >
                  Удалить артиста
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="content-search" ref={searchContainerRef}>
        <div className="search-bar-wrapper artist-bar-wrapper">
          <InputField
            type="text"
            placeholder="Поиск по трекам и альбомам..."
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
            leftIcon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            }
          />

          {isSearchFocused && debouncedQuery.trim() && (
            <div
              className="search-dropdown-menu"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {searchResults.tracks.length === 0 &&
              searchResults.albums.length === 0 ? (
                <div className="search-dropdown-empty">
                  Ничего не найдено по запросу «
                  <strong>{debouncedQuery}</strong>»
                </div>
              ) : (
                <>
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
                                  src={track.cover || defaultCover}
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
                                  {track.is_cover && (
                                    <span className="search-track-cover-tag">
                                      кавер
                                    </span>
                                  )}
                                </div>
                                <span className="search-track-artist">
                                  {track.albumTitle
                                    ? `Альбом: ${track.albumTitle}`
                                    : 'Сингл'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {searchResults.albums.length > 0 && (
                    <div className="search-category-group">
                      <div className="search-category-header">
                        <span>Альбомы</span>
                        <span className="search-category-count">
                          {searchResults.albums.length}
                        </span>
                      </div>
                      <div className="search-category-items">
                        {searchResults.albums.map((album) => (
                          <div
                            key={`album-${album.id}`}
                            className="search-item-artist"
                            onClick={() => {
                              setIsSearchFocused(false);
                              navigate(`/albums/${album.id}`);
                            }}
                          >
                            <img
                              src={album.cover || artist.avatar || defaultCover}
                              alt={album.title}
                              className="search-artist-avatar search-album-avatar"
                            />
                            <div className="search-artist-info">
                              <span className="search-artist-name">
                                {album.title}
                              </span>
                              <span className="search-artist-genre">
                                {album.release_year || 'Альбом'}
                              </span>
                            </div>
                            <span className="search-badge">Альбом</span>
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

      <Routes>
        <Route
          path="tracks"
          element={
            <div className="artist-section">
              <div className="all-tracks-action">
                <h2>Все треки исполнителя</h2>
                <button onClick={() => navigate(-1)}>&lt; Назад</button>
              </div>
              {popularTracks.length === 0 ? (
                <p className="empty-text">Нет доступных треков</p>
              ) : (
                <div className="album-tracks-container">
                  {popularTracks.map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      index={idx}
                      track={track}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onPlay={() => playTrack(track, popularTracks)}
                      canEdit={isStaff}
                      onEdit={(t) =>
                        setEditModal({ isOpen: true, item: t, type: 'track' })
                      }
                      canDelete={isStaff}
                      onDelete={(e, id) => handleDeleteTrack(e, id)}
                    />
                  ))}
                </div>
              )}
            </div>
          }
        />
        <Route
          path=""
          element={
            <>
              <div className="artist-section">
                <div className="all-tracks-action">
                  <h2>Популярные треки</h2>
                  <button
                    onClick={() => navigate(`/artists/${artist.id}/tracks`)}
                  >
                    Все треки
                  </button>
                </div>
                {popularTracks.length === 0 ? (
                  <p className="empty-text">Нет доступных треков</p>
                ) : (
                  <div className="album-tracks-container scrollable-chart-list">
                    {popularTracks.slice(0, 12).map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        index={idx}
                        track={track}
                        isPlaying={currentTrack?.id === track.id && isPlaying}
                        onPlay={() => playTrack(track, popularTracks)}
                        canEdit={isStaff}
                        onEdit={(t) =>
                          setEditModal({ isOpen: true, item: t, type: 'track' })
                        }
                        canDelete={isStaff}
                        onDelete={(e, id) => handleDeleteTrack(e, id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="artist-section">
                <h2>Синглы</h2>
                {singles.length === 0 ? (
                  <p className="empty-text">Нет доступных синглов</p>
                ) : (
                  <div className="media-cards-grid">
                    {singles.map((track) => {
                      const isCurrentPlaying =
                        currentTrack?.id === track.id && isPlaying;
                      return (
                        <div key={track.id} className="media-card single-card">
                          <div className="media-card-cover-wrapper">
                            <img
                              src={track.cover || artist.avatar || defaultCover}
                              alt={track.title}
                              className="media-card-cover"
                            />
                            <button
                              type="button"
                              className={`media-card-play-btn ${isCurrentPlaying ? 'visible' : ''}`}
                              onClick={() =>
                                playTrack({
                                  ...track,
                                  artist: { name: artist.name },
                                  cover: track.cover || artist.avatar,
                                })
                              }
                              title={isCurrentPlaying ? 'Пауза' : 'Слушать'}
                            >
                              <img
                                src={isCurrentPlaying ? pauseIcon : playIcon}
                                alt="Play/Pause"
                                className="player-main-icon"
                              />
                            </button>
                          </div>

                          <div className="media-card-info">
                            <span
                              className="media-card-title"
                              title={track.title}
                            >
                              {track.title}
                            </span>
                            {track.age_restriction && <AgeBadge size="small" />}
                            <span className="media-card-subtitle">Сингл</span>
                            <span className="media-card-subtitle">
                              {track.release_year}
                            </span>
                          </div>

                          {isStaff && (
                            <div
                              className="card-staff-controls"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="staff-btn edit"
                                onClick={() =>
                                  setEditModal({
                                    isOpen: true,
                                    item: track,
                                    type: 'track',
                                  })
                                }
                                title="Редактировать сингл"
                              >
                                <img
                                  src={edit_icon}
                                  alt="изменить"
                                  width="14px"
                                />
                              </button>
                              <button
                                type="button"
                                className="staff-btn delete"
                                onClick={(e) => handleDeleteTrack(e, track.id)}
                                title="Удалить сингл"
                              >
                                <img
                                  src={close_icon}
                                  alt="удалить"
                                  width="14px"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="artist-section">
                <h2>Альбомы</h2>
                {albums.length === 0 ? (
                  <p className="empty-text">Нет доступных альбомов</p>
                ) : (
                  <div className="media-cards-grid">
                    {albums.map((album) => {
                      const albumTrackIds = (album.tracks || []).map((t) =>
                        String(t.id),
                      );
                      const isCurrentTrackInAlbum =
                        currentTrack &&
                        albumTrackIds.includes(String(currentTrack.id));
                      const isAlbumPlaying = isCurrentTrackInAlbum && isPlaying;

                      return (
                        <div
                          key={album.id}
                          className="media-card album-card-grid"
                          onClick={() => navigate(`/albums/${album.id}`)}
                        >
                          <div className="media-card-cover-wrapper">
                            <img
                              src={album.cover || defaultCover}
                              alt={album.title}
                              className="media-card-cover"
                            />
                            <button
                              type="button"
                              className={`media-card-play-btn ${isAlbumPlaying ? 'visible' : ''}`}
                              onClick={(e) => handlePlayAlbum(e, album)}
                              title={
                                isAlbumPlaying ? 'Пауза' : 'Слушать альбом'
                              }
                            >
                              <img
                                src={isAlbumPlaying ? pauseIcon : playIcon}
                                alt="Play/Pause"
                                className="player-main-icon"
                              />
                            </button>
                          </div>

                          <div className="media-card-info">
                            <span
                              className="media-card-title"
                              title={album.title}
                            >
                              {album.title}
                            </span>
                            {album.has_age_restriction && (
                              <AgeBadge size="small" />
                            )}
                            <span className="media-card-subtitle">
                              {album.tracks?.length
                                ? `${album.tracks.length} трек(ов)`
                                : 'Альбом'}
                            </span>
                            <span className="media-card-subtitle">
                              {album.release_year}
                            </span>
                          </div>

                          {isStaff && (
                            <div
                              className="card-staff-controls"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="staff-btn edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditModal({
                                    isOpen: true,
                                    item: album,
                                    type: 'album',
                                  });
                                }}
                                title="Редактировать альбом"
                              >
                                <img
                                  src={edit_icon}
                                  alt="изменить"
                                  width="14px"
                                />
                              </button>
                              <button
                                type="button"
                                className="staff-btn delete"
                                onClick={(e) => handleDeleteAlbum(e, album.id)}
                                title="Удалить альбом"
                              >
                                <img
                                  src={close_icon}
                                  alt="удалить"
                                  width="14px"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {data.collab_tracks && data.collab_tracks.length > 0 && (
                <div className="artist-section">
                  <h2>Участие в релизах</h2>
                  <div className="media-cards-grid">
                    {data.collab_tracks.map((track) => {
                      const isCurrentPlaying =
                        currentTrack?.id === track.id && isPlaying;
                      const preparedTrack = {
                        ...track,
                        cover:
                          track.cover || track.album?.cover || defaultCover,
                        artist: track.artist || {
                          id: artist.id,
                          name: artist.name,
                        },
                      };

                      return (
                        <div key={track.id} className="media-card single-card">
                          <div className="media-card-cover-wrapper">
                            <img
                              src={preparedTrack.cover}
                              alt={track.title}
                              className="media-card-cover"
                            />
                            <button
                              type="button"
                              className={`media-card-play-btn ${isCurrentPlaying ? 'visible' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(
                                  preparedTrack,
                                  data.collab_tracks.map((t) => ({
                                    ...t,
                                    cover:
                                      t.cover || t.album?.cover || defaultCover,
                                    artist: t.artist || {
                                      id: artist.id,
                                      name: artist.name,
                                    },
                                  })),
                                );
                              }}
                              title={isCurrentPlaying ? 'Пауза' : 'Слушать'}
                            >
                              <img
                                src={isCurrentPlaying ? pauseIcon : playIcon}
                                alt="Play/Pause"
                                className="player-main-icon"
                              />
                            </button>
                          </div>

                          <div className="media-card-info">
                            <span
                              className="media-card-title"
                              title={track.title}
                            >
                              {track.title}
                            </span>
                            <span className="media-card-subtitle">
                              {track.album?.title ? (
                                <>
                                  Альбом: <em>{track.album.title}</em>
                                </>
                              ) : (
                                'Совместный трек'
                              )}
                            </span>
                            {track.artist && (
                              <span
                                className="collab-card-main-artist"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/artists/${track.artist.id}`);
                                }}
                                title={`Основной автор: ${track.artist.name}`}
                              >
                                {track.artist.name}
                              </span>
                            )}
                          </div>

                          {isStaff && (
                            <div
                              className="card-staff-controls"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="staff-btn edit"
                                onClick={() =>
                                  setEditModal({
                                    isOpen: true,
                                    item: track,
                                    type: 'track',
                                  })
                                }
                                title="Редактировать трек"
                              >
                                <img
                                  src={edit_icon}
                                  alt="изменить"
                                  width="14px"
                                />
                              </button>
                              <button
                                type="button"
                                className="staff-btn delete"
                                onClick={(e) => handleDeleteTrack(e, track.id)}
                                title="Удалить трек"
                              >
                                <img
                                  src={close_icon}
                                  alt="удалить"
                                  width="14px"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          }
        />
      </Routes>
    </div>
  );
}
