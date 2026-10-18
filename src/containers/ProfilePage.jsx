import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import ChangePasswordModal from '../components/ChangePasswordModal';
import ChangeNicknameModal from '../components/ChangeNicknameModal';
import PlaylistModal from '../components/PlaylistModal';
import TrackRow from '../components/TrackRow';
import AgeBadge from '../components/AgeBadge';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';

import '../styles/ProfilePage.css';
import '../styles/ArtistPage.css';
import '../styles/Playlists.css';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния профиля пользователя и модальных окон
  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  // Состояния избранных композиций и публичных плейлистов профиля
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  // Управление глобальным аудиопотоком
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  // Загрузка публичных плейлистов пользователя для отображения в профиле
  const loadProfilePlaylists = async (targetUserId) => {
    if (!targetUserId) return;
    setPlaylistsLoading(true);
    try {
      const res = await apiClient.getUserPlaylists(targetUserId);
      if (res?.data) {
        setProfilePlaylists(res.data);
      }
    } catch (e) {
      console.warn('Ошибка загрузки плейлистов профиля:', e);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  // Загрузка данных учетной записи
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentUser = apiClient.getUser();
        let targetId;
        let isOwn = false;

        if (id) {
          targetId = parseInt(id);
          if (currentUser && targetId === currentUser.id) isOwn = true;
        } else {
          if (!currentUser) {
            navigate('/');
            return;
          }
          targetId = currentUser.id;
          isOwn = true;
        }

        setIsOwnProfile(isOwn);

        let response;
        if (isOwn) {
          response = await apiClient.request('/api/profile', {
            method: 'GET',
            requireAuth: true,
          });
        } else {
          const token = apiClient.getToken();
          response = await apiClient.request(`/api/profile/${targetId}`, {
            method: 'GET',
            requireAuth: false,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }

        if (response) {
          const userData = response.profile || response.user;
          if (userData) {
            setUser(userData);
            loadProfilePlaylists(userData.id);
          } else {
            setError('Пользователь не найден');
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        if (err.status === 401) {
          apiClient.clearSession();
          navigate('/');
          return;
        }
        if (err.status === 404) {
          setError('Пользователь не найден');
        } else {
          setError(err.message || 'Ошибка загрузки профиля');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  // Запрос 12 последних добавленных треков из избранного
  const loadFavorites = async () => {
    if (!isOwnProfile) return;
    setFavLoading(true);
    try {
      const res = await apiClient.getFavorites(12);
      if (res?.data) {
        setFavoriteTracks(res.data);
      }
    } catch (e) {
      console.warn('Ошибка загрузки избранного:', e);
    } finally {
      setFavLoading(false);
    }
  };

  useEffect(() => {
    if (isOwnProfile) {
      loadFavorites();
    }
  }, [isOwnProfile]);

  // Подписка на события обновления избранного и плейлистов
  useEffect(() => {
    const handleFavUpdate = () => {
      if (isOwnProfile) loadFavorites();
    };
    const handlePlaylistUpdate = () => {
      if (user?.id) loadProfilePlaylists(user.id);
    };

    window.addEventListener('favorites:updated', handleFavUpdate);
    window.addEventListener('playlists:updated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('favorites:updated', handleFavUpdate);
      window.removeEventListener('playlists:updated', handlePlaylistUpdate);
    };
  }, [isOwnProfile, user?.id]);

  // Отправка нового изображения аватара
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await apiClient.upload('/api/profile/avatar', formData);
      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
        apiClient.setUser(res.user);
      }
    } catch (err) {
      alert(err.message || 'Ошибка загрузки аватара');
    }
  };

  // Воспроизведение плейлиста с карточки в профиле
  const handlePlayPlaylist = (e, playlist) => {
    e.stopPropagation();
    const tracks = playlist.tracks || [];
    if (tracks.length === 0) {
      alert('В этом плейлисте пока нет треков');
      return;
    }
    playTrack(tracks[0], tracks);
  };

  if (loading) {
    return <div className="profile-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  if (!user) {
    return <div className="profile-not-found">Пользователь не найден</div>;
  }

  return (
    <div className="profile-page">
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ChangeNicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        currentNickname={user.nickname}
        onNicknameUpdated={(updatedUser) => {
          setUser((prev) => ({ ...prev, ...updatedUser }));
        }}
      />

      <PlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onSuccess={() => loadProfilePlaylists(user.id)}
      />

      <div className="profile-container">
        <div className="profile-info">
          <div className="profile-header">
            <div className="profile-avatar">
              <img
                src={
                  user.avatar && user.avatar.trim() !== ''
                    ? user.avatar
                    : defaultAvatar
                }
                alt={user.nickname || user.login}
              />
            </div>
            <div className="profile-info">
              <h1>{user.nickname || user.login}</h1>
              <p className="profile-login">@{user.login}</p>
              {isOwnProfile && user.email && (
                <p className="profile-email">{user.email}</p>
              )}
              <div className="profile-badge">
                <span className={`role-badge ${user.role || 'member'}`}>
                  {user.role || 'member'}
                </span>
                {user.is_premium && (
                  <span className="premium-badge">Premium</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-details">
            {!isOwnProfile && (
              <div className="detail-item">
                <span className="detail-label">Присоединился</span>
                <span className="detail-value">
                  {user.inserted_at
                    ? new Date(user.inserted_at).toLocaleDateString()
                    : 'Не указано'}
                </span>
              </div>
            )}
            {isOwnProfile && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    {user.email || 'Не указано'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Дата регистрации</span>
                  <span className="detail-value">
                    {user.inserted_at
                      ? new Date(user.inserted_at).toLocaleDateString()
                      : 'Не указано'}
                  </span>
                </div>
                <div className="profile-actions">
                  <label
                    className="profile-action-btn"
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                  >
                    Изменить аватар
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                    />
                  </label>
                  <button
                    type="button"
                    className="profile-action-btn"
                    onClick={() => setIsNicknameModalOpen(true)}
                  >
                    Изменить имя
                  </button>
                  <button
                    type="button"
                    className="profile-action-btn"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Изменить пароль
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Секция плейлистов профиля (отображаются только плейлисты с включенной приватностью) */}
          <div className="profile-favorites-section">
            <div className="profile-favorites-header">
              <div>
                <h2>Плейлисты</h2>
                <span className="profile-favorites-subtitle">
                  {isOwnProfile
                    ? 'Публичные плейлисты вашего профиля'
                    : 'Публичные плейлисты пользователя'}
                </span>
              </div>
              {isOwnProfile && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="profile-show-all-btn"
                    onClick={() => setIsCreatePlaylistOpen(true)}
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    className="profile-show-all-btn"
                    onClick={() => navigate('/playlists')}
                  >
                    Все плейлисты
                  </button>
                </div>
              )}
            </div>

            {playlistsLoading ? (
              <p className="empty-text">Загрузка плейлистов...</p>
            ) : profilePlaylists.length === 0 ? (
              <p className="empty-text">
                Нет плейлистов.
              </p>
            ) : (
              <div className="media-cards-grid">
                {profilePlaylists.map((playlist) => {
                  const pTrackIds = (playlist.track_ids || []).map((tid) =>
                    String(tid),
                  );
                  const isPlaylistPlaying =
                    currentTrack &&
                    pTrackIds.includes(String(currentTrack.id)) &&
                    isPlaying;

                  return (
                    <div
                      key={playlist.id}
                      className="media-card"
                      onClick={() => navigate(`/playlists/${playlist.id}`)}
                    >
                      <div className="media-card-cover-wrapper">
                        <img
                          src={playlist.cover || defaultAvatar}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Приватный блок избранного для владельца профиля */}
          {isOwnProfile && (
            <div className="profile-favorites-section">
              <div className="profile-favorites-header">
                <div>
                  <h2>Мое избранное</h2>
                  <span className="profile-favorites-subtitle">
                    Последние 12 добавленных композиций
                  </span>
                </div>
                {favoriteTracks.length > 0 && (
                  <button
                    type="button"
                    className="profile-show-all-btn"
                    onClick={() => navigate('/favorites')}
                  >
                    Показать все
                  </button>
                )}
              </div>

              {favLoading ? (
                <p className="empty-text">Загрузка избранного...</p>
              ) : favoriteTracks.length === 0 ? (
                <p className="empty-text">Список избранных треков пуст.</p>
              ) : (
                <div className="album-tracks-container scrollable-chart-list">
                  {favoriteTracks.map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      index={idx}
                      track={track}
                      isFavorite={true}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onPlay={() => playTrack(track, favoriteTracks)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}