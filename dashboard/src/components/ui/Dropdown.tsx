import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import './Dropdown.css';

interface DropdownItem {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx('dropdown-container', className)} ref={dropdownRef}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={clsx('dropdown-menu animate-fade', `dropdown-align-${align}`)}>
          {items.map((item) => (
            <button
              key={item.id}
              className={clsx('dropdown-item', { 'dropdown-item-destructive': item.destructive })}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
