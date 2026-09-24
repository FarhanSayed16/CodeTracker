import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import {
  ArrowLeft,
  Plus,
  StopCircle,
  RefreshCw,
  QrCode,
  Download,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Button, Badge, Modal, Input, ConfirmDialog, QRCodeModal } from '../../components/ui';
import { ConnectionIndicator } from '../../components/ConnectionIndicator';
import { SessionCodeDisplay } from '../../components/SessionCodeDisplay';
import { StatusGrid } from './components/StatusGrid';
import { IssueStream } from './components/IssueStream';
import './SessionDashboard.css';

export const SessionDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    session,
    gridData,
    issues,
    isLoading,
    addTask,
    removeTask,
    endSession,
    resolveIssue,
    refresh,
  } = useSession(id);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  if (isLoading) {
    return <div className="session-dashboard session-dashboard-loading">Loading session…</div>;
  }

  if (!session || !gridData) {
    return (
      <div className="session-dashboard session-dashboard-loading">
        <h2>Session not found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await addTask(newTaskTitle, newTaskDesc);
    setIsTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleEndSession = async () => {
    await endSession();
    setIsEndConfirmOpen(false);
    if (id) navigate(`/sessions/${id}/summary`);
  };

  const handleExportCSV = () => {
    if (!gridData || !session) return;
    const { students, tasks, grid } = gridData;
    const headers = ['Roll No', 'Name', ...tasks.map((t) => t.title)];
    const rows = students.map((student) => {
      const row = [student.rollNo, student.name];
      tasks.forEach((task) => {
        const response = grid[student.id]?.[task.id];
        let status = 'NOT_STARTED';
        if (response) {
          status = response.status === 'ISSUE' ? `ISSUE: ${response.issueText || ''}` : response.status;
        }
        row.push(status);
      });
      return row;
    });
    const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map((cell) => escape(cell as string)).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `session-${session.sessionCode}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const participantCount = session._count?.participants ?? gridData.students.length;
  const issueCount = issues?.length ?? 0;
  const isActive = session.status === 'ACTIVE';
  const waitingForStudents = isActive && participantCount === 0;

  return (
    <div className="session-dashboard">
      <header className="session-toolbar">
        <div className="session-toolbar-left">
          <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="session-toolbar-title-block">
            <div className="session-toolbar-title-row">
              <h1 className="session-title">{session.title}</h1>
              <Badge status={isActive ? 'IN_PROGRESS' : 'DEFAULT'}>{session.status}</Badge>
            </div>
            <div className="session-toolbar-meta">
              <span className="session-stat">
                <Users size={13} /> {participantCount} joined
              </span>
              <span className={issueCount > 0 ? 'session-stat session-stat-alert' : 'session-stat'}>
                <AlertTriangle size={13} /> {issueCount} issue{issueCount === 1 ? '' : 's'}
              </span>
              <ConnectionIndicator />
            </div>
          </div>
        </div>

        {isActive && (
          <div className="session-toolbar-code">
            <span className="session-code-caption">Code</span>
            <SessionCodeDisplay code={session.sessionCode} size="sm" />
          </div>
        )}

        <div className="session-toolbar-actions">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} title="Download CSV">
            <Download size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refresh()} title="Refresh">
            <RefreshCw size={16} />
          </Button>
          {isActive && (
            <>
              <Button size="sm" onClick={() => setIsQrModalOpen(true)} variant="secondary" title="QR code">
                <QrCode size={16} />
              </Button>
              <Button size="sm" onClick={() => setIsTaskModalOpen(true)} variant="secondary">
                <Plus size={16} /> Task
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEndConfirmOpen(true)}
                className="btn-end-session"
              >
                <StopCircle size={16} /> End
              </Button>
            </>
          )}
        </div>
      </header>

      {waitingForStudents && (
        <div className="session-waiting-banner">
          Waiting for students — share code <strong>{session.sessionCode}</strong> or show the QR.
        </div>
      )}

      <div className="session-body">
        <div className="session-main">
          <StatusGrid
            students={gridData.students}
            tasks={gridData.tasks}
            grid={gridData.grid}
            onDeleteTask={isActive ? removeTask : undefined}
          />
        </div>

        <aside className={`session-sidebar ${issueCount === 0 ? 'session-sidebar-quiet' : ''}`}>
          <IssueStream issues={issues} onResolve={resolveIssue} />
        </aside>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add New Task">
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Task Title"
            placeholder="e.g. Task 1: Setup Server"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="Additional instructions..."
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        onConfirm={handleEndSession}
        title="End Session"
        message="Are you sure you want to end this session? Students will no longer be able to update their statuses."
        confirmText="End Session"
        isDestructive
      />

      {id && (
        <QRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} sessionId={id} />
      )}
    </div>
  );
};
