import { useState } from 'react';
import { Shell } from '../components/Shell';
import { SettingsView } from '../components/SettingsView';
import { setRole } from '../storage';
import type { Role } from '../types';

interface Props {
  onPick: (role: Role) => void;
}

export function RolePicker({ onPick }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const pick = (role: 'professor' | 'student') => {
    setRole(role);
    onPick(role);
  };

  return (
    <Shell
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      label="CT"
      connected={null}
      title={showSettings ? 'Settings' : 'Who are you?'}
      footer={
        !showSettings ? (
          <button type="button" className="btn ghost" onClick={() => setShowSettings(true)}>
            Server config
          </button>
        ) : null
      }
    >
      {showSettings ? (
        <SettingsView onBack={() => setShowSettings(false)} />
      ) : (
        <>
          <p className="hint">
            This is the <strong>desktop Quickball</strong> (port 5174) — not a Chrome extension, and not
            the class dashboard.
          </p>
          <ul className="seg-list">
            <li>
              <strong>Dashboard</strong> (sir creates sessions):{' '}
              <a href="http://localhost:5173" target="_blank" rel="noreferrer">
                localhost:5173
              </a>
            </li>
            <li>
              <strong>API</strong> must be running: <code>localhost:3000</code>
            </li>
          </ul>
          <div className="role-grid">
            <button type="button" className="role-card role-card--prof" onClick={() => pick('professor')}>
              <h3>Professor / Sir</h3>
              <p>Email + password login → attach ACTIVE session → live counts.</p>
            </button>
            <button type="button" className="role-card role-card--stu" onClick={() => pick('student')}>
              <h3>Student</h3>
              <p>Session code + name/roll + PIN → update Done / Issue. No email login.</p>
            </button>
          </div>
          <p className="hint">
            Tip: open two tabs —{' '}
            <a href="http://localhost:5174/?role=professor" target="_blank" rel="noreferrer">
              ?role=professor
            </a>{' '}
            and{' '}
            <a href="http://localhost:5174/?role=student" target="_blank" rel="noreferrer">
              ?role=student
            </a>{' '}
            — to test both sides at once.
          </p>
        </>
      )}
    </Shell>
  );
}
