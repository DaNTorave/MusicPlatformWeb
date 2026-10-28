import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import TrackRow from '../components/TrackRow';
import PlaylistModal from '../components/PlaylistModal';
import Button from '../components/Button';
import AgeBadge from '../components/AgeBadge';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import shareIcon from '../assets/share-icon.svg';

import '../styles/ArtistPage.css';
import '../styles/Playlists.css';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния данных плейлиста и модального окна редактирования
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();

  // Загрузка данных плейлиста по идентификатору
  const fetchPlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getPlaylist(id);
      if (res?.playlist) {
        setPlaylist(res.playlist);
      } else {
        setError('Плейлист не найден');
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Плейлист не найден');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();

    const handleUpdate = () => fetchPlaylist();
    window.addEventListener('playlists:updated', handleUpdate);
    return () => window.removeEventListener('playlists:updated', handleUpdate);
  }, [id]);

  // Удаление трека из текущего плейлиста
  const handleRemoveTrack = async (trackId) => {
    try {
      await apiClient.removePlaylistTrack(playlist.id, trackId);
      fetchPlaylist();
    } catch (err) {
      alert(err.message || 'Ошибка удаления трека из плейлиста');
    }
  };

  // Удаление всего плейлиста
  const handleDeletePlaylist = async () => {
    if (!window.confirm('Удалить этот плейлист?')) return;
    try {
      await apiClient.deletePlaylist(playlist.id);
      navigate('/playlists');
    } catch (err) {
      alert(err.message || 'Ошибка удаления плейлиста');
    }
  };

  // Копирование прямой ссылки на плейлист в буфер обмена
  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    }
  };

  if (loading) {
    return <div className="artist-page-state">Загрузка плейлиста...</div>;
  }

  if (error || !playlist) {
    return (
      <div className="artist-page-state error">
        {error || 'Плейлист не найден'}
      </div>
    );
  }

  const tracks = playlist.tracks || [];
  const isOwner =
    currentUser && Number(currentUser.id) === Number(playlist.user_id);
  const isStaff =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'moderator' || currentUser.role === 'owner');
  const canManage = isOwner || isStaff;

  const pTrackIds = tracks.map((t) => String(t.id));
  const isPlaylistPlaying =
    currentTrack && pTrackIds.includes(String(currentTrack.id)) && isPlaying;

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlaylistPlaying) {
      playTrack(currentTrack);
    } else {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="artist-page">
      <PlaylistModal
        isOpen={isEditOpen}
        playlist={playlist}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchPlaylist}
      />

      <div className="artist-header">
        <img
          src={playlist.cover || defaultCover}
          alt={playlist.title}
          className="album-cover-large"
        />

        <div className="artist-info">
          <div className="playlist-header-badges">
            <span className="artist-tag">Плейлист</span>
            <span
              className={`playlist-privacy-badge ${playlist.is_public ? 'public' : 'private'}`}
            >
              {playlist.is_public
                ? 'Отображается в профиле'
                : 'Доступен по ссылке'}
            </span>
          </div>

          <div className="artist-title-row">
            <h1 className="artist-title">{playlist.title}</h1>
            {playlist.has_age_restriction && <AgeBadge size="medium" />}
          </div>

          <div className="artist-meta">
            {playlist.owner && (
              <p className="artist-meta-string" style={{ paddingLeft: 0 }}>
                Автор:{' '}
                <Link
                  to={`/profile/${playlist.owner.id}`}
                  className="artist-link"
                >
                  {playlist.owner.nickname || playlist.owner.login}
                </Link>
              </p>
            )}
            <p className="artist-meta-string">Треков: {tracks.length}</p>
          </div>

          <div className="playlist-page-actions">
            {tracks.length > 0 && (
              <button
                type="button"
                className="track-page-main-play-btn"
                onClick={handlePlayAll}
              >
                <img src={isPlaylistPlaying ? pauseIcon : playIcon} alt="Play" />
                <span>{isPlaylistPlaying ? 'Пауза' : 'Слушать'}</span>
              </button>
            )}

            <button
              type="button"
              className="playlist-share-btn"
              onClick={handleCopyLink}
              title="Скопировать ссылку на плейлист"
            >
              <img src={shareIcon} alt="Ссылка" />
              <span>{copiedMsg ? 'Ссылка скопирована' : 'Поделиться'}</span>
            </button>

            {canManage && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() => setIsEditOpen(true)}
                >
                  Редактировать
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  onClick={handleDeletePlaylist}
                >
                  Удалить
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="artist-section">
        <div className="all-tracks-action">
          <h2>Список композиций</h2>
          <button type="button" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>

        {tracks.length === 0 ? (
          <p className="empty-text">
            В этом плейлисте пока нет композиций. Добавьте треки через кнопку с
            тремя точками рядом с любым треком.
          </p>
        ) : (
          <div className="album-tracks-container">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                index={idx}
                track={track}
                isPlaying={
                  currentTrack &&
                  String(currentTrack.id) === String(track.id) &&
                  isPlaying
                }
                onPlay={() => playTrack(track, tracks)}
                onRemoveFromPlaylist={canManage ? handleRemoveTrack : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}