import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { EmptyState, Button } from '../../../components/ui';
import './IssueStream.css';

interface IssueItem {
  id: string;
  studentId: string;
  rollNo: string;
  name: string;
  taskId: string;
  taskTitle: string;
  issueText: string;
  updatedAt: string;
}

interface IssueStreamProps {
  issues: IssueItem[];
  onResolve?: (studentId: string, taskId: string) => void;
}

export const IssueStream: React.FC<IssueStreamProps> = ({ issues, onResolve }) => {
  const [resolved, setResolved] = useState<IssueItem[]>([]);
  const [showResolved, setShowResolved] = useState(false);

  const handleResolve = (issue: IssueItem) => {
    onResolve?.(issue.studentId, issue.taskId);
    setResolved((prev) => [issue, ...prev]);
  };

  // Audio ping when a new issue appears
  const prevCount = useRef(issues.length);
  useEffect(() => {
    if (issues.length > prevCount.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // Audio may be blocked until user gesture
      }
    }
    prevCount.current = issues.length;
  }, [issues.length]);

  return (
    <div className="issue-stream">
      <div className="issue-stream-header">
        <h3>Active Issues</h3>
        <span className="issue-count">{issues.length}</span>
      </div>

      <div className="issue-stream-content">
        {issues.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All clear"
            description="No active issues reported by students."
          />
        ) : (
          <div className="issue-list">
            {issues.map((issue) => (
              <div key={`${issue.studentId}-${issue.taskId}`} className="issue-card animate-slideIn">
                <div className="issue-card-header">
                  <div className="issue-student">
                    <AlertCircle size={16} className="text-danger" />
                    <span className="student-name">{issue.name}</span>
                  </div>
                  <span className="issue-time">
                    {new Date(issue.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="issue-task">{issue.taskTitle}</div>
                <div className="issue-text">"{issue.issueText}"</div>

                <div className="issue-footer">
                  <span className="student-roll">{issue.rollNo}</span>
                  {onResolve && (
                    <Button size="sm" variant="ghost" onClick={() => handleResolve(issue)}>
                      Resolved ✓
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <div className="resolved-section">
            <button className="resolved-toggle" onClick={() => setShowResolved((v) => !v)}>
              {showResolved ? 'Hide' : 'Show'} resolved ({resolved.length})
            </button>
            {showResolved &&
              resolved.map((issue) => (
                <div key={`r-${issue.studentId}-${issue.taskId}`} className="issue-card resolved">
                  <div className="student-name">{issue.name}</div>
                  <div className="issue-task">{issue.taskTitle}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
