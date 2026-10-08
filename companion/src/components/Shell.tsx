import { useEffect, type ReactNode } from 'react';

export interface BallStats {
  joined: number;
  done: number;
  inProgress: number;
  issues: number;
}

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
  ballStats?: BallStats | null;
  ballSubLabel?: string;
}

/**
 * Collapsed ball: native CSS drag + perfect circle (no square chrome).
 * Open via the Open control or double-click.
 */
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
  ballStats,
  ballSubLabel,
}: Props) {
  useEffect(() => {
    const p = window.companion?.setExpanded(expanded);
    if (p && typeof p.then === 'function') void p.catch(() => undefined);
  }, [expanded]);

  if (!expanded) {
    const showIssues = (badge != null && badge > 0) || (ballStats && ballStats.issues > 0);
    const issueCount = badge ?? ballStats?.issues ?? 0;
    const connClass =
      connected === true ? 'ok' : connected === false ? 'err' : '';

    return (
      <div className="app-shell app-shell--ball" title="Drag to move">
        <div className="ball" onDoubleClick={onToggle}>
          <div className="ball-glow" aria-hidden />
          <div className="ball-inner">
            <span className={`ball-dot ${connClass}`} />
            <span className="ball-label">{label}</span>
            {ballSubLabel && <span className="ball-code">{ballSubLabel}</span>}
            {ballStats && (
              <div className="ball-stats" aria-label="Live counts">
                <span className="bs bs-j" title="Joined">
                  {ballStats.joined}
                  <em>J</em>
                </span>
                <span className="bs bs-d" title="Done">
                  {ballStats.done}
                  <em>D</em>
                </span>
                <span className="bs bs-w" title="Working">
                  {ballStats.inProgress}
                  <em>W</em>
                </span>
              </div>
            )}
          </div>
          {showIssues && issueCount > 0 && (
            <span className="ball-badge" title="Open issues">
              {issueCount > 99 ? '99+' : issueCount}
            </span>
          )}
          <button
            type="button"
            className="ball-open"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title="Open Quickball"
            aria-label="Open Quickball"
          >
            Open
          </button>
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
            title="Collapse to ball"
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
