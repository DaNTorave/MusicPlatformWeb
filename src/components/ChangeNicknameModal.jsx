import React, { useState, useEffect } from 'react';
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';

import InputField from './InputField';
import Button from './Button';

import closeIcon from '../assets/close-icon.svg';

export function ChangeNicknameContent({
  currentNickname,
  onNicknameUpdated,
  onClose,
}) {
  // Состояние для нового никнейма, ошибок и успеха
  const [nickname, setNickname] = useState(currentNickname || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setNickname(currentNickname || '');
  }, [currentNickname]);

  // Мутация для отправки нового никнейма на сервер
  const { mutate, loading } = useMutation('/api/update-nickname', {
    method: 'PUT',
    requireAuth: true,
    onSuccess: (data) => {
      if (data.token) apiClient.setToken(data.token);
      if (data.user) apiClient.setUser(data.user);
      setSuccessMsg('Никнейм успешно обновлен!');
      setErrorMsg('');
      if (onNicknameUpdated) onNicknameUpdated(data.user);
      setTimeout(() => {
        setSuccessMsg('');
        if (onClose) onClose();
      }, 1000);
    },
    onError: (err) => {
      setSuccessMsg('');
      if (err.data?.errors?.nickname) {
        setErrorMsg(`Никнейм ${err.data.errors.nickname[0]}`);
      } else {
        setErrorMsg(
          err.data?.error || err.message || 'Ошибка обновления никнейма',
        );
      }
    },
  });

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmed = nickname.trim();
    if (!trimmed) {
      setErrorMsg('Никнейм не может быть пустым');
      return;
    }

    mutate({ nickname: trimmed });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMsg && <div className="auth-error-global">{errorMsg}</div>}
      {successMsg && <div className="auth-success-global">{successMsg}</div>}

      <InputField
        id="new-nickname"
        label="Новый никнейм"
        placeholder="Введите никнейм"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
        disabled={loading}
        autoFocus
      />

      <Button
        type="submit"
        variant="primary"
        disabled={loading || !nickname.trim()}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </form>
  );
}

export default function ChangeNicknameModal({
  isOpen,
  onClose,
  currentNickname,
  onNicknameUpdated,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-background"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-window">
        <div className="modal-window-top-buttons">
          <button type="button" className="modal-window-top-button active">
            Смена никнейма
          </button>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            title="Закрыть"
          >
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="modal-window-content">
          <ChangeNicknameContent
            currentNickname={currentNickname}
            onNicknameUpdated={onNicknameUpdated}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}