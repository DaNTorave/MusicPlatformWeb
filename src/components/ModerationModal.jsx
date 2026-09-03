import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioContext';
import { apiClient } from '../api/apiClient';

import Button from './Button';
import TrackSlotItem from './TrackSlotItem';
import CollaboratorsManager from './CollaboratorsManager';
import OriginalTrackManager from './OriginalTrackManager';

import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';

import '../styles/ModerationModal.css';

export default function ModerationModal({ isOpen, onClose, item, onApprove, onReject, loading }) {
  const [title, setTitle] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tracks, setTracks] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const [isCover, setIsCover] = useState(false);
  const [originalTrackId, setOriginalTrackId] = useState(null);

  const { playTrack, currentTrack, isPlaying, updateTrackTitle, updateTrackCover, stopPlayer } = useAudioPlayer();

  useEffect(() => {
    if (isOpen) {
      apiClient.request('/api/artists').then((res) => {
        if (res?.data) setAvailableArtists(res.data);
      });
      apiClient.request('/api/charts/tracks').then((res) => {
        if (res?.data) setAvailableTracks(res.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setTitle(item.title || item.name || '');
      setCoverPreview(item.cover || item.avatar || '');
      setRejectReason('');
      setCoverFile(null);
      setAudioFile(null);
      setTracks((item.tracks || []).map((t) => ({
        ...t,
        audioFile: null,
        is_cover: Boolean(t.is_cover || t.original_track_id),
        original_track_id: t.original_track_id || null
      })));

      setIsCover(Boolean(item.is_cover || item.original_track_id));
      setOriginalTrackId(item.original_track_id || null);

      const existingCollabs = (item.collaborators || []).map((c) => c.id);
      setCollaborators(existingCollabs);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);

      if (currentTrack && (currentTrack.id === item.id || tracks.some((t) => t.id === currentTrack.id))) {
        updateTrackCover(previewUrl);
      }
    }
  };

  const handleSingleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentTrack?.id === item.id) updateTrackTitle(newTitle);
  };

  const handleTrackChange = (index, field, value) => {
    const track = tracks[index];
    setTracks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    if (field === 'title' && currentTrack?.id === track.id) {
      updateTrackTitle(value);
    }
  };

  const moveTrack = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    setTracks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleRemoveTrack = (index) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlaySingle = () => {
    playTrack({
      id: item.id,
      title: title || item.title,
      cover: coverPreview,
      streamUrl: audioFile ? URL.createObjectURL(audioFile) : null,
      artist: { name: item.artist_info?.name || 'Модерация' },
      is_cover: isCover,
      original_track: availableTracks.find(t => String(t.id) === String(originalTrackId))
    });
  };

  const handlePlayAlbumTrack = (track) => {
    playTrack({
      id: track.id,
      title: track.title,
      cover: coverPreview,
      streamUrl: track.audioFile ? URL.createObjectURL(track.audioFile) : null,
      artist: { name: item.artist_info?.name || 'Модерация' },
      is_cover: track.is_cover,
      original_track: availableTracks.find(t => String(t.id) === String(track.original_track_id))
    });
  };

  const handleSubmit = (action) => {
    stopPlayer();
    const schemaType =
      item.type ||
      (item.tracks ? 'album' : item.genre && !item.audio_uuid ? 'artist' : 'track');

    const formData = new FormData();
    formData.append('schema', schemaType);
    formData.append('id', item.id);
    formData.append('title', title);

    if (coverFile) formData.append('cover', coverFile);
    if (audioFile) formData.append('audio', audioFile);

    if (schemaType === 'track') {
      formData.append('is_cover', isCover ? 'true' : 'false');
      if (isCover && originalTrackId) {
        formData.append('original_track_id', originalTrackId);
      }
    }

    collaborators.forEach((id) => formData.append('collaborator_ids[]', id));

    if (item.type === 'album') {
      tracks.forEach((track, idx) => {
        formData.append(`tracks[${idx}][id]`, track.id);
        formData.append(`tracks[${idx}][title]`, track.title);
        formData.append(`tracks[${idx}][is_cover]`, track.is_cover ? 'true' : 'false');
        if (track.is_cover && track.original_track_id) {
          formData.append(`tracks[${idx}][original_track_id]`, track.original_track_id);
        }
        if (track.audioFile) formData.append(`tracks[${idx}][audio]`, track.audioFile);
      });
    }

    if (action === 'reject') {
      formData.append('status', 'rejected');
      formData.append('comment', rejectReason || 'Отклонено модератором');
      onReject(schemaType, item.id, rejectReason);
    } else {
      formData.append('status', 'approved');
      formData.append('comment', 'Одобрено модератором');
      onApprove(formData);
    }
  };

  const isSingleAudio = item.type === 'track' || item.type === 'single';
  const isAlbum = item.type === 'album';
  const isSinglePlaying = currentTrack?.id === item.id && isPlaying;

  const isApproveDisabled = (() => {
    if (loading) return true;
    if (!title.trim()) return true;

    if (isSingleAudio) {
      if (isCover && !originalTrackId) return true;
    }

    if (isAlbum) {
      if (tracks.length === 0) return true;
      const hasEmptyTitle = tracks.some(t => !t.title.trim());
      if (hasEmptyTitle) return true;
      const hasIncompleteCover = tracks.some(t => t.is_cover && !t.original_track_id);
      if (hasIncompleteCover) return true;
    }

    return false;
  })();

  return (
    <div className="modal-background" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-window moderation-modal" style={{ maxWidth: '680px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Модерация: {item.type === 'artist' ? 'Исполнитель' : item.type === 'album' ? 'Альбом' : 'Трек'}
          </button>
          <button type="button" className="modal-close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-window-content">
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="moderation-preview">
              <div className="moderation-cover">
                <img src={coverPreview || '/default.png'} alt="Обложка" />
                <label className="moderation-cover-change">
                  <input type="file" accept="image/*" onChange={handleCoverChange} />
                  Изменить обложку
                </label>
              </div>
            </div>

            <div className="auth-form-group">
              <label>{isAlbum ? 'Название альбома' : 'Название'} *</label>
              <input
                type="text"
                value={title}
                onChange={handleSingleTitleChange}
                placeholder="Введите название"
                disabled={loading}
                required
              />
            </div>

            {item.artist_info && (
              <CollaboratorsManager
                mainArtist={item.artist_info}
                availableArtists={availableArtists}
                collaboratorIds={collaborators}
                onChange={setCollaborators}
                disabled={loading}
              />
            )}

            {isSingleAudio && (
              <div className="meta-box-card">
                <div className="meta-box-header">
                  <label className="meta-switch-label">
                    <input
                      type="checkbox"
                      checked={isCover}
                      onChange={(e) => {
                        setIsCover(e.target.checked);
                        if (!e.target.checked) setOriginalTrackId(null);
                      }}
                      disabled={loading}
                    />
                    Кавер
                  </label>
                </div>

                {isCover && (
                  <OriginalTrackManager
                    availableTracks={availableTracks}
                    selectedTrackId={originalTrackId}
                    onChange={setOriginalTrackId}
                    disabled={loading}
                  />
                )}
              </div>
            )}

            {isSingleAudio && (
              <div className="auth-form-group">
                <label>Аудиозапись</label>
                <div className="moderation-single-audio-box">
                  <div className="moderation-single-audio-box-btn">
                    <button
                      type="button"
                      className="track-slot-play-btn"
                      onClick={handlePlaySingle}
                      title={isSinglePlaying ? 'Пауза' : 'Слушать'}
                    >
                      <img src={isSinglePlaying ? pauseIcon : playIcon} alt="Play/Pause" />
                    </button>
                  </div>

                  <label className="moderation-audio-change">
                    <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />
                    {audioFile ? 'Файл выбран для замены' : 'Заменить аудиофайл'}
                  </label>
                </div>
              </div>
            )}

            {isAlbum && (
              <div className="auth-form-group">
                <label>Треки альбома ({tracks.length} шт.):</label>
                <div className="scrollable-track-list">
                  {tracks.map((track, idx) => (
                    <TrackSlotItem
                      key={track.id || idx}
                      index={idx}
                      track={track}
                      total={tracks.length}
                      onChange={handleTrackChange}
                      onMove={moveTrack}
                      onRemove={handleRemoveTrack}
                      showPlay
                      onPlay={handlePlayAlbumTrack}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      disabled={loading}
                      availableArtists={availableArtists}
                      availableTracks={availableTracks}
                      mainArtist={item.artist_info}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="moderation-actions">
              <div className="moderation-action-group">
                <Button 
                  type="button" 
                  variant="primary" 
                  disabled={isApproveDisabled} 
                  onClick={() => handleSubmit('approve')}
                >
                  {loading ? 'Сохранение...' : 'Одобрить'}
                </Button>
              </div>

              <div className="moderation-action-group">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Причина отклонения..."
                  disabled={loading}
                  className="moderation-textarea"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !rejectReason.trim()}
                  onClick={() => handleSubmit('reject')}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}