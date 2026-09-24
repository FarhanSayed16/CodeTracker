import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import './Tabs.css';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
  activeTabId?: string;
  onChange?: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTabId, className, activeTabId: controlledActiveTabId, onChange }) => {
  const [internalTabId, setInternalTabId] = useState(defaultTabId || tabs[0]?.id);
  const activeTabId = controlledActiveTabId !== undefined ? controlledActiveTabId : internalTabId;

  const handleTabChange = (id: string) => {
    if (controlledActiveTabId === undefined) {
      setInternalTabId(id);
    }
    onChange?.(id);
  };

  const headerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeContent = tabs.find((t) => t.id === activeTabId)?.content;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const activeBtn = header.querySelector<HTMLButtonElement>(`.tab-btn[data-tab="${activeTabId}"]`);
    if (!activeBtn) return;
    setIndicator({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
  }, [activeTabId, tabs]);

  return (
    <div className={clsx('tabs-container', className)}>
      <div className="tabs-header" ref={headerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            className={clsx('tab-btn', { 'tab-active': activeTabId === tab.id })}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <span
          className="tabs-indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      </div>
      <div className="tab-content animate-fade">{activeContent}</div>
    </div>
  );
};
