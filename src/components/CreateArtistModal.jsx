import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import ImageCropModal from './ImageCropModal';
import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';

export default function CreateArtistModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [genreSearch, setGenreSearch] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Состояние модального окна кадрирования
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      apiClient
        .getGenres()
        .then((res) => {
          if (res?.data) setAvailableGenres(res.data);
        })
        .catch(() => {});
      setGenreSearch('');
    }
  }, [isOpen]);

  // Фильтрация жанров по поисковому запросу
  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return availableGenres;
    return availableGenres.filter(
      (g) =>
        (g.title_ru && g.title_ru.toLowerCase().includes(q)) ||
        (g.key && g.key.toLowerCase().includes(q))
    );
  }, [availableGenres, genreSearch]);

  if (!isOpen) return null;

  // Выбор файла и открытие кадрирования
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setRawImageSrc(objectUrl);
      setCropModalOpen(true);
    }
    e.target.value = '';
  };

  // Завершение кадрирования аватара
  const handleCropComplete = (croppedFile, previewUrl) => {
    setAvatar(croppedFile);
    setAvatarPreview(previewUrl);
  };

  const handleToggleGenre = (genreKey) => {
    setSelectedGenres((prev) =>
      prev.includes(genreKey)
        ? prev.filter((k) => k !== genreKey)
        : [...prev, genreKey]
    );
  };

  const handleReset = () => {
    setName('');
    setSelectedGenres([]);
    setGenreSearch('');
    setAvatar(null);
    setAvatarPreview('');
    setRawImageSrc('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedGenres.length === 0) {
      setErrorMsg('Выберите хотя бы один жанр из кластера');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('genre', selectedGenres.join(', '));
    selectedGenres.forEach((g) => formData.append('genres[]', g));
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
    <>
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        cropShape="circle"
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      <div
        className="modal-background"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-window" style={{ maxWidth: '520px' }}>
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
                      ref={fileInputRef}
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label style={{ margin: 0 }}>Жанры артиста *</label>
                  {selectedGenres.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#2563eb',
                        fontWeight: 600,
                      }}
                    >
                      Выбрано: {selectedGenres.length}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  className="input-element"
                  placeholder="Поиск жанра по названию..."
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  disabled={loading}
                  style={{ marginBottom: '8px' }}
                />

                <div className="genres-selector-list">
                  {filteredGenres.length === 0 ? (
                    <div
                      style={{
                        padding: '8px',
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                      }}
                    >
                      Жанр не найден
                    </div>
                  ) : (
                    filteredGenres.map((g) => {
                      const isSelected = selectedGenres.includes(g.key);
                      return (
                        <button
                          key={g.key}
                          type="button"
                          className={`genre-chip-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleGenre(g.key)}
                          disabled={loading}
                        >
                          {g.title_ru}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !name.trim() || selectedGenres.length === 0}
              >
                {loading ? 'Создание...' : 'Отправить на модерацию'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}