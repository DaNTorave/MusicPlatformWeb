import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import TrackSlotItem from './TrackSlotItem';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';

export default function EditEntityModal({ isOpen, onClose, item, type, onSuccess }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || item.name || '');
      setGenre(item.genre || '');
      setCoverPreview(item.cover || item.avatar || '');
      setCoverFile(null);
      setAudioFile(null);
      setErrorMsg('');

      if (type === 'album') {
        setTracks(
          (item.tracks || []).map((t) => ({
            id: t.id,
            title: t.title || '',
            audioFile: null
          }))
        );
      }
    }
  }, [item, type]);

  if (!isOpen || !item) return null;

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAddTrackSlot = () => {
    setTracks(prev => [...prev, { id: null, title: '', audioFile: null }]);
  };

  const handleRemoveTrack = (index) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index, field, value) => {
    setTracks(prev => {
      const copy = [...prev];
      copy[index] = { 
        ...copy[index], 
        [field === 'audio' ? 'audioFile' : field]: value 
      };
      return copy;
    });
  };

  const moveTrack = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    setTracks(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('schema', type);
      formData.append('id', item.id);
      formData.append('title', title.trim());

      if (type === 'artist' && genre) {
        formData.append('genre', genre.trim());
      }
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      if (type === 'track' && audioFile) {
        formData.append('audio', audioFile);
      }

      if (type === 'album') {
        tracks.forEach((track, idx) => {
          if (track.id) formData.append(`tracks[${idx}][id]`, track.id);
          formData.append(`tracks[${idx}][title]`, track.title);
          if (track.audioFile) {
            formData.append(`tracks[${idx}][audio]`, track.audioFile);
          }
        });
      }

      await apiClient.upload('/api/moderation/approve-with-edit', formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Ошибка сохранения изменений');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'artist': return 'Редактирование исполнителя';
      case 'album': return 'Редактирование альбома';
      case 'track': return 'Редактирование трека';
      default: return 'Редактирование';
    }
  };

  return (
    <div className="modal-background" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-window" style={{ maxWidth: type === 'album' ? '680px' : '520px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            {getModalTitle()}
          </button>
          <button type="button" className="modal-close-button" onClick={onClose}>
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMsg && <div className="auth-error-global">{errorMsg}</div>}

            <div className="avatar-preview-container">
              <div className="avatar-preview-wrapper">
                <img
                  src={coverPreview || defaultCover}
                  alt="cover"
                  className={`avatar-preview-image ${type === 'artist' ? 'circle' : ''}`}
                />
                <label className="avatar-preview-badge">
                  <input type="file" accept="image/*" onChange={handleCoverChange} />
                  Сменить
                </label>
              </div>
            </div>

            <div className="auth-form-group">
              <label>{type === 'artist' ? 'Имя исполнителя *' : 'Название *'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {type === 'artist' && (
              <div className="auth-form-group">
                <label>Основной жанр</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {type === 'track' && (
              <div className="auth-form-group">
                <label>Заменить аудиофайл (необязательно)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  disabled={loading}
                />
              </div>
            )}

            {type === 'album' && (
              <div className="auth-form-group">
                <div className="track-list-header">
                  <label>Список треков ({tracks.length} шт.):</label>
                  <button type="button" className="track-list-add-btn" onClick={handleAddTrackSlot}>
                    + Добавить трек
                  </button>
                </div>

                <div className="scrollable-track-list">
                  {tracks.map((track, i) => (
                    <TrackSlotItem
                      key={track.id || `new-${i}`}
                      index={i}
                      track={track}
                      total={tracks.length}
                      onChange={handleTrackChange}
                      onMove={moveTrack}
                      onRemove={handleRemoveTrack}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions-row">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Отмена
              </Button>
              <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}