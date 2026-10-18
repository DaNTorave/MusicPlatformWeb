import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { apiClient } from '../api/apiClient';

import AgeBadge from './AgeBadge';
import AddToPlaylistModal from './AddToPlaylistModal';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import favoriteIcon from '../assets/favorite.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import editIcon from '../assets/edit-icon.svg';
import closeIcon from '../assets/close-icon.svg';
import downloadIcon from '../assets/download-icon.svg';
import moreIcon from '../assets/more-icon.svg';
import playlistIcon from '../assets/playlist-icon.svg';

import '../styles/TrackRow.css';

export default function TrackRow({
  index,
  track,
  isPlaying = false,
  onPlay,
  onEdit,
  canEdit = false,
  onDelete,
  canDelete = false,
  onRemoveFromPlaylist,
  showAlbumPosition = false,
  showCoverImg = true,
  isFavorite: explicitIsFavorite,
  onToggleFavorite,
}) {
  // Получение функций проверки и изменения статуса избранного из контекста
  const { isFavorite: checkFavorite, toggleFavorite: ctxToggleFavorite } =
    useFavorites();

  // Вычисление итогового состояния избранного
  const isFavorite =
    explicitIsFavorite !== undefined
      ? explicitIsFavorite
      : checkFavorite(track?.id);

  const [duration, setDuration] = useState(
    () => track.duration_seconds || track.duration || 0,
  );

  // Состояния меню действий, направления открытия и модального окна выбора плейлиста
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState('down');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const menuWrapperRef = useRef(null);

  const currentUser = apiClient.getUser();

  // Закрытие всплывающего меню при клике вне его области
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Определение длительности через загрузку метаданных при ее отсутствии
  useEffect(() => {
    const directDur = track.duration_seconds || track.duration;
    if (directDur && directDur > 0) {
      setDuration(directDur);
      return;
    }

    if (track.id) {
      let isMounted = true;
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = `/api/stream/${track.id}`;

      const handleLoadedMetadata = () => {
        if (
          isMounted &&
          audio.duration &&
          !isNaN(audio.duration) &&
          isFinite(audio.duration)
        ) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        isMounted = false;
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeAttribute('src');
        audio.load();
      };
    }
  }, [track.id, track.duration_seconds, track.duration]);

  // Обработка нажатия на кнопку добавления в избранное
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(track.id);
    } else {
      ctxToggleFavorite(track.id);
    }
  };

  // Форматирование секунд в минуты и секунды
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Построение списка исполнителей
  const artistsList = [];
  if (track.artist && track.artist.name) {
    artistsList.push(track.artist);
  }
  if (Array.isArray(track.collaborators)) {
    track.collaborators.forEach((c) => {
      if (
        c &&
        c.name &&
        !artistsList.some((a) => String(a.id) === String(c.id))
      ) {
        artistsList.push(c);
      }
    });
  }

  const originalTrack = track.original_track;
  const isCover =
    track.is_cover ||
    Boolean(track.original_track_id) ||
    Boolean(originalTrack);

  // Переключение на воспроизведение оригинальной композиции
  const handleCoverClick = (e) => {
    e.stopPropagation();
    if (originalTrack && onPlay) {
      onPlay({
        ...originalTrack,
        cover: originalTrack.cover || track.cover || defaultCover,
        artist: originalTrack.artist || { name: 'Исполнитель' },
      });
    }
  };

  // Скачивание файла композиции
  const handleDownload = (e) => {
    if (e) e.stopPropagation();
    if (!track.id) return;
    const link = document.createElement('a');
    link.href = `/api/download/${track.id}`;
    link.download = `${track.title || 'track'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Открытие окна выбора плейлиста
  const handleOpenAddToPlaylist = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!currentUser) {
      alert('Войдите в аккаунт, чтобы добавлять треки в плейлисты');
      return;
    }
    setIsPlaylistModalOpen(true);
  };

  // Вычисление направления открытия меню относительно границ родительского блока и окна
  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && menuWrapperRef.current) {
      const buttonRect = menuWrapperRef.current.getBoundingClientRect();
      const container = menuWrapperRef.current.closest(
        '.scrollable-chart-list, .album-tracks-container, .artist-section, .profile-section',
      );

      const estimatedMenuHeight = onRemoveFromPlaylist ? 195 : 150;
      const playerBar = document.querySelector('.global-player-bar');
      const playerHeight = playerBar ? playerBar.offsetHeight : 0;
      const viewportBottom = window.innerHeight - playerHeight - 12;
      const viewportTop = 70;

      let bottomBoundary = viewportBottom;
      let topBoundary = viewportTop;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        bottomBoundary = Math.min(viewportBottom, containerRect.bottom);
        topBoundary = Math.max(viewportTop, containerRect.top);
      }

      const spaceBelow = bottomBoundary - buttonRect.bottom;
      const spaceAbove = buttonRect.top - topBoundary;

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setMenuDirection('up');
      } else {
        setMenuDirection('down');
      }
    }
    setIsMenuOpen((prev) => !prev);
  };

  const displayNum =
    showAlbumPosition && track.position ? track.position : index + 1;

  return (
    <>
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        track={track}
      />

      <div
        className={`track-row-item ${isPlaying ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
        onClick={() => onPlay && onPlay(track)}
      >
        <span className="track-row-num">{displayNum}</span>

        {showCoverImg ? (
          <div className="track-row-cover-wrapper">
            <img
              src={track.cover || defaultCover}
              alt={track.title}
              className="track-row-cover"
            />

            <button
              type="button"
              className={`track-cover-play-btn ${isPlaying ? 'visible' : ''}`}
              title={isPlaying ? 'Пауза' : 'Слушать'}
              onClick={(e) => {
                e.stopPropagation();
                onPlay && onPlay(track);
              }}
            >
              <img
                src={isPlaying ? pauseIcon : playIcon}
                alt="Play/Pause"
                className="player-icon-svg"
              />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`track-play-btn ${isPlaying ? 'visible' : ''}`}
            title={isPlaying ? 'Пауза' : 'Слушать'}
            onClick={(e) => {
              e.stopPropagation();
              onPlay && onPlay(track);
            }}
          >
            <img
              src={isPlaying ? pauseIcon : playIcon}
              alt="Play/Pause"
              className="player-icon-svg"
            />
          </button>
        )}

        <div className="track-row-main">
          <div className="track-row-title-container">
            <Link
              to={`/tracks/${track.id}`}
              className="track-row-title track-row-title-link"
              title={track.title}
              onClick={(e) => e.stopPropagation()}
            >
              {track.title}
            </Link>
            {track.age_restriction && <AgeBadge size="small" />}
            {isCover && (
              <span
                className={`track-cover-badge ${originalTrack ? 'clickable' : ''}`}
                onClick={handleCoverClick}
                title={
                  originalTrack
                    ? `Оригинал: ${originalTrack.title} (${originalTrack.artist?.name || 'Артист'})`
                    : 'Кавер-версия'
                }
              >
                кавер
              </span>
            )}
          </div>

          <div
            className="track-row-artists-list"
            onClick={(e) => e.stopPropagation()}
          >
            {artistsList.length > 0 ? (
              artistsList.map((art, idx) => (
                <React.Fragment key={art.id || idx}>
                  {art.id ? (
                    <Link
                      to={`/artists/${art.id}`}
                      className="track-row-artist-link"
                    >
                      {art.name}
                    </Link>
                  ) : (
                    <span className="track-row-artist-name">{art.name}</span>
                  )}
                  {idx < artistsList.length - 1 && (
                    <span className="artist-separator">, </span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="track-row-artist-name">
                Неизвестный исполнитель
              </span>
            )}
          </div>
        </div>

        <div className="track-row-duration">{formatDuration(duration)}</div>

        <div className="track-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`track-action-btn ${isFavorite ? 'active-fav' : ''}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <img
              src={favoriteIcon}
              alt="Favorite"
              className={`action-icon ${isFavorite ? 'fav-icon-active' : ''}`}
            />
          </button>

          <button
            type="button"
            className="track-action-btn download-btn"
            onClick={handleDownload}
            title="Скачать трек"
          >
            <img src={downloadIcon} alt="Скачать" className="action-icon" />
          </button>

          {/* Кнопка с тремя точками и всплывающее меню действий */}
          <div className="track-more-wrapper" ref={menuWrapperRef}>
            <button
              type="button"
              className={`track-action-btn more-btn ${isMenuOpen ? 'is-open' : ''}`}
              onClick={handleToggleMenu}
              title="Действия с треком"
            >
              <img src={moreIcon} alt="Меню" className="action-icon" />
            </button>

            {isMenuOpen && (
              <div
                className={`track-more-popover ${menuDirection === 'up' ? 'open-up' : 'open-down'}`}
              >
                <button
                  type="button"
                  className="track-more-item"
                  onClick={handleOpenAddToPlaylist}
                >
                  <img
                    src={playlistIcon}
                    alt="Плейлист"
                    className="track-more-item-icon"
                  />
                  <span>Добавить в плейлист</span>
                </button>

                <button
                  type="button"
                  className="track-more-item"
                  onClick={(e) => {
                    handleFavoriteClick(e);
                    setIsMenuOpen(false);
                  }}
                >
                  <img
                    src={favoriteIcon}
                    alt="Избранное"
                    className="track-more-item-icon"
                  />
                  <span>
                    {isFavorite ? 'Убрать из избранного' : 'В избранное'}
                  </span>
                </button>

                <button
                  type="button"
                  className="track-more-item"
                  onClick={(e) => {
                    handleDownload(e);
                    setIsMenuOpen(false);
                  }}
                >
                  <img
                    src={downloadIcon}
                    alt="Скачать"
                    className="track-more-item-icon"
                  />
                  <span>Скачать трек</span>
                </button>

                {onRemoveFromPlaylist && (
                  <button
                    type="button"
                    className="track-more-item danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onRemoveFromPlaylist(track.id);
                    }}
                  >
                    <img
                      src={closeIcon}
                      alt="Убрать"
                      className="track-more-item-icon"
                    />
                    <span>Убрать из плейлиста</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {canEdit && (
            <button
              type="button"
              className="track-action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(track);
              }}
              title="Редактировать трек"
            >
              <img src={editIcon} alt="Редактировать" className="action-icon" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="track-action-btn delete-btn"
              onClick={(e) => onDelete && onDelete(e, track.id)}
              title="Удалить трек"
            >
              <img src={closeIcon} alt="Удалить" className="action-icon" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}