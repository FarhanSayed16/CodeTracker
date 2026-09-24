import React, { useMemo, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../../../components/ui';

import './StatusGrid.css';

interface Student {
  id: string;
  rollNo: string;
  name: string;
}

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
}

interface GridCell {
  status: string;
  issueText: string | null;
}

interface StatusGridProps {
  students: Student[];
  tasks: Task[];
  grid: Record<string, Record<string, GridCell>>;
  onDeleteTask?: (taskId: string) => void;
}

export const StatusGrid: React.FC<StatusGridProps> = ({ students, tasks, grid, onDeleteTask }) => {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [students, search]);

  const taskStats = useMemo(() => {
    const stats: Record<string, { done: number; inProgress: number; issue: number; notStarted: number }> = {};
    tasks.forEach((task) => {
      let done = 0;
      let inProgress = 0;
      let issue = 0;
      let notStarted = 0;
      students.forEach((student) => {
        const cell = grid[student.id]?.[task.id];
        const status = cell?.status || 'NOT_STARTED';
        if (status === 'DONE') done++;
        else if (status === 'IN_PROGRESS') inProgress++;
        else if (status === 'ISSUE') issue++;
        else notStarted++;
      });
      stats[task.id] = { done, inProgress, issue, notStarted };
    });
    return stats;
  }, [students, tasks, grid]);

  if (students.length === 0) {
    return (
      <div className="grid-empty-state">
        <p>Waiting for students to join...</p>
      </div>
    );
  }

  return (
    <div className="status-grid-container">
      <div className="status-grid-toolbar">
        <div className="status-grid-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="status-grid-count">
          {filteredStudents.length}/{students.length} students
        </span>
      </div>

      <div className="status-grid-wrapper">
        <table className="status-grid">
          <thead>
            <tr>
              <th className="sticky-col header-cell">Student</th>
              {tasks.map((task) => {
                const stats = taskStats[task.id];
                const total = students.length || 1;
                const donePct = (stats.done / total) * 100;
                const ipPct = (stats.inProgress / total) * 100;
                const issuePct = (stats.issue / total) * 100;

                return (
                  <th key={task.id} className="task-header-cell">
                    <div className="task-header-content">
                      <div className="task-title-row">
                        <span className="task-title" title={task.title}>
                          {task.title}
                        </span>
                        {onDeleteTask && (
                          <button
                            className="task-delete-btn"
                            onClick={() => setTaskToDelete(task.id)}
                            title="Remove Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="task-progress-bar multi">
                        <div className="seg done" style={{ width: `${donePct}%` }} />
                        <div className="seg in-progress" style={{ width: `${ipPct}%` }} />
                        <div className="seg issue" style={{ width: `${issuePct}%` }} />
                      </div>
                      <div className="task-stats-text">
                        {Math.round(donePct)}% done · {stats.issue} issues
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td className="sticky-col student-cell">
                  <div className="student-name">{student.name}</div>
                  <div className="student-roll">{student.rollNo}</div>
                </td>
                {tasks.map((task) => {
                  const cell = grid[student.id]?.[task.id] || { status: 'NOT_STARTED', issueText: null };
                  return (
                    <td
                      key={`${student.id}-${task.id}`}
                      className={clsx('status-cell', `status-${cell.status.toLowerCase()}`)}
                      title={cell.issueText || cell.status}
                    >
                      <div className="status-indicator" />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete && onDeleteTask) onDeleteTask(taskToDelete);
          setTaskToDelete(null);
        }}
        title="Remove Task"
        message="Are you sure you want to remove this task? All student progress for this task will be lost."
        confirmText="Remove"
        isDestructive
      />
    </div>
  );
};
