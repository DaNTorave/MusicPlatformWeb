import React, { useState } from 'react';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';

export default function CreateArtistModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setName('');
    setGenre('');
    setAvatar(null);
    setAvatarPreview('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('genre', genre.trim());
    if (avatar) formData.append('avatar', avatar);

    try {
      const response = await apiClient.upload('/api/upload/artist', formData);
      setSuccessMsg('Артист успешно отправлен на модерацию!');
      setTimeout(() => {
        handleReset();
        if (onSuccess) onSuccess(response.artist);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Ошибка создания артиста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window" style={{ maxWidth: '500px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Новый исполнитель
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content">
          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
            {successMsg && (
              <div className="auth-success-global">{successMsg}</div>
            )}

            <div className="avatar-preview-container">
              <div className="avatar-preview-wrapper">
                <img
                  src={avatarPreview || defaultAvatar}
                  alt="Предпросмотр аватара"
                  className="avatar-preview-image circle"
                />
                <label className="avatar-preview-badge">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={loading}
                  />
                  {avatarPreview ? 'Сменить' : 'Выбрать фото'}
                </label>
              </div>
            </div>

            <div className="auth-form-group">
              <label>Имя исполнителя / Название группы *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Queen, Miyagi..."
                required
                disabled={loading}
              />
            </div>

            <div className="auth-form-group">
              <label>Жанр *</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Rock, Hip-Hop, Electronic..."
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !name.trim() || !genre.trim()}
            >
              {loading ? 'Создание...' : 'Отправить на модерацию'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}