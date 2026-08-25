import React, { useState, useEffect } from 'react';
import { useMutation } from '../hooks/useApi';
import InputField from './InputField';
import Button from './Button';
import eye from '../assets/eye.svg';
import eye_crossed from '../assets/eye-crossed.svg';
import '../styles/AuthModal.css';
import '../styles/Register.css';
import '../styles/Login.css';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [fieldError, setFieldError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setFieldError('');
        setSuccessMessage('');
        setErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            resetForm();
            onClose();
        }, 300);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const { mutate, loading } = useMutation('/api/change-password', {
        method: 'PUT',
        requireAuth: true,
        onSuccess: (data) => {
            setSuccessMessage(data.message || 'Пароль успешно изменен!');
            setTimeout(() => {
                handleClose();
            }, 1500);
        },
        onError: (err) => {
            setFieldError(err.data?.error || err.message || 'Не удалось изменить пароль');
        }
    });

    const validateField = (field, value) => {
        let error = '';
        switch (field) {
            case 'currentPassword':
                if (!value.trim()) error = 'Введите текущий пароль';
                break;
            case 'newPassword':
                if (!value.trim()) {
                    error = 'Пароль обязателен';
                } else if (value.length < 8) {
                    error = 'Пароль должен содержать не менее 8 символов';
                } else if (!/(?=.*[a-z])/.test(value) || !/(?=.*[A-Z])/.test(value)) {
                    error = 'Пароль должен содержать прописные и строчные буквы';
                } else if (!/(?=.*\d)/.test(value)) {
                    error = 'Пароль должен содержать как минимум одну цифру';
                }
                break;
            case 'confirmPassword':
                if (!value.trim()) {
                    error = 'Подтверждение пароля обязательно';
                } else if (value !== newPassword) {
                    error = 'Пароли не совпадают';
                }
                break;
            default:
                break;
        }
        return error;
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return null;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/(?=.*[a-z])/.test(pwd) && /(?=.*[A-Z])/.test(pwd)) score++;
        if (/(?=.*\d)/.test(pwd)) score++;
        if (/(?=.*[!@#$%^&*])/.test(pwd)) score++;

        if (score <= 2) return { label: 'Слабый', class: 'weak' };
        if (score <= 3) return { label: 'Средний', class: 'medium' };
        if (score <= 4) return { label: 'Сильный', class: 'strong' };
        return { label: 'Очень сильный', class: 'very-strong' };
    };

    const handleFieldChange = (field, value) => {
        const setters = {
            currentPassword: setCurrentPassword,
            newPassword: setNewPassword,
            confirmPassword: setConfirmPassword
        };
        setters[field](value);
        setFieldError('');

        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));

        if (field === 'newPassword' && confirmPassword) {
            const confError = validateField('confirmPassword', confirmPassword);
            setErrors(prev => ({ ...prev, confirmPassword: confError }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFieldError('');

        const curErr = validateField('currentPassword', currentPassword);
        const newErr = validateField('newPassword', newPassword);
        const confErr = validateField('confirmPassword', confirmPassword);

        if (curErr || newErr || confErr) {
            setErrors({
                currentPassword: curErr,
                newPassword: newErr,
                confirmPassword: confErr
            });
            return;
        }

        mutate({
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword
        });
    };

    if (!isOpen) return null;

    const passwordStrength = getPasswordStrength(newPassword);
    const hasErrors = Boolean(errors.currentPassword || errors.newPassword || errors.confirmPassword);
    const isEmpty = !currentPassword || !newPassword || !confirmPassword;

    return (
        <div 
            className={`modal-background ${isClosing ? 'closing' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className={`modal-window ${isClosing ? 'closing' : ''}`}>
                <div className="modal-window-top-buttons">
                    <button className="modal-window-top-button active">
                        Смена пароля
                    </button>
                    <button className="modal-close-button" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-window-content">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <h2 className="auth-form-title">Изменить пароль</h2>
                        <p className="auth-form-subtitle">Укажите текущий и новый пароль</p>

                        {fieldError && (
                            <div className="auth-error-global" role="alert">
                                {fieldError}
                            </div>
                        )}

                        {successMessage && (
                            <div className="auth-success-global" role="alert">
                                {successMessage}
                            </div>
                        )}

                        {/* Текущий пароль */}
                        <div className="auth-form-group">
                            <label htmlFor="change-current-password">
                                Текущий пароль <span className="required-star">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="change-current-password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    placeholder="Введите текущий пароль"
                                    value={currentPassword}
                                    onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
                                    required
                                    disabled={loading}
                                    className={errors.currentPassword ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    tabIndex="-1"
                                    disabled={loading}
                                >
                                    <img 
                                        className="password-toggle-icon" 
                                        src={showCurrentPassword ? eye_crossed : eye} 
                                        alt="Видимость пароля" 
                                    />
                                </button>
                            </div>
                            {errors.currentPassword && <span className="auth-error">{errors.currentPassword}</span>}
                        </div>

                        {/* Новый пароль */}
                        <div className="auth-form-group">
                            <label htmlFor="change-new-password">
                                Новый пароль <span className="required-star">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="change-new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Минимум 8 символов"
                                    value={newPassword}
                                    onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    className={errors.newPassword ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    tabIndex="-1"
                                    disabled={loading}
                                >
                                    <img 
                                        className="password-toggle-icon" 
                                        src={showNewPassword ? eye_crossed : eye} 
                                        alt="Видимость пароля" 
                                    />
                                </button>
                            </div>
                            {errors.newPassword && <span className="auth-error">{errors.newPassword}</span>}
                            {newPassword && !errors.newPassword && passwordStrength && (
                                <div className="password-strength">
                                    <div className={`password-strength-bar ${passwordStrength.class}`}></div>
                                    <span className={`password-strength-text ${passwordStrength.class}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Подтверждение пароля */}
                        <div className="auth-form-group">
                            <label htmlFor="change-confirm-password">
                                Подтверждение нового пароля <span className="required-star">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="change-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Повторите новый пароль"
                                    value={confirmPassword}
                                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    className={errors.confirmPassword ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex="-1"
                                    disabled={loading}
                                >
                                    <img 
                                        className="password-toggle-icon" 
                                        src={showConfirmPassword ? eye_crossed : eye} 
                                        alt="Видимость пароля" 
                                    />
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            disabled={loading || hasErrors || isEmpty}
                            fullWidth
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Обновление...
                                </>
                            ) : (
                                'Сохранить пароль'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}