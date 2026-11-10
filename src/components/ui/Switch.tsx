import React from 'react';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function Switch({ label, checked, onChange, description }: SwitchProps) {
  return (
    <div
      className="switch-container"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div className={`switch-track ${checked ? 'switch-track--active' : ''}`}>
        <div className="switch-thumb" />
      </div>
      <div>
        <div className="field__label">{label}</div>
        {description && <div className="type-mono" style={{ color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
}

