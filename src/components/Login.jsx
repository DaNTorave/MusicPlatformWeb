import { useState } from 'react';
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';

import google_logo from "../assets/google.svg";
import github_logo from "../assets/github.svg";
import eye from "../assets/eye.svg";
import eye_crossed from "../assets/eye-crossed.svg";

import '../styles/Login.css'

export default function Login({ onSuccess, onSwitchToRegister }) {
    const [loginOrEmail, setLoginOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { mutate, loading, error } = useMutation('/api/login', {
        method: 'POST',
        onSuccess: (data) => {
            if (data.token) {
                apiClient.setToken(data.token);
            }
            if (data.user) {
                apiClient.setUser(data.user);
            }
            
            if (onSuccess) {
                onSuccess();
            }
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

        if (password.length < 8) {
            setFieldError('Пароль должен содержать не менее 8 символов');
            return;
        }

        mutate({
            login: loginOrEmail,
            password: password,
        });
    };

    const getInputType = () => {
        if (loginOrEmail.includes('@') && loginOrEmail.includes('.')) {
            return 'email';
        }
        return 'text';
    };

    const getPlaceholder = () => {
        if (loginOrEmail.includes('@') && loginOrEmail.includes('.')) {
            return 'example@mail.com';
        }
        return 'Имя пользователя или email';
    };

    const isFormEmpty = !loginOrEmail.trim() || password.length < 8;

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Добро пожаловать!</h2>
            <p className="auth-form-subtitle">Войдите, чтобы продолжить</p>
            
            {fieldError && (
                <div className="auth-error-global" role="alert">
                    {fieldError}
                </div>
            )}

            <div className="auth-form-group">
                <label htmlFor="login-email">Имя пользователя или Email</label>
                <input
                    id="login-email"
                    type={getInputType()}
                    placeholder={getPlaceholder()}
                    value={loginOrEmail}
                    onChange={(e) => {
                        setLoginOrEmail(e.target.value);
                        setFieldError('');
                    }}
                    required
                    disabled={loading}
                    className={fieldError ? 'error' : ''}
                    autoComplete="username"
                    autoFocus
                />
            </div>

            <div className="auth-form-group">
                <label htmlFor="login-password">Пароль</label>
                <div className="password-input-wrapper">
                    <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldError('');
                        }}
                        required
                        minLength={8}
                        disabled={loading}
                        className={fieldError ? 'error' : ''}
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                    >
                        {showPassword ? <img className="password-toggle-icon" src={eye_crossed} alt="Показать пароль" /> : <img className="password-toggle-icon" src={eye} alt="Скрыть пароль" />}
                    </button>
                </div>
                <div className="auth-forgot-password">
                    <a onClick={() => alert('Функция восстановления пароля')}>
                        Забыли пароль?
                    </a>
                </div>
            </div>

            <button 
                type="submit" 
                className="auth-submit-button" 
                disabled={loading || isFormEmpty}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Вход...
                    </>
                ) : (
                    'Войти'
                )}
            </button>

            <div className="auth-divider">или</div>

            <div className="social-buttons">
                <button 
                    type="button" 
                    className="social-button" 
                    disabled={loading}
                    onClick={() => {alert("Это декоративное говно")}}
                >
                    <img className="social-button-icon" src={google_logo} alt="Google" />
                    Google
                </button>
                <button 
                    type="button" 
                    className="social-button" 
                    disabled={loading}
                    onClick={() => {alert("Это тоже декоративное говно")}}
                >
                    <img className="social-button-icon" src={github_logo} alt="GitHub" />
                    GitHub
                </button>
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