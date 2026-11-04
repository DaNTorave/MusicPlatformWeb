import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import ChangeNicknameModal from '../components/ChangeNicknameModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import PlaylistModal from '../components/PlaylistModal';
import PreferencesStepModal from '../components/PreferencesStepModal';
import ImageCropModal from '../components/ImageCropModal';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import userIcon from '../assets/user-svgrepo-com.svg';

import '../styles/ProfilePage.css';
import '../styles/Playlists.css';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  // Управление модальными окнами
  const [activeModal, setActiveModal] = useState(null);

  // Кадрирование круглого аватара пользователя
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const fileInputRef = useRef(null);

  // Определение принадлежности профиля текущему авторизованному аккаунту
  const isOwnProfile = !id || (currentUser && String(currentUser.id) === String(id));

  // Форматирование даты регистрации
  const formatRegistrationDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Загрузка данных профиля и плейлистов
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const authUser = apiClient.getUser();
      setCurrentUser(authUser);

      const targetId = id || (authUser ? authUser.id : null);
      if (!targetId) {
        navigate('/');
        return;
      }

      // Если открыт собственный профиль, берем данные через /api/profile с токеном
      const profileEndpoint = !id || (authUser && String(authUser.id) === String(id))
        ? '/api/profile'
        : `/api/profile/${targetId}`;

      const res = await apiClient.request(profileEndpoint, {
        method: 'GET',
        requireAuth: true,
      });

      const profileData = res?.user || res?.profile;
      if (profileData) {
        setProfile(profileData);
      }

      const playlistsRes = await apiClient.getUserPlaylists(targetId);
      if (playlistsRes?.data) {
        setPlaylists(playlistsRes.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  // Обработка выбора файла аватара с открытием кадрирования
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawImageSrc(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
    e.target.value = '';
  };

  // Отправка вырезанного аватара на сервер
  const handleCropComplete = async (croppedFile) => {
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', croppedFile);

    try {
      const response = await apiClient.upload('/api/profile/avatar', formData);
      if (response?.user) {
        apiClient.setUser(response.user);
        setCurrentUser(response.user);
        setProfile((prev) => ({ ...prev, avatar: response.user.avatar }));
        window.dispatchEvent(new CustomEvent('user:updated'));
      }
    } catch (err) {
      alert(err.data?.error || err.message || 'Ошибка загрузки аватара');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Сохранение обновленных предпочтений
  const handleSavePreferences = async (genres, artistIds) => {
    try {
      const res = await apiClient.updatePreferences(genres, artistIds);
      if (res?.user) {
        apiClient.setUser(res.user);
        setCurrentUser(res.user);
        setProfile((prev) => ({
          ...prev,
          preferred_genres: res.user.preferred_genres,
          preferred_artist_ids: res.user.preferred_artist_ids,
        }));
        window.dispatchEvent(new CustomEvent('user:updated'));
      }
      setActiveModal(null);
    } catch (err) {
      alert(err.message || 'Ошибка обновления предпочтений');
    }
  };

  if (loading) {
    return <div className="artist-page-state">Загрузка профиля...</div>;
  }

  if (!profile) {
    return <div className="artist-page-state">Пользователь не найден</div>;
  }

  const avatarSrc =
    profile.avatar && profile.avatar.trim() !== ''
      ? profile.avatar
      : userIcon;

  const roleClass = (profile.role || 'member').toLowerCase();

  return (
    <>
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        cropShape="circle"
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      <ChangeNicknameModal
        isOpen={activeModal === 'nickname'}
        currentNickname={profile.nickname || profile.login}
        onClose={() => setActiveModal(null)}
        onNicknameUpdated={(updatedUser) => {
          setProfile((prev) => ({ ...prev, nickname: updatedUser.nickname }));
          window.dispatchEvent(new CustomEvent('user:updated'));
        }}
      />

      <ChangePasswordModal
        isOpen={activeModal === 'password'}
        onClose={() => setActiveModal(null)}
      />

      <PreferencesStepModal
        isOpen={activeModal === 'preferences'}
        initialGenres={profile.preferred_genres || []}
        initialArtistIds={profile.preferred_artist_ids || []}
        onClose={() => setActiveModal(null)}
        onComplete={handleSavePreferences}
      />

      <PlaylistModal
        isOpen={activeModal === 'create_playlist'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => fetchProfileData()}
      />

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar" style={{ position: 'relative' }}>
              <img
                src={avatarSrc}
                alt="Avatar"
              />
              {isOwnProfile && (
                <label
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#14161a',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  title="Сменить аватар"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarFileSelect}
                    disabled={avatarLoading}
                  />
                  {avatarLoading ? '...' : 'Фото'}
                </label>
              )}
            </div>

            <div className="profile-info">
              <h1>{profile.nickname || profile.login}</h1>
              <div className="profile-login">@{profile.login}</div>

              <div className="profile-badge">
                <span className={`role-badge ${roleClass}`}>
                  {profile.role || 'member'}
                </span>
                {profile.is_premium && (
                  <span className="premium-badge">PREMIUM</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-details">
            {isOwnProfile && profile.email && (
              <div className="detail-item">
                <span className="detail-label">Электронная почта</span>
                <span className="detail-value">{profile.email}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Дата регистрации</span>
              <span className="detail-value">
                {formatRegistrationDate(profile.inserted_at)}
              </span>
            </div>
          </div>

          {isOwnProfile && (
            <div className="profile-actions">
              <button
                type="button"
                className="profile-action-btn"
                onClick={() => setActiveModal('nickname')}
              >
                Сменить никнейм
              </button>
              <button
                type="button"
                className="profile-action-btn"
                onClick={() => setActiveModal('password')}
              >
                Сменить пароль
              </button>
              <button
                type="button"
                className="profile-action-btn"
                onClick={() => setActiveModal('preferences')}
              >
                Настроить предпочтения
              </button>
            </div>
          )}

          <div className="profile-favorites-section">
            <div className="profile-favorites-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                  Публичные плейлисты
                </h2>
                <span className="profile-favorites-subtitle">
                  {playlists.length} доступно для прослушивания
                </span>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-show-all-btn"
                  onClick={() => setActiveModal('create_playlist')}
                >
                  + Создать плейлист
                </button>
              )}
            </div>

            {playlists.length === 0 ? (
              <p className="empty-text">Нет доступных плейлистов</p>
            ) : (
              <div className="playlists-grid">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="playlist-card"
                    onClick={() => navigate(`/playlists/${pl.id}`)}
                  >
                    <img
                      src={pl.cover || defaultAvatar}
                      alt={pl.title}
                      className="playlist-card-cover"
                    />
                    <div className="playlist-card-info">
                      <h3 className="playlist-card-title">{pl.title}</h3>
                      <span className="playlist-card-count">
                        {pl.tracks_count || 0} треков
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}