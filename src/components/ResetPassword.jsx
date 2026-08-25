import React, { useState } from 'react';
import { useMutation } from '../hooks/useApi';
import InputField from './InputField';
import Button from './Button';
import eye from "../assets/eye.svg";
import eye_crossed from "../assets/eye-crossed.svg";
import '../styles/Register.css';
import '../styles/Login.css';

export default function ResetPassword({ onSuccess, onSwitchToLogin, onShowNotification }) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [errors, setErrors] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });

    const { mutate: requestReset, loading: loadingRequest } = useMutation('/api/reset-password/request', {
        method: 'POST',
        onSuccess: (data) => {
            if (data.reset_token) setResetToken(data.reset_token);
            if (data.code && onShowNotification) {
                onShowNotification(`Код подтверждения: ${data.code}`);
            }
            setFieldError('');
            setStep(2);
        },
        onError: (err) => {
            setFieldError(err.data?.error || err.message || 'Ошибка отправки запроса');
        }
    });

    const { mutate: confirmReset, loading: loadingConfirm } = useMutation('/api/reset-password/confirm', {
        method: 'POST',
        onSuccess: (data) => {
            setSuccessMessage(data.message || 'Пароль успешно обновлен!');
            setTimeout(() => {
                if (onSuccess) onSuccess();
                else if (onSwitchToLogin) onSwitchToLogin();
            }, 1500);
        },
        onError: (err) => {
            setFieldError(err.data?.error || err.message || 'Ошибка сброса пароля');
        }
    });

    const validateField = (field, value) => {
        let error = "";
        switch (field) {
            case "email":
                if (!value.trim()) {
                    error = "Email обязателен";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = "Введите корректный email адрес";
                }
                break;
            case "code":
                if (!value.trim()) {
                    error = "Код подтверждения обязателен";
                }
                break;
            case "newPassword":
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
                } else if (value !== newPassword) {
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
            email: setEmail,
            code: setCode,
            newPassword: setNewPassword,
            confirmPassword: setConfirmPassword
        };
        setters[field](value);
        setFieldError("");

        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));

        if (field === "newPassword" && confirmPassword) {
            const confirmError = validateField("confirmPassword", confirmPassword);
            setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
    };

    const handleStepOneSubmit = (e) => {
        e.preventDefault();
        setFieldError('');
        const error = validateField("email", email);
        if (error) {
            setErrors(prev => ({ ...prev, email: error }));
            return;
        }
        requestReset({ email: email.trim() });
    };

    const handleStepTwoSubmit = (e) => {
        e.preventDefault();
        setFieldError('');

        const codeError = validateField("code", code);
        const passError = validateField("newPassword", newPassword);
        const confError = validateField("confirmPassword", confirmPassword);

        if (codeError || passError || confError) {
            setErrors({
                email: "",
                code: codeError,
                newPassword: passError,
                confirmPassword: confError
            });
            return;
        }

        confirmReset({
            reset_token: resetToken,
            code: code.trim(),
            new_password: newPassword,
            new_password_confirmation: confirmPassword
        });
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const hasStepTwoErrors = Boolean(errors.code || errors.newPassword || errors.confirmPassword);
    const isStepTwoEmpty = !code.trim() || !newPassword.trim() || !confirmPassword.trim();

    return (
        <div className="auth-form">
            <h2 className="auth-form-title">Сброс пароля</h2>
            <p className="auth-form-subtitle">
                {step === 1 ? 'Введите email для получения кода' : 'Введите код и новый пароль'}
            </p>

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

            {step === 1 ? (
                <form onSubmit={handleStepOneSubmit} className="auth-form">
                    <div className="auth-form-group">
                        <label htmlFor="reset-email">Email <span className="required-star">*</span></label>
                        <input
                            id="reset-email"
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => handleFieldChange("email", e.target.value)}
                            required
                            disabled={loadingRequest}
                            className={errors.email ? "error" : ""}
                            autoFocus
                        />
                        {errors.email && <span className="auth-error">{errors.email}</span>}
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={loadingRequest || !email.trim() || Boolean(errors.email)}
                        fullWidth
                    >
                        {loadingRequest ? (
                            <>
                                <span className="spinner"></span>
                                Отправка...
                            </>
                        ) : (
                            'Получить код'
                        )}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleStepTwoSubmit} className="auth-form">
                    <div className="auth-form-group">
                        <label htmlFor="reset-code">Код подтверждения <span className="required-star">*</span></label>
                        <input
                            id="reset-code"
                            type="text"
                            placeholder="Введите код"
                            value={code}
                            onChange={(e) => handleFieldChange("code", e.target.value)}
                            required
                            disabled={loadingConfirm}
                            className={errors.code ? "error" : ""}
                            autoFocus
                        />
                        {errors.code && <span className="auth-error">{errors.code}</span>}
                    </div>

                    <div className="auth-form-group">
                        <label htmlFor="reset-new-password">Новый пароль <span className="required-star">*</span></label>
                        <div className="password-input-wrapper">
                            <input
                                id="reset-new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Минимум 8 символов"
                                value={newPassword}
                                onChange={(e) => handleFieldChange("newPassword", e.target.value)}
                                required
                                minLength={8}
                                disabled={loadingConfirm}
                                className={errors.newPassword ? "error" : ""}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                disabled={loadingConfirm}
                            >
                                <img 
                                    className="password-toggle-icon" 
                                    src={showPassword ? eye_crossed : eye} 
                                    alt={showPassword ? "Скрыть пароль" : "Показать пароль"} 
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

                    <div className="auth-form-group">
                        <label htmlFor="reset-confirm-password">Подтверждение пароля <span className="required-star">*</span></label>
                        <div className="password-input-wrapper">
                            <input
                                id="reset-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Повторите пароль"
                                value={confirmPassword}
                                onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                                required
                                minLength={8}
                                disabled={loadingConfirm}
                                className={errors.confirmPassword ? "error" : ""}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                                disabled={loadingConfirm}
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

                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={loadingConfirm || hasStepTwoErrors || isStepTwoEmpty}
                        fullWidth
                    >
                        {loadingConfirm ? (
                            <>
                                <span className="spinner"></span>
                                Сохранение...
                            </>
                        ) : (
                            'Сменить пароль'
                        )}
                    </Button>
                </form>
            )}

            <div className="auth-form-footer">
                <a onClick={onSwitchToLogin}>
                    Вернуться ко входу
                </a>
            </div>
        </div>
    );
}