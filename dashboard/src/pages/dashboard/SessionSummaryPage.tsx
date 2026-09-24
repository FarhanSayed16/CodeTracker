import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, CheckCircle, Clock, AlertTriangle, Users, ArrowLeft } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { StatusGrid } from './components/StatusGrid';
import { responsesService, type StudentResponseGrid } from '../../services/responsesService';
import { sessionService, type SessionItem } from '../../services/sessionService';

export const SessionSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionItem | null>(null);
  const [gridData, setGridData] = useState<StudentResponseGrid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([sessionService.getSession(id), responsesService.getStatusGrid(id)])
      .then(([sessionData, grid]) => {
        setSession(sessionData);
        setGridData(grid);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const taskBreakdown = useMemo(() => {
    if (!gridData) return [];
    return gridData.tasks.map((task) => {
      let done = 0;
      let issue = 0;
      let inProgress = 0;
      let notStarted = 0;

      gridData.students.forEach((student) => {
        const status = gridData.grid[student.id]?.[task.id]?.status ?? 'NOT_STARTED';
        switch (status) {
          case 'DONE':
            done += 1;
            break;
          case 'ISSUE':
            issue += 1;
            break;
          case 'IN_PROGRESS':
            inProgress += 1;
            break;
          default:
            notStarted += 1;
        }
      });

      return { task, done, issue, inProgress, notStarted };
    });
  }, [gridData]);

  if (loading) return <div className="p-8">Loading summary...</div>;
  if (!session || !gridData) return <div className="p-8">Session not found</div>;

  const totalTasks = gridData.tasks.length;
  const totalStudents = gridData.students.length;

  let totalDone = 0;
  let totalIssues = 0;

  gridData.students.forEach((student) => {
    gridData.tasks.forEach((task) => {
      const status = gridData.grid[student.id]?.[task.id]?.status;
      if (status === 'DONE') totalDone++;
      if (status === 'ISSUE') totalIssues++;
    });
  });

  const completionPercent =
    totalTasks * totalStudents > 0
      ? Math.round((totalDone / (totalTasks * totalStudents)) * 100)
      : 0;

  const handleExportCSV = () => {
    const headers = ['Roll No', 'Name', ...gridData.tasks.map((t) => t.title)];
    const rows = gridData.students.map((student) => {
      const rowData = [
        student.rollNo,
        student.name,
        ...gridData.tasks.map((t) => {
          const s = gridData.grid[student.id]?.[t.id];
          if (!s) return 'NOT_STARTED';
          return s.status === 'ISSUE' ? `ISSUE: ${s.issueText || ''}` : s.status;
        }),
      ];
      return rowData.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${session.title}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 mx-auto" style={{ maxWidth: '1200px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={`/classes/${session.classId}`}
            className="flex items-center gap-2 mb-2 text-muted hover:text-primary"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Back to Class
          </Link>
          <h1 className="text-3xl font-bold">{session.title} - Summary</h1>
          <p className="text-muted mt-2">
            {session.endedAt
              ? `Ended at ${new Date(session.endedAt).toLocaleString()}`
              : 'Session still active'}
          </p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <CheckCircle size={16} className="text-success" /> Completion Rate
          </div>
          <div className="text-3xl font-bold">{completionPercent}%</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <AlertTriangle size={16} className="text-danger" /> Total Issues
          </div>
          <div className="text-3xl font-bold">{totalIssues}</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Clock size={16} className="text-primary" /> Tasks Assigned
          </div>
          <div className="text-3xl font-bold">{totalTasks}</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <Users size={16} style={{ color: 'var(--color-primary-500)' }} /> Participants
          </div>
          <div className="text-3xl font-bold">{totalStudents}</div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Per-Task Breakdown</h2>
        {taskBreakdown.length === 0 ? (
          <p className="text-muted">No tasks were assigned in this session.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted">Task</th>
                  <th className="text-center p-4 text-sm font-medium text-muted">Done</th>
                  <th className="text-center p-4 text-sm font-medium text-muted">Issue</th>
                  <th className="text-center p-4 text-sm font-medium text-muted">In Progress</th>
                  <th className="text-center p-4 text-sm font-medium text-muted">Not Started</th>
                </tr>
              </thead>
              <tbody>
                {taskBreakdown.map(({ task, done, issue, inProgress, notStarted }) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="p-4 font-medium">
                      {task.taskNumber}. {task.title}
                    </td>
                    <td className="p-4 text-center text-success">{done}</td>
                    <td className="p-4 text-center text-danger">{issue}</td>
                    <td className="p-4 text-center text-primary">{inProgress}</td>
                    <td className="p-4 text-center text-muted">{notStarted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Final Status Grid</h2>
        <StatusGrid students={gridData.students} tasks={gridData.tasks} grid={gridData.grid} />
      </Card>
    </div>
  );
};
