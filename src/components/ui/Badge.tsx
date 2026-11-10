import React from 'react';

export interface BadgeProps {
  variant?: 'mono' | 'neutral' | 'danger' | 'success' | 'accent';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'mono', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}

