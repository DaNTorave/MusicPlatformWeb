import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import ModerationModal from '../components/ModerationModal';

import '../styles/Content.css';

export default function ModerationPage() {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await apiClient.request('/api/moderation/pending', {
        method: 'GET',
        requireAuth: true,
      });
      setPendingItems(data.items || []);
    } catch (err) {
      setError(
        err.data?.error || err.message || 'Ошибка загрузки списка модерации',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (formData) => {
    setActionLoading(true);
    try {
      await apiClient.upload('/api/moderation/approve-with-edit', formData);
      setSelectedItem(null);
      await loadPending();
    } catch (err) {
      alert(err.data?.error || err.message || 'Не удалось одобрить');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (schema, id, comment) => {
    setActionLoading(true);
    try {
      await apiClient.request('/api/moderation/decision', {
        method: 'POST',
        requireAuth: true,
        data: { schema, id, status: 'rejected', comment },
      });
      setSelectedItem(null);
      await loadPending();
    } catch (err) {
      alert(err.data?.error || err.message || 'Не удалось отклонить');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content-page">
        <p className="status-message">Загрузка очереди...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-page">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <>
      <ModerationModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading}
      />

      <div className="content-page moderation-page-content">
        <div className="moderation-header">
          <h2>Панель модерации</h2>
          <Button variant="secondary" fullWidth={false} onClick={loadPending}>
            Обновить
          </Button>
        </div>

        {pendingItems.length === 0 ? (
          <p className="empty-catalog-text">Очередь модерации пуста.</p>
        ) : (
          <div className="moderation-list">
            {pendingItems.map((item) => {
              const author = item.creator_info;
              const artist = item.artist_info;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="moderation-card"
                >
                  <img
                    src={item.cover || item.avatar || '/default.png'}
                    alt="preview"
                    className="moderation-card-preview"
                  />

                  <div className="moderation-card-info">
                    <span className="moderation-card-type">[{item.type}]</span>
                    <h3 className="moderation-card-title">
                      {item.title || item.name}
                    </h3>

                    {artist && (
                      <p className="moderation-card-artist">
                        Артист:{' '}
                        <Link
                          to={`/artists/${artist.id}`}
                          className="moderation-link"
                        >
                          {artist.name}
                        </Link>
                      </p>
                    )}

                    {item.type === 'album' && item.tracks && (
                      <p className="moderation-card-tracks">
                        Количество треков в альбоме:{' '}
                        <strong>{item.tracks.length}</strong>
                      </p>
                    )}

                    <p className="moderation-card-author">
                      Автор заявки:{' '}
                      {author ? (
                        <Link
                          to={`/profile/${author.id}`}
                          className="moderation-link-bold"
                        >
                          {author.nickname || author.login} (@{author.login})
                        </Link>
                      ) : (
                        <span>ID: {item.creator_id}</span>
                      )}
                      {item.genre ? ` • Жанр: ${item.genre}` : ''}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    onClick={() => setSelectedItem(item)}
                    disabled={actionLoading}
                  >
                    Взять на модерацию
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
