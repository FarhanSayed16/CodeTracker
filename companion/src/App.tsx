import { useEffect, useState } from 'react';
import { initConfig } from './config';
import { getRole } from './storage';
import type { Role } from './types';
import { RolePicker } from './views/RolePicker';
import { StudentView } from './views/StudentView';
import { ProfessorView } from './views/ProfessorView';

export default function App() {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<Role>(null);

  useEffect(() => {
    initConfig().then(() => {
      setRoleState(getRole());
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="ball">
          <div className="ball-inner">
            <span className="ball-dot" />
            <span className="ball-label">…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return <RolePicker onPick={setRoleState} />;
  }

  if (role === 'student') return <StudentView />;
  return <ProfessorView />;
}
