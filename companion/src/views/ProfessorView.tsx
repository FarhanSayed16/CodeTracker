import { useCallback, useEffect, useState } from 'react';
import * as api from '../api';
import { getConfig } from '../config';
import { connectSocket, disconnectSocket, joinSessionRoom } from '../socket';
import {
  getProfessorEmail,
  getProfessorSessionId,
  getProfessorToken,
  isMuted,
  setMuted,
  setProfessorSessionId,
  setProfessorToken,
  setRole,
} from '../storage';
import type { IssueItem, TaskStatus } from '../types';
import { Shell } from '../components/Shell';
import { SettingsView } from '../components/SettingsView';

type Step = 'login' | 'pick' | 'live' | 'settings';

interface Counts {
  joined: number;
  done: number;
  inProgress: number;
  issues: number;
}

interface LiveSession {
  id: string;
  title: string;
  sessionCode: string;
}

function computeCounts(
  students: { id: string }[],
  tasks: { id: string }[],
  grid: Record<string, Record<string, { status: string; issueText: string | null }>>
): { counts: Counts; issues: IssueItem[] } {
  let done = 0;
  let inProgress = 0;
  let issues = 0;
  const issueList: IssueItem[] = [];

  for (const student of students) {
    const row = grid[student.id] || {};
    for (const task of tasks) {
      const cell = row[task.id];
      if (!cell) continue;
      if (cell.status === 'DONE') done++;
      else if (cell.status === 'IN_PROGRESS') inProgress++;
      else if (cell.status === 'ISSUE') {
        issues++;
        issueList.push({
          studentId: student.id,
          studentName: (student as { name?: string }).name || 'Student',
          taskId: task.id,
          taskTitle: (task as { title?: string }).title || 'Task',
          issueText: cell.issueText || '',
          timestamp: Date.now(),
        });
      }
    }
  }

  return {
    counts: { joined: students.length, done, inProgress, issues },
    issues: issueList.slice(0, 20),
  };
}

function playNotify() {
  if (isMuted()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* ignore */
  }
}

export function ProfessorView() {
  const [expanded, setExpanded] = useState(true);
  const [step, setStep] = useState<Step>(() => (getProfessorToken() ? 'pick' : 'login'));
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(getProfessorEmail() || '');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(getProfessorToken());
  const [sessions, setSessions] = useState<
    { id: string; title: string; sessionCode: string; class?: { name: string } }[]
  >([]);
  const [live, setLive] = useState<LiveSession | null>(null);
  const [counts, setCounts] = useState<Counts>({ joined: 0, done: 0, inProgress: 0, issues: 0 });
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const refreshGrid = useCallback(async (tok: string, sessionId: string) => {
    const [session, gridData] = await Promise.all([
      api.getSession(tok, sessionId),
      api.getResponseGrid(tok, sessionId),
    ]);
    const titles: Record<string, string> = {};
    for (const t of gridData.tasks) titles[t.id] = t.title;
    setTaskTitles(titles);
    setLive({
      id: session.id,
      title: session.title,
      sessionCode: session.sessionCode,
    });
    const computed = computeCounts(gridData.students, gridData.tasks, gridData.grid);
    // Prefer names from students list
    computed.issues = computed.issues.map((iss) => {
      const stu = gridData.students.find((s) => s.id === iss.studentId);
      return {
        ...iss,
        studentName: stu?.name || iss.studentName,
        taskTitle: titles[iss.taskId] || iss.taskTitle,
      };
    });
    setCounts(computed.counts);
    setIssues(computed.issues);
    return session;
  }, []);

  const attachSession = useCallback(
    async (tok: string, sessionId: string) => {
      await refreshGrid(tok, sessionId);
      setProfessorSessionId(sessionId);
      setStep('live');

      const sock = connectSocket(tok);
      sock.off('connect');
      sock.off('disconnect');
      sock.off('status-update');
      sock.off('student-joined');
      sock.off('new-task');
      sock.off('session-ended');

      sock.on('connect', () => {
        setConnected(true);
        joinSessionRoom(sessionId);
      });
      sock.on('disconnect', () => setConnected(false));
      sock.on('session-ended', () => {
        showToast('Session ended');
        setStep('pick');
        setLive(null);
        setProfessorSessionId(null);
      });
      sock.on('student-joined', () => {
        setCounts((c) => ({ ...c, joined: c.joined + 1 }));
        void refreshGrid(tok, sessionId);
      });
      sock.on(
        'status-update',
        (data: {
          studentId: string;
          name: string;
          taskId: string;
          taskTitle?: string;
          status: TaskStatus;
          issueText: string | null;
        }) => {
          void refreshGrid(tok, sessionId);
          if (data.status === 'ISSUE') {
            playNotify();
            showToast(`Issue: ${data.name}`);
            setIssues((prev) =>
              [
                {
                  studentId: data.studentId,
                  studentName: data.name,
                  taskId: data.taskId,
                  taskTitle: data.taskTitle || taskTitles[data.taskId] || 'Task',
                  issueText: data.issueText || '',
                  timestamp: Date.now(),
                },
                ...prev.filter(
                  (i) => !(i.studentId === data.studentId && i.taskId === data.taskId)
                ),
              ].slice(0, 20)
            );
          }
        }
      );
      sock.on('new-task', () => {
        playNotify();
        showToast('New task added');
        void refreshGrid(tok, sessionId);
      });

      if (sock.connected) {
        setConnected(true);
        joinSessionRoom(sessionId);
      }
    },
    [refreshGrid, taskTitles]
  );

  const loadActiveSessions = useCallback(async (tok: string) => {
    setLoading(true);
    setError('');
    try {
      const list = await api.listSessions(tok, 'ACTIVE');
      setSessions(list);
      const savedId = getProfessorSessionId();
      if (savedId && list.some((s) => s.id === savedId)) {
        await attachSession(tok, savedId);
      } else if (list.length === 1) {
        await attachSession(tok, list[0].id);
      } else {
        setStep('pick');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
      if (e instanceof api.ApiError && e.status === 401) {
        setProfessorToken(null);
        setToken(null);
        setStep('login');
      }
    } finally {
      setLoading(false);
    }
  }, [attachSession]);

  useEffect(() => {
    if (token && step === 'pick') {
      void loadActiveSessions(token);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — mount only

  const doLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email.trim(), password);
      setProfessorToken(data.token, data.professor.email);
      setToken(data.token);
      setPassword('');
      await loadActiveSessions(data.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const doEnd = async () => {
    if (!token || !live) return;
    if (!confirm('End this session for everyone?')) return;
    setLoading(true);
    try {
      await api.endSession(token, live.id);
      disconnectSocket();
      setLive(null);
      setProfessorSessionId(null);
      setConnected(null);
      await loadActiveSessions(token);
      showToast('Session ended');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not end session');
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = () => {
    const { dashboardUrl } = getConfig();
    const url = live ? `${dashboardUrl}/sessions/${live.id}` : dashboardUrl;
    void window.companion?.openExternal(url);
  };

  const copyCode = async () => {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(live.sessionCode);
      showToast('Code copied');
    } catch {
      showToast(live.sessionCode);
    }
  };

  const logout = () => {
    disconnectSocket();
    setProfessorToken(null);
    setToken(null);
    setLive(null);
    setSessions([]);
    setConnected(null);
    setStep('login');
  };

  const switchRole = () => {
    logout();
    setRole(null);
    window.location.reload();
  };

  const title =
    step === 'settings'
      ? 'Settings'
      : step === 'login'
        ? 'Professor login'
        : step === 'pick'
          ? 'Active sessions'
          : live?.title || 'Live session';

  return (
    <Shell
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      label="PROF"
      connected={connected}
      badge={counts.issues}
      title={title}
      headerExtra={
        step === 'live' ? (
          <span className={`conn ${connected === true ? 'ok' : connected === false ? 'err' : ''}`}>
            <span className="dot" />
            {connected === true ? 'Live' : connected === false ? 'Off' : '—'}
          </span>
        ) : null
      }
      footer={
        <>
          {step === 'live' && (
            <>
              <button type="button" className="btn secondary" onClick={openDashboard}>
                Dashboard
              </button>
              <button type="button" className="btn secondary" onClick={copyCode}>
                Copy code
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setMutedState(next);
                }}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button type="button" className="btn danger" onClick={doEnd} disabled={loading}>
                End
              </button>
            </>
          )}
          {step !== 'settings' && (
            <>
              <button type="button" className="btn ghost" onClick={() => setStep('settings')}>
                Config
              </button>
              {token && (
                <button type="button" className="btn ghost" onClick={logout}>
                  Log out
                </button>
              )}
              <button type="button" className="btn ghost" onClick={switchRole}>
                Switch role
              </button>
            </>
          )}
        </>
      }
    >
      {step === 'settings' && (
        <SettingsView onBack={() => setStep(token ? (live ? 'live' : 'pick') : 'login')} />
      )}

      {step === 'login' && (
        <>
          <div className="field">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="button"
            className="btn block"
            onClick={doLogin}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="hint">Uses the same professor account as the web dashboard.</p>
        </>
      )}

      {step === 'pick' && (
        <>
          <p className="hint">Choose an ACTIVE session to monitor. Create sessions in the web dashboard.</p>
          {loading && <p className="hint">Loading…</p>}
          {error && <p className="error">{error}</p>}
          {!loading && sessions.length === 0 && (
            <div className="empty">No active sessions. Start one from the dashboard.</div>
          )}
          <div className="search-results">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="search-item"
                onClick={() => token && attachSession(token, s.id)}
              >
                <div>{s.title}</div>
                <div className="roll">
                  {s.sessionCode}
                  {s.class?.name ? ` · ${s.class.name}` : ''}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn secondary block"
            onClick={() => token && loadActiveSessions(token)}
          >
            Refresh
          </button>
        </>
      )}

      {step === 'live' && live && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="session-code">{live.sessionCode}</span>
            <button type="button" className="btn ghost" onClick={() => setStep('pick')}>
              Switch
            </button>
          </div>
          <div className="counts">
            <div className="count-cell">
              <div className="n">{counts.joined}</div>
              <div className="l">Joined</div>
            </div>
            <div className="count-cell done">
              <div className="n">{counts.done}</div>
              <div className="l">Done</div>
            </div>
            <div className="count-cell progress">
              <div className="n">{counts.inProgress}</div>
              <div className="l">Working</div>
            </div>
            <div className="count-cell issues">
              <div className="n">{counts.issues}</div>
              <div className="l">Issues</div>
            </div>
          </div>
          <div>
            <div className="label">Latest issues</div>
            <div className="issue-list">
              {issues.length === 0 && <div className="empty">No open issues</div>}
              {issues.map((iss) => (
                <div key={`${iss.studentId}-${iss.taskId}-${iss.timestamp}`} className="issue-row">
                  <div className="who">{iss.studentName}</div>
                  <div className="meta">{iss.taskTitle}</div>
                  {iss.issueText && <div>{iss.issueText}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </Shell>
  );
}
