import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  className,
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={clsx('input-container', className)}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={inputId}
          type={inputType}
          className={clsx('input-field', { 'input-error': error })}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};
