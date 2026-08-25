import React, { useState } from 'react';
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';
import InputField from './InputField';
import Button from './Button';

import google_logo from '../assets/google.svg';
import github_logo from '../assets/github.svg';
import '../styles/Login.css';

export default function Login({ onSuccess, onSwitchToRegister, onSwitchToReset }) {
    const [loginOrEmail, setLoginOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldError, setFieldError] = useState('');

    const { mutate, loading } = useMutation('/api/login', {
        method: 'POST',
        onSuccess: (data) => {
            if (data.token) apiClient.setToken(data.token);
            if (data.user) apiClient.setUser(data.user);
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            console.error('Ошибка входа:', err);
            let errorMessage = '';
            if (err.status === 401) {
                errorMessage = 'Неверный логин или пароль';
            } else if (err.status === 400) {
                errorMessage = err.data?.error || err.message || 'Некорректные данные';
            } else if (err.status === 422) {
                errorMessage = 'Ошибка валидации данных';
            } else if (err.isCorsError) {
                errorMessage = 'Ошибка подключения к серверу. Проверьте настройки CORS.';
            } else if (err.isNetworkError) {
                errorMessage = 'Нет соединения с сервером. Проверьте интернет.';
            } else if (err.isTimeout) {
                errorMessage = 'Сервер не отвечает. Попробуйте позже.';
            } else {
                errorMessage = err.message || 'Произошла ошибка при входе';
            }
            setFieldError(errorMessage);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFieldError('');

        if (!loginOrEmail.trim()) {
            setFieldError('Введите имя пользователя или email');
            return;
        }

        if (!password) {
            setFieldError('Введите пароль');
            return;
        }

        mutate({ login: loginOrEmail, password });
    };

    const getInputType = () => {
        return loginOrEmail.includes('@') && loginOrEmail.includes('.') ? 'email' : 'text';
    };

    const getPlaceholder = () => {
        return loginOrEmail.includes('@') && loginOrEmail.includes('.') 
            ? 'example@mail.com' 
            : 'Имя пользователя или email';
    };

    const isFormEmpty = !loginOrEmail.trim() || !password;

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Добро пожаловать!</h2>
            <p className="auth-form-subtitle">Войдите, чтобы продолжить</p>
            
            {fieldError && (
                <div className="auth-error-global" role="alert">
                    {fieldError}
                </div>
            )}

            <InputField
                id="login-email"
                label="Имя пользователя или Email"
                type={getInputType()}
                placeholder={getPlaceholder()}
                value={loginOrEmail}
                onChange={(e) => {
                    setLoginOrEmail(e.target.value);
                    setFieldError('');
                }}
                required
                disabled={loading}
                autoComplete="username"
                autoFocus
            />

            <InputField
                id="login-password"
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError('');
                }}
                required
                disabled={loading}
                autoComplete="current-password"
            >
                <div className="auth-forgot-password">
                    <a onClick={onSwitchToReset}>
                        Забыли пароль?
                    </a>
                </div>
            </InputField>

            <Button 
                type="submit" 
                variant="primary"
                disabled={loading || isFormEmpty}
                fullWidth
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Вход...
                    </>
                ) : (
                    'Войти'
                )}
            </Button>

            <div className="auth-divider">или</div>

            <div className="social-buttons">
                <Button 
                    type="button" 
                    variant="secondary"
                    disabled={loading}
                    onClick={() => alert('Вход через Google')}
                >
                    <img className="social-button-icon" src={google_logo} alt="Google" />
                    Google
                </Button>
                <Button 
                    type="button" 
                    variant="secondary"
                    disabled={loading}
                    onClick={() => alert('Вход через GitHub')}
                >
                    <img className="social-button-icon" src={github_logo} alt="GitHub" />
                    GitHub
                </Button>
            </div>

            <div className="auth-form-footer">
                Нет аккаунта?{' '}
                <a onClick={onSwitchToRegister}>
                    Зарегистрироваться
                </a>
            </div>
        </form>
    );
}