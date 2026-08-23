import { useState } from "react";
import { useMutation } from '../hooks/useApi';
import { apiClient } from '../api/apiClient';
import google_logo from "../assets/google.svg";
import github_logo from "../assets/github.svg";
import eye from "../assets/eye.svg";
import eye_crossed from "../assets/eye-crossed.svg";

import "../styles/Register.css";

export default function Register({ onSuccess, onSwitchToLogin }) {
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldError, setFieldError] = useState("");
    const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
    
    const [errors, setErrors] = useState({
        login: "",
        email: "",
        nickname: "",
        password: "",
        confirmPassword: ""
    });

    const { mutate, loading } = useMutation('/api/register', {
        method: 'POST',
        onSuccess: async (data) => {
            console.log('Регистрация успешна:', data);
            
            try {
                setIsRegistrationComplete(true);
                
                const loginData = {
                    login: login,
                    password: password
                };
                
                const loginResponse = await apiClient.login(loginData);
                
                console.log('Автоматический вход выполнен:', loginResponse);
                
                if (onSuccess) {
                    onSuccess();
                }
            } catch (loginError) {
                console.error('Автоматический вход не удался:', loginError);
                if (onSuccess) {
                    onSuccess();
                }
            }
        },
        onError: (err) => {
            console.error('Ошибка регистрации:', err);
            
            if (err.status === 400) {
                if (err.data?.errors) {
                    const serverErrors = err.data.errors;
                    const newErrors = {};
                    let hasFieldErrors = false;
                    
                    const fieldMap = {
                        login: 'login',
                        email: 'email',
                        nickname: 'nickname',
                        password: 'password'
                    };
                    
                    Object.keys(serverErrors).forEach(key => {
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
                        setErrors(prev => ({ ...prev, ...newErrors }));
                    } else {
                        setFieldError(err.data.error || 'Ошибка регистрации');
                    }
                } else {
                    const errorMsg = err.data?.error || 'Некорректные данные';
                    setFieldError(errorMsg);
                }
            } else if (err.isCorsError) {
                setFieldError('Ошибка подключения к серверу. Проверьте настройки CORS.');
            } else if (err.isNetworkError) {
                setFieldError('Нет соединения с сервером. Проверьте интернет.');
            } else if (err.isTimeout) {
                setFieldError('Сервер не отвечает. Попробуйте позже.');
            } else {
                setFieldError(err.message || 'Произошла ошибка при регистрации');
            }
        }
    });

    const validateField = (field, value) => {
        let error = "";
        
        switch (field) {
            case "login":
                if (!value.trim()) {
                    error = "Логин обязателен";
                } else if (value.length < 3) {
                    error = "Логин должен содержать не менее 3 символов";
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    error = "Логин может содержать только буквы, цифры и символ подчеркивания";
                }
                break;
                
            case "email":
                if (!value.trim()) {
                    error = "Email обязателен";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = "Введите корректный email адрес";
                }
                break;
                
            case "nickname":
                if (value.trim() && value.length < 2) {
                    error = "Никнейм должен содержать не менее 2 символов";
                } else if (value.trim() && !/^[a-zA-Zа-яА-Я0-9_]+$/.test(value)) {
                    error = "Никнейм может содержать только буквы, цифры и символ подчеркивания";
                }
                break;
                
            case "password":
                if (!value.trim()) {
                    error = "Пароль обязателен";
                } else if (value.length < 8) {
                    error = "Пароль должен содержать не менее 8 символов";
                } else if (!/(?=.*[a-z])/.test(value) || !/(?=.*[A-Z])/.test(value)) {
                    error = "Пароль должен содержать прописные и строчные буквы";
                } else if (!/(?=.*\d)/.test(value)) {
                    error = "Пароль должен содержать как минимум одну цифру";
                }
                break;
                
            case "confirmPassword":
                if (!value.trim()) {
                    error = "Подтверждение пароля обязательно";
                } else if (value !== password) {
                    error = "Пароли не совпадают";
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
        
        if (score <= 2) return { label: "Слабый", class: "weak" };
        if (score <= 3) return { label: "Средний", class: "medium" };
        if (score <= 4) return { label: "Сильный", class: "strong" };
        return { label: "Очень сильный", class: "very-strong" };
    };

    const handleFieldChange = (field, value) => {
        const setters = {
            login: setLogin,
            email: setEmail,
            nickname: setNickname,
            password: setPassword,
            confirmPassword: setConfirmPassword
        };
        setters[field](value);
        
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
        
        if (field === "password" && confirmPassword) {
            const confirmError = validateField("confirmPassword", confirmPassword);
            setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFieldError("");
        
        const fields = {
            login,
            email,
            nickname,
            password,
            confirmPassword
        };
        
        const newErrors = {};
        let hasError = false;
        
        Object.keys(fields).forEach(field => {
            const error = validateField(field, fields[field]);
            if (error) {
                newErrors[field] = error;
                hasError = true;
            }
        });
        
        setErrors(newErrors);
        
        if (hasError) {
            return;
        }
        
        const registrationData = {
            login: login.trim(),
            email: email.trim(),
            nickname: nickname.trim(),
            password: password
        };
        
        mutate(registrationData);
    };

    const hasErrors = Object.values(errors).some(error => error !== "");
    const isFormEmpty = !login.trim() || !email.trim() || !password.trim() || !confirmPassword.trim();
    const passwordStrength = getPasswordStrength(password);

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Создать аккаунт</h2>
            <p className="auth-form-subtitle">Присоединяйтесь к нам</p>
            
            {fieldError && (
                <div className="auth-error-global" role="alert">
                    {fieldError}
                </div>
            )}
            
            {isRegistrationComplete && (
                <div className="auth-success-global" role="alert">
                    Регистрация успешна! Выполняется вход...
                </div>
            )}
            
            <div className="auth-form-group">
                <label htmlFor="register-login">Логин <span className="required-star">*</span></label>
                <input
                    id="register-login"
                    type="text"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => handleFieldChange("login", e.target.value)}
                    required
                    disabled={loading}
                    className={errors.login ? "error" : ""}
                />
                {errors.login && <span className="auth-error">{errors.login}</span>}
            </div>

            <div className="auth-form-group">
                <label htmlFor="register-email">Email <span className="required-star">*</span></label>
                <input
                    id="register-email"
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    required
                    disabled={loading}
                    className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="auth-error">{errors.email}</span>}
            </div>

            <div className="auth-form-group">
                <label htmlFor="register-nickname">Никнейм <span className="optional-label">(необязательно)</span></label>
                <input
                    id="register-nickname"
                    type="text"
                    placeholder="Введите никнейм"
                    value={nickname}
                    onChange={(e) => handleFieldChange("nickname", e.target.value)}
                    disabled={loading}
                    className={errors.nickname ? "error" : ""}
                />
                {errors.nickname && <span className="auth-error">{errors.nickname}</span>}
            </div>
            
            <div className="auth-form-group">
                <label htmlFor="register-password">Пароль <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                    <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Минимум 8 символов"
                        value={password}
                        onChange={(e) => handleFieldChange("password", e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
                        className={errors.password ? "error" : ""}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        disabled={loading}
                    >
                        <img 
                            className="password-toggle-icon" 
                            src={showPassword ? eye_crossed : eye} 
                            alt={showPassword ? "Скрыть пароль" : "Показать пароль"} 
                        />
                    </button>
                </div>
                {errors.password && <span className="auth-error">{errors.password}</span>}
                {password && !errors.password && passwordStrength && (
                    <div className="password-strength">
                        <div className={`password-strength-bar ${passwordStrength.class}`}></div>
                        <span className={`password-strength-text ${passwordStrength.class}`}>
                            {passwordStrength.label}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="auth-form-group">
                <label htmlFor="register-confirm-password">Подтверждение пароля <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                    <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
                        className={errors.confirmPassword ? "error" : ""}
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
                            alt={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"} 
                        />
                    </button>
                </div>
                {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
            </div>
            
            <button 
                type="submit" 
                className="auth-submit-button" 
                disabled={loading || hasErrors || isFormEmpty}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Регистрация...
                    </>
                ) : (
                    'Зарегистрироваться'
                )}
            </button>
            
            <div className="auth-divider">или</div>
            
            <div className="social-buttons">
                <button type="button" className="social-button" disabled={loading} onClick={() => alert("Тут могла быть ваша реклама")}>
                    <img className="social-button-icon" src={google_logo} alt="Google" />
                    Google
                </button>
                <button type="button" className="social-button" disabled={loading} onClick={() => alert("Вааар Тандер - это многопользовательский онлайн экшен")}>
                    <img className="social-button-icon" src={github_logo} alt="GitHub" />
                    GitHub
                </button>
            </div>
            
            <div className="auth-form-footer">
                Уже есть аккаунт?{" "}
                <a onClick={onSwitchToLogin}>
                    Войти
                </a>
            </div>
        </form>
    );
}