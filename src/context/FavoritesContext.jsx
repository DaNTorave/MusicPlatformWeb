import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  // Набор идентификаторов избранных треков текущего пользователя
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Получение перечня идентификаторов избранных композиций с сервера
  const loadFavoriteIds = useCallback(async () => {
    const token = apiClient.getToken();
    if (!token) {
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.getFavoriteIds();
      if (res?.data && Array.isArray(res.data)) {
        setFavoriteIds(new Set(res.data.map((id) => Number(id))));
      }
    } catch (err) {
      console.warn('Ошибка загрузки идентификаторов избранного:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первичная загрузка и подписка на события авторизации
  useEffect(() => {
    loadFavoriteIds();

    const handleAuthChange = () => {
      loadFavoriteIds();
    };

    const handleUnauthorized = () => {
      setFavoriteIds(new Set());
    };

    window.addEventListener('auth:login', handleAuthChange);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('favorites:updated', handleAuthChange);

    return () => {
      window.removeEventListener('auth:login', handleAuthChange);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('favorites:updated', handleAuthChange);
    };
  }, [loadFavoriteIds]);

  // Проверка присутствия трека в списке избранного
  const isFavorite = useCallback(
    (trackId) => {
      if (!trackId) return false;
      return favoriteIds.has(Number(trackId));
    },
    [favoriteIds],
  );

  // Оптимистичное добавление или удаление трека из избранного
  const toggleFavorite = useCallback(
    async (trackId) => {
      if (!trackId) return;
      const numId = Number(trackId);
      const isCurrentlyFavorite = favoriteIds.has(numId);

      // Оптимистичное обновление локального набора
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFavorite) {
          next.delete(numId);
        } else {
          next.add(numId);
        }
        return next;
      });

      try {
        await apiClient.toggleFavorite(numId);
        window.dispatchEvent(new CustomEvent('favorites:updated'));
      } catch (err) {
        // Откат состояния при сетевой ошибке
        setFavoriteIds((prev) => {
          const rollback = new Set(prev);
          if (isCurrentlyFavorite) {
            rollback.add(numId);
          } else {
            rollback.delete(numId);
          }
          return rollback;
        });
        console.error('Ошибка отправки изменения избранного на сервер:', err);
      }
    },
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavorite,
        toggleFavorite,
        reloadFavorites: loadFavoriteIds,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);