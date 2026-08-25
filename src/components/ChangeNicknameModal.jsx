import React, { useState } from 'react';
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';
import InputField from './InputField';
import Button from './Button';

export default function ChangeNicknameModal({ isOpen, onClose, currentNickname, onNicknameUpdated }) {
    const [nickname, setNickname] = useState(currentNickname || '');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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
                onClose();
            }, 1000);
        },
        onError: (err) => {
            setSuccessMsg('');
            if (err.data?.errors?.nickname) {
                setErrorMsg(`Никнейм ${err.data.errors.nickname[0]}`);
            } else {
                setErrorMsg(err.data?.error || err.message || 'Ошибка обновления никнейма');
            }
        }
    });

    if (!isOpen) return null;

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
        <div className="modal-background" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-window">
                <div className="modal-window-top-buttons">
                    <button className="modal-window-top-button active">Смена никнейма</button>
                    <button className="modal-close-button" onClick={onClose}>✕</button>
                </div>

                <div className="modal-window-content">
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

                        <Button type="submit" variant="primary" disabled={loading || !nickname.trim()}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}