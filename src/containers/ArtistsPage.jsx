import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import InputField from '../components/InputField';
import Button from '../components/Button';
import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import searchIcon from '../assets/search-icon.svg';

import '../styles/ArtistPage.css';
import '../styles/Content.css';
import '../styles/ArtistsPage.css';

export default function ArtistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGenre = searchParams.get('genre') || '';

  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Загрузка жанров
  useEffect(() => {
    apiClient.getGenres().then((res) => {
      if (res?.data) setGenres(res.data);
    }).catch(() => {});
  }, []);

  // Загрузка артистов с учетом фильтра
  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getArtists({
        genre: selectedGenre,
        search: searchQuery,
      });
      if (res?.data) {
        setArtists(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, [selectedGenre, searchQuery]);

  // Смена жанрового фильтра
  const handleSelectGenre = (key) => {
    if (selectedGenre === key) {
      searchParams.delete('genre');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ genre: key });
    }
  };

  return (
    <div className="artists-catalog-page">
      <div className="artists-catalog-header">
        <div>
          <span className="artist-tag">Каталог</span>
          <h1 className="artist-title">Все исполнители</h1>
          <p className="artist-meta-string" style={{ paddingLeft: 0 }}>
            Найдено артистов: {artists.length}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          onClick={() => navigate('/')}
        >
          На главную
        </Button>
      </div>

      {/* Поисковая строка по артистам */}
      <div className="content-search" style={{ marginBottom: '1rem' }}>
        <div className="search-bar-wrapper">
          <InputField
            type="text"
            placeholder="Поиск исполнителя по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            clearable
            onClear={() => setSearchQuery('')}
            leftIcon={<img src={searchIcon} alt="Поиск" />}
          />
        </div>
      </div>

      {/* Горизонтальный фильтр по кнопкам жанров */}
      <div className="genres-filter-bar">
        <button
          type="button"
          className={`genre-filter-chip ${!selectedGenre ? 'active' : ''}`}
          onClick={() => {
            searchParams.delete('genre');
            setSearchParams(searchParams);
          }}
        >
          Все жанры
        </button>

        {genres.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`genre-filter-chip ${selectedGenre === g.key ? 'active' : ''}`}
            onClick={() => handleSelectGenre(g.key)}
          >
            {g.title_ru}
          </button>
        ))}
      </div>

      {/* Сетка артистов */}
      <div className="artist-section">
        {loading ? (
          <p className="empty-text">Загрузка каталога исполнителей...</p>
        ) : artists.length === 0 ? (
          <p className="empty-text">По заданным параметрам артисты не найдены.</p>
        ) : (
          <div className="artists-grid">
            {artists.map((artist) => {
              const artistGenres = Array.isArray(artist.genres) && artist.genres.length > 0
                ? artist.genres
                : (artist.genre ? artist.genre.split(',').map((s) => s.trim()) : []);

              return (
                <div
                  key={artist.id}
                  className="artist-card"
                  onClick={() => navigate(`/artists/${artist.id}`)}
                >
                  <img
                    src={artist.avatar || defaultAvatar}
                    alt={artist.name}
                    className="artist-card-avatar"
                  />
                  <div className="artist-card-info">
                    <h3 className="artist-card-name">{artist.name}</h3>

                    {/* Жанры артиста в виде ссылок на страницу /artists?genre= */}
                    <div
                      className="artist-card-genres-links"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {artistGenres.map((gKey, idx) => {
                        const matched = genres.find((g) => g.key === gKey);
                        const label = matched ? matched.title_ru : gKey;
                        return (
                          <p
                            key={idx}
                            className="artist-genre-pill-link"
                          >
                            {label}
                          </p>
                        );
                      })}
                    </div>

                    <span className="artist-card-plays">
                      {artist.plays_count || 0} прослушиваний
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}