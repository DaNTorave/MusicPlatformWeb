import React from 'react';

export default function AgeRestrictionToggle({
  checked,
  onChange,
  disabled = false,
  compact = false,
}) {
  if (compact) {
    return (
      <button
        type="button"
        className={`track-slot-age-btn ${checked ? 'is-active' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        title={checked ? 'Снять ограничение 18+' : 'Пометить как 18+'}
      >
        {checked ? '18+ есть' : '18+'}
      </button>
    );
  }

  return (
    <div className={`age-restriction-box ${checked ? 'is-active' : ''}`}>
      <label className="age-restriction-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="age-restriction-pill">18+</span>
        <span>
          Возрастное ограничение
          <span className="age-restriction-hint"> нецензурная лексика</span>
        </span>
      </label>
    </div>
  );
}