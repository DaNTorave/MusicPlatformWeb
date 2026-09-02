import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../context/AudioContext';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import prevIcon from '../assets/prev-icon.svg';
import nextIcon from '../assets/next-icon.svg';
import volumeIcon from '../assets/volume-icon.svg';

import '../styles/GlobalPlayer.css';

export default function GlobalPlayer() {
  const { currentTrack, queue, isPlaying, playTrack, nextTrack, prevTrack, volume, setVolume, audioRef } = useAudioPlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isDragging) setProgress(audio.currentTime);
    };

    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioRef, isDragging]);

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

  if (!currentTrack) return null;

  const currentIdx = queue.findIndex(t => t.id === currentTrack.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx !== -1 && currentIdx + 1 < queue.length;

  const targetArtistId = currentTrack.artist?.id || currentTrack.artist_id;
  const artistName = currentTrack.artist?.name || (typeof currentTrack.artist === 'string' ? currentTrack.artist : 'Исполнитель');

  return (
    <div className="global-player-bar">
      <div className="player-track-info">
        <img src={currentTrack.cover || defaultCover} alt="cover" className="player-cover" />
        <div className="player-track-meta">
          <div className="player-title" title={currentTrack.title}>{currentTrack.title}</div>
          {targetArtistId ? (
            <Link 
              to={`/artists/${targetArtistId}`} 
              className="player-artist player-artist-link"
              title={artistName}
            >
              {artistName}
            </Link>
          ) : (
            <span className="player-artist">{artistName}</span>
          )}
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            type="button"
            className="player-btn-secondary"
            onClick={prevTrack}
            disabled={!hasPrev && (!audioRef.current || audioRef.current.currentTime === 0)}
            title="Предыдущий трек"
          >
            <img src={prevIcon} alt="Назад" className="player-nav-icon" />
          </button>

          <button onClick={() => playTrack(currentTrack)} className="player-btn-main" title={isPlaying ? 'Пауза' : 'Слушать'}>
            <img src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause" className="player-main-icon" />
          </button>

          <button
            type="button"
            className="player-btn-secondary"
            onClick={nextTrack}
            disabled={!hasNext}
            title="Следующий трек"
          >
            <img src={nextIcon} alt="Вперед" className="player-nav-icon" />
          </button>
        </div>

        <div className="player-progress-container">
          <span className="player-time">{formatTime(progress)}</span>
          <div
            className="player-progress-bar"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onClick={handleSeek}
          >
            <div
              className="player-progress-fill"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
            <div
              className="player-progress-thumb"
              style={{ left: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right-controls">
        <img src={volumeIcon} alt="Громкость" className="player-volume-icon" />
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
  );
}