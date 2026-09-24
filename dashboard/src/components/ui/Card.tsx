import React from 'react';
import { clsx } from 'clsx';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverLift = false,
  ...props
}) => {
  return (
    <div
      className={clsx('card', { 'card-hover': hoverLift }, className)}
      {...props}
    >
      {children}
    </div>
  );
};
