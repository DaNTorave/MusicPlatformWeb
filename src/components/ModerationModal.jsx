import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioContext';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import TrackSlotItem from './TrackSlotItem';
import CollaboratorsManager from './CollaboratorsManager';
import OriginalTrackManager from './OriginalTrackManager';
import AgeRestrictionToggle from './AgeRestrictionToggle';

import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import closeIcon from '../assets/close-icon.svg';
import alertIcon from '../assets/alert-circle.svg';

import '../styles/ModerationModal.css';

// Готовые типовые шаблоны причин отклонения
const COMMON_REJECT_REASONS = [
  'Низкое качество аудиофайла (присутствуют шумы, низкий битрейт)',
];

export default function ModerationModal({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  loading,
}) {
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tracks, setTracks] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  // Режим содержимого внутри единого модального окна: 'review' (проверка) или 'reject' (ввод причины отклонения)
  const [moderationMode, setModerationMode] = useState('review');

  // Состояния для кавера и возрастного ограничения
  const [isCover, setIsCover] = useState(false);
  const [originalTrackId, setOriginalTrackId] = useState(null);
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);

  const {
    playTrack,
    currentTrack,
    isPlaying,
    updateTrackTitle,
    updateTrackCover,
    stopPlayer,
  } = useAudioPlayer();

  // Загрузка списков артистов и треков при открытии
  useEffect(() => {
    if (isOpen) {
      setModerationMode('review');
      apiClient.request('/api/artists').then((res) => {
        if (res?.data) setAvailableArtists(res.data);
      }).catch(() => {});
      apiClient.request('/api/charts/tracks').then((res) => {
        if (res?.data) setAvailableTracks(res.data);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Заполнение полей при изменении item
  useEffect(() => {
    if (item) {
      setTitle(item.title || item.name || '');
      setReleaseYear(item.release_year ? String(item.release_year) : '');
      setCoverPreview(item.cover || item.avatar || '');
      setRejectReason('');
      setCoverFile(null);
      setAudioFile(null);
      setModerationMode('review');
      setTracks(
        (item.tracks || []).map((t, idx) => ({
          ...t,
          position: t.position || idx + 1,
          release_year: t.release_year ? String(t.release_year) : '',
          audioFile: null,
          is_cover: Boolean(t.is_cover || t.original_track_id),
          original_track_id: t.original_track_id || null,
          age_restriction: Boolean(
            t.age_restriction || t.has_age_restriction,
          ),
        })),
      );

      setIsCover(Boolean(item.is_cover || item.original_track_id));
      setOriginalTrackId(item.original_track_id || null);
      setIsAgeRestricted(
        Boolean(item.age_restriction || item.has_age_restriction),
      );

      const existingCollabs = (item.collaborators || []).map((c) => c.id);
      setCollaborators(existingCollabs);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Обработчик смены обложки
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);

      if (
        currentTrack &&
        (currentTrack.id === item.id ||
          tracks.some((t) => t.id === currentTrack.id))
      ) {
        updateTrackCover(previewUrl);
      }
    }
  };

  // Изменение названия одиночного трека
  const handleSingleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentTrack?.id === item.id) updateTrackTitle(newTitle);
  };

  // Изменение поля трека в альбоме
  const handleTrackChange = (index, field, value) => {
    const track = tracks[index];
    setTracks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    if (field === 'title' && currentTrack?.id === track.id) {
      updateTrackTitle(value);
    }
  };

  // Перемещение трека вверх или вниз
  const moveTrack = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    setTracks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((t, idx) => ({ ...t, position: idx + 1 }));
    });
  };

  // Удаление трека из списка
  const handleRemoveTrack = (index) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  // Воспроизведение одиночного трека
  const handlePlaySingle = () => {
    playTrack({
      id: item.id,
      title: title || item.title,
      cover: coverPreview,
      streamUrl: audioFile ? URL.createObjectURL(audioFile) : null,
      artist: { name: item.artist_info?.name || 'Модерация' },
      is_cover: isCover,
      original_track: availableTracks.find(
        (t) => String(t.id) === String(originalTrackId),
      ),
    });
  };

  // Воспроизведение трека из альбома
  const handlePlayAlbumTrack = (track) => {
    playTrack({
      id: track.id,
      title: track.title,
      cover: coverPreview,
      streamUrl: track.audioFile ? URL.createObjectURL(track.audioFile) : null,
      artist: { name: item.artist_info?.name || 'Модерация' },
      is_cover: track.is_cover,
      original_track: availableTracks.find(
        (t) => String(t.id) === String(track.original_track_id),
      ),
    });
  };

  // Отправка решения модератора
  const handleSubmit = (action, customReason = null) => {
    stopPlayer();
    const schemaType =
      item.type ||
      (item.tracks
        ? 'album'
        : item.genre && !item.audio_uuid
          ? 'artist'
          : 'track');

    const formData = new FormData();
    formData.append('schema', schemaType);
    formData.append('id', item.id);
    formData.append('title', title);
    if (releaseYear) formData.append('release_year', releaseYear);

    if (coverFile) formData.append('cover', coverFile);
    if (audioFile) formData.append('audio', audioFile);

    if (schemaType === 'track') {
      formData.append('is_cover', isCover ? 'true' : 'false');
      formData.append('position', '1');
      formData.append(
        'age_restriction',
        isAgeRestricted ? 'true' : 'false',
      );
      if (isCover && originalTrackId) {
        formData.append('original_track_id', String(originalTrackId));
      }
    }

    collaborators.forEach((id) => formData.append('collaborator_ids[]', String(id)));

    // Для альбома добавляются все треки
    if (item.type === 'album') {
      tracks.forEach((track, idx) => {
        if (track.id) formData.append(`tracks[${idx}][id]`, String(track.id));
        formData.append(`tracks[${idx}][title]`, track.title);
        formData.append(`tracks[${idx}][position]`, String(track.position || idx + 1));
        formData.append(
          `tracks[${idx}][release_year]`,
          String(track.release_year || releaseYear || ''),
        );
        formData.append(
          `tracks[${idx}][is_cover]`,
          track.is_cover ? 'true' : 'false',
        );
        formData.append(
          `tracks[${idx}][age_restriction]`,
          track.age_restriction ? 'true' : 'false',
        );
        if (track.is_cover && track.original_track_id) {
          formData.append(
            `tracks[${idx}][original_track_id]`,
            String(track.original_track_id),
          );
        }
        if (track.audioFile)
          formData.append(`tracks[${idx}][audio]`, track.audioFile);
      });
    }

    // Добавление причины отклонения при отклонении
    if (action === 'reject') {
      const finalReason = customReason || rejectReason || 'Отклонено модератором';
      formData.append('status', 'rejected');
      formData.append('comment', finalReason);
      onReject(schemaType, item.id, finalReason);
    } else {
      formData.append('status', 'approved');
      formData.append('comment', 'Одобрено модератором');
      onApprove(formData);
    }
  };

  const isSingleAudio = item.type === 'track' || item.type === 'single';
  const isAlbum = item.type === 'album';
  const isSinglePlaying = currentTrack?.id === item.id && isPlaying;

  const isApproveDisabled = (() => {
    if (loading) return true;
    if (!title.trim()) return true;

    if (isSingleAudio) {
      if (isCover && !originalTrackId) return true;
    }

    if (isAlbum) {
      if (tracks.length === 0) return true;
      const hasEmptyTitle = tracks.some((t) => !t.title.trim());
      if (hasEmptyTitle) return true;
      const hasIncompleteCover = tracks.some(
        (t) => t.is_cover && !t.original_track_id,
      );
      if (hasIncompleteCover) return true;
    }

    return false;
  })();

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window moderation-modal">
        {/* Шапка единого модального окна */}
        <div className="modal-window-top-buttons">
          {moderationMode === 'review' ? (
            <button type="button" className="modal-window-top-button active">
              Модерация:{' '}
              {item.type === 'artist'
                ? 'Исполнитель'
                : item.type === 'album'
                  ? 'Альбом'
                  : 'Трек'}
            </button>
          ) : (
            <button
              type="button"
              className="modal-window-top-button active"
              onClick={() => setModerationMode('review')}
            >
              Причина отклонения
            </button>
          )}

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="✕" />
          </button>
        </div>

        <div className="modal-window-content">
          {/* ЭКРАН 1: Проверка и редактирование параметров */}
          {moderationMode === 'review' && (
            <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
              <div className="moderation-preview">
                <div className="moderation-cover">
                  <img src={coverPreview || '/default.png'} alt="Обложка" />
                  <label className="moderation-cover-change">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                    />
                    Изменить обложку
                  </label>
                </div>
              </div>

              <div className="auth-form-group">
                <label>{isAlbum ? 'Название альбома' : 'Название'} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={handleSingleTitleChange}
                  placeholder="Введите название"
                  disabled={loading}
                  required
                />
              </div>

              {item.type !== 'artist' && (
                <div className="auth-form-group">
                  <label>Год выпуска</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="2026"
                    disabled={loading}
                  />
                </div>
              )}

              {isSingleAudio && (
                <AgeRestrictionToggle
                  checked={isAgeRestricted}
                  onChange={setIsAgeRestricted}
                  disabled={loading}
                />
              )}

              {item.artist_info && (
                <CollaboratorsManager
                  mainArtist={item.artist_info}
                  availableArtists={availableArtists}
                  collaboratorIds={collaborators}
                  onChange={setCollaborators}
                  disabled={loading}
                />
              )}

              {isSingleAudio && (
                <div className="meta-box-card">
                  <div className="meta-box-header">
                    <label className="meta-switch-label">
                      <input
                        type="checkbox"
                        checked={isCover}
                        onChange={(e) => {
                          setIsCover(e.target.checked);
                          if (!e.target.checked) setOriginalTrackId(null);
                        }}
                        disabled={loading}
                      />
                      Кавер
                    </label>
                  </div>

                  {isCover && (
                    <OriginalTrackManager
                      availableTracks={availableTracks}
                      selectedTrackId={originalTrackId}
                      onChange={setOriginalTrackId}
                      disabled={loading}
                    />
                  )}
                </div>
              )}

              {isSingleAudio && (
                <div className="auth-form-group">
                  <label>Аудиозапись</label>
                  <div className="moderation-single-audio-box">
                    <div className="moderation-single-audio-box-btn">
                      <button
                        type="button"
                        className="track-slot-play-btn"
                        onClick={handlePlaySingle}
                        title={isSinglePlaying ? 'Пауза' : 'Слушать'}
                      >
                        <img
                          src={isSinglePlaying ? pauseIcon : playIcon}
                          alt="Play/Pause"
                        />
                      </button>
                    </div>

                    <label className="moderation-audio-change">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files[0])}
                      />
                      {audioFile
                        ? 'Файл выбран для замены'
                        : 'Заменить аудиофайл'}
                    </label>
                  </div>
                </div>
              )}

              {isAlbum && (
                <div className="auth-form-group">
                  <label>Треки альбома ({tracks.length} шт.):</label>
                  <div className="scrollable-track-list">
                    {tracks.map((track, idx) => (
                      <TrackSlotItem
                        key={track.id || idx}
                        index={idx}
                        track={track}
                        total={tracks.length}
                        onChange={handleTrackChange}
                        onMove={moveTrack}
                        onRemove={handleRemoveTrack}
                        showPlay
                        onPlay={handlePlayAlbumTrack}
                        isPlaying={currentTrack?.id === track.id && isPlaying}
                        disabled={loading}
                        availableArtists={availableArtists}
                        availableTracks={availableTracks}
                        mainArtist={item.artist_info}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Действия модератора */}
              <div className="moderation-actions">
                <Button
                  type="button"
                  variant="primary"
                  disabled={isApproveDisabled}
                  onClick={() => handleSubmit('approve')}
                >
                  {loading ? 'Сохранение...' : 'Одобрить'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => setModerationMode('reject')}
                >
                  Отклонить
                </Button>
              </div>
            </form>
          )}

          {/* ЭКРАН 2: Указание причины отклонения (внутри этого же модального окна) */}
          {moderationMode === 'reject' && (
            <div className="auth-form">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
                <img
                  src={alertIcon}
                  alt="Внимание"
                  style={{
                    width: '22px',
                    height: '22px',
                    filter: 'invert(24%) sepia(88%) saturate(3412%) hue-rotate(352deg) brightness(92%) contrast(93%)'
                  }}
                />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Укажите причину отклонения для автора
                </h3>
              </div>

              <p className="auth-form-subtitle" style={{ margin: '0 0 10px 0' }}>
                Автор получит уведомление с точной причиной отклонения релиза <strong>«{title || item.title || item.name}»</strong>:
              </p>

              {/* Готовые шаблоны причин */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Готовые шаблоны:
                </label>
                <div className="reject-presets">
                  {COMMON_REJECT_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`reject-preset-chip ${rejectReason === preset ? 'active' : ''}`}
                      onClick={() => setRejectReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-form-group">
                <label>Текст причины (обязательно) *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Опишите, что именно требуется исправить..."
                  required
                  disabled={loading}
                  className="moderation-textarea"
                  style={{ minHeight: '90px' }}
                  autoFocus
                />
              </div>

              <div className="modal-actions-row">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => setModerationMode('review')}
                >
                  Назад к проверке
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={loading || !rejectReason.trim()}
                  onClick={() => handleSubmit('reject', rejectReason)}
                >
                  {loading ? 'Отклонение...' : 'Отклонить и отправить автору'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
