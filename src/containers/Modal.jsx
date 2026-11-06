import React, { useState, useEffect } from 'react';
import closeIcon from '../assets/close-icon.svg';
import '../styles/Modal.css';

// Универсальный контейнер модального окна
export default function Modal({
  isOpen,
  onClose,
  tabs = [],
  activeTab,
  onTabChange,
  size = 'default',
  scrollable = false,
  notification = null,
  onClearNotification,
  children,
}) {
  // Состояние анимации закрытия окна
  const [isClosing, setIsClosing] = useState(false);

  // Сброс состояния закрытия при открытии окна
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Запуск анимации закрытия с последующим вызовом колбэка
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  // Перехват нажатия клавиши Escape для закрытия окна
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Блокировка прокрутки страницы при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Закрытие окна при клике на затемненный фон
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  // Определение модификатора ширины окна
  const sizeClass =
    size === 'wide'
      ? 'modal-window-wide'
      : size === 'narrow'
        ? 'modal-window-narrow'
        : '';

  return (
    <div
      className={`modal-background ${isClosing ? 'closing' : ''}`}
      onClick={handleBackgroundClick}
    >
      {/* Всплывающее уведомление поверх модального окна */}
      {notification && (
        <div className="modal-toast-notification">
          <span>{notification}</span>
          <button
            type="button"
            onClick={onClearNotification}
            title="Закрыть уведомление"
          >
            <img
              src={closeIcon}
              alt="Закрыть"
              className="modal-toast-close-icon"
            />
          </button>
        </div>
      )}

      <div
        className={`modal-window ${sizeClass} ${isClosing ? 'closing' : ''}`}
      >
        {/* Верхняя панель с вкладками переключения и кнопкой закрытия */}
        <div className="modal-window-top-buttons">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`modal-window-top-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        {/* Контейнер внутреннего содержимого */}
        <div
          className={`modal-window-content ${scrollable ? 'modal-window-content-scroll' : ''}`}
        >
          {typeof children === 'function'
            ? children({ handleClose })
            : children}
        </div>
      </div>
    </div>
  );
}