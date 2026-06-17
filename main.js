const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Check if we are in production or development
  const isDev = !app.isPackaged;
  const port = 3005; // Using 3005 as it was the default in your setup earlier
  const url = `http://localhost:${port}`;

  if (isDev) {
    // In dev, we assume you're already running `npm run dev` in another terminal
    mainWindow.loadURL(url);
  } else {
    // In production, spawn the Next.js server locally
    const nextPath = path.join(process.resourcesPath, 'app.asar', 'node_modules', '.bin', 'next');
    
    // Fallback path if not in asar (sometimes happens depending on builder config)
    const fallbackPath = path.join(__dirname, 'node_modules', '.bin', 'next');

    // To ensure compatibility on Windows, we'll just run 'node' with the next entry point
    const nextServerScript = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

    nextProcess = spawn(process.execPath, [nextServerScript, 'start', '-p', port.toString()], {
      cwd: __dirname,
      env: { ...process.env, PORT: port.toString() }
    });

    nextProcess.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    // Wait 2 seconds for server to start, then load
    setTimeout(() => {
      mainWindow.loadURL(url);
    }, 2000);
  }

  // Setup auto-updater
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new update is available. Downloading now...'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to install it.',
      buttons: ['Restart Now']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
