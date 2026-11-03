import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import InputField from './InputField';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import searchIcon from '../assets/search-icon.svg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/AuthModal.css';
import '../styles/PreferencesModal.css';

export function PreferencesFormContent({
  initialGenres = [],
  initialArtistIds = [],
  onComplete,
  onCancel,
  submitLabel = 'Сохранить',
}) {
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(initialGenres);
  const [selectedArtistIds, setSelectedArtistIds] = useState(initialArtistIds);

  const [genreSearch, setGenreSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Загрузка утвержденного кластера жанров и списка исполнителей
  useEffect(() => {
    Promise.all([apiClient.getGenres(), apiClient.getArtists()])
      .then(([genresRes, artistsRes]) => {
        if (genresRes?.data) setGenres(genresRes.data);
        if (artistsRes?.data) setArtists(artistsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Переключение жанра с каскадным удалением привязанных исполнителей
  const handleToggleGenre = (genreKey) => {
    if (selectedGenres.includes(genreKey)) {
      const nextGenres = selectedGenres.filter((k) => k !== genreKey);
      setSelectedGenres(nextGenres);

      // Автоматическое удаление исполнителя, если ни один из его жанров больше не выбран
      setSelectedArtistIds((prevIds) =>
        prevIds.filter((aId) => {
          const artist = artists.find((a) => a.id === aId);
          if (!artist) return false;
          const artistGenres =
            Array.isArray(artist.genres) && artist.genres.length > 0
              ? artist.genres
              : artist.genre
                ? artist.genre.split(',').map((s) => s.trim())
                : [];
          return artistGenres.some((g) => nextGenres.includes(g));
        }),
      );
    } else {
      setSelectedGenres([...selectedGenres, genreKey]);
    }
  };

  // Переключение выбора исполнителя
  const handleToggleArtist = (artistId) => {
    setSelectedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId],
    );
  };

  // Формирование списка кандидатов исполнителей для второго шага
  const candidateArtists = useMemo(() => {
    let list = artists;
    if (selectedGenres.length > 0) {
      list = artists.filter((artist) => {
        const artistGenres =
          Array.isArray(artist.genres) && artist.genres.length > 0
            ? artist.genres
            : artist.genre
              ? artist.genre.split(',').map((s) => s.trim())
              : [];
        return artistGenres.some((g) => selectedGenres.includes(g));
      });
    } else {
      list = [...artists].sort(
        (a, b) => (b.plays_count || 0) - (a.plays_count || 0),
      );
    }

    if (!artistSearch.trim()) return list;
    const q = artistSearch.trim().toLowerCase();
    return list.filter((a) => a.name && a.name.toLowerCase().includes(q));
  }, [artists, selectedGenres, artistSearch]);

  // Фильтрация жанров по поисковой строке
  const filteredGenres = useMemo(() => {
    const q = genreSearch.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter(
      (g) =>
        (g.title_ru && g.title_ru.toLowerCase().includes(q)) ||
        (g.key && g.key.toLowerCase().includes(q)),
    );
  }, [genres, genreSearch]);

  if (loading) {
    return <p className="status-message">Загрузка данных...</p>;
  }

  return (
    <div className="preferences-step-flow">
      {step === 1 && (
        <div className="preferences-step">
          <h2 className="auth-form-title">Выберите любимые жанры</h2>
          <p className="auth-form-subtitle">
            Шаг 1 из 2. Выбор жанров необязателен. Нажмите «Далее» для продолжения.
          </p>

          <InputField
            type="text"
            placeholder="Поиск по жанрам..."
            value={genreSearch}
            onChange={(e) => setGenreSearch(e.target.value)}
            clearable
            onClear={() => setGenreSearch('')}
            leftIcon={<img src={searchIcon} alt="Поиск" />}
          />

          <div className="preferences-selector-list">
            {filteredGenres.map((g) => {
              const isSelected = selectedGenres.includes(g.key);
              return (
                <button
                  key={g.key}
                  type="button"
                  className={`genre-chip-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleToggleGenre(g.key)}
                >
                  {g.title_ru}
                </button>
              );
            })}
          </div>

          <div className="modal-actions-row">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Отмена
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => setStep(2)}
            >
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="preferences-step">
          <h2 className="auth-form-title">
            {selectedGenres.length > 0
              ? 'Выберите исполнителей'
              : 'Популярные исполнители'}
          </h2>
          <p className="auth-form-subtitle">
            {selectedGenres.length > 0
              ? 'Исполнители, работающие в выбранных жанрах (необязательно)'
              : 'Жанры не выбраны. Показаны популярные исполнители (необязательно)'}
          </p>

          <InputField
            type="text"
            placeholder="Поиск исполнителя..."
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
            clearable
            onClear={() => setArtistSearch('')}
            leftIcon={<img src={searchIcon} alt="Поиск" />}
          />

          <div className="preferences-artists-grid">
            {candidateArtists.length === 0 ? (
              <p className="empty-text">Исполнители не найдены</p>
            ) : (
              candidateArtists.map((artist) => {
                const isSelected = selectedArtistIds.includes(artist.id);
                return (
                  <div
                    key={artist.id}
                    className={`preferences-artist-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleToggleArtist(artist.id)}
                  >
                    <img
                      src={artist.avatar || defaultAvatar}
                      alt={artist.name}
                      className="preferences-artist-avatar"
                    />
                    <div className="preferences-artist-name">
                      {artist.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="modal-actions-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Назад
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => onComplete(selectedGenres, selectedArtistIds)}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreferencesStepModal({
  isOpen,
  onClose,
  initialGenres = [],
  initialArtistIds = [],
  onComplete,
  submitLabel = 'Сохранить предпочтения',
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window" style={{ maxWidth: '540px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Настройка предпочтений
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
          <PreferencesFormContent
            initialGenres={initialGenres}
            initialArtistIds={initialArtistIds}
            onCancel={onClose}
            onComplete={onComplete}
            submitLabel={submitLabel}
          />
        </div>
      </div>
    </div>
  );
}