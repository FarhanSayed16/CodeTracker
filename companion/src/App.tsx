import { useEffect, useState } from 'react';
import { initConfig } from './config';
import { getRuntime, initRuntime, resolveInitialRole } from './runtime';
import { getRole, setRole } from './storage';
import type { Role } from './types';
import { RolePicker } from './views/RolePicker';
import { StudentView } from './views/StudentView';
import { ProfessorView } from './views/ProfessorView';

export default function App() {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<Role>(null);

  useEffect(() => {
    (async () => {
      await initConfig();
      const rt = await initRuntime();
      const initial = resolveInitialRole(getRole());
      if (rt.lockedRole) {
        setRole(rt.lockedRole);
        setRoleState(rt.lockedRole);
      } else {
        setRoleState(initial);
      }
      if (rt.productLabel) {
        document.title = rt.productLabel;
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="app-shell app-shell--ball">
        <div className="ball">
          <div className="ball-inner">
            <span className="ball-dot" />
            <span className="ball-label">…</span>
          </div>
        </div>
      </div>
    );
  }

  const rt = getRuntime();

  if (!role) {
    return <RolePicker onPick={setRoleState} />;
  }

  if (role === 'student') {
    return <StudentView allowSwitchRole={rt.allowSwitchRole} ballLabel={rt.ballLabel || 'STU'} />;
  }
  return <ProfessorView allowSwitchRole={rt.allowSwitchRole} ballLabel={rt.ballLabel || 'PROF'} />;
}
