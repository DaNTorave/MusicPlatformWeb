import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import * as musicMetadata from 'music-metadata';

import Button from './Button';
import TrackSlotItem from './TrackSlotItem';
import CollaboratorsManager from './CollaboratorsManager';
import OriginalTrackManager from './OriginalTrackManager';
import AgeRestrictionToggle from './AgeRestrictionToggle';

import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';

const createEmptyTrack = (releaseYear = '') => ({
  title: '',
  audio: null,
  duration: 0,
  position: 1,
  release_year: releaseYear,
  collaboratorIds: [],
  is_cover: false,
  original_track_id: null,
  age_restriction: false,
});

export default function UploadMusicModal({
  isOpen,
  onClose,
  onSuccess,
  artistId: initialArtistId = '',
  artistName: initialArtistName = '',
}) {
  const [uploadType, setUploadType] = useState('single');
  const [titleOrName, setTitleOrName] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [genre, setGenre] = useState('');
  const [artistId, setArtistId] = useState(initialArtistId);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [singleAudio, setSingleAudio] = useState(null);
  const [singleDuration, setSingleDuration] = useState(0);
  const [singleAgeRestriction, setSingleAgeRestriction] = useState(false);

  const [isCover, setIsCover] = useState(false);
  const [originalTrackId, setOriginalTrackId] = useState(null);

  const [albumTracks, setAlbumTracks] = useState([createEmptyTrack()]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const singleFileInputRef = useRef(null);
  const albumBatchInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiClient
        .request('/api/artists')
        .then((res) => {
          if (res?.data) setAvailableArtists(res.data);
        })
        .catch((err) => console.error('Ошибка загрузки артистов:', err));

      apiClient
        .request('/api/charts/tracks')
        .then((res) => {
          if (res?.data) setAvailableTracks(res.data);
        })
        .catch((err) => console.error('Ошибка загрузки треков:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialArtistId) {
      setArtistId(initialArtistId);
      setUploadType('single');
    }
    setSelectedCollaborators([]);
  }, [initialArtistId, isOpen]);

  if (!isOpen) return null;

  const handleAddTrackSlot = () => {
    setAlbumTracks((prev) => [
      ...prev,
      {
        ...createEmptyTrack(releaseYear || ''),
        position: prev.length + 1,
      },
    ]);
  };

  const handleTrackChange = (index, field, value) => {
    setAlbumTracks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveTrackSlot = (index) => {
    setAlbumTracks((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const reindexed = filtered.map((t, idx) => ({
        ...t,
        position: t.position || idx + 1,
      }));
      return reindexed.length === 0
        ? [createEmptyTrack(releaseYear || '')]
        : reindexed;
    });
  };

  const moveTrack = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= albumTracks.length) return;
    setAlbumTracks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((t, idx) => ({ ...t, position: idx + 1 }));
    });
  };

  const applySingleFile = async (file) => {
    if (!file) return;
    setSingleAudio(file);
    setErrorMsg('');

    try {
      const metadata = await musicMetadata.parseBlob(file);

      if (metadata.format?.duration) {
        setSingleDuration(Math.round(metadata.format.duration));
      }

      if (metadata.common.title) {
        setTitleOrName(metadata.common.title);
      } else if (!titleOrName.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setTitleOrName(cleanName);
      }

      if (metadata.common.year && !releaseYear) {
        setReleaseYear(String(metadata.common.year));
      }

      if (metadata.common.genre && metadata.common.genre.length > 0 && !genre) {
        setGenre(metadata.common.genre[0]);
      }

      if (!artistId && metadata.common.artist && availableArtists.length > 0) {
        const matched = availableArtists.find(
          (a) => a.name.toLowerCase() === metadata.common.artist.toLowerCase(),
        );
        if (matched) {
          setArtistId(matched.id);
        }
      }

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const blob = new Blob([pic.data], { type: pic.format });
        const cover = new File([blob], 'cover.jpg', {
          type: pic.format,
        });
        setCoverFile(cover);
        setCoverPreview(URL.createObjectURL(cover));
      }
    } catch (err) {
      console.warn('Метаданные не найдены:', err);
      if (!titleOrName.trim()) {
        setTitleOrName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const processBatchAudioFiles = async (files) => {
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(f.name),
    );

    if (audioFiles.length === 0) {
      setErrorMsg('Перетянутые файлы не являются поддерживаемым аудио');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const parsedSlots = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      let trackTitle = file.name.replace(/\.[^/.]+$/, '');
      let duration = 0;
      let pos = null;
      let trackYear = '';

      try {
        const metadata = await musicMetadata.parseBlob(file);
        if (metadata.format?.duration) {
          duration = Math.round(metadata.format.duration);
        }
        if (metadata.common.title) {
          trackTitle = metadata.common.title;
        }
        if (metadata.common.track?.no) {
          pos = metadata.common.track.no;
        }
        if (metadata.common.year) {
          trackYear = String(metadata.common.year);
        }

        if (i === 0) {
          if (metadata.common.album && !titleOrName.trim()) {
            setTitleOrName(metadata.common.album);
          }
          if (metadata.common.year && !releaseYear) {
            setReleaseYear(String(metadata.common.year));
          }
          if (
            metadata.common.picture &&
            metadata.common.picture.length > 0 &&
            !coverFile
          ) {
            const pic = metadata.common.picture[0];
            const blob = new Blob([pic.data], { type: pic.format });
            const extractedCover = new File([blob], 'cover.jpg', {
              type: pic.format,
            });
            setCoverFile(extractedCover);
            setCoverPreview(URL.createObjectURL(extractedCover));
          }
        }
      } catch (err) {
        console.warn('Не удалось прочитать теги файла:', file.name, err);
      }

      parsedSlots.push({
        title: trackTitle,
        audio: file,
        duration,
        position: pos || albumTracks.filter((t) => t.audio).length + i + 1,
        release_year: trackYear,
        collaboratorIds: [],
        is_cover: false,
        original_track_id: null,
        age_restriction: false,
      });
    }

    setAlbumTracks((prev) => {
      const existing = prev.filter(
        (t) => t.title.trim() !== '' && t.audio !== null,
      );
      const combined = [...existing, ...parsedSlots];
      return combined.sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    setLoading(false);
  };

  const handleDropzoneDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (uploadType === 'single') {
      applySingleFile(files[0]);
    } else if (uploadType === 'album') {
      processBatchAudioFiles(files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setLoading(true);
    const formData = new FormData();

    try {
      let endpoint = '';

      if (uploadType === 'artist') {
        endpoint = '/api/upload/artist';
        formData.append('name', titleOrName.trim());
        formData.append('genre', genre.trim());
        if (coverFile) formData.append('avatar', coverFile);
      } else if (uploadType === 'single') {
        endpoint = '/api/upload/single';
        formData.append('title', titleOrName.trim());
        formData.append('artist_id', artistId);
        formData.append('duration_seconds', singleDuration || 0);
        formData.append('is_cover', isCover ? 'true' : 'false');
        formData.append('position', 1);
        formData.append(
          'age_restriction',
          singleAgeRestriction ? 'true' : 'false',
        );
        if (releaseYear) formData.append('release_year', releaseYear);
        if (isCover && originalTrackId) {
          formData.append('original_track_id', originalTrackId);
        }
        selectedCollaborators.forEach((id) =>
          formData.append('collaborator_ids[]', id),
        );
        if (coverFile) formData.append('cover', coverFile);
        if (singleAudio) formData.append('audio', singleAudio);
      } else if (uploadType === 'album') {
        endpoint = '/api/upload/album';
        formData.append('title', titleOrName.trim());
        formData.append('artist_id', artistId);
        if (releaseYear) formData.append('release_year', releaseYear);
        if (coverFile) formData.append('cover', coverFile);

        albumTracks
          .filter((t) => t.title.trim() && t.audio)
          .forEach((track, idx) => {
            formData.append(`tracks[${idx}][title]`, track.title.trim());
            formData.append(`tracks[${idx}][audio]`, track.audio);
            formData.append(
              `tracks[${idx}][duration_seconds]`,
              track.duration || 0,
            );
            formData.append(
              `tracks[${idx}][position]`,
              track.position || idx + 1,
            );
            formData.append(
              `tracks[${idx}][release_year]`,
              track.release_year || releaseYear || '',
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
                track.original_track_id,
              );
            }

            (track.collaboratorIds || []).forEach((cId) => {
              formData.append(`tracks[${idx}][collaborator_ids][]`, cId);
            });
          });
      }

      await apiClient.upload(endpoint, formData);
      setSuccessMsg('Материал успешно отправлен на модерацию!');

      setTimeout(() => {
        setSuccessMsg('');
        setTitleOrName('');
        setReleaseYear('');
        setCoverFile(null);
        setCoverPreview('');
        setSingleAudio(null);
        setSingleDuration(0);
        setSingleAgeRestriction(false);
        setIsCover(false);
        setOriginalTrackId(null);
        setAlbumTracks([createEmptyTrack()]);
        setSelectedCollaborators([]);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Ошибка отправки данных');
    } finally {
      setLoading(false);
    }
  };

  const currentMainArtist =
    availableArtists.find((a) => String(a.id) === String(artistId)) ||
    (initialArtistId ? { id: initialArtistId, name: initialArtistName } : null);

  const isSubmitDisabled = (() => {
    if (loading) return true;

    if (uploadType === 'artist') {
      return !titleOrName.trim() || !genre.trim();
    }

    if (!titleOrName.trim() || !artistId) return true;

    if (uploadType === 'single') {
      if (!singleAudio) return true;
      if (isCover && !originalTrackId) return true;
      return false;
    }

    if (uploadType === 'album') {
      const validTracks = albumTracks.filter((t) => t.title.trim() && t.audio);
      if (validTracks.length === 0) return true;
      const hasIncompleteCover = validTracks.some(
        (t) => t.is_cover && !t.original_track_id,
      );
      if (hasIncompleteCover) return true;
      return false;
    }

    return false;
  })();

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window modal-window-wide">
        <div className="modal-window-top-buttons">
          <button
            type="button"
            className={`modal-window-top-button ${uploadType === 'single' ? 'active' : ''}`}
            onClick={() => setUploadType('single')}
          >
            Сингл
          </button>
          <button
            type="button"
            className={`modal-window-top-button ${uploadType === 'album' ? 'active' : ''}`}
            onClick={() => setUploadType('album')}
          >
            Альбом
          </button>
          {!initialArtistId && (
            <button
              type="button"
              className={`modal-window-top-button ${uploadType === 'artist' ? 'active' : ''}`}
              onClick={() => setUploadType('artist')}
            >
              Артист
            </button>
          )}
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content modal-window-content-scroll">
          <form className="auth-form" onSubmit={handleSubmit}>
            {initialArtistName && (
              <p className="auth-form-subtitle">
                Основной исполнитель: <strong>{initialArtistName}</strong>
              </p>
            )}

            {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
            {successMsg && (
              <div className="auth-success-global">{successMsg}</div>
            )}

            <div className="auth-form-group">
              <label>
                {uploadType === 'artist'
                  ? 'Имя исполнителя'
                  : 'Название релиза'}{' '}
                *
              </label>
              <input
                type="text"
                value={titleOrName}
                onChange={(e) => setTitleOrName(e.target.value)}
                placeholder={
                  uploadType === 'artist' ? 'Введите имя' : 'Введите название'
                }
                required
                disabled={loading}
              />
            </div>

            {uploadType !== 'artist' && (
              <div className="auth-form-group">
                <label>Год выпуска</label>
                <input
                  type="number"
                  placeholder="Например: 2026"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {uploadType === 'artist' && (
              <div className="auth-form-group">
                <label>Основной жанр *</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Hip-Hop, Electronic, Rock..."
                  required
                  disabled={loading}
                />
              </div>
            )}

            {uploadType !== 'artist' && !initialArtistId && (
              <div className="auth-form-group">
                <label>Основной исполнитель *</label>
                <select
                  value={artistId}
                  onChange={(e) => setArtistId(e.target.value)}
                  required
                  disabled={loading}
                  className="input-element upload-select"
                >
                  <option value="">Выберите артиста...</option>
                  {availableArtists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.genre})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {uploadType === 'single' && (
              <CollaboratorsManager
                mainArtist={currentMainArtist}
                availableArtists={availableArtists}
                collaboratorIds={selectedCollaborators}
                onChange={setSelectedCollaborators}
                disabled={loading}
              />
            )}

            {uploadType === 'single' && (
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

            {uploadType === 'single' && (
              <AgeRestrictionToggle
                checked={singleAgeRestriction}
                onChange={setSingleAgeRestriction}
                disabled={loading}
              />
            )}

            <div className="auth-form-group">
              <label>
                {uploadType === 'artist'
                  ? 'Аватар (обложка)'
                  : 'Обложка релиза'}
              </label>
              {coverPreview && (
                <div className="upload-cover-preview-wrapper">
                  <img
                    src={coverPreview}
                    alt="Превью обложки"
                    className="upload-cover-preview"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }
                }}
                disabled={loading}
              />
            </div>

            {uploadType === 'single' && (
              <div className="auth-form-group">
                <label>Аудиозапись *</label>
                <div
                  className={`dropzone-box ${isDraggingOver ? 'dragover' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropzoneDrop}
                  onClick={() =>
                    singleFileInputRef.current &&
                    singleFileInputRef.current.click()
                  }
                >
                  <p className="dropzone-text">
                    {singleAudio
                      ? singleAudio.name
                      : 'Перетащите аудиофайл сюда или нажмите'}
                  </p>
                  <p className="dropzone-subtext">
                    Поддерживаются форматы MP3, WAV, FLAC
                  </p>

                  {singleAudio && (
                    <span className="dropzone-file-selected">
                      Готов к загрузке (
                      {(singleAudio.size / (1024 * 1024)).toFixed(2)} МБ)
                    </span>
                  )}

                  <input
                    ref={singleFileInputRef}
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={(e) => applySingleFile(e.target.files[0])}
                  />
                </div>
              </div>
            )}

            {uploadType === 'album' && (
              <div className="auth-form-group">
                <div className="track-list-header">
                  <label>
                    Список треков альбома ({albumTracks.length} шт.):
                  </label>
                  <div className="track-list-actions">
                    {albumTracks.length > 0 && (
                      <button
                        type="button"
                        className="track-list-add-btn track-list-clear-btn"
                        onClick={() =>
                          setAlbumTracks([createEmptyTrack(releaseYear || '')])
                        }
                      >
                        Очистить все
                      </button>
                    )}
                    <button
                      type="button"
                      className="track-list-add-btn"
                      onClick={handleAddTrackSlot}
                    >
                      + Добавить слот
                    </button>
                  </div>
                </div>

                <div
                  className={`dropzone-box ${isDraggingOver ? 'dragover' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropzoneDrop}
                  onClick={() =>
                    albumBatchInputRef.current &&
                    albumBatchInputRef.current.click()
                  }
                >
                  <p className="dropzone-text">
                    Перетащите один или несколько треков из проводника
                  </p>
                  <p className="dropzone-subtext">
                    Теги (названия, год, порядок в альбоме) считаются
                    автоматически
                  </p>

                  <input
                    ref={albumBatchInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => processBatchAudioFiles(e.target.files)}
                  />
                </div>

                <div className="scrollable-track-list">
                  {albumTracks.map((track, i) => (
                    <TrackSlotItem
                      key={i}
                      index={i}
                      track={track}
                      total={albumTracks.length}
                      onChange={handleTrackChange}
                      onMove={moveTrack}
                      onRemove={handleRemoveTrackSlot}
                      disabled={loading}
                      availableArtists={availableArtists}
                      availableTracks={availableTracks}
                      mainArtist={currentMainArtist}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
              {loading ? 'Отправка...' : 'Отправить на модерацию'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}