const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Aquí puedes agregar APIs específicas si las necesitas
  platform: process.platform,
  version: process.versions.electron
}); 