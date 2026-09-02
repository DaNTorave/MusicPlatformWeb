import React, { useState, useEffect } from 'react';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import favoriteIcon from '../assets/favorite.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import editIcon from '../assets/edit-icon.svg';
import closeIcon from '../assets/close-icon.svg';

import '../styles/TrackRow.css';

export default function TrackRow({
  index,
  track,
  isPlaying = false,
  onPlay,
  onEdit,
  canEdit = false,
  onDelete,
  canDelete = false
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [duration, setDuration] = useState(track.duration_seconds || track.duration || 0);

  useEffect(() => {
    if (track.duration_seconds && track.duration_seconds > 0) {
      setDuration(track.duration_seconds);
      return;
    }

    if (track.id) {
      const audio = new Audio(`/api/stream/${track.id}`);
      const handleLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.src = '';
      };
    }
  }, [track.id, track.duration_seconds]);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`track-row-item ${isPlaying ? 'active' : ''}`}
      onClick={() => onPlay && onPlay(track)}
    >
      <span className="track-row-num">{index + 1}</span>

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
          <img src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause" className="player-icon-svg" />
        </button>
      </div>

      <div className="track-row-main">
        <span className="track-row-title" title={track.title}>{track.title}</span>
        {track.artist?.name && (
          <span className="track-row-artist">{track.artist.name}</span>
        )}
      </div>

      <div className="track-row-duration">
        {formatDuration(duration)}
      </div>

      <div className="track-row-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`track-action-btn ${isFavorite ? 'active-fav' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          title="Добавить в избранное"
        >
          <img 
            src={favoriteIcon} 
            alt="Favorite" 
            className={`action-icon ${isFavorite ? 'fav-icon-active' : ''}`} 
          />
        </button>

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
  );
}