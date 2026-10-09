import React, { useState } from 'react';
import Button from './Button';
import closeIcon from '../assets/close-icon.svg';
import alertIcon from '../assets/alert-circle.svg';

import '../styles/AuthModal.css';
import '../styles/ModerationModal.css';

// Типовые шаблоны причин отклонения
const REJECTION_PRESETS = [
  'Низкое качество аудиофайла (присутствуют шумы, низкий битрейт)'
];

export default function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  loading = false,
}) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  // Отправка решения об отклонении
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  // Выбор готового шаблона причины
  const handleSelectPreset = (preset) => {
    setReason(preset);
  };

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window" style={{ maxWidth: '520px' }}>
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Отклонение заявки
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="✕" />
          </button>
        </div>

        <div className="modal-window-content">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
              <img
                src={alertIcon}
                alt="Внимание"
                style={{
                  width: '20px',
                  height: '20px',
                  filter: 'invert(24%) sepia(88%) saturate(3412%) hue-rotate(352deg) brightness(92%) contrast(93%)'
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Укажите причину для автора
              </span>
            </div>

            <p className="auth-form-subtitle" style={{ marginTop: 0 }}>
              Причина отклонения для <strong>«{itemTitle || 'материала'}»</strong> будет отправлена автору в уведомлении:
            </p>

            {/* Быстрые шаблоны причин */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                Быстрые шаблоны:
              </label>
              <div className="reject-presets">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`reject-preset-chip ${reason === preset ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-form-group">
              <label>Подробная причина отклонения *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите, что именно необходимо исправить (качество звука, обложка, теги)..."
                required
                disabled={loading}
                className="moderation-textarea"
                style={{ minHeight: '90px' }}
                autoFocus
              />
            </div>

            <div className="modal-actions-row">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Отклонение...' : 'Отклонить с причиной'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
