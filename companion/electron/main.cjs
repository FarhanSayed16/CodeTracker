const { app, BrowserWindow, ipcMain, shell, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
let mainWindow = null;
let tray = null;
let pendingDeepLink = null;
let isQuitting = false;

const COLLAPSED = { width: 72, height: 72 };
const EXPANDED = { width: 340, height: 520 };
const PROTOCOL = 'codetrack';

// —— Single instance ——
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const url = extractProtocolUrl(argv);
    if (url) handleDeepLink(url);
    showMainWindow();
  });
}

function extractProtocolUrl(argv = []) {
  return argv.find((a) => typeof a === 'string' && a.startsWith(`${PROTOCOL}://`)) || null;
}

function readLockedRole() {
  const fromEnv = (process.env.CODETRACK_ROLE || '').toLowerCase().trim();
  if (fromEnv === 'student' || fromEnv === 'professor') return fromEnv;
  try {
    const lockPath = path.join(__dirname, 'role.lock.json');
    const raw = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (raw.role === 'student' || raw.role === 'professor') return raw.role;
  } catch {
    /* unlocked */
  }
  return null;
}

function productMeta(lockedRole) {
  if (lockedRole === 'student') {
    return { productLabel: 'CodeTrack Student', ballLabel: 'STU' };
  }
  if (lockedRole === 'professor') {
    return { productLabel: 'CodeTrack Lab Monitor', ballLabel: 'PROF' };
  }
  return { productLabel: 'CodeTrack Companion', ballLabel: 'CT' };
}

/** Merge lab-config.json (packaged / next to exe) + env for IT preconfigure. */
function pickStr(...vals) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim().replace(/\/$/, '');
  }
  return null;
}

function loadLabConfig() {
  const candidates = [
    path.join(process.resourcesPath || '', 'lab-config.json'),
    path.join(path.dirname(process.execPath), 'lab-config.json'),
    path.join(__dirname, 'lab-config.json'),
  ];
  let fileCfg = {};
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) {
        fileCfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    } catch {
      /* skip */
    }
  }
  let apiUrl =
    pickStr(process.env.CODETRACK_API_URL, fileCfg.apiUrl) || 'http://localhost:3000/api';
  if (/^https?:\/\//i.test(apiUrl) && !/\/api$/i.test(apiUrl)) {
    apiUrl = `${apiUrl}/api`;
  }
  return {
    apiUrl,
    socketUrl:
      pickStr(process.env.CODETRACK_SOCKET_URL, fileCfg.socketUrl) || 'http://localhost:3000',
    dashboardUrl:
      pickStr(process.env.CODETRACK_DASHBOARD_URL, fileCfg.dashboardUrl) ||
      'http://localhost:5173',
    updateUrl: pickStr(process.env.CODETRACK_UPDATE_URL, fileCfg.updateUrl) || '',
  };
}

function resolveIcon() {
  const candidates = [
    path.join(__dirname, '../build/icon.png'),
    path.join(process.resourcesPath || '', 'icon.png'),
    path.join(__dirname, '../dist/icon.png'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) return img;
      }
    } catch {
      /* skip */
    }
  }
  return nativeImage.createEmpty();
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
}

function hideToTray() {
  if (!mainWindow) return;
  mainWindow.hide();
}

function createTray() {
  if (tray) return;
  const icon = resolveIcon();
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFUlEQVQ4T2NkYGD4z0ABYBw1gGHwBQBu0AH5Y5KxwQAAAABJRU5ErkJggg=='
  ) : icon);
  const meta = productMeta(readLockedRole());
  tray.setToolTip(meta.productLabel);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Quickball', click: () => showMainWindow() },
      { label: 'Expand / Collapse', click: () => mainWindow?.webContents.send('companion:toggleExpand') },
      { type: 'separator' },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked, openAsHidden: true });
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on('click', () => showMainWindow());
  tray.on('double-click', () => showMainWindow());
}

function createWindow() {
  const display = screen.getPrimaryDisplay().workArea;
  const x = display.x + display.width - EXPANDED.width - 24;
  const y = display.y + display.height - EXPANDED.height - 24;

  mainWindow = new BrowserWindow({
    width: EXPANDED.width,
    height: EXPANDED.height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    minimizable: true,
    fullscreenable: false,
    skipTaskbar: false,
    hasShadow: true,
    show: false,
    backgroundColor: '#00000000',
    icon: resolveIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5174');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript('document.body.classList.add("electron")');
    if (pendingDeepLink) {
      mainWindow.webContents.send('companion:deepLink', pendingDeepLink);
      pendingDeepLink = null;
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (typeof mainWindow.showInactive === 'function') {
      mainWindow.showInactive();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      hideToTray();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function parseDeepLink(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== `${PROTOCOL}:`) return null;
    const host = u.hostname || u.host;
    const code = u.searchParams.get('code') || '';
    // codetrack://join?code=ABC or codetrack:join?code=
    const action = host || u.pathname.replace(/^\//, '') || 'join';
    return { action, code: code.toUpperCase(), raw: url };
  } catch {
    return null;
  }
}

function handleDeepLink(url) {
  const parsed = parseDeepLink(url);
  if (!parsed) return;
  pendingDeepLink = parsed;
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('companion:deepLink', parsed);
    pendingDeepLink = null;
  }
  showMainWindow();
}

function setupAutoUpdater() {
  if (isDev) return;
  const { updateUrl } = loadLabConfig();
  if (!updateUrl) return;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = false;
    autoUpdater.setFeedURL({ provider: 'generic', url: updateUrl });
    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('companion:updateStatus', {
        status: 'available',
        version: info.version,
      });
    });
    autoUpdater.on('update-not-available', () => {
      mainWindow?.webContents.send('companion:updateStatus', { status: 'none' });
    });
    autoUpdater.on('error', (err) => {
      mainWindow?.webContents.send('companion:updateStatus', {
        status: 'error',
        message: err.message,
      });
    });
    autoUpdater.on('download-progress', (p) => {
      mainWindow?.webContents.send('companion:updateStatus', {
        status: 'downloading',
        percent: p.percent,
      });
    });
    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('companion:updateStatus', { status: 'ready' });
    });
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => undefined);
    }, 5000);

    ipcMain.handle('companion:checkUpdate', async () => {
      try {
        return await autoUpdater.checkForUpdates();
      } catch (e) {
        return { error: e.message };
      }
    });
    ipcMain.handle('companion:downloadUpdate', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    });
    ipcMain.handle('companion:installUpdate', () => {
      isQuitting = true;
      autoUpdater.quitAndInstall(false, true);
    });
  } catch (e) {
    console.warn('autoUpdater setup failed', e.message);
  }
}

// Protocol registration (dev needs setAsDefaultProtocolClient with execPath)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Windows / Linux: protocol URL may arrive in argv on first launch
const coldStartUrl = extractProtocolUrl(process.argv);
if (coldStartUrl) pendingDeepLink = parseDeepLink(coldStartUrl);

// macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

ipcMain.handle('companion:setExpanded', (_event, expanded) => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const size = expanded ? EXPANDED : COLLAPSED;
  const x = bounds.x + bounds.width - size.width;
  const y = bounds.y + bounds.height - size.height;
  mainWindow.setBounds({
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: size.width,
    height: size.height,
  });
});

ipcMain.handle('companion:openExternal', (_event, url) => {
  if (typeof url === 'string' && /^(https?:|codetrack:)/i.test(url)) {
    shell.openExternal(url);
  }
});

ipcMain.handle('companion:getConfig', () => {
  const lab = loadLabConfig();
  return {
    apiUrl: lab.apiUrl,
    socketUrl: lab.socketUrl,
    dashboardUrl: lab.dashboardUrl,
  };
});

ipcMain.handle('companion:getRuntime', () => {
  const lockedRole = readLockedRole();
  const meta = productMeta(lockedRole);
  const lab = loadLabConfig();
  return {
    lockedRole,
    allowSwitchRole: lockedRole == null,
    productLabel: meta.productLabel,
    ballLabel: meta.ballLabel,
    isPackaged: app.isPackaged,
    version: app.getVersion(),
    updateConfigured: Boolean(lab.updateUrl),
    openAtLogin: app.getLoginItemSettings().openAtLogin,
  };
});

ipcMain.handle('companion:getDeepLink', () => pendingDeepLink);

ipcMain.handle('companion:setOpenAtLogin', (_e, enabled) => {
  app.setLoginItemSettings({ openAtLogin: !!enabled, openAsHidden: true });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('companion:hideToTray', () => {
  hideToTray();
});

app.whenReady().then(() => {
  createTray();
  createWindow();
  setupAutoUpdater();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});

app.on('activate', () => {
  showMainWindow();
});
