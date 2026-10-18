import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import closeIcon from '../assets/close-icon.svg';
import checkIcon from '../assets/check-circle.svg';
import alertIcon from '../assets/alert-circle.svg';

import '../styles/AuthModal.css';
import '../styles/NotificationsModal.css';

// Содержимое детального просмотра уведомления (для встраивания в единое модальное окно)
export function NotificationDetailContent({
  notification,
  onBack,
  onClose,
  onOpenUpload,
}) {
  const navigate = useNavigate();

  if (!notification) return null;

  const isApproved =
    notification.type === 'approved' || notification.type === 'success';
  const isRejected =
    notification.type === 'rejected' || notification.type === 'error';

  // Извлечение причины отклонения (из поля reason или из текста message)
  const extractRejectReason = () => {
    if (notification.reason) return notification.reason;
    if (notification.message) {
      const match = notification.message.match(/Причина:\s*(.+)$/i);
      if (match) return match[1].trim();
      return notification.message;
    }
    return 'Причина не была подробно указана модератором.';
  };

  // Переход к одобренному материалу в каталоге
  const handleNavigateToEntity = () => {
    if (onClose) onClose();
    if (notification.entity_type === 'track') {
      navigate(`/tracks/${notification.entity_id}`);
    } else if (notification.entity_type === 'album') {
      navigate(`/albums/${notification.entity_id}`);
    } else if (notification.entity_type === 'artist') {
      navigate(`/artists/${notification.entity_id}`);
    } else {
      navigate('/');
    }
  };

  // Повторная загрузка исправленного материала
  const handleRetryUpload = () => {
    if (onClose) onClose();
    if (onOpenUpload) {
      onOpenUpload();
    }
  };

  // Форматирование даты создания
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="notification-detail-body">
      {/* Статусная шапка: зеленая для одобрения, красная для отклонения */}
      <div
        className={`notification-detail-header-status ${
          isApproved ? 'approved' : isRejected ? 'rejected' : 'info'
        }`}
      >
        <div className="notification-detail-status-icon">
          {isApproved ? (
            <img
              src={checkIcon}
              alt="Успех"
              style={{
                width: '22px',
                height: '22px',
                filter: 'brightness(0) invert(1)',
              }}
            />
          ) : (
            <img
              src={alertIcon}
              alt="Внимание"
              style={{
                width: '22px',
                height: '22px',
                filter: 'brightness(0) invert(1)',
              }}
            />
          )}
        </div>
        <div className="notification-detail-status-text">
          <h3>
            {isApproved
              ? 'Материал успешно опубликован'
              : isRejected
                ? 'Заявка отклонена модератором'
                : 'Системное уведомление'}
          </h3>
          <p>
            {notification.entity_type
              ? `Тип объекта: ${notification.entity_type.toUpperCase()}`
              : 'Служба модерации Music Platform'}
          </p>
        </div>
      </div>

      {/* Заголовок уведомления */}
      <h2 className="notification-detail-title">{notification.title}</h2>

      {/* БЛОК 1: Сообщение об одобрении */}
      {isApproved && (
        <div className="notification-approval-callout">
          <div className="notification-approval-title">
            Публикация подтверждена
          </div>
          <p className="notification-approval-desc">
            {notification.message}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>
            Ваш релиз прошел проверку соответствия правилам площадки и теперь доступен всем слушателям платформы.
          </p>
        </div>
      )}

      {/* БЛОК 2: Сообщение об отклонении с подробной причиной */}
      {isRejected && (
        <div className="notification-rejection-callout">
          <div className="notification-rejection-title">
            Причина отклонения заявки:
          </div>
          <div className="notification-rejection-reason-text">
            {extractRejectReason()}
          </div>
        </div>
      )}

      {/* Общее сообщение для информационных уведомлений */}
      {!isApproved && !isRejected && (
        <div className="notification-detail-message-box">
          {notification.message}
        </div>
      )}

      {/* Мета-информация о времени получения */}
      <div className="notification-detail-meta">
        <span>Дата получения:</span>
        <strong>{formatDate(notification.inserted_at)}</strong>
      </div>

      {/* Кнопки действий */}
      <div className="notification-detail-actions">
        {onBack && (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            Назад к списку
          </Button>
        )}

        {isApproved && notification.entity_id && (
          <Button
            type="button"
            variant="primary"
            onClick={handleNavigateToEntity}
          >
            Перейти к материалу в каталоге
          </Button>
        )}

        {isRejected && (
          <Button
            type="button"
            variant="primary"
            onClick={handleRetryUpload}
          >
            Исправить и загрузить снова
          </Button>
        )}
      </div>
    </div>
  );
}

// Отдельное модальное окно (для совместимости)
export default function NotificationDetailModal({
  isOpen,
  onClose,
  notification,
  onOpenUpload,
}) {
  if (!isOpen || !notification) return null;

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window notification-detail-window">
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Детали уведомления
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
          <NotificationDetailContent
            notification={notification}
            onClose={onClose}
            onOpenUpload={onOpenUpload}
          />
        </div>
      </div>
    </div>
  );
}
