// TradeOS Desktop Preload — Secure bridge between renderer and main process
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tradeos', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, route) => callback(route)),
});
