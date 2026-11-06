import React, { useState, useEffect } from 'react';
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';

import InputField from './InputField';
import Button from './Button';
import ResetPassword from './ResetPassword';
import { PreferencesFormContent } from './PreferencesStepModal';

import google_logo from '../assets/google.svg';
import github_logo from '../assets/github.svg';
import eye from '../assets/eye.svg';
import eye_crossed from '../assets/eye-crossed.svg';

import '../styles/Modal.css';

// Компонент содержимого авторизации, регистрации и сброса пароля
export default function AuthModal({
  activeTab = 'login',
  onTabChange,
  onSuccess,
  onShowNotification,
}) {
  // Состояния для режима входа
  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Состояния для режима регистрации
  const [regStep, setRegStep] = useState('credentials');
  const [regLogin, setRegLogin] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regFieldError, setRegFieldError] = useState('');
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [preferredArtistIds, setPreferredArtistIds] = useState([]);

  // Ошибки валидации полей регистрации
  const [regErrors, setRegErrors] = useState({
    login: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  });

  // Сброс локальных ошибок при переключении вкладки
  useEffect(() => {
    setLoginError('');
    setRegFieldError('');
    if (activeTab !== 'register') {
      setRegStep('credentials');
    }
  }, [activeTab]);

  // Мутация авторизации пользователя
  const { mutate: mutateLogin, loading: loadingLogin } = useMutation(
    '/api/login',
    {
      method: 'POST',
      onSuccess: (data) => {
        if (data.token) apiClient.setToken(data.token);
        if (data.user) apiClient.setUser(data.user);
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        let errorMessage = '';
        if (err.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (err.status === 400) {
          errorMessage =
            err.data?.error || err.message || 'Некорректные данные';
        } else if (err.status === 422) {
          errorMessage = 'Ошибка валидации данных';
        } else if (err.isCorsError) {
          errorMessage =
            'Ошибка подключения к серверу. Проверьте настройки CORS.';
        } else if (err.isNetworkError) {
          errorMessage = 'Нет соединения с сервером. Проверьте интернет.';
        } else if (err.isTimeout) {
          errorMessage = 'Сервер не отвечает. Попробуйте позже.';
        } else {
          errorMessage = err.message || 'Произошла ошибка при входе';
        }
        setLoginError(errorMessage);
      },
    },
  );

  // Мутация регистрации с последующим автоматическим входом
  const { mutate: mutateRegister, loading: loadingRegister } = useMutation(
    '/api/register',
    {
      method: 'POST',
      onSuccess: async () => {
        try {
          setIsRegistrationComplete(true);
          await apiClient.login({
            login: regLogin,
            password: regPassword,
          });
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onSuccess) onSuccess();
        }
      },
      onError: (err) => {
        setRegStep('credentials');

        if (err.status === 400) {
          if (err.data?.errors) {
            const serverErrors = err.data.errors;
            const newErrors = {};
            let hasFieldErrors = false;

            const fieldMap = {
              login: 'login',
              email: 'email',
              nickname: 'nickname',
              password: 'password',
            };

            Object.keys(serverErrors).forEach((key) => {
              const field = fieldMap[key];
              if (field) {
                const errorMsg = Array.isArray(serverErrors[key])
                  ? serverErrors[key][0]
                  : serverErrors[key];
                newErrors[field] = errorMsg;
                hasFieldErrors = true;
              }
            });

            if (hasFieldErrors) {
              setRegErrors((prev) => ({ ...prev, ...newErrors }));
            } else {
              setRegFieldError(err.data.error || 'Ошибка регистрации');
            }
          } else {
            setRegFieldError(err.data?.error || 'Некорректные данные');
          }
        } else if (err.isCorsError) {
          setRegFieldError(
            'Ошибка подключения к серверу. Проверьте настройки CORS.',
          );
        } else if (err.isNetworkError) {
          setRegFieldError('Нет соединения с сервером. Проверьте интернет.');
        } else if (err.isTimeout) {
          setRegFieldError('Сервер не отвечает. Попробуйте позже.');
        } else {
          setRegFieldError(err.message || 'Произошла ошибка при регистрации');
        }
      },
    },
  );

  // Обработка отправки формы входа
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginOrEmail.trim()) {
      setLoginError('Введите имя пользователя или email');
      return;
    }

    if (!loginPassword) {
      setLoginError('Введите пароль');
      return;
    }

    mutateLogin({ login: loginOrEmail, password: loginPassword });
  };

  // Определение типа поля логина по наличию символов почты
  const getLoginInputType = () => {
    return loginOrEmail.includes('@') && loginOrEmail.includes('.')
      ? 'email'
      : 'text';
  };

  // Определение текста подсказки для поля логина
  const getLoginPlaceholder = () => {
    return loginOrEmail.includes('@') && loginOrEmail.includes('.')
      ? 'example@mail.com'
      : 'Имя пользователя или email';
  };

  // Валидация поля формы регистрации
  const validateRegField = (field, value) => {
    let error = '';

    switch (field) {
      case 'login':
        if (!value.trim()) {
          error = 'Логин обязателен';
        } else if (value.length < 3) {
          error = 'Логин должен содержать не менее 3 символов';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error =
            'Логин может содержать только буквы, цифры и символ подчеркивания';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email обязателен';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Введите корректный email адрес';
        }
        break;

      case 'nickname':
        if (value.trim() && value.length < 2) {
          error = 'Никнейм должен содержать не менее 2 символов';
        } else if (value.trim() && !/^[a-zA-Zа-яА-Я0-9_]+$/.test(value)) {
          error =
            'Никнейм может содержать только буквы, цифры и символ подчеркивания';
        }
        break;

      case 'password':
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
        } else if (value !== regPassword) {
          error = 'Пароли не совпадают';
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Вычисление надежности пароля при регистрации
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

  // Обновление значения поля регистрации с проверкой валидации
  const handleRegFieldChange = (field, value) => {
    const setters = {
      login: setRegLogin,
      email: setRegEmail,
      nickname: setRegNickname,
      password: setRegPassword,
      confirmPassword: setRegConfirmPassword,
    };
    setters[field](value);

    const error = validateRegField(field, value);
    setRegErrors((prev) => ({ ...prev, [field]: error }));

    if (field === 'password' && regConfirmPassword) {
      const confirmError =
        regConfirmPassword !== value ? 'Пароли не совпадают' : '';
      setRegErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Переход ко второму шагу регистрации (выбор предпочтений)
  const handleProceedToPreferences = (e) => {
    e.preventDefault();
    setRegFieldError('');

    const fields = {
      login: regLogin,
      email: regEmail,
      nickname: regNickname,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    };

    const newErrors = {};
    let hasError = false;

    Object.keys(fields).forEach((field) => {
      const error = validateRegField(field, fields[field]);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    });

    setRegErrors(newErrors);

    if (hasError) {
      return;
    }

    setRegStep('preferences');
  };

  // Завершение регистрации с отправкой выбранных жанров и артистов
  const handleCompleteRegistration = (genres, artistIds) => {
    setPreferredGenres(genres);
    setPreferredArtistIds(artistIds);

    mutateRegister({
      login: regLogin.trim(),
      email: regEmail.trim(),
      nickname: regNickname.trim(),
      password: regPassword,
      preferred_genres: genres,
      preferred_artist_ids: artistIds,
    });
  };

  // Отображение вкладки входа
  if (activeTab === 'login') {
    const isLoginEmpty = !loginOrEmail.trim() || !loginPassword;

    return (
      <form className="auth-form" onSubmit={handleLoginSubmit}>
        <h2 className="auth-form-title">Добро пожаловать!</h2>
        <p className="auth-form-subtitle">Войдите, чтобы продолжить</p>

        {loginError && (
          <div className="auth-error-global" role="alert">
            {loginError}
          </div>
        )}

        <InputField
          id="login-email"
          label="Имя пользователя или Email"
          type={getLoginInputType()}
          placeholder={getLoginPlaceholder()}
          value={loginOrEmail}
          onChange={(e) => {
            setLoginOrEmail(e.target.value);
            setLoginError('');
          }}
          required
          disabled={loadingLogin}
          autoComplete="username"
          autoFocus
        />

        <InputField
          id="login-password"
          label="Пароль"
          type="password"
          placeholder="Введите пароль"
          value={loginPassword}
          onChange={(e) => {
            setLoginPassword(e.target.value);
            setLoginError('');
          }}
          required
          disabled={loadingLogin}
          autoComplete="current-password"
        >
          <div className="auth-forgot-password">
            <a onClick={() => onTabChange && onTabChange('reset')}>
              Забыли пароль?
            </a>
          </div>
        </InputField>

        <Button
          type="submit"
          variant="primary"
          disabled={loadingLogin || isLoginEmpty}
          fullWidth
        >
          {loadingLogin ? (
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
            disabled={loadingLogin}
            onClick={() => alert('Вход через Google')}
          >
            <img className="social-button-icon" src={google_logo} alt="Google" />
            Google
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loadingLogin}
            onClick={() => alert('Вход через GitHub')}
          >
            <img className="social-button-icon" src={github_logo} alt="GitHub" />
            GitHub
          </Button>
        </div>

        <div className="auth-form-footer">
          Нет аккаунта?{' '}
          <a onClick={() => onTabChange && onTabChange('register')}>
            Зарегистрироваться
          </a>
        </div>
      </form>
    );
  }

  // Отображение вкладки регистрации
  if (activeTab === 'register') {
    const hasRegErrors = Object.values(regErrors).some((error) => error !== '');
    const isRegEmpty =
      !regLogin.trim() ||
      !regEmail.trim() ||
      !regPassword.trim() ||
      !regConfirmPassword.trim();
    const passwordStrength = getPasswordStrength(regPassword);

    return (
      <div className="auth-form-wrapper">
        {regFieldError && (
          <div className="auth-error-global" role="alert">
            {regFieldError}
          </div>
        )}

        {isRegistrationComplete && (
          <div className="auth-success-global" role="alert">
            Регистрация успешна. Выполняется вход...
          </div>
        )}

        {regStep === 'credentials' ? (
          <form className="auth-form" onSubmit={handleProceedToPreferences}>
            <h2 className="auth-form-title">Создать аккаунт</h2>
            <p className="auth-form-subtitle">
              Заполните регистрационные данные
            </p>

            <div className="auth-form-group">
              <label htmlFor="register-login">
                Логин <span className="required-star">*</span>
              </label>
              <input
                id="register-login"
                type="text"
                placeholder="Введите логин"
                value={regLogin}
                onChange={(e) => handleRegFieldChange('login', e.target.value)}
                required
                disabled={loadingRegister}
                className={regErrors.login ? 'error' : ''}
              />
              {regErrors.login && (
                <span className="auth-error">{regErrors.login}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-email">
                Email <span className="required-star">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="example@mail.com"
                value={regEmail}
                onChange={(e) => handleRegFieldChange('email', e.target.value)}
                required
                disabled={loadingRegister}
                className={regErrors.email ? 'error' : ''}
              />
              {regErrors.email && (
                <span className="auth-error">{regErrors.email}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-nickname">
                Никнейм <span className="optional-label">(необязательно)</span>
              </label>
              <input
                id="register-nickname"
                type="text"
                placeholder="Введите никнейм"
                value={regNickname}
                onChange={(e) =>
                  handleRegFieldChange('nickname', e.target.value)
                }
                disabled={loadingRegister}
                className={regErrors.nickname ? 'error' : ''}
              />
              {regErrors.nickname && (
                <span className="auth-error">{regErrors.nickname}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-password">
                Пароль <span className="required-star">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="register-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Минимум 8 символов"
                  value={regPassword}
                  onChange={(e) =>
                    handleRegFieldChange('password', e.target.value)
                  }
                  required
                  minLength={8}
                  disabled={loadingRegister}
                  className={regErrors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  tabIndex="-1"
                  disabled={loadingRegister}
                >
                  <img
                    className="password-toggle-icon"
                    src={showRegPassword ? eye_crossed : eye}
                    alt="Видимость пароля"
                  />
                </button>
              </div>
              {regErrors.password && (
                <span className="auth-error">{regErrors.password}</span>
              )}
              {regPassword && !regErrors.password && passwordStrength && (
                <div className="password-strength">
                  <div
                    className={`password-strength-bar ${passwordStrength.class}`}
                  ></div>
                  <span
                    className={`password-strength-text ${passwordStrength.class}`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="register-confirm-password">
                Подтверждение пароля <span className="required-star">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="register-confirm-password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="Повторите пароль"
                  value={regConfirmPassword}
                  onChange={(e) =>
                    handleRegFieldChange('confirmPassword', e.target.value)
                  }
                  required
                  minLength={8}
                  disabled={loadingRegister}
                  className={regErrors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowRegConfirmPassword(!showRegConfirmPassword)
                  }
                  tabIndex="-1"
                  disabled={loadingRegister}
                >
                  <img
                    className="password-toggle-icon"
                    src={showRegConfirmPassword ? eye_crossed : eye}
                    alt="Видимость пароля"
                  />
                </button>
              </div>
              {regErrors.confirmPassword && (
                <span className="auth-error">{regErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loadingRegister || hasRegErrors || isRegEmpty}
            >
              Далее
            </button>

            <div className="auth-divider">или</div>

            <div className="social-buttons">
              <button
                type="button"
                className="social-button"
                disabled={loadingRegister}
                onClick={() => alert('Вход через Google')}
              >
                <img
                  className="social-button-icon"
                  src={google_logo}
                  alt="Google"
                />
                Google
              </button>
              <button
                type="button"
                className="social-button"
                disabled={loadingRegister}
                onClick={() => alert('Вход через GitHub')}
              >
                <img
                  className="social-button-icon"
                  src={github_logo}
                  alt="GitHub"
                />
                GitHub
              </button>
            </div>

            <div className="auth-form-footer">
              Уже есть аккаунт?{' '}
              <a onClick={() => onTabChange && onTabChange('login')}>Войти</a>
            </div>
          </form>
        ) : (
          <PreferencesFormContent
            initialGenres={preferredGenres}
            initialArtistIds={preferredArtistIds}
            onCancel={() => setRegStep('credentials')}
            onComplete={handleCompleteRegistration}
            submitLabel={
              loadingRegister ? 'Регистрация...' : 'Завершить регистрацию'
            }
          />
        )}
      </div>
    );
  }

  // Отображение вкладки сброса пароля
  if (activeTab === 'reset') {
    return (
      <ResetPassword
        onSuccess={() => onTabChange && onTabChange('login')}
        onSwitchToLogin={() => onTabChange && onTabChange('login')}
        onShowNotification={onShowNotification}
      />
    );
  }

  return null;
}