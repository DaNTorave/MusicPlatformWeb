import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import InputField from '../components/InputField';

import defaultAvatar from '../assets/Шотландская веслоухая.jpg';
import searchIcon from '../assets/search-icon.svg';

import '../styles/RolesPage.css';
import '../styles/Content.css';

// Полный перечень ролей и их названий
const ROLE_LABELS = {
  owner: 'Владелец (owner)',
  admin: 'Администратор (admin)',
  moderator: 'Модератор (moderator)',
  member: 'Пользователь (member)',
};

export default function RolesPage() {
  const [users, setUsers] = useState([]);
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();
  const currentUser = apiClient.getUser();

  // Доступ открыт только для owner и admin
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Загрузка пользователей с сервера
  const loadUsers = async (query = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.getUsers(query);
      if (res?.users) {
        setUsers(res.users);
      }
      if (res?.roles) {
        setAllowedRoles(res.roles);
      }
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Поиск пользователей по запросу
  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  // Смена роли пользователя
  const handleRoleChange = async (targetUser, targetRole) => {
    if (targetUser.id === currentUser?.id && targetRole !== currentUser?.role) {
      alert('Нельзя изменить роль собственной учетной записи.');
      return;
    }

    if (!window.confirm(`Подтвердите назначение роли "${targetRole}" пользователю @${targetUser.login}.`)) {
      return;
    }

    setUpdatingId(targetUser.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.updateUserRole(targetUser.id, targetRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: targetRole } : u)),
      );
      setSuccessMsg(`Роль пользователя @${targetUser.login} успешно изменена на ${targetRole}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Не удалось обновить роль');
    } finally {
      setUpdatingId(null);
    }
  };

  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="content-page roles-page-container">
      <div className="roles-header-row">
        <div>
          <h2>Панель управления ролями</h2>
          <p className="roles-subtitle">
            {isOwner
              ? 'Полное управление ролями платформы (Владелец).'
              : 'Управление модераторами платформы (Администратор).'}
          </p>
        </div>
        <Button variant="secondary" fullWidth={false} onClick={() => loadUsers(searchQuery)}>
          Обновить
        </Button>
      </div>

      {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
      {successMsg && <div className="auth-success-global">{successMsg}</div>}

      <form onSubmit={handleSearch} className="roles-search-form">
        <InputField
          type="text"
          placeholder="Поиск по логину, email или никнейму..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearable
          onClear={() => {
            setSearchQuery('');
            loadUsers('');
          }}
          leftIcon={<img src={searchIcon} alt="Поиск" />}
        />
        <Button type="submit" variant="primary" fullWidth={false}>
          Найти
        </Button>
      </form>

      {loading ? (
        <p className="status-message">Загрузка пользователей...</p>
      ) : users.length === 0 ? (
        <p className="empty-catalog-text">Пользователи не найдены.</p>
      ) : (
        <div className="roles-table-wrapper">
          <table className="roles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Текущая роль</th>
                <th>Назначить роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrent = currentUser && currentUser.id === u.id;
                const isBusy = updatingId === u.id;

                // Администратор не может редактировать владельцев и других администраторов
                const canEditThisUser =
                  isOwner || (currentUser?.role === 'admin' && u.role !== 'owner' && u.role !== 'admin');

                return (
                  <tr key={u.id} className={isCurrent ? 'current-user-row' : ''}>
                    <td>{u.id}</td>
                    <td>
                      <div className="roles-user-cell">
                        <img
                          src={u.avatar || defaultAvatar}
                          alt={u.login}
                          className="roles-user-avatar"
                        />
                        <div className="roles-user-names">
                          <span className="roles-user-nick">{u.nickname || u.login}</span>
                          <Link className="roles-user-login" to={`/profile/${u.id}`}>@{u.login}</Link>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      {isCurrent && <span className="roles-you-pill">(Вы)</span>}
                    </td>
                    <td>
                      {canEditThisUser ? (
                        <select
                          className="roles-select-input"
                          value={u.role}
                          disabled={isBusy}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          {allowedRoles.map((roleKey) => (
                            <option key={roleKey} value={roleKey}>
                              {ROLE_LABELS[roleKey] || roleKey}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="roles-locked-text">Недоступно</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}