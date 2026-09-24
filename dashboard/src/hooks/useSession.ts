import { useState, useEffect, useCallback } from 'react';
import { sessionService, type SessionItem } from '../services/sessionService';
import { taskService, type TaskItem } from '../services/taskService';
import { responsesService, type StudentResponseGrid, type IssueItem } from '../services/responsesService';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export const useSession = (sessionId: string | undefined) => {
  const [session, setSession] = useState<SessionItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [gridData, setGridData] = useState<StudentResponseGrid | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { socket, isConnected } = useSocket();
  const toast = useToast();

  const fetchSessionData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!sessionId) return;
    try {
      if (!opts?.silent) setIsLoading(true);
      const [sessionData, tasksData, gridRes, issuesRes] = await Promise.all([
        sessionService.getSession(sessionId),
        taskService.getTasks(sessionId),
        responsesService.getStatusGrid(sessionId),
        responsesService.getIssues(sessionId),
      ]);
      setSession(sessionData);
      setTasks(tasksData);
      setGridData(gridRes);
      setIssues(issuesRes);
    } catch (error: any) {
      if (!opts?.silent) toast.error(error.message || 'Failed to load session data');
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // While disconnected, periodically refresh so the grid still catches up
  useEffect(() => {
    if (!sessionId || isConnected) return;
    const id = window.setInterval(() => {
      fetchSessionData({ silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [sessionId, isConnected, fetchSessionData]);

  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    // Join (and re-join after every reconnect) so status-update events arrive
    const join = () => socket.emit('join-session', sessionId);
    join();
    socket.on('connect', join);

    const onStudentJoined = (data: { studentId: string; rollNo: string; name: string }) => {
      setGridData((prev) => {
        if (!prev) return prev;
        const exists = prev.students.find((s) => s.id === data.studentId);
        if (exists) return prev;

        const newStudents = [...prev.students, { id: data.studentId, rollNo: data.rollNo, name: data.name }].sort(
          (a, b) => a.rollNo.localeCompare(b.rollNo)
        );

        const newGrid = { ...prev.grid } as Record<
          string,
          Record<string, { status: string; issueText: string | null }>
        >;
        newGrid[data.studentId] = {};
        prev.tasks.forEach((task) => {
          newGrid[data.studentId][task.id] = { status: 'NOT_STARTED', issueText: null };
        });

        return { ...prev, students: newStudents, grid: newGrid };
      });
      setSession((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                participants: (prev._count?.participants ?? 0) + 1,
                tasks: prev._count?.tasks ?? 0,
              },
            }
          : prev
      );
      toast.info(`Student ${data.name} joined the session`);
    };

    const onStatusUpdate = (data: {
      id?: string;
      studentId: string;
      taskId: string;
      status: string;
      issueText: string | null;
      name: string;
      rollNo: string;
      taskTitle: string;
      updatedAt: string;
    }) => {
      setGridData((prev) => {
        if (!prev) return prev;
        const newGrid = { ...prev.grid } as Record<
          string,
          Record<string, { status: string; issueText: string | null }>
        >;
        if (!newGrid[data.studentId]) {
          newGrid[data.studentId] = {};
          prev.tasks.forEach((task) => {
            newGrid[data.studentId][task.id] = { status: 'NOT_STARTED', issueText: null };
          });
        }
        newGrid[data.studentId] = {
          ...newGrid[data.studentId],
          [data.taskId]: {
            status: data.status,
            issueText: data.issueText,
          },
        };

        let students = prev.students;
        if (!students.some((s) => s.id === data.studentId)) {
          students = [
            ...students,
            { id: data.studentId, rollNo: data.rollNo, name: data.name },
          ].sort((a, b) => a.rollNo.localeCompare(b.rollNo));
        }

        return { ...prev, students, grid: newGrid };
      });

      if (data.status === 'ISSUE') {
        setIssues((prev) => {
          const filtered = prev.filter(
            (i) => !(i.studentId === data.studentId && i.taskId === data.taskId)
          );
          const item: IssueItem = {
            id: data.id || `${data.studentId}-${data.taskId}`,
            studentId: data.studentId,
            rollNo: data.rollNo,
            name: data.name,
            taskId: data.taskId,
            taskTitle: data.taskTitle,
            issueText: data.issueText || '',
            updatedAt: data.updatedAt,
          };
          return [item, ...filtered].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        toast.error(`${data.name} reported an issue on ${data.taskTitle}`);
      } else {
        setIssues((prev) =>
          prev.filter((i) => !(i.studentId === data.studentId && i.taskId === data.taskId))
        );
      }
    };

    const onNewTask = (task: TaskItem) => {
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]));
      setGridData((prev) => {
        if (!prev) return prev;
        if (prev.tasks.some((t) => t.id === task.id)) return prev;
        const newGrid = { ...prev.grid } as Record<
          string,
          Record<string, { status: string; issueText: string | null }>
        >;
        Object.keys(newGrid).forEach((studentId) => {
          newGrid[studentId] = {
            ...newGrid[studentId],
            [task.id]: { status: 'NOT_STARTED', issueText: null },
          };
        });
        return {
          ...prev,
          tasks: [...prev.tasks, task],
          grid: newGrid,
        };
      });
      toast.success(`New task: ${task.title}`);
    };

    const onTaskRemoved = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setGridData((prev) => {
        if (!prev) return prev;
        const newGrid = { ...prev.grid } as Record<
          string,
          Record<string, { status: string; issueText: string | null }>
        >;
        Object.keys(newGrid).forEach((studentId) => {
          const row = { ...newGrid[studentId] };
          delete row[taskId];
          newGrid[studentId] = row;
        });
        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
          grid: newGrid,
        };
      });
      setIssues((prev) => prev.filter((i) => i.taskId !== taskId));
    };

    const onSessionEnded = () => {
      setSession((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
      toast.info('Session has ended');
    };

    socket.on('student-joined', onStudentJoined);
    socket.on('status-update', onStatusUpdate);
    socket.on('new-task', onNewTask);
    socket.on('task-removed', onTaskRemoved);
    socket.on('session-ended', onSessionEnded);

    return () => {
      socket.off('connect', join);
      socket.off('student-joined', onStudentJoined);
      socket.off('status-update', onStatusUpdate);
      socket.off('new-task', onNewTask);
      socket.off('task-removed', onTaskRemoved);
      socket.off('session-ended', onSessionEnded);
    };
  }, [socket, isConnected, sessionId, toast]);

  const addTask = async (title: string, description?: string) => {
    if (!sessionId) return;
    try {
      const newTask = await taskService.createTask(sessionId, title, description);
      setTasks((prev) => (prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask]));

      setGridData((prev) => {
        if (!prev) return prev;
        if (prev.tasks.some((t) => t.id === newTask.id)) return prev;
        const newGrid = { ...prev.grid } as Record<string, Record<string, { status: string; issueText: string | null }>>;
        Object.keys(newGrid).forEach((studentId) => {
          newGrid[studentId][newTask.id] = { status: 'NOT_STARTED', issueText: null };
        });
        return {
          ...prev,
          tasks: [...prev.tasks, newTask],
          grid: newGrid,
        };
      });

      toast.success('Task created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      setGridData((prev) => {
        if (!prev) return prev;
        const newGrid = { ...prev.grid } as Record<string, Record<string, { status: string; issueText: string | null }>>;
        Object.keys(newGrid).forEach((studentId) => {
          delete newGrid[studentId][taskId];
        });
        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
          grid: newGrid,
        };
      });

      toast.success('Task removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove task');
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await sessionService.endSession(sessionId);
      setSession((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
      toast.success('Session ended successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to end session');
    }
  };

  const resolveIssue = async (studentId: string, taskId: string) => {
    if (!sessionId) return;
    try {
      await responsesService.resolveIssue(sessionId, studentId, taskId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve issue');
    }
  };

  return {
    session,
    tasks,
    gridData,
    issues,
    isLoading,
    addTask,
    removeTask,
    endSession,
    resolveIssue,
    refresh: fetchSessionData,
  };
};
