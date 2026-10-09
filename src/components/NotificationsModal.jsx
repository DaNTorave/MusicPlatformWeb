import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

import { NotificationDetailContent } from './NotificationDetailModal';
import closeIcon from '../assets/close-icon.svg';
import checkIcon from '../assets/check-circle.svg';
import alertIcon from '../assets/alert-circle.svg';
import bellIcon from '../assets/bell-icon.svg';

import '../styles/AuthModal.css';
import '../styles/NotificationsModal.css';

export default function NotificationsModal({
  isOpen,
  onClose,
  onOpenUpload,
}) {
  // Состояния списка уведомлений, режима отображения и фильтров
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail'
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Загрузка уведомлений с сервера
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.request('/api/notifications', {
        method: 'GET',
        requireAuth: true,
      });
      if (response?.notifications) {
        setNotifications(response.notifications);
      }
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Обновление списка при открытии и сброс режима в 'list'
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      setActiveView('list');
      setSelectedNotification(null);
    }

    const handleUpdate = () => {
      if (isOpen) loadNotifications();
    };

    window.addEventListener('notifications:update', handleUpdate);
    return () => {
      window.removeEventListener('notifications:update', handleUpdate);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Отметка отдельного уведомления как прочитанного
  const handleMarkAsRead = async (notification) => {
    if (!notification.is_read) {
      try {
        await apiClient.request(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          requireAuth: true,
        });
      } catch (err) {
        console.warn('Ошибка отметки прочитанным:', err);
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
      );
      window.dispatchEvent(new CustomEvent('notifications:update'));
    }
  };

  // Клик по уведомлению: отметка прочитанным и переключение на экран деталей в этом же окне
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
    setSelectedNotification(notification);
    setActiveView('detail');
  };

  // Возврат к списку уведомлений внутри этого же окна
  const handleBackToList = () => {
    setActiveView('list');
    setSelectedNotification(null);
  };

  // Отметка всех уведомлений как прочитанных
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const item of unread) {
      try {
        await apiClient.request(`/api/notifications/${item.id}/read`, {
          method: 'PUT',
          requireAuth: true,
        });
      } catch (e) {
        // Игнорируем
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new CustomEvent('notifications:update'));
  };

  // Форматирование даты
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Только что';
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч. назад`;
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Фильтрация списка
  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window notifications-modal-window">
        {/* Шапка единого модального окна */}
        <div className="modal-window-top-buttons">
          {activeView === 'list' ? (
            <button className="modal-window-top-button active">
              Уведомления {unreadCount > 0 && `(${unreadCount})`}
            </button>
          ) : (
            <button
              type="button"
              className="modal-window-top-button active"
            >
              Подробнее
            </button>
          )}

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
          {/* РЕЖИМ 1: Список уведомлений */}
          {activeView === 'list' && (
            <>
              {/* Панель фильтров и действий */}
              <div className="notifications-header-tabs">
                <div className="notifications-filter-group">
                  <button
                    type="button"
                    className={`notifications-filter-btn ${
                      filter === 'all' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('all')}
                  >
                    Все ({notifications.length})
                  </button>
                  <button
                    type="button"
                    className={`notifications-filter-btn ${
                      filter === 'unread' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('unread')}
                  >
                    Непрочитанные
                    {unreadCount > 0 && (
                      <span className="notifications-filter-badge">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {unreadCount > 0 && (
                  <div className="notifications-actions-group">
                    <button
                      type="button"
                      className="notifications-mark-all-btn"
                      onClick={handleMarkAllRead}
                    >
                      Прочитать все
                    </button>
                  </div>
                )}
              </div>

              {/* Список уведомлений */}
              <div className="notifications-list">
                {loading && notifications.length === 0 ? (
                  <div className="notifications-empty-state">
                    <p>Загрузка уведомлений...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="notifications-empty-state">
                    <img
                      src={bellIcon}
                      alt="Уведомления"
                      className="notifications-empty-icon"
                    />
                    <h4 className="notifications-empty-title">
                      {filter === 'unread'
                        ? 'Нет непрочитанных уведомлений'
                        : 'Уведомлений пока нет'}
                    </h4>
                    <p className="notifications-empty-desc">
                      Здесь будут отображаться решения по модерации загруженных
                      треков и системные сообщения.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const isApproved =
                      item.type === 'approved' || item.type === 'success';
                    const isRejected =
                      item.type === 'rejected' || item.type === 'error';

                    const reasonSnippet =
                      item.reason ||
                      (item.message && item.message.includes('Причина:')
                        ? item.message.split('Причина:')[1]?.trim()
                        : null);

                    return (
                      <div
                        key={item.id}
                        className={`notification-card-item ${
                          !item.is_read ? 'unread' : ''
                        } ${
                          isApproved
                            ? 'type-approved'
                            : isRejected
                              ? 'type-rejected'
                              : ''
                        }`}
                        onClick={() => handleNotificationClick(item)}
                      >
                        {/* Иконка статуса */}
                        <div
                          className={`notification-icon-wrapper ${
                            isApproved
                              ? 'approved'
                              : isRejected
                                ? 'rejected'
                                : 'info'
                          }`}
                        >
                          {isApproved ? (
                            <img
                              src={checkIcon}
                              alt="Одобрено"
                              style={{
                                width: '18px',
                                height: '18px',
                                filter:
                                  'invert(37%) sepia(85%) saturate(542%) hue-rotate(95deg) brightness(95%) contrast(92%)',
                              }}
                            />
                          ) : isRejected ? (
                            <img
                              src={alertIcon}
                              alt="Отклонено"
                              style={{
                                width: '18px',
                                height: '18px',
                                filter:
                                  'invert(24%) sepia(88%) saturate(3412%) hue-rotate(352deg) brightness(92%) contrast(93%)',
                              }}
                            />
                          ) : (
                            <img
                              src={bellIcon}
                              alt="Инфо"
                              style={{ width: '18px', height: '18px' }}
                            />
                          )}
                        </div>

                        {/* Текст уведомления */}
                        <div className="notification-content">
                          <div className="notification-top-row">
                            <span
                              className={`notification-badge-type ${
                                isApproved
                                  ? 'approved'
                                  : isRejected
                                    ? 'rejected'
                                    : 'info'
                              }`}
                            >
                              {isApproved
                                ? 'Одобрено'
                                : isRejected
                                  ? 'Отклонено'
                                  : 'Инфо'}
                            </span>
                            <span className="notification-date">
                              {formatTime(item.inserted_at)}
                            </span>
                          </div>

                          <h4 className="notification-title">{item.title}</h4>
                          <p className="notification-message-snippet">
                            {item.message}
                          </p>

                          {/* Плашка с причиной для отклоненных материалов */}
                          {isRejected && reasonSnippet && (
                            <div className="notification-reason-preview">
                              <strong>Причина:</strong> {reasonSnippet}
                            </div>
                          )}
                        </div>

                        {/* Индикатор непрочитанного */}
                        {!item.is_read && (
                          <div
                            className="notification-unread-dot"
                            title="Новое уведомление"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* РЕЖИМ 2: Детальный просмотр уведомления (внутри этого же модального окна) */}
          {activeView === 'detail' && selectedNotification && (
            <NotificationDetailContent
              notification={selectedNotification}
              onBack={handleBackToList}
              onClose={onClose}
              onOpenUpload={onOpenUpload}
            />
          )}
        </div>
      </div>
    </div>
  );
}
