import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

import Button from '../components/Button';
import Modal from './Modal';
import AuthModal from '../components/AuthModal';
import UploadMusicModal from '../components/UploadMusicModal';
import NotificationsModal from '../components/NotificationsModal';

import logo from '../assets/logo.png';
import userIcon from '../assets/user-svgrepo-com.svg';

import '../styles/Header.css';

export default function Header() {
  // Состояния открытого модального окна, вкладок и уведомлений
  const [activeModal, setActiveModal] = useState(null);
  const [authTab, setAuthTab] = useState('login');
  const [uploadTab, setUploadTab] = useState('single');
  const [toastNotification, setToastNotification] = useState(null);

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
    window.addEventListener('user:updated', handleAuthChange);
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
      window.removeEventListener('user:updated', handleAuthChange);
      window.removeEventListener(
        'notifications:update',
        handleNotificationsChange,
      );
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Показ всплывающего уведомления поверх модального окна на 8 секунд
  const showNotification = (msg) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 8000);
  };

  // Обработка успешного входа
  const handleLoginSuccess = () => {
    const currentUser = apiClient.getUser();
    setUser(currentUser);
    setActiveModal(null);
    setIsDropdownOpen(false);
    loadUnreadCount();
    window.location.reload();
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

  // Клик по кнопке пользователя в шапке
  const handleUserClick = () => {
    if (user) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setAuthTab('login');
      setActiveModal('auth');
    }
  };

  // Открытие модального окна уведомлений
  const handleNotificationsClick = () => {
    setIsDropdownOpen(false);
    setActiveModal('notifications');
  };

  const displayName = user ? user.nickname || user.login : null;
  const canManageRoles =
    user && (user.role === 'owner' || user.role === 'admin');
  const isStaff =
    user &&
    (user.role === 'owner' ||
      user.role === 'admin' ||
      user.role === 'moderator');

  const avatarSrc =
    user && user.avatar && user.avatar.trim() !== '' ? user.avatar : userIcon;
  const isCustomAvatar = Boolean(
    user && user.avatar && user.avatar.trim() !== '',
  );

  // Вкладки для окна авторизации
  const authTabs = [
    { id: 'login', label: 'Вход' },
    { id: 'register', label: 'Регистрация' },
    ...(authTab === 'reset' ? [{ id: 'reset', label: 'Сброс пароля' }] : []),
  ];

  // Вкладки для окна загрузки музыки
  const uploadTabs = [
    { id: 'single', label: 'Сингл' },
    { id: 'album', label: 'Альбом' },
    { id: 'artist', label: 'Артист' },
  ];

  return (
    <>
      {/* Контейнер модального окна авторизации */}
      <Modal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal(null)}
        tabs={authTabs}
        activeTab={authTab}
        onTabChange={setAuthTab}
        notification={toastNotification}
        onClearNotification={() => setToastNotification(null)}
      >
        <AuthModal
          activeTab={authTab}
          onTabChange={setAuthTab}
          onSuccess={handleLoginSuccess}
          onShowNotification={showNotification}
        />
      </Modal>

      {/* Контейнер модального окна загрузки музыки */}
      <Modal
        isOpen={activeModal === 'upload'}
        onClose={() => setActiveModal(null)}
        tabs={uploadTabs}
        activeTab={uploadTab}
        onTabChange={setUploadTab}
        size="wide"
        scrollable={true}
      >
        <UploadMusicModal
          uploadType={uploadTab}
          onUploadTypeChange={setUploadTab}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            loadUnreadCount();
          }}
        />
      </Modal>

      {/* Модальное окно уведомлений */}
      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        onOpenUpload={() => {
          setUploadTab('single');
          setActiveModal('upload');
        }}
      />

      <header className="header">
        <div
          className="header-title-with-logo-block"
          onClick={() => navigate('/')}
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
                className={`user-icon ${isCustomAvatar ? 'user-avatar-image' : ''}`}
                src={avatarSrc}
                alt={user ? displayName : 'Пользователь'}
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

                {canManageRoles && (
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/roles');
                    }}
                  >
                    <span>Управление ролями</span>
                  </button>
                )}

                {isStaff && (
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

                {user && user.role === 'owner' && (
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/genres');
                    }}
                  >
                    <span>Кластер жанров</span>
                  </button>
                )}

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