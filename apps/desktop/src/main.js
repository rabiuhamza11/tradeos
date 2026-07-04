const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0A0E17',
    title: 'TradeOS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the web app
  const isDev = process.env.NODE_ENV === 'development' || process.env.TRADEOS_DEV === 'true';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('https://tradeos.app'); // Production URL
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('minimize', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create tray icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open TradeOS', click: () => { mainWindow?.show(); } },
    { label: 'Markets', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'markets'); } },
    { label: 'Trade', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'trading'); } },
    { label: 'Portfolio', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', 'portfolios'); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('TradeOS — Enterprise Trading Platform');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow?.show(); });
}

// IPC handlers for native features
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('minimize-to-tray', () => {
  mainWindow?.hide();
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Auto-launch on system startup
ipcMain.handle('set-auto-launch', (event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (e, url) => {
    const allowedOrigins = ['http://localhost:3000', 'https://tradeos.app'];
    if (!allowedOrigins.some((origin) => url.startsWith(origin))) {
      e.preventDefault();
    }
  });
});
