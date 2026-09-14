import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAudioPlayer } from '../context/AudioContext';
import { useState, useEffect, useRef } from 'react';

import AgeBadge from '../components/AgeBadge';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import prevIcon from '../assets/prev-icon.svg';
import nextIcon from '../assets/next-icon.svg';
import volumeIcon from '../assets/volume-icon.svg';

import '../styles/PlayerPage.css';

export default function PlayerPage() {
  const navigate = useNavigate();
  const {
    currentTrack,
    queue,
    isPlaying,
    playTrack,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    audioRef,
  } = useAudioPlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const SPEED = 45;

    const tick = (time) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      rotationRef.current = (rotationRef.current + SPEED * delta) % 360;
      setRotation(rotationRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isDragging) setProgress(audio.currentTime);
    };
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);

    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioRef, isDragging, currentTrack]);

  if (!currentTrack) {
    return (
      <div className="player-page player-page-empty">
        <div className="player-page-empty-content">
          <h1>Плеер пуст</h1>
          <p>Выберите трек, чтобы начать воспроизведение</p>
          <button
            className="player-page-back-btn"
            onClick={() => navigate('/')}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const currentIdx = queue.findIndex(
    (t) => String(t.id) === String(currentTrack.id),
  );
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx !== -1 && currentIdx + 1 < queue.length;

  const allArtists = [];
  if (currentTrack.artist && currentTrack.artist.name) {
    allArtists.push(currentTrack.artist);
  } else if (typeof currentTrack.artist === 'string') {
    allArtists.push({ id: currentTrack.artist_id, name: currentTrack.artist });
  }
  if (Array.isArray(currentTrack.collaborators)) {
    currentTrack.collaborators.forEach((c) => {
      if (
        c &&
        c.name &&
        !allArtists.some((a) => String(a.id) === String(c.id))
      ) {
        allArtists.push(c);
      }
    });
  }

  const originalTrack = currentTrack.original_track;
  const isCover = currentTrack.is_cover || Boolean(originalTrack);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const newTime = x * duration;
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handlePlayOriginal = () => {
    if (originalTrack) {
      playTrack({
        ...originalTrack,
        cover: originalTrack.cover || currentTrack.cover || defaultCover,
        artist: originalTrack.artist || { name: 'Исполнитель' },
      });
    }
  };

  return (
    <div className="player-page">
      <button className="player-page-back" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <div className="player-page-content">
        <div className="player-page-left">
          <div className="player-page-left-container">
            <div className={`vinyl-wrapper ${isPlaying ? 'spinning' : ''}`}>
              <div
                className="vinyl-disc"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <img
                  src={currentTrack.cover || defaultCover}
                  alt={currentTrack.title}
                  className="vinyl-cover"
                />
                <div className="vinyl-hole" />
              </div>
            </div>
          </div>
        </div>

        <div className="player-page-right">
          <div className="player-page-right-container">
            <div className="player-page-info">
              <h1 className="player-page-title">{currentTrack.title}</h1>

              {currentTrack.age_restriction && (
                <div style={{ marginTop: '8px' }}>
                  <AgeBadge size="large" />
                </div>
              )}

              <div className="player-page-artists">
                {allArtists.map((art, idx) => (
                  <React.Fragment key={art.id || idx}>
                    {art.id ? (
                      <Link
                        to={`/artists/${art.id}`}
                        className="player-page-artist-link"
                      >
                        {art.name}
                      </Link>
                    ) : (
                      <span className="player-page-artist-name">
                        {art.name}
                      </span>
                    )}
                    {idx < allArtists.length - 1 && (
                      <span className="player-page-artist-sep">, </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {isCover && (
              <div
                className={`player-page-cover-badge ${originalTrack ? 'clickable' : ''}`}
                onClick={handlePlayOriginal}
                title={
                  originalTrack ? `Оригинал: ${originalTrack.title}` : 'Кавер'
                }
              >
                кавер
              </div>
            )}

            <div className="player-page-progress">
              <span className="player-page-time">{formatTime(progress)}</span>
              <div
                className="player-page-progress-bar"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onClick={handleSeek}
              >
                <div
                  className="player-page-progress-fill"
                  style={{
                    width: `${duration ? (progress / duration) * 100 : 0}%`,
                  }}
                />
                <div
                  className="player-page-progress-thumb"
                  style={{
                    left: `${duration ? (progress / duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="player-page-time">{formatTime(duration)}</span>
            </div>

            <div className="player-page-controls">
              <button
                type="button"
                className="player-page-btn-secondary"
                onClick={prevTrack}
                disabled={!hasPrev}
                title="Предыдущий трек"
              >
                <img src={prevIcon} alt="Назад" />
              </button>

              <button
                type="button"
                className="player-page-btn-main"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Пауза' : 'Слушать'}
              >
                <img src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause" />
              </button>

              <button
                type="button"
                className="player-page-btn-secondary"
                onClick={nextTrack}
                disabled={!hasNext}
                title="Следующий трек"
              >
                <img src={nextIcon} alt="Вперед" />
              </button>
            </div>

            <div className="player-page-volume">
              <img
                src={volumeIcon}
                alt="Громкость"
                className="player-page-volume-icon"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
