import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import UploadMusicModal from '../components/UploadMusicModal';
import EditEntityModal from '../components/EditEntityModal';
import Button from '../components/Button';
import TrackRow from '../components/TrackRow';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';

import defaultCover from '../assets/Шотландская веслоухая.jpg';
import edit_icon from '../assets/edit-icon.svg';
import close_icon from '../assets/close-icon.svg';

import '../styles/ArtistPage.css';

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [editModal, setEditModal] = useState({ isOpen: false, item: null, type: null });

  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  const fetchArtist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request(`/api/artists/${id}`);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка загрузки артиста');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const handleDeleteArtist = async () => {
    if (!window.confirm('Удалить исполнителя и все его релизы?')) return;
    try {
      await apiClient.request(`/api/artists/${id}`, { method: 'DELETE', requireAuth: true });
      navigate('/');
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const handleDeleteAlbum = async (e, albumId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этот альбом и все треки в нем?')) return;
    try {
      await apiClient.request(`/api/albums/${albumId}`, { method: 'DELETE', requireAuth: true });
      fetchArtist();
    } catch (e) {
      alert(e.message || 'Ошибка удаления альбома');
    }
  };

  const handleDeleteTrack = async (e, trackId) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Удалить этот трек?')) return;
    try {
      await apiClient.request(`/api/tracks/${trackId}`, { method: 'DELETE', requireAuth: true });
      fetchArtist();
    } catch (e) {
      alert(e.message || 'Ошибка удаления трека');
    }
  };

  const popularTracks = useMemo(() => {
    if (!data) return [];
    
    const fromAlbums = (data.albums || []).flatMap(a => 
      (a.tracks || []).map(t => ({ 
        ...t, 
        albumTitle: a.title, 
        cover: t.cover || a.cover || data.artist.avatar,
        artist: t.artist || { id: data.artist.id, name: data.artist.name } 
      }))
    );

    const singles = (data.singles || []).map(s => ({
      ...s,
      cover: s.cover || data.artist.avatar,
      artist: s.artist || { id: data.artist.id, name: data.artist.name }
    }));

    const collabs = (data.collab_tracks || []).map(c => ({
      ...c,
      albumTitle: c.album?.title,
      cover: c.cover || c.album?.cover || data.artist.avatar,
      artist: c.artist
    }));

    const allTracksMap = new Map();
    [...singles, ...fromAlbums, ...collabs].forEach(t => {
      if (!allTracksMap.has(t.id)) {
        allTracksMap.set(t.id, t);
      }
    });

    return Array.from(allTracksMap.values()).sort(
      (a, b) => (b.plays_count || 0) - (a.plays_count || 0)
    );
  }, [data]);

  const handlePlayAlbum = (e, album) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!album.tracks || album.tracks.length === 0) {
      alert('В этом альбоме нет доступных треков');
      return;
    }

    const albumQueue = album.tracks.map(t => ({
      ...t,
      cover: album.cover || data.artist.avatar,
      artist: { id: data.artist.id, name: data.artist.name }
    }));

    playTrack(albumQueue[0], albumQueue);
  };

  if (loading) return <div className="artist-page-state">Загрузка артиста...</div>;
  if (error) return <div className="artist-page-state error">{error}</div>;
  if (!data || !data.artist) return <div className="artist-page-state">Артист не найден</div>;

  const { artist, albums = [], singles = [] } = data;

  return (
    <div className="artist-page">
      <UploadMusicModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artistId={artist.id}
        artistName={artist.name}
        onSuccess={fetchArtist}
      />

      <EditEntityModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null, type: null })}
        item={editModal.item}
        type={editModal.type}
        onSuccess={fetchArtist}
      />

      <div className="artist-header">
        <img 
          src={artist.avatar || defaultCover} 
          alt={artist.name} 
          className="artist-avatar" 
        />
        <div className="artist-info">
          <span className="artist-tag">Исполнитель</span>
          <h1 className="artist-title">{artist.name}</h1>
          <p className="artist-meta">
            Жанр: <strong>{artist.genre}</strong> • Прослушиваний: <strong>{artist.plays_count || 0}</strong> • Лайков: <strong>{artist.likes_count || 0}</strong>
          </p>

          <div className="artist-actions" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {currentUser && (
              <Button 
                variant="primary" 
                fullWidth={false} 
                onClick={() => setIsUploadModalOpen(true)}
              >
                + Добавить музыку
              </Button>
            )}
            {isStaff && (
              <>
                <Button 
                  variant="secondary" 
                  fullWidth={false} 
                  onClick={() => setEditModal({ isOpen: true, item: artist, type: 'artist' })}
                >
                  Редактировать
                </Button>
                <Button variant="secondary" fullWidth={false} onClick={handleDeleteArtist}>
                  Удалить артиста
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="artist-section">
        <h2>Популярные треки</h2>
        {popularTracks.length === 0 ? (
          <p className="empty-text">Нет доступных треков</p>
        ) : (
          <div className="album-tracks-container">
            {popularTracks.slice(0, 5).map((track, idx) => (
              <TrackRow
                key={track.id}
                index={idx}
                track={track}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => playTrack(track, popularTracks)}
                canEdit={isStaff}
                onEdit={(t) => setEditModal({ isOpen: true, item: t, type: 'track' })}
                canDelete={isStaff}
                onDelete={(e, id) => handleDeleteTrack(e, id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="artist-section">
        <h2>Синглы</h2>
        {singles.length === 0 ? (
          <p className="empty-text">Нет доступных синглов</p>
        ) : (
          <div className="media-cards-grid">
            {singles.map((track) => {
              const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div key={track.id} className="media-card single-card">
                  <div className="media-card-cover-wrapper">
                    <img 
                      src={track.cover || artist.avatar || defaultCover} 
                      alt={track.title} 
                      className="media-card-cover"
                    />
                    <button 
                      type="button"
                      className={`media-card-play-btn ${isCurrentPlaying ? 'visible' : ''}`}
                      onClick={() => playTrack({ 
                        ...track, 
                        artist: { name: artist.name }, 
                        cover: track.cover || artist.avatar 
                      })}
                      title={isCurrentPlaying ? 'Пауза' : 'Слушать'}
                    >
                      <img src={isCurrentPlaying ? pauseIcon : playIcon} alt="Play/Pause" className="player-main-icon" />
                    </button>
                  </div>

                  <div className="media-card-info">
                    <span className="media-card-title" title={track.title}>
                      {track.title}
                    </span>
                    <span className="media-card-subtitle">Сингл</span>
                  </div>

                  {isStaff && (
                    <div className="card-staff-controls" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="staff-btn edit"
                        onClick={() => setEditModal({ isOpen: true, item: track, type: 'track' })}
                        title="Редактировать сингл"
                      >
                        <img src={edit_icon} alt='изменить' width='14px'/>
                      </button>
                      <button
                        type="button"
                        className="staff-btn delete"
                        onClick={(e) => handleDeleteTrack(e, track.id)}
                        title="Удалить сингл"
                      >
                        <img src={close_icon} alt='удалить' width='14px'/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="artist-section">
        <h2>Альбомы</h2>
        {albums.length === 0 ? (
          <p className="empty-text">Нет доступных альбомов</p>
        ) : (
          <div className="media-cards-grid">
            {albums.map((album) => {
              const firstTrack = album.tracks?.[0];
              const isAlbumPlaying = firstTrack && currentTrack?.id === firstTrack.id && isPlaying;

              return (
                <div 
                  key={album.id} 
                  className="media-card album-card-grid"
                  onClick={() => navigate(`/albums/${album.id}`)}
                >
                  <div className="media-card-cover-wrapper">
                    <img 
                      src={album.cover || defaultCover} 
                      alt={album.title} 
                      className="media-card-cover"
                    />
                    <button 
                      type="button"
                      className={`media-card-play-btn ${isAlbumPlaying ? 'visible' : ''}`}
                      onClick={(e) => handlePlayAlbum(e, album)}
                      title={isAlbumPlaying ? 'Пауза' : 'Слушать альбом'}
                    >
                      <img src={isAlbumPlaying ? pauseIcon : playIcon} alt="Play/Pause" className="player-main-icon" />
                    </button>
                  </div>

                  <div className="media-card-info">
                    <span className="media-card-title" title={album.title}>
                      {album.title}
                    </span>
                    <span className="media-card-subtitle">
                      {album.tracks?.length ? `${album.tracks.length} трек(ов)` : 'Альбом'}
                    </span>
                  </div>

                  {isStaff && (
                    <div className="card-staff-controls" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="staff-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditModal({ isOpen: true, item: album, type: 'album' });
                        }}
                        title="Редактировать альбом"
                      >
                        <img src={edit_icon} alt='изменить' width='14px'/>
                      </button>
                      <button
                        type="button"
                        className="staff-btn delete"
                        onClick={(e) => handleDeleteAlbum(e, album.id)}
                        title="Удалить альбом"
                      >
                        <img src={close_icon} alt='удалить' width='14px'/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.collab_tracks && data.collab_tracks.length > 0 && (
        <div className="artist-section">
          <h2>Участие в релизах</h2>
          <div className="media-cards-grid">
            {data.collab_tracks.map((track) => {
              const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
              const preparedTrack = {
                ...track,
                cover: track.cover || track.album?.cover || defaultCover,
                artist: track.artist || { id: artist.id, name: artist.name }
              };

              return (
                <div key={track.id} className="media-card single-card">
                  <div className="media-card-cover-wrapper">
                    <img 
                      src={preparedTrack.cover} 
                      alt={track.title} 
                      className="media-card-cover"
                    />
                    <button 
                      type="button"
                      className={`media-card-play-btn ${isCurrentPlaying ? 'visible' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(preparedTrack, data.collab_tracks.map(t => ({
                          ...t,
                          cover: t.cover || t.album?.cover || defaultCover,
                          artist: t.artist || { id: artist.id, name: artist.name }
                        })));
                      }}
                      title={isCurrentPlaying ? 'Пауза' : 'Слушать'}
                    >
                      <img src={isCurrentPlaying ? pauseIcon : playIcon} alt="Play/Pause" className="player-main-icon" />
                    </button>
                  </div>

                  <div className="media-card-info">
                    <span className="media-card-title" title={track.title}>
                      {track.title}
                    </span>
                    <span className="media-card-subtitle">
                      {track.album?.title ? (
                        <>Альбом: <em>{track.album.title}</em></>
                      ) : (
                        'Совместный трек'
                      )}
                    </span>
                    {track.artist && (
                      <span 
                        className="collab-card-main-artist"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artists/${track.artist.id}`);
                        }}
                        title={`Основной автор: ${track.artist.name}`}
                      >
                        {track.artist.name}
                      </span>
                    )}
                  </div>

                  {isStaff && (
                    <div className="card-staff-controls" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="staff-btn edit"
                        onClick={() => setEditModal({ isOpen: true, item: track, type: 'track' })}
                        title="Редактировать трек"
                      >
                        <img src={edit_icon} alt='изменить' width='14px'/>
                      </button>
                      <button
                        type="button"
                        className="staff-btn delete"
                        onClick={(e) => handleDeleteTrack(e, track.id)}
                        title="Удалить трек"
                      >
                        <img src={close_icon} alt='удалить' width='14px'/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}