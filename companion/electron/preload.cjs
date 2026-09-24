const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companion', {
  setExpanded: (expanded) => ipcRenderer.invoke('companion:setExpanded', expanded),
  openExternal: (url) => ipcRenderer.invoke('companion:openExternal', url),
  getConfig: () => ipcRenderer.invoke('companion:getConfig'),
});
