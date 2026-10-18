import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import AuthModal from './AuthModal';
import UploadMusicModal from '../components/UploadMusicModal';
import NotificationsModal from '../components/NotificationsModal';

import logo from '../assets/logo.png';
import userIcon from '../assets/user-svgrepo-com.svg';

import '../styles/Header.css';

export default function Header() {
  // Единое состояние для активного модального окна в шапке ('auth' | 'upload' | 'notifications' | null)
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Загрузка количества непрочитанных уведомлений
  const loadUnreadCount = async () => {
    try {
      const res = await apiClient.request('/api/notifications', {
        method: 'GET',
        requireAuth: true,
      });
      if (res?.notifications) {
        const count = res.notifications.filter((n) => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch (e) {
      setUnreadCount(0);
    }
  };

  // Загрузка пользователя и подписка на события авторизации и уведомлений
  useEffect(() => {
    const currentUser = apiClient.getUser();
    if (currentUser) {
      setUser(currentUser);
      loadUnreadCount();
    }

    const handleAuthChange = () => {
      const updatedUser = apiClient.getUser();
      setUser(updatedUser);
      if (updatedUser) loadUnreadCount();
      else setUnreadCount(0);
    };

    const handleNotificationsChange = () => {
      loadUnreadCount();
    };

    window.addEventListener('auth:unauthorized', handleAuthChange);
    window.addEventListener('auth:login', handleAuthChange);
    window.addEventListener('notifications:update', handleNotificationsChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user' || e.key === 'authToken') {
        handleAuthChange();
      }
      if (e.key === 'user_notifications') {
        handleNotificationsChange();
      }
    });

    // Закрытие выпадающего меню при клике вне области
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('auth:unauthorized', handleAuthChange);
      window.removeEventListener('auth:login', handleAuthChange);
      window.removeEventListener(
        'notifications:update',
        handleNotificationsChange,
      );
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработка успешного входа
  const handleLoginSuccess = () => {
    const currentUser = apiClient.getUser();
    setUser(currentUser);
    setActiveModal(null);
    setIsDropdownOpen(false);
    loadUnreadCount();
  };

  // Выход из системы
  const handleLogout = () => {
    apiClient.clearSession();
    setUser(null);
    setUnreadCount(0);
    setIsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    navigate('/');
  };

  // Переход в профиль
  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  // Клик по пользователю
  const handleUserClick = () => {
    if (user) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setActiveModal('auth');
    }
  };

  // Открытие модального окна уведомлений
  const handleNotificationsClick = () => {
    setIsDropdownOpen(false);
    setActiveModal('notifications');
  };

  const displayName = user ? user.nickname || user.login : null;

  return (
    <>
      {/* Модальное окно авторизации */}
      <AuthModal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal(null)}
        onLoginSuccess={handleLoginSuccess}
        initialTab="login"
      />

      {/* Модальное окно загрузки музыки */}
      <UploadMusicModal
        isOpen={activeModal === 'upload'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => {
          loadUnreadCount();
        }}
      />

      {/* Модальное окно уведомлений */}
      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        onOpenUpload={() => {
          setActiveModal('upload');
        }}
      />

      <header className="header">
        <div
          className="header-title-with-logo-block"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <img className="header-logo" src={logo} alt="Логотип" />
          <p className="header-title">Music Platform</p>
        </div>

        <div className="header-user-block" ref={dropdownRef}>
          <div className="user-menu-container">
            <Button
              type="button"
              variant="user-header"
              fullWidth={false}
              onClick={handleUserClick}
            >
              <img
                className="user-icon"
                src={userIcon}
                alt="Иконка пользователя"
              />
              <span>{user ? displayName : 'Войти'}</span>
            </Button>

            {/* Выпадающее меню пользователя */}
            {user && isDropdownOpen && (
              <div className="user-dropdown">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  <span>Профиль</span>
                </button>

                {user &&
                  (user.role === 'admin' || user.role === 'moderator') && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/moderation');
                      }}
                    >
                      <span>Модерация</span>
                    </button>
                  )}

                <button
                  type="button"
                  className="dropdown-item"
                  onClick={handleNotificationsClick}
                >
                  <span>Уведомления</span>
                  {unreadCount > 0 && (
                    <span className="dropdown-badge-counter">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="dropdown-divider"></div>

                <button
                  type="button"
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}