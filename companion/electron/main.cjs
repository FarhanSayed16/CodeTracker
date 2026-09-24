const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
let mainWindow = null;

const COLLAPSED = { width: 72, height: 72 };
const EXPANDED = { width: 340, height: 520 };

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
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    hasShadow: true,
    show: false,
    backgroundColor: '#00000000',
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
  });

  mainWindow.once('ready-to-show', () => {
    if (typeof mainWindow.showInactive === 'function') {
      mainWindow.showInactive();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('companion:setExpanded', (_event, expanded) => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const size = expanded ? EXPANDED : COLLAPSED;
  // Keep bottom-right corner anchored when resizing
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
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
});

ipcMain.handle('companion:getConfig', () => {
  return {
    apiUrl: process.env.CODETRACK_API_URL || 'http://localhost:3000/api',
    socketUrl: process.env.CODETRACK_SOCKET_URL || 'http://localhost:3000',
    dashboardUrl: process.env.CODETRACK_DASHBOARD_URL || 'http://localhost:5173',
  };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
