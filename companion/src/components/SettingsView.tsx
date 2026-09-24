import { useEffect, useState } from 'react';
import * as api from '../api';
import { getConfig, getDefaultConfig, sanitizeUrl, updateConfig } from '../config';
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
  const [testMsg, setTestMsg] = useState('');
  const [testing, setTesting] = useState(false);

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
      apiUrl: sanitizeUrl('api', form.apiUrl) || getDefaultConfig().apiUrl,
      socketUrl: sanitizeUrl('socket', form.socketUrl) || getDefaultConfig().socketUrl,
      dashboardUrl: sanitizeUrl('dashboard', form.dashboardUrl) || getDefaultConfig().dashboardUrl,
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
    const d = getDefaultConfig();
    updateConfig(d);
    saveConfig(d);
    setForm(d);
    window.location.reload();
  };

  const testConnection = async () => {
    setTesting(true);
    setTestMsg('');
    // Apply form values temporarily for ping
    updateConfig({
      apiUrl: sanitizeUrl('api', form.apiUrl) || form.apiUrl,
      socketUrl: sanitizeUrl('socket', form.socketUrl) || form.socketUrl,
      dashboardUrl: sanitizeUrl('dashboard', form.dashboardUrl) || form.dashboardUrl,
    });
    const ping = await api.pingApi();
    setTestMsg(ping.ok ? `OK — ${ping.apiUrl}` : ping.message);
    setTesting(false);
  };

  const toggleLogin = async () => {
    if (!window.companion?.setOpenAtLogin) return;
    const next = await window.companion.setOpenAtLogin(!openAtLogin);
    setOpenAtLogin(next);
  };

  return (
    <>
      <p className="hint">
        Desktop app must use a full URL like <code>http://localhost:3000/api</code> (not{' '}
        <code>/api</code> or port 5174). Start the server with <code>cd server && npm run dev</code>.
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
        <button type="button" className="btn secondary block" onClick={testConnection} disabled={testing}>
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {testMsg && <p className={`hint ${testMsg.startsWith('OK') ? '' : 'error-inline'}`}>{testMsg}</p>}
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
