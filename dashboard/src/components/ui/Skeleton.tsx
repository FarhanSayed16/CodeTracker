import React from 'react';
import { clsx } from 'clsx';
import './Skeleton.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  style,
  ...props
}) => {
  return (
    <div
      className={clsx('skeleton', `skeleton-${variant}`, className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
