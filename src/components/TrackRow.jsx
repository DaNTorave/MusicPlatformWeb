import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  const [duration, setDuration] = useState(() => track.duration_seconds || track.duration || 0);

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
        if (isMounted && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
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

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const artistsList = [];
  if (track.artist && track.artist.name) {
    artistsList.push(track.artist);
  }
  if (Array.isArray(track.collaborators)) {
    track.collaborators.forEach((c) => {
      if (c && c.name && !artistsList.some((a) => String(a.id) === String(c.id))) {
        artistsList.push(c);
      }
    });
  }

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
        
        <div className="track-row-artists-list" onClick={(e) => e.stopPropagation()}>
          {artistsList.length > 0 ? (
            artistsList.map((art, idx) => (
              <React.Fragment key={art.id || idx}>
                {art.id ? (
                  <Link to={`/artists/${art.id}`} className="track-row-artist-link">
                    {art.name}
                  </Link>
                ) : (
                  <span className="track-row-artist-name">{art.name}</span>
                )}
                {idx < artistsList.length - 1 && <span className="artist-separator">, </span>}
              </React.Fragment>
            ))
          ) : (
            <span className="track-row-artist-name">Неизвестный исполнитель</span>
          )}
        </div>
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