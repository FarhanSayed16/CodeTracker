import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={clsx('empty-state animate-fade', className)}>
      <div className="empty-state-icon-wrapper">
        <Icon className="empty-state-icon" size={48} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};
