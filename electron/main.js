// // Electron main process entry point

// const { app, BrowserWindow, ipcMain } = require('electron');
// const path = require('path');
// const isDev = process.env.NODE_ENV === 'development';

// let mainWindow;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 1024,
//     minHeight: 768,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js')
//     },
//     titleBarStyle: 'hiddenInset',
//     backgroundColor: '#0f172a',
//     show: false
//   });

//   // Load app
//   const startUrl = isDev 
//     ? 'http://localhost:3000' 
//     : `file://${path.join(__dirname, '../frontend/build/index.html')}`;
  
//   mainWindow.loadURL(startUrl);

//   // Show window when ready
//   mainWindow.once('ready-to-show', () => {
//     mainWindow.show();
//   });

//   // Open DevTools in development
//   if (isDev) {
//     mainWindow.webContents.openDevTools();
//   }

//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }

// // App lifecycle
// app.whenReady().then(createWindow);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// // IPC Handlers
// ipcMain.handle('get-app-path', () => {
//   return app.getPath('userData');
// });

// ipcMain.handle('minimize-window', () => {
//   if (mainWindow) mainWindow.minimize();
// });

// ipcMain.handle('maximize-window', () => {
//   if (mainWindow) {
//     if (mainWindow.isMaximized()) {
//       mainWindow.unmaximize();
//     } else {
//       mainWindow.maximize();
//     }
//   }
// });

// ipcMain.handle('close-window', () => {
//   if (mainWindow) mainWindow.close();
// });

// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Add this for development
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    show: false
  });

  // Fixed URL loading
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../frontend/build/index.html')}`;
  
  console.log('Loading URL:', startUrl); // Debug log
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  console.log('App ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});