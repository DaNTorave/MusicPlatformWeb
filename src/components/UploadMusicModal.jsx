import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/apiClient';
import * as musicMetadata from 'music-metadata';

import Button from './Button';
import TrackSlotItem from './TrackSlotItem';
import CollaboratorsManager from './CollaboratorsManager';

import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';

export default function UploadMusicModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  artistId: initialArtistId = '',
  artistName: initialArtistName = ''
}) {
  const [uploadType, setUploadType] = useState('single');
  const [titleOrName, setTitleOrName] = useState('');
  const [genre, setGenre] = useState('');
  const [artistId, setArtistId] = useState(initialArtistId);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [singleAudio, setSingleAudio] = useState(null);
  
  const [albumTracks, setAlbumTracks] = useState([{ title: '', audio: null, collaboratorIds: [] }]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const singleFileInputRef = useRef(null);
  const albumBatchInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiClient.request('/api/artists')
        .then(res => {
          if (res?.data) setAvailableArtists(res.data);
        })
        .catch(err => console.error('Ошибка загрузки артистов:', err));
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
    setAlbumTracks(prev => [...prev, { title: '', audio: null, collaboratorIds: [] }]);
  };

  const handleTrackChange = (index, field, value) => {
    setAlbumTracks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveTrackSlot = (index) => {
    setAlbumTracks(prev => prev.filter((_, i) => i !== index));
  };

  const moveTrack = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= albumTracks.length) return;
    setAlbumTracks(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const applySingleFile = async (file) => {
    if (!file) return;
    setSingleAudio(file);
    setErrorMsg('');

    try {
      const metadata = await musicMetadata.parseBlob(file);
      if (metadata.common.title && !titleOrName.trim()) {
        setTitleOrName(metadata.common.title);
      }
      if (metadata.common.picture && metadata.common.picture.length > 0 && !coverFile) {
        const pic = metadata.common.picture[0];
        const blob = new Blob([pic.data], { type: pic.format });
        const cover = new File([blob], 'cover.jpg', { type: pic.format });
        setCoverFile(cover);
        setCoverPreview(URL.createObjectURL(cover));
      }
    } catch (err) {
      console.warn('Метаданные не найдены:', err);
    }
  };

  const processBatchAudioFiles = async (files) => {
    const audioFiles = Array.from(files).filter(f => 
      f.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(f.name)
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

      try {
        const metadata = await musicMetadata.parseBlob(file);
        if (metadata.common.title) {
          trackTitle = metadata.common.title;
        }

        if (i === 0) {
          if (metadata.common.album && !titleOrName.trim()) {
            setTitleOrName(metadata.common.album);
          }
          if (metadata.common.picture && metadata.common.picture.length > 0 && !coverFile) {
            const pic = metadata.common.picture[0];
            const blob = new Blob([pic.data], { type: pic.format });
            const extractedCover = new File([blob], 'cover.jpg', { type: pic.format });
            setCoverFile(extractedCover);
            setCoverPreview(URL.createObjectURL(extractedCover));
          }
        }
      } catch (err) {
        console.warn('Не удалось прочитать теги файла:', file.name, err);
      }

      parsedSlots.push({ title: trackTitle, audio: file, collaboratorIds: [] });
    }

    setAlbumTracks(prev => {
      const existing = prev.filter(t => t.title.trim() !== '' && t.audio !== null);
      return [...existing, ...parsedSlots];
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

    if (uploadType === 'single' && !singleAudio) {
      setErrorMsg('Пожалуйста, прикрепите аудиофайл сингла');
      return;
    }

    if (uploadType === 'album') {
      const validTracks = albumTracks.filter(t => t.title.trim() && t.audio);
      if (validTracks.length === 0) {
        setErrorMsg('Добавьте хотя бы один трек с аудиофайлом');
        return;
      }
    }

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
        let singleFinalTitle = titleOrName.trim();
        if (selectedCollaborators.length > 0) {
          const collabNames = availableArtists
            .filter(a => selectedCollaborators.includes(a.id))
            .map(a => a.name)
            .join(', ');

          if (collabNames) {
            singleFinalTitle = `${singleFinalTitle} (feat. ${collabNames})`;
          }
        }

        formData.append('title', singleFinalTitle);
        formData.append('artist_id', artistId);
        selectedCollaborators.forEach(id => formData.append('collaborator_ids[]', id));
        if (coverFile) formData.append('cover', coverFile);
        if (singleAudio) formData.append('audio', singleAudio);
      } else if (uploadType === 'album') {
        endpoint = '/api/upload/album';
        formData.append('title', titleOrName.trim());
        formData.append('artist_id', artistId);
        if (coverFile) formData.append('cover', coverFile);

        albumTracks
          .filter(t => t.title.trim() && t.audio)
          .forEach((track, idx) => {
            let trackFinalTitle = track.title.trim();
            const trackCollabs = track.collaboratorIds || [];

            if (trackCollabs.length > 0) {
              const names = availableArtists
                .filter(a => trackCollabs.includes(a.id))
                .map(a => a.name)
                .join(', ');
              if (names) {
                trackFinalTitle = `${trackFinalTitle} (feat. ${names})`;
              }
            }

            formData.append(`tracks[${idx}][title]`, trackFinalTitle);
            formData.append(`tracks[${idx}][audio]`, track.audio);

            trackCollabs.forEach(cId => {
              formData.append(`tracks[${idx}][collaborator_ids][]`, cId);
            });
          });
      }

      await apiClient.upload(endpoint, formData);
      setSuccessMsg('Материал успешно отправлен на модерацию!');
      
      setTimeout(() => {
        setSuccessMsg('');
        setTitleOrName('');
        setCoverFile(null);
        setCoverPreview('');
        setSingleAudio(null);
        setAlbumTracks([{ title: '', audio: null, collaboratorIds: [] }]);
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

  return (
    <div className="modal-background" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-window" style={{ maxWidth: '680px' }}>
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
          <button type="button" className="modal-close-button" onClick={onClose}>
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            {initialArtistName && (
              <p className="auth-form-subtitle">
                Основной исполнитель: <strong>{initialArtistName}</strong>
              </p>
            )}

            {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
            {successMsg && <div className="auth-success-global">{successMsg}</div>}

            <div className="auth-form-group">
              <label>{uploadType === 'artist' ? 'Имя исполнителя' : 'Название релиза'} *</label>
              <input
                type="text"
                value={titleOrName}
                onChange={(e) => setTitleOrName(e.target.value)}
                placeholder={uploadType === 'artist' ? 'Введите имя' : 'Введите название'}
                required
                disabled={loading}
              />
            </div>

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
                  className="input-element"
                  style={{ padding: '10px 14px' }}
                >
                  <option value="">Выберите артиста...</option>
                  {availableArtists.map(a => (
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

            <div className="auth-form-group">
              <label>{uploadType === 'artist' ? 'Аватар (обложка)' : 'Обложка релиза'}</label>
              {coverPreview && (
                <div style={{ marginBottom: '8px' }}>
                  <img 
                    src={coverPreview} 
                    alt="Превью обложки" 
                    style={{ width: 76, height: 76, borderRadius: 10, objectFit: 'cover', border: '2px solid #e2e8f0' }} 
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
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropzoneDrop}
                  onClick={() => singleFileInputRef.current && singleFileInputRef.current.click()}
                >
                  <p className="dropzone-text">
                    {singleAudio ? singleAudio.name : 'Перетащите аудиофайл сюда или нажмите'}
                  </p>
                  <p className="dropzone-subtext">Поддерживаются форматы MP3, WAV, FLAC</p>

                  {singleAudio && (
                    <span className="dropzone-file-selected">
                      Готов к загрузке ({(singleAudio.size / (1024 * 1024)).toFixed(2)} МБ)
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
                  <label>Список треков альбома ({albumTracks.length} шт.):</label>
                  <button type="button" className="track-list-add-btn" onClick={handleAddTrackSlot}>
                    + Добавить слот
                  </button>
                </div>

                <div
                  className={`dropzone-box ${isDraggingOver ? 'dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropzoneDrop}
                  onClick={() => albumBatchInputRef.current && albumBatchInputRef.current.click()}
                >
                  <p className="dropzone-text">Перетащите один или несколько треков из проводника</p>
                  <p className="dropzone-subtext">Теги (названия, альбом, обложка) заполнятся автоматически</p>

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
                      mainArtist={currentMainArtist}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить на модерацию'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}