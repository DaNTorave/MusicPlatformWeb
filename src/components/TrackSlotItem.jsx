import React, { useRef, useState } from 'react';

import CollaboratorsManager from './CollaboratorsManager';

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
  mainArtist = null
}) {
  const fileInputRef = useRef(null);
  const [showCollaborators, setShowCollaborators] = useState(false);

  const hasAudio = Boolean(track.audio || track.audioFile || track.audio_uuid || track.id);
  const audioName = track.audio?.name || track.audioFile?.name;
  const collaboratorIds = track.collaboratorIds || [];

  const handleCollaboratorsChange = (newIds) => {
    onChange(index, 'collaboratorIds', newIds);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: '#fcfafafa',
      border: '1px solid #e8e0e0',
      borderRadius: '12px',
      padding: '10px'
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
              padding: '6px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: collaboratorIds.length > 0 ? '#1773cf' : '#555',
              background: collaboratorIds.length > 0 ? '#e0f2fe' : '#eee',
              border: collaboratorIds.length > 0 ? '1px solid #bae6fd' : 'none'
            }}
            title="Настроить соавторов трека"
          >
            {collaboratorIds.length > 0 ? `Соавторы (${collaboratorIds.length})` : '+ Соавтор'}
          </button>
        )}

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

        {total > 1 && onRemove && (
          <button
            type="button"
            className="track-slot-remove-btn"
            onClick={() => onRemove(index)}
            disabled={disabled}
            title="Удалить слот"
          >
            <img src={closeIcon} alt="Удалить" />
          </button>
        )}
      </div>

      {showCollaborators && mainArtist && (
        <div style={{
          marginTop: '6px',
          padding: '12px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
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