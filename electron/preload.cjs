const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studioFileStorage', {
  getItem: (key) => ipcRenderer.sendSync('storage:get-item', key),
  setItem: (key, value) => ipcRenderer.sendSync('storage:set-item', key, value),
  removeItem: (key) => ipcRenderer.sendSync('storage:remove-item', key),
  listKeys: () => ipcRenderer.sendSync('storage:list-keys'),
  getDataDir: () => ipcRenderer.sendSync('storage:get-data-dir'),
});

contextBridge.exposeInMainWorld('studioAiFetch', (options) =>
  ipcRenderer.invoke('ai:fetch', options)
);
