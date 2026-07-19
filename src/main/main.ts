import { app, BaseWindow, BrowserWindow, WebContentsView, ipcMain, screen, shell, Menu } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';

const store = new Store();

let mainWindow: BaseWindow;
let uiView: WebContentsView;
const tabs = new Map<string, WebContentsView>();
let activeTabId: string | null = null;

// Read config
const builtInServices = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../services/config.json'), 'utf8')
);

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const defaultBounds = {
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8)
  };
  
  const bounds = store.get('windowBounds', defaultBounds) as any;

  mainWindow = new BaseWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111111',
      symbolColor: '#F5F5F5',
      height: 40
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  const saveBounds = () => {
    store.set('windowBounds', mainWindow.getBounds());
  };
  
  mainWindow.on('resized', saveBounds);
  mainWindow.on('moved', saveBounds);

  uiView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.contentView.addChildView(uiView);
  
  let sidebarWidth = 250;
  const topBarHeight = 50;
  const tabBarHeight = 30;
  const statusBarHeight = 24;

  const updateLayout = () => {
    const bounds = mainWindow.getContentBounds();
    // UI view takes full window
    uiView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    
    // Tabs take the area below the tab bar and to the right of the sidebar
    tabs.forEach((view, id) => {
      view.setBounds({ 
        x: sidebarWidth, 
        y: topBarHeight + tabBarHeight, 
        width: bounds.width - sidebarWidth, 
        height: bounds.height - topBarHeight - tabBarHeight - statusBarHeight 
      });
    });
  };

  mainWindow.on('resize', updateLayout);
  
  ipcMain.on('update-layout', (_, newSidebarWidth) => {
    sidebarWidth = newSidebarWidth;
    updateLayout();
  });
  
  // In a real app we'd load an HTML file
  uiView.webContents.loadFile(path.join(__dirname, '../renderer/index.html'));

  setupIpc();
  
  updateLayout();
}

function setupIpc() {
  ipcMain.handle('get-builtin-services', () => builtInServices.builtIn);
  
  ipcMain.handle('get-custom-services', () => {
    return store.get('customServices', []);
  });
  
  ipcMain.handle('save-custom-service', (_, service) => {
    const services: any = store.get('customServices', []);
    services.push(service);
    store.set('customServices', services);
    return services;
  });

  ipcMain.handle('remove-custom-service', (_, id) => {
    let services: any = store.get('customServices', []);
    services = services.filter((s: any) => s.id !== id);
    store.set('customServices', services);
    return services;
  });

  ipcMain.handle('open-tab', (_, url, id) => {
    if (tabs.has(id)) {
      switchTab(id);
      return;
    }

    const view = new WebContentsView({
      webPreferences: {
        partition: `persist:${id}`, // Separate session per website
        contextIsolation: true,
        sandbox: true
      }
    });

    view.webContents.loadURL(url);
    
    view.webContents.on('page-title-updated', (e, title) => {
      uiView.webContents.send('update-title', id, title);
    });

    view.webContents.on('update-target-url', (e, url) => {
      uiView.webContents.send('update-status', url);
    });
    
    // Prevent arbitrary navigation and popups
    view.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    
    // Handle permissions securely (deny all by default in this minimal version, or conditionally)
    view.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      // For now, deny high-risk permissions. 
      // If needed, check permission type and allow safe ones (like notifications if toggled).
      if (permission === 'notifications') {
        callback(true); // Notifications allowed if native notifications are enabled.
      } else {
        callback(false);
      }
    });

    mainWindow.contentView.addChildView(view);
    tabs.set(id, view);
    
    // Force layout update for the new view by calling updateLayout directly
    // Wait, updateLayout is scoped to createWindow. 
    // We can calculate manually here based on the known sidebar width
    // Or we make updateLayout global. Let's just emit resize on mainWindow to trigger it.
    mainWindow.emit('resize');
    
    switchTab(id);
  });

  ipcMain.handle('switch-tab', (_, id) => {
    switchTab(id);
  });

  ipcMain.handle('close-tab', (_, id) => {
    if (tabs.has(id)) {
      const view = tabs.get(id)!;
      try { mainWindow.contentView.removeChildView(view); } catch(e) {}
      tabs.delete(id);
      if (activeTabId === id) {
        activeTabId = null;
      }
    }
  });

  ipcMain.handle('go-back', (_, id) => {
    if (tabs.has(id) && tabs.get(id)!.webContents.canGoBack()) {
      tabs.get(id)!.webContents.goBack();
    }
  });

  ipcMain.handle('go-forward', (_, id) => {
    if (tabs.has(id)) {
      tabs.get(id)!.webContents.goForward();
    }
  });

  ipcMain.handle('reload', (_, id) => {
    if (tabs.has(id)) {
      tabs.get(id)!.webContents.reload();
    }
  });
  
  ipcMain.handle('load-url', (_, id, url) => {
    if (tabs.has(id)) {
      tabs.get(id)!.webContents.loadURL(url);
    }
  });

  ipcMain.handle('get-settings', () => store.get('settings', { theme: 'dark' }));
  ipcMain.handle('save-settings', (_, settings) => store.set('settings', settings));
  
  ipcMain.handle('get-system-info', () => {
    return {
      version: app.getVersion(),
      electronVersion: process.versions.electron
    };
  });
  
  ipcMain.on('open-external', (_, url) => {
    shell.openExternal(url);
  });
  
  ipcMain.on('open-in-browser', (_, id) => {
    if (tabs.has(id)) {
      const url = tabs.get(id)!.webContents.getURL();
      shell.openExternal(url);
    }
  });

  // Window Controls
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window-close', () => mainWindow.close());

  ipcMain.on('toggle-settings-view', (_, isOpen) => {
    if (isOpen) {
      if (activeTabId && tabs.has(activeTabId)) {
        try { mainWindow.contentView.removeChildView(tabs.get(activeTabId)!); } catch(e) {}
      }
    } else {
      if (activeTabId && tabs.has(activeTabId)) {
        try { mainWindow.contentView.addChildView(tabs.get(activeTabId)!); } catch(e) {}
        mainWindow.emit('resize');
      }
    }
  });
}

function switchTab(id: string) {
  if (activeTabId && tabs.has(activeTabId)) {
    const prevView = tabs.get(activeTabId)!;
    try { mainWindow.contentView.removeChildView(prevView); } catch(e) {}
  }
  
  if (tabs.has(id)) {
    const view = tabs.get(id)!;
    try { mainWindow.contentView.addChildView(view); } catch(e) {}
    mainWindow.emit('resize'); // Trigger layout update for the added view
    activeTabId = id;
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Application Menu for Shortcuts
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (uiView) uiView.webContents.send('shortcut-new-tab');
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (uiView) uiView.webContents.send('shortcut-close-tab');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    if (uiView) uiView.webContents.send('update-available');
  });
  
  autoUpdater.on('update-downloaded', () => {
    if (uiView) uiView.webContents.send('update-downloaded');
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });
  
  app.on('activate', () => {
    if (BaseWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (e, contents) => {
  contents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      contents.openDevTools({ mode: 'detach' });
      event.preventDefault();
    }
  });
});
