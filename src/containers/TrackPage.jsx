import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import AgeBadge from '../components/AgeBadge';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';
import downloadIcon from '../assets/download-icon.svg';

import '../styles/TrackPage.css';

export default function TrackPage() {
  const { id } = useParams();
  // Состояния трека, загрузки и ошибок
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();

  // Загрузка данных трека
  useEffect(() => {
    const fetchTrack = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.request(`/api/tracks/${id}`);
        if (res?.track) {
          setTrack(res.track);
        } else {
          const chartsRes = await apiClient.request('/api/charts/tracks');
          const found = chartsRes?.data?.find(
            (t) => String(t.id) === String(id),
          );
          if (found) {
            setTrack(found);
          } else {
            setError('Трек не найден');
          }
        }
      } catch (err) {
        setError(err.data?.error || err.message || 'Ошибка загрузки трека');
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [id]);

  if (loading) {
    return (
      <div className="track-page-state">Загрузка информации о треке...</div>
    );
  }

  if (error || !track) {
    return (
      <div className="track-page-state error">{error || 'Трек не найден'}</div>
    );
  }

  const isCurrentActive =
    currentTrack && String(currentTrack.id) === String(track.id);
  const isPlayingNow = isCurrentActive && isPlaying;

  // Формирование списка исполнителей
  const allArtists = [];
  if (track.artist && track.artist.name) {
    allArtists.push(track.artist);
  }
  if (Array.isArray(track.collaborators)) {
    track.collaborators.forEach((c) => {
      if (
        c &&
        c.name &&
        !allArtists.some((a) => String(a.id) === String(c.id))
      ) {
        allArtists.push(c);
      }
    });
  }

  // Переключение воспроизведения
  const handleTogglePlay = () => {
    playTrack(track);
  };

  // Скачивание трека
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/download/${track.id}`;
    link.download = `${track.title || 'track'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Форматирование длительности
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="track-page">
      <div className="track-page-header">
        <div className="track-page-cover-wrapper">
          <img
            src={track.cover || defaultCover}
            alt={track.title}
            className="track-page-cover"
          />
        </div>

        <div className="track-page-meta">
          <div className="track-page-badges">
            <span className="track-badge-type">
              {track.is_single
                ? 'Сингл'
                : `Трек #${track.position || 1} из альбома`}
            </span>
            {track.age_restriction && <AgeBadge size="medium" />}
            {track.is_cover && <span className="track-badge-cover">Кавер</span>}
          </div>

          <h1 className="track-page-title">{track.title}</h1>

          <div className="track-page-artists">
            <span className="track-meta-label">Исполнитель: </span>
            {allArtists.map((art, idx) => (
              <React.Fragment key={art.id || idx}>
                {art.id ? (
                  <Link
                    to={`/artists/${art.id}`}
                    className="track-page-artist-link"
                  >
                    {art.name}
                  </Link>
                ) : (
                  <span>{art.name}</span>
                )}
                {idx < allArtists.length - 1 && <span>, </span>}
              </React.Fragment>
            ))}
          </div>

          {track.album && !track.is_single && (
            <div className="track-page-album">
              <span className="track-meta-label">Альбом: </span>
              <Link
                to={`/albums/${track.album.id}`}
                className="track-page-album-link"
              >
                {track.album.title}
              </Link>
              {track.album.release_year && (
                <span style={{ color: '#64748b' }}>
                  {' '}
                  ({track.album.release_year})
                </span>
              )}
            </div>
          )}

          {track.is_single && (
            <div className="track-page-album">
              <span className="track-meta-label">Релиз: </span>
              <strong>Сингл</strong>
            </div>
          )}

          <div className="track-page-stats">
            {track.release_year && (
              <>
                Год: <strong>{track.release_year}</strong> •{' '}
              </>
            )}
            Длительность:{' '}
            <strong>{formatDuration(track.duration_seconds)}</strong> •
            Прослушиваний: <strong>{track.plays_count || 0}</strong>
          </div>

          <div className="track-page-actions">
            <button
              type="button"
              className="track-page-main-play-btn"
              onClick={handleTogglePlay}
            >
              <img src={isPlayingNow ? pauseIcon : playIcon} alt="Play" />
              <span>{isPlayingNow ? 'Пауза' : 'Слушать'}</span>
            </button>

            <button
              type="button"
              className="track-page-download-btn"
              onClick={handleDownload}
              title="Скачать трек"
            >
              <img src={downloadIcon} alt="Скачать" />
              <span>Скачать</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
