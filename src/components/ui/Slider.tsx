import React from 'react';

export interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({
  label,
  value,
  min = 1,
  max = 100,
  step = 1,
  unit = '%',
  onChange,
  className = '',
}: SliderProps) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <div className="field__label-row">
          <label className="field__label">{label}</label>
          <span className="type-mono">
            {value}
            {unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
    </div>
  );
}

