const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sendToOverlay } = require('./src/overlayServer');

let overlayWindow = null;
let settingsWindow = null;

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 1280,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay', 'index.html'));
  overlayWindow.setIgnoreMouseEvents(true);
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000');
    settingsWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    settingsWindow.loadFile(path.join(__dirname, 'ui', 'build', 'index.html'));
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

app.whenReady().then(() => {
  createOverlayWindow();
  createSettingsWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
      createSettingsWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers — send to both Electron overlay AND browser source via WebSocket
ipcMain.on('update-overlay', (event, data) => {
  // Electron window overlay
  if (overlayWindow) {
    overlayWindow.webContents.send('overlay-update', data);
  }
  // Browser source (WebSocket)
  sendToOverlay(data);
});

ipcMain.on('save-settings', (event, settings) => {
  console.log('Settings saved:', settings);
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});
