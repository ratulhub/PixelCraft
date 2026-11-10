import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div className={`progress-bar ${className}`.trim()}>
      <div className="progress-bar__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

