import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api';
import { connectSocket, disconnectSocket } from '../socket';
import { getStudentSession, setStudentSession, setRole } from '../storage';
import type { StudentSession, StudentTask, TaskStatus } from '../types';
import { Shell } from '../components/Shell';
import { SettingsView } from '../components/SettingsView';
import { GRACE_MS, ISSUE_MAX_LEN } from '../constants';

const SEARCH_DEBOUNCE_MS = 300;

type Step = 'join' | 'pin' | 'tasks' | 'settings';

type SearchHit = { id: string; name: string; roll: string; hasPin: boolean };

function mapTasks(
  tasks: { id: string; title: string; description?: string | null; taskNumber?: number; order?: number }[],
  responses?: { taskId: string; status: string; issueText?: string | null }[]
): StudentTask[] {
  return (tasks || []).map((t) => {
    const response = responses?.find((r) => r.taskId === t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      order: t.taskNumber ?? t.order ?? 0,
      localStatus: (response?.status || 'NOT_STARTED') as TaskStatus,
      localIssueText: response?.issueText || '',
      localDoneTimestamp: response?.status === 'DONE' ? Date.now() : null,
    };
  });
}

export function StudentView({
  allowSwitchRole = true,
  ballLabel = 'STU',
}: {
  allowSwitchRole?: boolean;
  ballLabel?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [step, setStep] = useState<Step>('join');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchHint, setSearchHint] = useState('Enter session code, then type 2+ letters of your name or roll.');
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [apiMsg, setApiMsg] = useState('Checking server…');

  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string; hasPin: boolean } | null>(null);
  const [pin, setPin] = useState('');
  const [setPinMode, setSetPinMode] = useState(false);

  const [session, setSession] = useState<StudentSession | null>(null);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [clientWarning, setClientWarning] = useState(true);
  const [, tick] = useState(0);
  const graceTimer = useRef<number | null>(null);
  const searchTimer = useRef<number | null>(null);
  const searchGen = useRef(0);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const enterTasks = useCallback((sess: StudentSession, taskList: StudentTask[]) => {
    setSession(sess);
    setStudentSession(sess);
    setTasks(taskList.sort((a, b) => a.order - b.order));
    setStep('tasks');
    setSessionEnded(false);

    const sock = connectSocket(sess.token);
    sock.off('connect');
    sock.off('disconnect');
    sock.off('session-ended');
    sock.off('new-task');
    sock.off('task-removed');
    sock.off('status-resolved');
    sock.off('session-taken-over');

    // Students are auto-joined to session rooms by the server — do NOT emit join-session
    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('session-ended', () => {
      setSessionEnded(true);
      showToast('Session ended', 'error');
    });
    sock.on('session-taken-over', () => {
      setConnected(false);
      showToast('Signed in elsewhere — this Quickball was disconnected', 'error');
      disconnectSocket();
    });
    sock.on(
      'new-task',
      (task: {
        id?: string;
        taskId?: string;
        title: string;
        description: string | null;
        taskNumber: number;
      }) => {
        const id = task.id || task.taskId;
        if (!id) return;
        setTasks((prev) => {
          if (prev.some((t) => t.id === id)) return prev;
          return [
            ...prev,
            {
              id,
              title: task.title,
              description: task.description,
              order: task.taskNumber ?? prev.length,
              localStatus: 'NOT_STARTED' as TaskStatus,
              localIssueText: '',
              localDoneTimestamp: null,
            },
          ].sort((a, b) => a.order - b.order);
        });
        showToast('New task added', 'success');
      }
    );
    sock.on('task-removed', ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setOpenTaskId((open) => (open === taskId ? null : open));
    });
    sock.on(
      'status-resolved',
      (data: { taskId: string; status: TaskStatus; studentId?: string }) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.taskId
              ? {
                  ...t,
                  localStatus: data.status,
                  localIssueText: data.status === 'ISSUE' ? t.localIssueText : '',
                  localDoneTimestamp: data.status === 'DONE' ? Date.now() : null,
                }
              : t
          )
        );
      }
    );
    if (sock.connected) setConnected(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ping = await api.pingApi();
      if (cancelled) return;
      setApiOk(ping.ok);
      setApiMsg(ping.ok ? `${ping.message} · ${ping.apiUrl}` : ping.message);
      if (!ping.ok) setConnected(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = getStudentSession();
    if (!saved?.token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.restoreStudent(saved.token);
        if (cancelled) return;
        if (data.session.status !== 'ACTIVE') {
          setStudentSession(null);
          return;
        }
        enterTasks(
          {
            sessionId: data.session.id,
            studentId: data.student.id,
            studentName: data.student.name,
            sessionTitle: data.session.title,
            sessionCode: data.session.sessionCode,
            token: saved.token,
          },
          mapTasks(data.tasks, data.responses)
        );
      } catch {
        setStudentSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enterTasks]);

  useEffect(() => {
    const hasGrace = tasks.some(
      (t) => t.localStatus === 'DONE' && t.localDoneTimestamp && Date.now() - t.localDoneTimestamp < GRACE_MS
    );
    if (hasGrace) {
      graceTimer.current = window.setInterval(() => tick((n) => n + 1), 1000);
    }
    return () => {
      if (graceTimer.current) clearInterval(graceTimer.current);
    };
  }, [tasks]);

  const runSearch = useCallback(async (sessionCode: string, q: string) => {
    const trimmedCode = sessionCode.trim().toUpperCase();
    const trimmedQ = q.trim();
    if (trimmedCode.length < 3) {
      setResults([]);
      setSearching(false);
      setSearchHint('Enter the full session code first (usually 6 characters).');
      return;
    }
    if (trimmedQ.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchHint('Type at least 2 characters of your name or roll…');
      return;
    }

    const gen = ++searchGen.current;
    setSearching(true);
    setError('');
    setSearchHint('Searching…');
    try {
      const data = await api.searchStudents(trimmedCode, trimmedQ);
      if (gen !== searchGen.current) return;
      const mapped: SearchHit[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        roll: s.rollNumber || s.rollNo || '',
        hasPin: !!s.hasPin,
      }));
      setResults(mapped);
      setSearchHint(mapped.length ? '' : 'No students found. Try a different name or roll.');
    } catch (e: unknown) {
      if (gen !== searchGen.current) return;
      setResults([]);
      setSearchHint('');
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      if (gen === searchGen.current) setSearching(false);
    }
  }, []);

  const scheduleSearch = (nextCode: string, nextQuery: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      void runSearch(nextCode, nextQuery);
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    const unsub = window.companion?.onToggleExpand?.(() => setExpanded((e) => !e));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const applyLink = (data: { action?: string; code?: string } | null) => {
      if (!data?.code) return;
      const v = data.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      setCode(v);
      setStep('join');
      setExpanded(true);
      setSearchHint('Session code filled from link — type your name to search.');
      showToast(`Session code ${v} from link`, 'success');
    };
    void window.companion?.getDeepLink?.().then(applyLink);
    const unsub = window.companion?.onDeepLink?.(applyLink);
    return () => {
      unsub?.();
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, []);

  const pickStudent = (s: SearchHit) => {
    setSelected({ id: s.id, name: s.name, hasPin: s.hasPin });
    setSetPinMode(!s.hasPin);
    setStep('pin');
    setPin('');
    setError('');
  };

  const doJoin = async () => {
    if (!selected || pin.length !== 4) {
      setError('Enter a 4-digit PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.joinSession({
        sessionCode: code.trim().toUpperCase(),
        studentId: selected.id,
        pin,
      });
      enterTasks(
        {
          sessionId: data.session.id,
          studentId: data.student.id,
          studentName: data.student.name,
          sessionTitle: data.session.title,
          sessionCode: data.session.sessionCode,
          token: data.token,
        },
        mapTasks(data.tasks)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Join failed');
    } finally {
      setLoading(false);
    }
  };

  const graceRemaining = (task: StudentTask) => {
    if (!task.localDoneTimestamp || task.localStatus !== 'DONE') return 0;
    return Math.max(0, GRACE_MS - (Date.now() - task.localDoneTimestamp));
  };

  const isLocked = (task: StudentTask) =>
    task.localStatus === 'DONE' && task.localDoneTimestamp != null && graceRemaining(task) <= 0;

  const sendStatus = async (taskId: string, status: TaskStatus, issueText = '') => {
    if (!session || sessionEnded) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (isLocked(task) && status !== 'DONE') {
      showToast('Status locked after grace period', 'error');
      return;
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              localStatus: status,
              localIssueText: status === 'ISSUE' ? issueText : t.localIssueText,
              localDoneTimestamp: status === 'DONE' ? Date.now() : null,
            }
          : t
      )
    );
    try {
      await api.updateStatus(session.token, {
        sessionId: session.sessionId,
        taskId,
        status,
        issueText: status === 'ISSUE' ? issueText : undefined,
      });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed', 'error');
    }
  };

  const logout = () => {
    disconnectSocket();
    setStudentSession(null);
    setSession(null);
    setTasks([]);
    setStep('join');
    setConnected(null);
    setCode('');
    setQuery('');
    setResults([]);
    setSelected(null);
  };

  const switchRole = () => {
    if (!allowSwitchRole) return;
    logout();
    setRole(null);
    window.location.reload();
  };

  const issueCount = tasks.filter((t) => t.localStatus === 'ISSUE').length;
  const title =
    step === 'settings'
      ? 'Settings'
      : session
        ? session.sessionTitle
        : step === 'pin'
          ? 'Enter PIN'
          : 'Join session';

  return (
    <Shell
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      label={ballLabel}
      connected={connected}
      badge={issueCount}
      title={title}
      headerExtra={
        <span className={`conn ${connected === true ? 'ok' : connected === false ? 'err' : ''}`}>
          <span className="dot" />
          {connected === true ? 'Live' : connected === false ? 'Off' : '—'}
        </span>
      }
      footer={
        step === 'tasks' ? (
          <>
            <button type="button" className="btn ghost" onClick={() => setStep('settings')}>
              Config
            </button>
            <button type="button" className="btn ghost" onClick={logout}>
              Leave
            </button>
            {allowSwitchRole && (
              <button type="button" className="btn ghost" onClick={switchRole}>
                Switch role
              </button>
            )}
          </>
        ) : step !== 'settings' ? (
          <>
            <button type="button" className="btn ghost" onClick={() => setStep('settings')}>
              Config
            </button>
            {allowSwitchRole && (
              <button type="button" className="btn ghost" onClick={switchRole}>
                Switch role
              </button>
            )}
          </>
        ) : null
      }
    >
      {step === 'settings' && <SettingsView onBack={() => setStep(session ? 'tasks' : 'join')} />}

      {step === 'join' && (
        <>
          <div className={`api-status ${apiOk === true ? 'ok' : apiOk === false ? 'err' : ''}`}>
            <span className="dot" />
            <span>{apiMsg}</span>
          </div>
          {apiOk === false && (
            <button type="button" className="btn secondary block" onClick={() => setStep('settings')}>
              Open Config — set API URL
            </button>
          )}
          <p className="hint">Enter the full session code, then your name. Results appear below — tap your name.</p>
          <div className="field">
            <label className="label">Session code</label>
            <input
              value={code}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                setCode(v);
                setError('');
                scheduleSearch(v, query);
              }}
              placeholder="e.g. 84XQ3U"
              maxLength={8}
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="label">Your name or roll</label>
            <input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setError('');
                scheduleSearch(code, v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch(code, query);
              }}
              placeholder="Type 2+ characters"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="btn block"
            disabled={searching || apiOk === false}
            onClick={() => void runSearch(code, query)}
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
          {error && <p className="error">{error}</p>}
          <div className="search-results" aria-live="polite">
            {searching && <div className="search-hint">Searching…</div>}
            {!searching && searchHint && results.length === 0 && (
              <div className="search-hint">{searchHint}</div>
            )}
            {!searching &&
              results.map((s) => (
                <button key={s.id} type="button" className="search-item" onClick={() => pickStudent(s)}>
                  <div className="search-item-name">{s.name}</div>
                  <div className="roll">{s.roll}</div>
                </button>
              ))}
          </div>
        </>
      )}

      {step === 'pin' && selected && (
        <>
          <p className="hint">
            {selected.name}
            {setPinMode ? ' — create a new 4-digit PIN' : ' — enter your PIN'}
          </p>
          <div className="field">
            <label className="label">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && doJoin()}
              autoFocus
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="button" className="btn block" onClick={doJoin} disabled={loading || pin.length !== 4}>
            {loading ? 'Joining…' : setPinMode ? 'Set PIN & join' : 'Join'}
          </button>
          <button
            type="button"
            className="btn secondary block"
            onClick={() => {
              setStep('join');
              setSelected(null);
            }}
          >
            Back
          </button>
        </>
      )}

      {step === 'tasks' && (
        <>
          {clientWarning && (
            <div className="client-warning">
              Use only this Quickball for lab status — close the browser join page (
              <code>/join</code>) if it is open on this PC.
              <button type="button" className="btn ghost" onClick={() => setClientWarning(false)}>
                Dismiss
              </button>
            </div>
          )}
          {sessionEnded && <p className="error">This session has ended.</p>}
          <p className="hint">
            {session?.studentName} · {session?.sessionCode}
          </p>
          <div className="task-list">
            {tasks.length === 0 && <div className="empty">No tasks yet</div>}
            {tasks.map((task) => {
              const open = openTaskId === task.id;
              const rem = graceRemaining(task);
              return (
                <div key={task.id} className="task-card">
                  <button
                    type="button"
                    className="task-head"
                    onClick={() => {
                      if (isLocked(task)) {
                        showToast('Status locked', 'error');
                        return;
                      }
                      setOpenTaskId(open ? null : task.id);
                    }}
                  >
                    <span className="title">{task.title}</span>
                    <span className={`status-pill ${task.localStatus}`}>
                      {task.localStatus.replace('_', ' ')}
                    </span>
                  </button>
                  {open && !sessionEnded && (
                    <div className="task-body">
                      {task.description && <p className="hint">{task.description}</p>}
                      <div className="status-grid">
                        {(
                          [
                            ['NOT_STARTED', 'Not started'],
                            ['IN_PROGRESS', 'Working'],
                            ['DONE', 'Done'],
                            ['ISSUE', 'Need help'],
                          ] as const
                        ).map(([st, label]) => (
                          <button
                            key={st}
                            type="button"
                            className={`status-btn ${task.localStatus === st ? `active ${st}` : ''}`}
                            onClick={() => {
                              if (st === 'ISSUE') {
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t.id === task.id ? { ...t, localStatus: 'ISSUE' } : t
                                  )
                                );
                              } else {
                                void sendStatus(task.id, st);
                                if (st !== 'DONE') setOpenTaskId(null);
                              }
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {task.localStatus === 'DONE' && rem > 0 && (
                        <p className="grace">Can undo for {Math.ceil(rem / 1000)}s</p>
                      )}
                      {task.localStatus === 'ISSUE' && (
                        <>
                          <textarea
                            maxLength={ISSUE_MAX_LEN}
                            value={task.localIssueText}
                            onChange={(e) =>
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, localIssueText: e.target.value.slice(0, ISSUE_MAX_LEN) }
                                    : t
                                )
                              )
                            }
                            placeholder="Describe your problem (optional)"
                            rows={3}
                          />
                          <button
                            type="button"
                            className="btn block"
                            onClick={() => {
                              void sendStatus(task.id, 'ISSUE', task.localIssueText);
                              showToast('Issue submitted', 'success');
                              setOpenTaskId(null);
                            }}
                          >
                            Submit issue
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </Shell>
  );
}
