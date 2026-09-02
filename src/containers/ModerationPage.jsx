import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/apiClient";

import Button from "../components/Button";
import ModerationModal from "../components/ModerationModal";

import "../styles/Content.css";

export default function ModerationPage() {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await apiClient.request("/api/moderation/pending", {
        method: "GET",
        requireAuth: true
      });
      setPendingItems(data.items || []);
    } catch (err) {
      setError(err.data?.error || err.message || "Ошибка загрузки списка модерации");
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
      alert(err.data?.error || err.message || "Не удалось одобрить");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (schema, id, comment) => {
    setActionLoading(true);
    try {
      await apiClient.request("/api/moderation/decision", {
        method: "POST",
        requireAuth: true,
        data: { schema, id, status: "rejected", comment }
      });
      setSelectedItem(null);
      await loadPending();
    } catch (err) {
      alert(err.data?.error || err.message || "Не удалось отклонить");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="content-page"><p className="status-message">Загрузка очереди...</p></div>;
  if (error) return <div className="content-page"><p style={{ color: "red" }}>{error}</p></div>;

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

      <div className="content-page" style={{ flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Панель модерации</h2>
          <Button variant="secondary" fullWidth={false} onClick={loadPending}>
            Обновить
          </Button>
        </div>

        {pendingItems.length === 0 ? (
          <p className="empty-catalog-text">Очередь модерации пуста.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            {pendingItems.map((item) => {
              const author = item.creator_info;
              const artist = item.artist_info;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    padding: "1.25rem",
                    background: "#fff",
                    borderRadius: "14px",
                    alignItems: "center",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                    border: "1px solid #f0eded"
                  }}
                >
                  <img
                    src={item.cover || item.avatar || "/default.png"}
                    alt="preview"
                    style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover" }}
                  />

                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#1773cf", textTransform: "uppercase" }}>
                      [{item.type}]
                    </span>
                    <h3 style={{ margin: "4px 0" }}>{item.title || item.name}</h3>
                    
                    {artist && (
                      <p style={{ margin: "2px 0", color: "#14161a", fontSize: "0.95rem", fontWeight: 600 }}>
                        Артист: <Link to={`/artists/${artist.id}`} style={{ color: "#1773cf", textDecoration: "none" }}>{artist.name}</Link>
                      </p>
                    )}

                    {item.type === "album" && item.tracks && (
                      <p style={{ margin: "2px 0", color: "#555", fontSize: "0.85rem" }}>
                        Количество треков в альбоме: <strong>{item.tracks.length}</strong>
                      </p>
                    )}

                    <p style={{ margin: "4px 0", color: "#666", fontSize: "0.9rem" }}>
                      Автор заявки:{" "}
                      {author ? (
                        <Link 
                          to={`/profile/${author.id}`}
                          style={{ color: "#1773cf", fontWeight: 600, textDecoration: "none" }}
                        >
                          {author.nickname || author.login} (@{author.login})
                        </Link>
                      ) : (
                        <span>ID: {item.creator_id}</span>
                      )}
                      {item.genre ? ` • Жанр: ${item.genre}` : ""}
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