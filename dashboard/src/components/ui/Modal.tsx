import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={handleBackdropClick}>
      <div className={clsx('modal-content animate-pop', className)}>
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button className="modal-close-btn modal-close-absolute" onClick={onClose}>
            <X size={20} />
          </button>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
