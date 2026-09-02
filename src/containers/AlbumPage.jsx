import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import TrackRow from '../components/TrackRow';
import EditEntityModal from '../components/EditEntityModal';
import Button from '../components/Button';

import defaultCover from '../assets/Шотландская веслоухая.jpg';

import '../styles/ArtistPage.css';

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, item: null, type: null });

  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  const fetchAlbum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request(`/api/artists`);
      if (res?.data) {
        let foundAlbum = null;
        for (const artist of res.data) {
          const artistData = await apiClient.request(`/api/artists/${artist.id}`);
          const matching = artistData?.data?.albums?.find(a => String(a.id) === String(id));
          if (matching) {
            foundAlbum = { ...matching, artist: artistData.data.artist };
            break;
          }
        }
        if (foundAlbum) setAlbum(foundAlbum);
        else setError('Альбом не найден');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки альбома');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbum();
  }, [id]);

  const handleDeleteTrack = async (e, trackId) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Удалить этот трек из альбома?')) return;
    try {
      await apiClient.request(`/api/tracks/${trackId}`, { method: 'DELETE', requireAuth: true });
      fetchAlbum();
    } catch (err) {
      alert(err.message || 'Ошибка удаления трека');
    }
  };

  if (loading) return <div className="artist-page-state">Загрузка альбома...</div>;
  if (error || !album) return <div className="artist-page-state error">{error || 'Альбом не найден'}</div>;

  const formattedAlbumTracks = [...(album.tracks || [])]
    .sort((a, b) => (a.id || 0) - (b.id || 0))
    .map(t => ({
      ...t,
      cover: t.cover || album.cover,
      artist: { id: album.artist?.id, name: album.artist?.name || 'Исполнитель' }
  }));

  return (
    <div className="artist-page">
      <EditEntityModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null, type: null })}
        item={editModal.item}
        type={editModal.type}
        onSuccess={fetchAlbum}
      />

      <div className="artist-header">
        <img 
          src={album.cover || defaultCover} 
          alt={album.title} 
          className="album-cover-large" 
        />
        <div className="artist-info">
          <span className="artist-tag">Альбом</span>
          <h1 className="artist-title">{album.title}</h1>
          <p className="artist-meta">
            Исполнитель: <Link to={`/artists/${album.artist?.id}`} className="artist-link">{album.artist?.name}</Link>
            {album.likes_count > 0 && ` • Лайков: ${album.likes_count}`}
          </p>

          {isStaff && (
            <div style={{ marginTop: '12px' }}>
              <Button 
                variant="secondary" 
                fullWidth={false}
                onClick={() => setEditModal({ isOpen: true, item: album, type: 'album' })}
              >
                Редактировать альбом
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="artist-section">
        <h2>Список композиций</h2>
        {(!album.tracks || album.tracks.length === 0) ? (
          <p className="empty-text">В альбоме пока нет доступных треков</p>
        ) : (
          <div className="album-tracks-container">
            {formattedAlbumTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                index={idx}
                track={track}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={(t) => playTrack(t, formattedAlbumTracks)}
                canEdit={isStaff}
                onEdit={(t) => setEditModal({ isOpen: true, item: t, type: 'track' })}
                canDelete={isStaff}
                onDelete={handleDeleteTrack}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}