import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

import Button from './Button';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';
import '../styles/Playlists.css';

// Форма создания и редактирования плейлиста для встраивания в модальное окно
export function PlaylistFormContent({
  playlist = null,
  onCancel,
  onSuccess,
  cancelLabel = 'Отмена',
}) {
  // Состояния полей формы плейлиста
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditMode = Boolean(playlist && playlist.id);

  // Заполнение данных при инициализации формы
  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title || '');
      setIsPublic(
        playlist.is_public !== undefined ? Boolean(playlist.is_public) : true,
      );
      setCoverPreview(playlist.cover || '');
    } else {
      setTitle('');
      setIsPublic(true);
      setCoverPreview('');
    }
    setCoverFile(null);
    setErrorMsg('');
  }, [playlist]);

  // Выбор файла обложки
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Отправка данных плейлиста на сервер
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Введите название плейлиста');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('is_public', isPublic ? 'true' : 'false');
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      let response;
      if (isEditMode) {
        response = await apiClient.updatePlaylist(playlist.id, formData);
      } else {
        response = await apiClient.createPlaylist(formData);
      }

      window.dispatchEvent(new CustomEvent('playlists:updated'));
      if (onSuccess) onSuccess(response?.playlist);
    } catch (err) {
      setErrorMsg(
        err.data?.error || err.message || 'Ошибка сохранения плейлиста',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMsg && <div className="auth-error-global">{errorMsg}</div>}

      <div className="avatar-preview-container">
        <div className="avatar-preview-wrapper playlist-cover-preview-box">
          <img
            src={coverPreview || defaultCover}
            alt="Обложка плейлиста"
            className="avatar-preview-image"
          />
          <label className="avatar-preview-badge">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              disabled={loading}
            />
            Обложка
          </label>
        </div>
      </div>

      <div className="auth-form-group">
        <label>Название плейлиста *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите название плейлиста"
          required
          disabled={loading}
          autoFocus
        />
      </div>

      <div className="playlist-privacy-box">
        <label className="playlist-privacy-label">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={loading}
          />
          <span
            className={`playlist-privacy-pill ${isPublic ? 'is-on' : 'is-off'}`}
          >
            {isPublic ? 'Вкл' : 'Выкл'}
          </span>
          <div className="playlist-privacy-text-group">
            <span className="playlist-privacy-title">
              Публичный
            </span>
            <span className="playlist-privacy-hint">
              {isPublic
                ? 'Плейлист отображается в профиле пользователя'
                : 'Не отображается в профиле, но его можно открыть и послушать по ссылке'}
            </span>
          </div>
        </label>
      </div>

      <div className="modal-actions-row">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !title.trim()}
        >
          {loading
            ? 'Сохранение...'
            : isEditMode
              ? 'Сохранить'
              : 'Создать плейлист'}
        </Button>
      </div>
    </form>
  );
}

export default function PlaylistModal({
  isOpen,
  onClose,
  playlist = null,
  onSuccess,
}) {
  if (!isOpen) return null;

  const isEditMode = Boolean(playlist && playlist.id);

  // Обработка успешного сохранения плейлиста
  const handleSuccess = (savedPlaylist) => {
    if (onSuccess) onSuccess(savedPlaylist);
    onClose();
  };

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window" style={{ maxWidth: '500px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            {isEditMode ? 'Редактирование плейлиста' : 'Новый плейлист'}
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content">
          <PlaylistFormContent
            playlist={playlist}
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}