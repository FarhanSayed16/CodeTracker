import { useState } from 'react';
import { getConfig, updateConfig } from '../config';
import { saveConfig } from '../storage';
import type { CompanionConfig } from '../types';

interface Props {
  onBack: () => void;
}

export function SettingsView({ onBack }: Props) {
  const current = getConfig();
  const [form, setForm] = useState<CompanionConfig>({ ...current });
  const [saved, setSaved] = useState(false);

  const save = () => {
    const next = {
      apiUrl: form.apiUrl.replace(/\/$/, '') || '/api',
      socketUrl: form.socketUrl.replace(/\/$/, '') || window.location.origin,
      dashboardUrl: form.dashboardUrl.replace(/\/$/, ''),
    };
    updateConfig(next);
    saveConfig(next);
    setForm(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetLocal = () => {
    localStorage.removeItem('ct_api_url');
    localStorage.removeItem('ct_socket_url');
    localStorage.removeItem('ct_dashboard_url');
    window.location.reload();
  };

  return (
    <>
      <p className="hint">Point the companion at your CodeTrack server. Restart connection after changing URLs.</p>
      <div className="settings-form">
        <div className="field">
          <label className="label">API URL</label>
          <input
            value={form.apiUrl}
            onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
            placeholder="http://localhost:3000/api"
          />
        </div>
        <div className="field">
          <label className="label">Socket URL</label>
          <input
            value={form.socketUrl}
            onChange={(e) => setForm({ ...form, socketUrl: e.target.value })}
            placeholder="http://localhost:3000"
          />
        </div>
        <div className="field">
          <label className="label">Dashboard URL</label>
          <input
            value={form.dashboardUrl}
            onChange={(e) => setForm({ ...form, dashboardUrl: e.target.value })}
            placeholder="http://localhost:5173"
          />
        </div>
        <button type="button" className="btn block" onClick={save}>
          {saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" className="btn secondary block" onClick={resetLocal}>
          Reset to defaults
        </button>
        <button type="button" className="btn secondary block" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  );
}
