import React from 'react';
import { clsx } from 'clsx';
import './Badge.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'ISSUE' | 'DEFAULT';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  status = 'DEFAULT',
  size = 'md',
  ...props
}) => {
  return (
    <span
      className={clsx('badge', `badge-${status.toLowerCase()}`, `badge-${size}`, className)}
      {...props}
    >
      {children}
    </span>
  );
};
