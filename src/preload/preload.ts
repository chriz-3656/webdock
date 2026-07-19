import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Services
  getBuiltInServices: () => ipcRenderer.invoke('get-builtin-services'),
  getCustomServices: () => ipcRenderer.invoke('get-custom-services'),
  saveCustomService: (service: any) => ipcRenderer.invoke('save-custom-service', service),
  removeCustomService: (id: string) => ipcRenderer.invoke('remove-custom-service', id),
  
  // Tabs / Navigation
  openTab: (url: string, id: string) => ipcRenderer.invoke('open-tab', url, id),
  closeTab: (id: string) => ipcRenderer.invoke('close-tab', id),
  switchTab: (id: string) => ipcRenderer.invoke('switch-tab', id),
  goBack: (id: string) => ipcRenderer.invoke('go-back', id),
  goForward: (id: string) => ipcRenderer.invoke('go-forward', id),
  reload: (id: string) => ipcRenderer.invoke('reload', id),
  loadUrl: (id: string, url: string) => ipcRenderer.invoke('load-url', id, url),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.send('open-settings'),
  
  // System Info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  openInBrowser: (id: string) => ipcRenderer.send('open-in-browser', id),
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  updateLayout: (sidebarWidth: number) => ipcRenderer.send('update-layout', sidebarWidth),

  // Events
  onUpdateTitle: (callback: (id: string, title: string) => void) => {
    ipcRenderer.on('update-title', (_event, id, title) => callback(id, title));
  },
  onUpdateFavicon: (callback: (id: string, favicon: string) => void) => {
    ipcRenderer.on('update-favicon', (_event, id, favicon) => callback(id, favicon));
  },
  onUpdateStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('update-status', (_event, status) => callback(status));
  },
  
  toggleSettingsView: (isOpen: boolean) => ipcRenderer.send('toggle-settings-view', isOpen),
  
  // Shortcuts & Updates
  onShortcutNewTab: (callback: () => void) => {
    ipcRenderer.on('shortcut-new-tab', () => callback());
  },
  onShortcutCloseTab: (callback: () => void) => {
    ipcRenderer.on('shortcut-close-tab', () => callback());
  },
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback());
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },
  restartApp: () => ipcRenderer.send('restart-app')
});
