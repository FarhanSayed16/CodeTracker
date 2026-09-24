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
      title={showSettings ? 'Settings' : 'CodeTrack'}
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
          <p className="hint">Always-on-top companion for live labs. Pick your role.</p>
          <div className="role-grid">
            <button type="button" className="role-card" onClick={() => pick('professor')}>
              <h3>Professor</h3>
              <p>Monitor active session counts and issues while you code.</p>
            </button>
            <button type="button" className="role-card" onClick={() => pick('student')}>
              <h3>Student</h3>
              <p>Join with code + PIN and update task status from the ball.</p>
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
