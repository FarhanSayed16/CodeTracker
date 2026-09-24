const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companion', {
  setExpanded: (expanded) => ipcRenderer.invoke('companion:setExpanded', expanded),
  openExternal: (url) => ipcRenderer.invoke('companion:openExternal', url),
  getConfig: () => ipcRenderer.invoke('companion:getConfig'),
  getRuntime: () => ipcRenderer.invoke('companion:getRuntime'),
  getDeepLink: () => ipcRenderer.invoke('companion:getDeepLink'),
  setOpenAtLogin: (enabled) => ipcRenderer.invoke('companion:setOpenAtLogin', enabled),
  hideToTray: () => ipcRenderer.invoke('companion:hideToTray'),
  checkUpdate: () => ipcRenderer.invoke('companion:checkUpdate'),
  downloadUpdate: () => ipcRenderer.invoke('companion:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('companion:installUpdate'),
  onDeepLink: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('companion:deepLink', handler);
    return () => ipcRenderer.removeListener('companion:deepLink', handler);
  },
  onUpdateStatus: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('companion:updateStatus', handler);
    return () => ipcRenderer.removeListener('companion:updateStatus', handler);
  },
  onToggleExpand: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('companion:toggleExpand', handler);
    return () => ipcRenderer.removeListener('companion:toggleExpand', handler);
  },
});
