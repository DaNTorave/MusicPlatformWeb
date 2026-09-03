import React, { useRef, useState } from 'react';

import CollaboratorsManager from './CollaboratorsManager';
import OriginalTrackManager from './OriginalTrackManager';

import closeIcon from '../assets/close-icon.svg';
import playIcon from '../assets/play-icon.svg';
import pauseIcon from '../assets/pause-icon.svg';

export default function TrackSlotItem({
  index,
  track,
  total,
  onChange,
  onMove,
  onRemove,
  onPlay,
  isPlaying,
  showPlay = false,
  disabled = false,
  availableArtists = [],
  availableTracks = [],
  mainArtist = null
}) {
  const fileInputRef = useRef(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showCoverPanel, setShowCoverPanel] = useState(() => Boolean(track.is_cover));

  const hasAudio = Boolean(track.audio || track.audioFile || track.audio_uuid || track.id);
  const audioName = track.audio?.name || track.audioFile?.name;
  const collaboratorIds = track.collaboratorIds || [];
  const isCover = Boolean(track.is_cover);

  const handleCollaboratorsChange = (newIds) => {
    onChange(index, 'collaboratorIds', newIds);
  };

  const toggleCover = () => {
    const nextState = !isCover;
    onChange(index, 'is_cover', nextState);
    if (!nextState) {
      onChange(index, 'original_track_id', null);
      setShowCoverPanel(false);
    } else {
      setShowCoverPanel(true);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: '#fcfafafa',
      border: '1px solid #e8e0e0',
      borderRadius: '14px',
      padding: '12px'
    }}>
      <div
        className="track-slot-row"
        style={{ border: 'none', background: 'transparent', padding: 0 }}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const fromIdx = Number(e.dataTransfer.getData('text/plain'));
          if (!isNaN(fromIdx) && fromIdx !== index) onMove(fromIdx, index);
        }}
      >
        <span className="track-slot-handle" title="Перетащите для смены порядка">
          ☰ #{index + 1}
        </span>

        {showPlay && onPlay && (
          <button
            type="button"
            className="track-slot-play-btn"
            onClick={() => onPlay(track)}
            title={isPlaying ? 'Пауза' : 'Слушать'}
          >
            <img src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause" />
          </button>
        )}

        <input
          type="text"
          className="track-slot-input-title"
          placeholder={`Название трека #${index + 1}`}
          value={track.title}
          onChange={(e) => onChange(index, 'title', e.target.value)}
          required
          disabled={disabled}
        />

        <div className="track-slot-audio-picker">
          <button
            type="button"
            className={`track-slot-file-btn ${hasAudio ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={disabled}
            title={audioName || (hasAudio ? 'Аудио загружено' : 'Прикрепить аудиофайл')}
          >
            {hasAudio ? (audioName ? `✓ ${audioName}` : '✓ Аудио') : '+ Файл трека'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) onChange(index, 'audio', file);
            }}
            disabled={disabled}
          />
        </div>

        {mainArtist && (
          <button
            type="button"
            className="track-slot-nav-btn"
            onClick={() => setShowCollaborators(!showCollaborators)}
            disabled={disabled}
            style={{
              padding: '7px 11px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: collaboratorIds.length > 0 ? '#1d4ed8' : '#475569',
              background: collaboratorIds.length > 0 ? '#dbeafe' : '#f1f5f9',
              border: collaboratorIds.length > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            title="Настроить соавторов трека"
          >
            {collaboratorIds.length > 0 ? `Соавторы (${collaboratorIds.length})` : '+ Соавтор'}
          </button>
        )}

        <button
          type="button"
          className="track-slot-nav-btn"
          onClick={toggleCover}
          disabled={disabled}
          style={{
            padding: '7px 11px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: isCover ? '#15803d' : '#475569',
            background: isCover ? '#dcfce7' : '#f1f5f9',
            border: isCover ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
          title="Отметить трек как кавер"
        >
          {isCover ? '✓ Кавер' : '+ Кавер'}
        </button>

        <div className="track-slot-arrows">
          <button
            type="button"
            className="track-slot-nav-btn"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0 || disabled}
          >
            ▲
          </button>
          <button
            type="button"
            className="track-slot-nav-btn"
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1 || disabled}
          >
            ▼
          </button>
        </div>

        {onRemove && (
          <button
            type="button"
            className="track-slot-remove-btn"
            onClick={() => onRemove(index)}
            disabled={disabled}
            title="Удалить трек"
          >
            <img src={closeIcon} alt="Удалить" />
          </button>
        )}
      </div>

      {isCover && showCoverPanel && (
        <div className="meta-box-card" style={{ marginTop: '4px', background: '#fdfbfb' }}>
          <div className="meta-box-header">
            <span className="meta-box-title">Оригинальный трек для кавера</span>
          </div>
          <OriginalTrackManager
            availableTracks={availableTracks}
            selectedTrackId={track.original_track_id}
            onChange={(trackId) => onChange(index, 'original_track_id', trackId)}
            disabled={disabled}
          />
        </div>
      )}

      {showCollaborators && mainArtist && (
        <div style={{ marginTop: '4px' }}>
          <CollaboratorsManager
            mainArtist={mainArtist}
            availableArtists={availableArtists}
            collaboratorIds={collaboratorIds}
            onChange={handleCollaboratorsChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}