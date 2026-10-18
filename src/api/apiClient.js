async function parseResponse(response) {
  const contentLength = response.headers.get('content-length');
  if (
    contentLength === '0' ||
    response.status === 204 ||
    response.status === 205
  ) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await response.text();
      if (!text || text.trim() === '') return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }
  return await response.text();
}

export const apiClient = {
  // Сохранение токена в localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },

  // Получение токена из localStorage
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Сохранение данных пользователя
  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('auth:login'));
    } else {
      localStorage.removeItem('user');
    }
  },

  // Получение данных пользователя
  getUser() {
    const user = localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // Очистка сессии
  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Основной метод выполнения запросов к API
  async request(url, options = {}) {
    const {
      method = 'GET',
      data = null,
      requireAuth = false,
      ...rest
    } = options;
    const headers = { 'Content-Type': 'application/json', ...rest.headers };

    if (requireAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`[API] Запрос: ${method} ${url}`, data || '');
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
      });

      const parsedData = await parseResponse(response);
      console.log(`[API] Ответ от сервера:`, parsedData);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearSession();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        const error = new Error(
          parsedData?.error ||
            parsedData?.message ||
            `Ошибка сервера: ${response.status}`,
        );
        error.status = response.status;
        error.data = parsedData;

        if (parsedData?.errors) {
          error.validationErrors = parsedData.errors;
        }

        console.error('[API] Ошибка сервера:', error);
        throw error;
      }

      return parsedData;
    } catch (err) {
      if (err.name === 'TypeError') {
        err.isNetworkError = true;
        err.message =
          'Сервер не запущен или CORS заблокирован. Проверьте, работает ли сервер.';
      }
      throw err;
    }
  },

  // Авторизация
  async login(credentials) {
    const response = await this.request('/api/login', {
      method: 'POST',
      data: credentials,
    });

    if (response?.token) {
      this.setToken(response.token);
    }
    if (response?.user) {
      this.setUser(response.user);
    }

    return response;
  },

  // Регистрация с последующим автоматическим входом
  async registerAndLogin(userData) {
    const registerResponse = await this.request('/api/register', {
      method: 'POST',
      data: userData,
    });

    const loginResponse = await this.request('/api/login', {
      method: 'POST',
      data: {
        login: userData.login,
        password: userData.password,
      },
    });

    if (loginResponse?.token) {
      this.setToken(loginResponse.token);
    }
    if (loginResponse?.user) {
      this.setUser(loginResponse.user);
    }

    return {
      register: registerResponse,
      login: loginResponse,
    };
  },

  // Загрузка файлов через FormData
  async upload(url, formData) {
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`[API] Upload: POST ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const parsedData = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearSession();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const error = new Error(
          parsedData?.error ||
            parsedData?.message ||
            `Ошибка загрузки: ${response.status}`,
        );
        error.status = response.status;
        error.data = parsedData;
        throw error;
      }

      return parsedData;
    } catch (err) {
      if (err.name === 'TypeError') {
        err.isNetworkError = true;
        err.message = 'Сервер не запущен или CORS заблокирован.';
      }
      throw err;
    }
  },

  // Получение уведомлений текущего пользователя
  async getNotifications() {
    return await this.request('/api/notifications', {
      method: 'GET',
      requireAuth: true,
    });
  },

  // Отметка уведомления как прочитанного
  async markNotificationRead(id) {
    return await this.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
      requireAuth: true,
    });
  },

  // Получение избранных треков
  async getFavorites(limit = null) {
    const query = limit ? `?limit=${limit}` : '';
    return await this.request(`/api/favorites${query}`, {
      method: 'GET',
      requireAuth: true,
    });
  },

  // Получение идентификаторов всех избранных треков
  async getFavoriteIds() {
    return await this.request('/api/favorites/ids', {
      method: 'GET',
      requireAuth: true,
    });
  },

  // Переключение статуса избранного
  async toggleFavorite(trackId) {
    return await this.request('/api/favorites/toggle', {
      method: 'POST',
      requireAuth: true,
      data: { track_id: trackId },
    });
  },

  // Получение всех плейлистов текущего пользователя
  async getMyPlaylists() {
    return await this.request('/api/playlists', {
      method: 'GET',
      requireAuth: true,
    });
  },

  // Получение публичных плейлистов пользователя для профиля
  async getUserPlaylists(userId) {
    return await this.request(`/api/users/${userId}/playlists`, {
      method: 'GET',
    });
  },

  // Получение плейлиста по идентификатору
  async getPlaylist(playlistId) {
    return await this.request(`/api/playlists/${playlistId}`, {
      method: 'GET',
    });
  },

  // Создание нового плейлиста
  async createPlaylist(formData) {
    return await this.upload('/api/playlists', formData);
  },

  // Обновление плейлиста
  async updatePlaylist(playlistId, formData) {
    return await this.upload(`/api/playlists/${playlistId}/update`, formData);
  },

  // Удаление плейлиста
  async deletePlaylist(playlistId) {
    return await this.request(`/api/playlists/${playlistId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // Добавление или удаление трека в плейлисте
  async togglePlaylistTrack(playlistId, trackId) {
    return await this.request(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      requireAuth: true,
      data: { track_id: trackId },
    });
  },

  // Удаление трека из плейлиста
  async removePlaylistTrack(playlistId, trackId) {
    return await this.request(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },
};