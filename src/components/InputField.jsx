import React, { useState } from 'react';
import eyeIcon from '../assets/eye.svg';
import eyeCrossedIcon from '../assets/eye-crossed.svg';
import closeIcon from '../assets/close-icon.svg';
import '../styles/InputField.css';

export default function InputField({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onClear,
  onFocus,
  onBlur,
  onKeyDown,
  error,
  required = false,
  disabled = false,
  autoFocus = false,
  autoComplete = 'off',
  minLength,
  leftIcon,
  clearable = false,
  className = '',
  children,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  return (
    <div className={`input-field-container ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {leftIcon && <span className="input-left-icon">{leftIcon}</span>}

        <input
          id={id}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value ?? ''}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          minLength={minLength}
          className={`input-element ${error ? 'input-error' : ''} ${leftIcon ? 'with-left-icon' : ''} ${clearable && value ? 'with-clear' : ''}`}
        />

        {clearable && Boolean(value) && !disabled && (
          <button
            type="button"
            className="input-clear-button"
            onClick={handleClear}
            tabIndex="-1"
            title="Очистить"
          >
            <img src={closeIcon} alt="Очистить" />
          </button>
        )}

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
