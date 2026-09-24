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
          <p className="hint">
            <strong>Lab live status</strong> — always-on-top Quickball. Create sessions and import
            rosters in the web dashboard. Pick your role for this machine:
          </p>
          <div className="role-grid">
            <button type="button" className="role-card" onClick={() => pick('professor')}>
              <h3>Professor</h3>
              <p>Monitor live counts and issues while you code (not for creating classes).</p>
            </button>
            <button type="button" className="role-card" onClick={() => pick('student')}>
              <h3>Student</h3>
              <p>Join with code + PIN and update task status. Do not also open /join in a browser.</p>
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
