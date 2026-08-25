import React from 'react';
import '../styles/button.css';

export default function Button({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    disabled = false,
    fullWidth = true 
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`custom-btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
        >
            {children}
        </button>
    );
};