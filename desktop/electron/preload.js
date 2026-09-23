/**
 * Electron Preload Script
 * Safely exposes backend/system APIs to the Angular renderer and splash window
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  isBackendReady: () => ipcRenderer.invoke('is-backend-ready'),

  // System
  openLogsFolder: () => ipcRenderer.invoke('open-logs-folder'),
  openBackupFolder: () => ipcRenderer.invoke('open-backup-folder'),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  clearAllStorage: () => ipcRenderer.invoke('clear-all-storage'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // LAN & Server Configuration
  discoverServer: () => ipcRenderer.invoke('discover-server'),
  saveServerConfig: (cfg) => ipcRenderer.invoke('save-server-config', cfg),
  getLanInfo: () => ipcRenderer.invoke('get-lan-info'),
  getServerMode: () => ipcRenderer.invoke('get-server-mode'),

  // Events
  onSplashStatus: (callback) => ipcRenderer.on('splash-status', (event, data) => callback(data)),
  onBackendReady: (callback) => ipcRenderer.on('backend-ready', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
