import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  connected?: boolean | null;
  label: string;
  children: ReactNode;
  title: string;
  onCollapse?: () => void;
  headerExtra?: ReactNode;
  footer?: ReactNode;
}

export function Shell({
  expanded,
  onToggle,
  badge,
  connected,
  label,
  children,
  title,
  headerExtra,
  footer,
}: Props) {
  useEffect(() => {
    const p = window.companion?.setExpanded(expanded);
    if (p && typeof p.then === 'function') void p.catch(() => undefined);
  }, [expanded]);

  if (!expanded) {
    return (
      <div className="app-shell app-shell--ball">
        <div className="ball" title="Open CodeTrack">
          <button type="button" className="ball-inner" onClick={onToggle}>
            <span
              className={`ball-dot ${connected === true ? 'ok' : connected === false ? 'err' : ''}`}
            />
            <span className="ball-label">{label}</span>
          </button>
          {badge != null && badge > 0 && (
            <span className="ball-badge">{badge > 99 ? '99+' : badge}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--panel">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">{title}</div>
          {headerExtra}
          <button
            type="button"
            className="icon-btn"
            onClick={onToggle}
            title="Collapse"
            aria-label="Collapse"
          >
            −
          </button>
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-footer">{footer}</div>}
      </div>
    </div>
  );
}
