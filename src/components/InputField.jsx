import React, { useState } from 'react';
import eyeIcon from '../assets/eye.svg';
import eyeCrossedIcon from '../assets/eye-crossed.svg';
import '../styles/InputField.css';

export default function InputField({
    id,
    name,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    autoFocus = false,
    autoComplete,
    minLength,
    children
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="input-field-container">
            {label && (
                <label htmlFor={id} className="input-label">
                    {label} {required && <span className="required-star">*</span>}
                </label>
            )}
            <div className="input-wrapper">
                <input
                    id={id}
                    name={name}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    minLength={minLength}
                    className={`input-element ${error ? 'input-error' : ''}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="input-eye-button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        disabled={disabled}
                    >
                        <img 
                            src={showPassword ? eyeCrossedIcon : eyeIcon} 
                            alt={showPassword ? 'Скрыть пароль' : 'Показать пароль'} 
                        />
                    </button>
                )}
            </div>
            {error && <span className="input-error-text">{error}</span>}
            {children}
        </div>
    );
}