import { useEffect, useState } from 'react';
import { getConfig, updateConfig } from '../config';
import { getRuntime } from '../runtime';
import { saveConfig } from '../storage';
import type { CompanionConfig } from '../types';

interface Props {
  onBack: () => void;
}

export function SettingsView({ onBack }: Props) {
  const current = getConfig();
  const rt = getRuntime();
  const [form, setForm] = useState<CompanionConfig>({ ...current });
  const [saved, setSaved] = useState(false);
  const [openAtLogin, setOpenAtLogin] = useState(!!rt.openAtLogin);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    return window.companion?.onUpdateStatus?.((data) => {
      if (data.status === 'available') setUpdateMsg(`Update ${data.version} available`);
      else if (data.status === 'downloading') setUpdateMsg(`Downloading… ${Math.round(data.percent || 0)}%`);
      else if (data.status === 'ready') setUpdateMsg('Update ready — click Install');
      else if (data.status === 'none') setUpdateMsg('You are up to date');
      else if (data.status === 'error') setUpdateMsg(data.message || 'Update check failed');
    });
  }, []);

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

  const toggleLogin = async () => {
    if (!window.companion?.setOpenAtLogin) return;
    const next = await window.companion.setOpenAtLogin(!openAtLogin);
    setOpenAtLogin(next);
  };

  return (
    <>
      <p className="hint">
        Point the companion at your CodeTrack API. Lab images should set{' '}
        <code>lab-config.json</code> or <code>CODETRACK_*</code> env so students skip this screen.
        CORS must allow 5173 + 5174.
      </p>
      {rt.version && <p className="hint">Version {rt.version}</p>}
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
        {window.companion?.setOpenAtLogin && (
          <button type="button" className="btn secondary block" onClick={toggleLogin}>
            {openAtLogin ? '✓ Start with Windows (on)' : 'Start with Windows (off)'}
          </button>
        )}
        {rt.updateConfigured && (
          <>
            <button
              type="button"
              className="btn secondary block"
              onClick={() => void window.companion?.checkUpdate?.()}
            >
              Check for updates
            </button>
            {updateMsg.includes('available') && (
              <button
                type="button"
                className="btn block"
                onClick={() => void window.companion?.downloadUpdate?.()}
              >
                Download update
              </button>
            )}
            {updateMsg.includes('ready') && (
              <button
                type="button"
                className="btn block"
                onClick={() => void window.companion?.installUpdate?.()}
              >
                Install & restart
              </button>
            )}
            {updateMsg && <p className="hint">{updateMsg}</p>}
          </>
        )}
        <button type="button" className="btn block" onClick={save}>
          {saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" className="btn secondary block" onClick={resetLocal}>
          Reset to defaults
        </button>
        {window.companion?.hideToTray && (
          <button type="button" className="btn secondary block" onClick={() => void window.companion?.hideToTray?.()}>
            Hide to tray
          </button>
        )}
        <button type="button" className="btn secondary block" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  );
}
