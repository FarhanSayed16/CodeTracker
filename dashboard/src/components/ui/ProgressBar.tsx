import React from 'react';
import { clsx } from 'clsx';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number; // 0 to 100
  colorClass?: string; // Optional class for custom color
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  colorClass = 'progress-primary',
  label,
  className,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={clsx('progress-container', className)}>
      {label && (
        <div className="progress-label-row">
          <span className="progress-label">{label}</span>
          <span className="progress-value">{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-track">
        <div
          className={clsx('progress-fill', colorClass)}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
