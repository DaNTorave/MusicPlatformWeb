import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import InputField from '../components/InputField';

import '../styles/GenresPage.css';

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Поля добавления нового жанра
  const [key, setKey] = useState('');
  const [titleRu, setTitleRu] = useState('');

  // Поля редактирования выбранного жанра
  const [editingId, setEditingId] = useState(null);
  const [editTitleRu, setEditTitleRu] = useState('');

  const navigate = useNavigate();
  const currentUser = apiClient.getUser();

  // Загрузка списка жанров
  const loadGenres = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getGenres();
      if (res?.data) {
        setGenres(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка загрузки жанров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'owner') {
      navigate('/');
      return;
    }
    loadGenres();
  }, []);

  // Сортировка жанров по возрастанию ID базы данных
  const sortedGenres = useMemo(() => {
    return [...genres].sort((a, b) => Number(a.id) - Number(b.id));
  }, [genres]);

  // Добавление жанра
  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedKey = key.trim().toLowerCase();
    const trimmedTitleRu = titleRu.trim();

    try {
      await apiClient.createGenre({
        key: trimmedKey,
        title_ru: trimmedTitleRu,
        title_en: trimmedKey,
      });
      setKey('');
      setTitleRu('');
      setSuccessMsg('Жанр успешно добавлен в кластер');
      loadGenres();
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Ошибка добавления жанра');
    }
  };

  // Начало редактирования
  const startEdit = (g) => {
    setEditingId(g.id);
    setEditTitleRu(g.title_ru);
  };

  // Сохранение изменений
  const handleSaveEdit = async (id, currentGenre) => {
    try {
      await apiClient.updateGenre(id, {
        title_ru: editTitleRu.trim(),
        title_en: currentGenre.title_en || currentGenre.key,
      });
      setEditingId(null);
      loadGenres();
    } catch (err) {
      alert(err.message || 'Ошибка сохранения');
    }
  };

  // Удаление жанра
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить жанр из кластера?')) return;
    try {
      await apiClient.deleteGenre(id);
      loadGenres();
    } catch (err) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="genres-manager-page">
      <div className="genres-manager-header">
        <div>
          <span className="artist-tag">Администрирование</span>
          <h1 className="artist-title">Кластер жанров</h1>
          <p className="artist-meta-string" style={{ paddingLeft: 0 }}>
            Управление допустимыми жанрами для всей платформы
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          onClick={() => navigate('/')}
        >
          Назад
        </Button>
      </div>

      {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
      {successMsg && <div className="auth-success-global">{successMsg}</div>}

      {/* Форма создания жанра */}
      <form className="genres-create-card" onSubmit={handleCreate}>
        <h3>Добавить жанр в кластер</h3>
        <div className="genres-form-row">
          <InputField
            label="Ключ (английский слаг)"
            placeholder="например: synthwave"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <InputField
            label="Название на русском (для фронта)"
            placeholder="например: Синтвейв"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            required
          />
        </div>
        <div className="genres-btn-submit-wrapper">
          <Button type="submit" variant="primary" fullWidth={false}>
            Добавить жанр
          </Button>
        </div>
      </form>

      {/* Список жанров с порядковой нумерацией */}
      <div className="genres-table-wrapper">
        <table className="genres-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>№</th>
              <th>Ключ системы</th>
              <th>Название на русском</th>
              <th style={{ width: '180px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && sortedGenres.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  Загрузка жанров...
                </td>
              </tr>
            ) : (
              sortedGenres.map((g, index) => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>
                    {index + 1}
                  </td>
                  <td>
                    <code>{g.key}</code>
                  </td>
                  <td>
                    {editingId === g.id ? (
                      <input
                        type="text"
                        className="input-element"
                        value={editTitleRu}
                        onChange={(e) => setEditTitleRu(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      g.title_ru
                    )}
                  </td>
                  <td>
                    {editingId === g.id ? (
                      <div className="genres-action-btns">
                        <button
                          type="button"
                          className="btn-save-chip"
                          onClick={() => handleSaveEdit(g.id, g)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-chip"
                          onClick={() => setEditingId(null)}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="genres-action-btns">
                        <button
                          type="button"
                          className="btn-edit-chip"
                          onClick={() => startEdit(g)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="btn-delete-chip"
                          onClick={() => handleDelete(g.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}