import React from 'react';
import '../styles/AgeBadge.css';

export default function AgeBadge({ size = 'small' }) {
  return (
    <span
      className={`age-badge age-badge-${size}`}
      title="Возрастное ограничение 18+"
    >
      18+
    </span>
  );
}
