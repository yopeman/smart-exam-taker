import { app, BrowserWindow, ipcMain, dialog, safeStorage, globalShortcut, Menu, session } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;
let examLockdown = false;
let defaultAppMenu: Electron.Menu | null = null;

const BLOCKED_GLOBAL_ACCELS = [
  'Alt',
  'Alt+Tab',
  'Alt+F4',
  'Super',
  'Super+Tab',
  'Meta',
  'F11',
];

class SecureStore {
  private file: string;
  private cache: Record<string, string> = {};

  constructor() {
    this.file = path.join(app.getPath('userData'), 'secure-store.json');
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return;
      const encrypted: Record<string, string> = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      for (const [key, value] of Object.entries(encrypted)) {
        const buf = Buffer.from(value, 'base64');
        this.cache[key] = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(buf)
          : buf.toString('utf-8');
      }
    } catch {
      this.cache = {};
    }
  }

  get(key: string): string | null {
    return this.cache[key] ?? null;
  }

  set(key: string, value: string) {
    this.cache[key] = value;
    this.persist();
  }

  delete(key: string) {
    delete this.cache[key];
    this.persist();
  }

  clear() {
    this.cache = {};
    this.persist();
  }

  persist() {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.cache)) {
      out[key] = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(value).toString('base64')
        : Buffer.from(value, 'utf-8').toString('base64');
    }
    try {
      fs.writeFileSync(this.file, JSON.stringify(out));
    } catch {
      // ignore write errors
    }
  }
}

const secureStore = new SecureStore();

function applyLockdown(active: boolean) {
  examLockdown = active;
  const win = mainWindow;
  if (!win) return;

  win.setKiosk(active);
  win.setFullScreen(active);
  win.setAlwaysOnTop(active, 'screen-saver');
  if (process.platform !== 'win32') {
    win.setVisibleOnAllWorkspaces(active, { visibleOnFullScreen: true });
  } else {
    win.setVisibleOnAllWorkspaces(false);
  }

  if (active) {
    Menu.setApplicationMenu(null);
    for (const accel of BLOCKED_GLOBAL_ACCELS) {
      try {
        globalShortcut.register(accel, () => {});
      } catch {
        // best-effort: some window managers reject global registration
      }
    }
  } else {
    Menu.setApplicationMenu(defaultAppMenu);
    globalShortcut.unregisterAll();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Smart Exam Taker',
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-changed', false);
  });
  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('window:blur');
  });
  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window:focus');
  });
  mainWindow.on('minimize', () => {
    mainWindow?.webContents.send('window:minimize');
  });

  mainWindow.on('close', (event) => {
    if (!examLockdown) return;
    event.preventDefault();
    mainWindow?.webContents.send('window:close-blocked');
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!examLockdown) return;
    const key = (input.key || '').toLowerCase();
    const blocked =
      (input.alt && input.key === 'F4') ||
      input.key === 'F11' ||
      (input.control && key === 'w') ||
      input.meta ||
      input.alt ||
      input.control ||
      key === 'escape' ||
      key === 'f12' ||
      key === 'f5' ||
      key === 'super';
    if (blocked) {
      event.preventDefault();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('secure:get', (_event, key: string) => secureStore.get(key));
  ipcMain.handle('secure:set', (_event, key: string, value: string) => {
    secureStore.set(key, value);
  });
  ipcMain.handle('secure:delete', (_event, key: string) => {
    secureStore.delete(key);
  });
  ipcMain.handle('secure:clear', () => {
    secureStore.clear();
  });

  ipcMain.handle('window:set-fullscreen', (_event, flag: boolean) => {
    mainWindow?.setFullScreen(Boolean(flag));
  });
  ipcMain.handle('window:is-fullscreen', () => mainWindow?.isFullScreen() ?? false);
  ipcMain.handle('window:lockdown', (_event, active: boolean) => {
    applyLockdown(Boolean(active));
  });

  ipcMain.handle(
    'pdf:save-html',
    async (_event, html: string, defaultName: string) => {
      if (!mainWindow) return { canceled: true };
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          sandbox: true,
        },
      });
      try {
        await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
        const data = await printWindow.webContents.printToPDF({
          pageSize: 'A4',
          printBackground: true,
        });
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
          defaultPath: defaultName,
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        });
        if (canceled || !filePath) return { canceled: true };
        fs.writeFileSync(filePath, data);
        return { canceled: false, filePath };
      } finally {
        printWindow.destroy();
      }
    }
  );
}

function setupMediaPermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    if (permission === 'media') {
      const mediaTypes: string[] | undefined = (details as any)?.mediaTypes;
      const wantsVideo = !mediaTypes || mediaTypes.includes('video');
      callback(wantsVideo);
      return;
    }
    callback(false);
  });
  ses.setPermissionCheckHandler((_webContents, permission) => permission === 'media');
}

app.whenReady().then(() => {
  defaultAppMenu = Menu.getApplicationMenu();
  setupMediaPermissions();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});