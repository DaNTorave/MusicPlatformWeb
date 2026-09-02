import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAudioPlayer } from '../context/AudioContext';

import CreateArtistModal from '../components/CreateArtistModal';
import EditEntityModal from '../components/EditEntityModal';
import TrackRow from '../components/TrackRow';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import edit_icon from '../assets/edit-icon.svg';
import close_icon from '../assets/close-icon.svg';

import '../styles/Content.css';

export default function Content() {
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artists, setArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState(null);

  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const currentUser = apiClient.getUser();
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artistsRes, tracksRes] = await Promise.all([
        apiClient.request('/api/artists'),
        apiClient.request('/api/charts/tracks')
      ]);

      if (artistsRes?.data) setArtists(artistsRes.data);
      if (tracksRes?.data) setTopTracks(tracksRes.data);
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteArtist = async (e, artistId) => {
    e.stopPropagation();
    if (!window.confirm('Удалить этого исполнителя?')) return;
    try {
      await apiClient.request(`/api/artists/${artistId}`, { method: 'DELETE', requireAuth: true });
      fetchData();
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  return (
    <>
      <CreateArtistModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <EditEntityModal
        isOpen={Boolean(editingArtist)}
        onClose={() => setEditingArtist(null)}
        item={editingArtist}
        type="artist"
        onSuccess={fetchData}
      />

      <div className="content-page">
        <div className="content-container">
          <div className="content-actions-panel">
            {currentUser && (
              <button
                className="content-actions-panel-button"
                onClick={() => setIsArtistModalOpen(true)}
              >
                Добавить исполнителя
              </button>
            )}
          </div>

          <div className="artists-catalog-section" style={{ gap: '2.5rem' }}>
            <div>
              <h2 className="section-heading" style={{ marginBottom: '1rem' }}>Топ чарт треков</h2>
              {loading ? (
                <p className="status-message">Загрузка чарта...</p>
              ) : topTracks.length === 0 ? (
                <p className="empty-catalog-text">Пока нет треков в чарте.</p>
              ) : (
                <div className="album-tracks-container">
                  {topTracks.map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      index={idx}
                      track={track}
                      isPlaying={currentTrack && String(currentTrack.id) === String(track.id) && isPlaying}
                      onPlay={() => playTrack(track, topTracks)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="section-heading" style={{ marginBottom: '1rem' }}>Популярные исполнители</h2>
              {loading ? (
                <p className="status-message">Загрузка каталога...</p>
              ) : artists.length === 0 ? (
                <p className="empty-catalog-text">Список исполнителей пуст или находится на модерации.</p>
              ) : (
                <div className="artists-grid">
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="artist-card"
                      onClick={() => navigate(`/artists/${artist.id}`)}
                    >
                      {isStaff && (
                        <div className="card-staff-controls" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="staff-btn edit"
                            onClick={() => setEditingArtist(artist)}
                            title="Редактировать артиста"
                          >
                            <img src={edit_icon} alt='изменить' width='14px'/>
                          </button>
                          <button
                            type="button"
                            className="staff-btn delete"
                            onClick={(e) => handleDeleteArtist(e, artist.id)}
                            title="Удалить артиста"
                          >
                            <img src={close_icon} alt='удалить' width='14px'/>
                          </button>
                        </div>
                      )}

                      <img
                        src={artist.avatar || defaultAvatar}
                        alt={artist.name}
                        className="artist-card-avatar"
                      />
                      <div className="artist-card-info">
                        <h3 className="artist-card-name">{artist.name}</h3>
                        <span className="artist-card-genre">{artist.genre}</span>
                        <span className="artist-card-plays">{artist.plays_count || 0} прослушиваний</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}