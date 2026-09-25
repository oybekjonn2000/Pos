/**
 * Electron Main Process
 * Restaurant POS Desktop Application — Full Self-Contained Runtime
 *
 * Architecture:
 * 1. Shows sleek splash screen
 * 2. Checks/starts local PostgreSQL (Port 5433)
 * 3. Starts Spring Boot using bundled JRE 21 (127.0.0.1:8080)
 * 4. Polls /actuator/health until UP
 * 5. Loads offline Angular production UI in desktop window
 * 6. Graceful shutdown of all backend processes on exit
 */

const { app, BrowserWindow, ipcMain, shell, dialog, Menu, session, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const dgram = require('dgram');
const os = require('os');
const { spawn, execSync } = require('child_process');

// ============================================================
// 0. Single Instance Lock Enforcement
// ============================================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[SingleInstance] Boshqa POS dasturi allaqachon ishlayapti. Yangi nusxa to‘xtatildi.');
  app.quit();
  process.exit(0);
}

// ============================================================
// Paths and Configuration
// ============================================================
const isDev = !app.isPackaged;
const APP_DATA = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'RestaurantPOS');
const BACKEND_PORT = 8080;
const PG_PORT = 5433;
const DISCOVERY_PORT = 38888;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const HEALTH_URL = `${BACKEND_URL}/actuator/health`;
const STARTUP_TIMEOUT_MS = 120000; // 2 minutes max

const isAutostart = process.argv.includes('--autostart') || process.argv.includes('--minimized') || process.argv.includes('--hidden');

let splashWindow = null;
let mainWindow = null;
let tray = null;
let isQuitting = false;
let backendProcess = null;
let startedPgLocally = false;
let backendReady = false;
let activeServerUrl = BACKEND_URL;
let currentAppMode = 'server';
let discoverySocket = null;
let crashRestartCount = 0;
let lastCrashTime = 0;

// Re-activate existing window if user runs another .exe
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('[SingleInstance] Takroriy ishga tushirish aniqlandi. Mavjud oynani ekranga chiqarish...');
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.maximize();
    mainWindow.focus();
    mainWindow.webContents.focus();
  } else if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.show();
    splashWindow.focus();
  } else {
    createMainWindow();
  }
});

// Ensure base application data directories exist
ensureDirectories();

// ============================================================
// Directory Management
// ============================================================
function ensureDirectories() {
  const dirs = [
    APP_DATA,
    path.join(APP_DATA, 'PostgreSQL'),
    path.join(APP_DATA, 'PostgreSQL', 'data'),
    path.join(APP_DATA, 'config'),
    path.join(APP_DATA, 'logs'),
    path.join(APP_DATA, 'uploads'),
    path.join(APP_DATA, 'receipts'),
    path.join(APP_DATA, 'backups')
  ];

  dirs.forEach(d => {
    try {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    } catch (err) {
      console.error('Directory creation error:', d, err);
    }
  });

  // Ensure default application.properties exists in config
  const cfgFile = path.join(APP_DATA, 'config', 'application.properties');
  if (!fs.existsSync(cfgFile)) {
    const defaultCfg = [
      '# Restaurant POS Local Configuration',
      'server.port=' + BACKEND_PORT,
      'spring.datasource.url=jdbc:postgresql://127.0.0.1:' + PG_PORT + '/pos',
      'spring.datasource.username=pos_user',
      'spring.datasource.password=123',
      'spring.flyway.enabled=true',
      'spring.flyway.baseline-on-migrate=true',
      'app.upload.dir=' + path.join(APP_DATA, 'uploads').replace(/\\/g, '/'),
      'logging.file.name=' + path.join(APP_DATA, 'logs', 'app.log').replace(/\\/g, '/'),
      'app.backup.path=' + path.join(APP_DATA, 'backups').replace(/\\/g, '/')
    ].join('\n');
    try {
      fs.writeFileSync(cfgFile, defaultCfg, 'utf-8');
    } catch (e) {
      console.error('Failed to create default config file:', e);
    }
  }
}

// ============================================================
// Binary Resolution (Bundled vs Dev Fallback)
// ============================================================
function findJavaBinary() {
  const appDir = path.dirname(app.getPath('exe'));
  const locations = [
    path.join(appDir, 'jre', 'bin', 'java.exe'),
    path.join(process.resourcesPath, 'jre', 'bin', 'java.exe'),
    path.join(appDir, 'resources', 'jre', 'bin', 'java.exe'),
    path.join(__dirname, '..', '..', 'dist', 'staging', 'jre', 'bin', 'java.exe'),
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
    'C:\\Users\\User\\.jdks\\jbr-21.0.11\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21.0.12\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21.0.12.1\\bin\\java.exe'
  ].filter(Boolean);
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  return 'java'; // system PATH fallback
}

function findPgBinDir() {
  const appDir = path.dirname(app.getPath('exe'));
  const locations = [
    path.join(appDir, 'pgsql', 'bin'),
    path.join(process.resourcesPath, 'pgsql', 'bin'),
    path.join(appDir, 'resources', 'pgsql', 'bin'),
    path.join(__dirname, '..', '..', 'dist', 'staging', 'pgsql', 'bin'),
    'C:\\Program Files\\PostgreSQL\\18\\bin'
  ];
  for (const loc of locations) {
    if (fs.existsSync(path.join(loc, 'pg_ctl.exe'))) return loc;
  }
  return null;
}

function findBackendJar() {
  const appDir = path.dirname(app.getPath('exe'));
  const locations = [
    path.join(appDir, 'backend'),
    path.join(process.resourcesPath, 'backend'),
    path.join(appDir, 'resources', 'backend'),
    path.join(__dirname, '..', '..', 'dist', 'staging', 'backend'),
    path.join(__dirname, '..', '..', 'backend', 'restaurant-pos-api', 'target')
  ];
  for (const dir of locations) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.jar') && !f.includes('-sources') && !f.includes('.original'));
      if (files.length > 0) {
        return path.join(dir, files[0]);
      }
    }
  }
  return null;
}

function findFrontendIndex() {
  const appDir = path.dirname(app.getPath('exe'));
  const locations = [
    path.join(process.resourcesPath, 'app', 'index.html'),
    path.join(appDir, 'resources', 'app', 'index.html'),
    path.join(appDir, 'app', 'index.html'),
    path.join(__dirname, '..', '..', 'frontend', 'angular-pos', 'dist', 'angular-pos', 'browser', 'index.html')
  ];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  return null;
}

// ============================================================
// Splash Window
// ============================================================
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    resizable: false,
    center: true,
    show: false,
    backgroundColor: '#0b0d14',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

function updateSplash(step, message, error = null) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash-status', { step, message, error });
  }
}

// ============================================================
// Main Application Window & Menu Management
// ============================================================
function buildAppMenu() {
  const template = [
    {
      label: 'Fayl',
      submenu: [
        {
          label: 'System Tray\'ga yashirish',
          click: () => {
            if (mainWindow) mainWindow.hide();
          }
        },
        { type: 'separator' },
        {
          label: 'Dasturni butunlay yopish',
          click: () => {
            const choice = dialog.showMessageBoxSync(mainWindow, {
              type: 'warning',
              title: 'Dasturni butunlay yopish',
              message: 'POS server to‘liq to‘xtatiladi va LAN tarmog‘idagi ofitsiantlar, oshxona (KDS) serverga ulana olmay qoladi.\n\nDasturdan chiqishni tasdiqlaysizmi?',
              buttons: ['Ha, butunlay yopish', 'Bekor qilish'],
              defaultId: 1,
              cancelId: 1
            });
            if (choice === 0) {
              isQuitting = true;
              if (tray) {
                try { tray.destroy(); } catch (e) {}
                tray = null;
              }
              app.quit();
            }
          }
        }
      ]
    },
    {
      label: 'Tahrirlash',
      submenu: [
        { role: 'undo', label: 'Bekor qilish' },
        { role: 'redo', label: 'Qaytarish' },
        { type: 'separator' },
        { role: 'cut', label: 'Qirqib olish' },
        { role: 'copy', label: 'Nusxa olish' },
        { role: 'paste', label: 'Qo‘yish' },
        { role: 'delete', label: 'O‘chirish' },
        { type: 'separator' },
        { role: 'selectAll', label: 'Barchasini tanlash' }
      ]
    },
    {
      label: 'Ko‘rinish',
      submenu: [
        { role: 'reload', label: 'Qayta yuklash' },
        { role: 'forceReload', label: 'Majburiy qayta yuklash' },
        { role: 'toggleDevTools', label: 'Dasturchi asboblari' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Asl masshtab' },
        { role: 'zoomIn', label: 'Kattalashtirish' },
        { role: 'zoomOut', label: 'Kichiklashtirish' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'To‘liq ekran' }
      ]
    }
  ];
  return Menu.buildFromTemplate(template);
}

function createMainWindow() {
  // Always register a complete Application Menu with Edit roles
  // so Win32 keyboard accelerator table and text editing are fully functional.
  const appMenu = buildAppMenu();
  Menu.setApplicationMenu(appMenu);

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'Restaurant POS',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0f1117',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // allow local file / image loading
    }
  });

  mainWindow.setMenuBarVisibility(false);

  const targetUrl = activeServerUrl || BACKEND_URL;
  const indexPath = findFrontendIndex();
  if (indexPath) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:4200');
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.__POS_SERVER_URL__ = '${targetUrl}';
      window.__POS_APP_MODE__ = '${currentAppMode}';
      try {
        localStorage.setItem('pos_server_url', '${targetUrl}');
        localStorage.setItem('pos_is_desktop', 'true');
        localStorage.setItem('pos_app_mode', '${currentAppMode}');
      } catch(e) {}
    `);
  });

  mainWindow.once('ready-to-show', () => {
    // Show and maximize main window first to capture OS foreground focus
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.focus();

    // Safely destroy splash window after main window has focus
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
  });

  // Ensure Chromium WebContents maintains focus when window is activated
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Guarantee developer shortcuts work seamlessly
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.control && input.key.toLowerCase() === 'r') {
      mainWindow.webContents.reload();
      event.preventDefault();
    }
  });

  // Intercept X button to hide to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray) {
        try {
          tray.displayBalloon({
            title: 'Restaurant POS',
            content: 'Dastur System Tray\'da ishlashda davom etmoqda. Server va mobil aloqa faol.',
            iconType: 'info'
          });
        } catch (e) {}
      }
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ============================================================
// Service & Process Management
// ============================================================

/**
 * Checks if a TCP port is open (listening)
 */
function checkTcpPort(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Ensures PostgreSQL is up and running on PG_PORT
 */
async function ensurePostgreSQL() {
  updateSplash(1, "1/3: Mahalliy ma'lumotlar bazasi tekshirilmoqda...");

  const isAlreadyListening = await checkTcpPort(PG_PORT);
  if (isAlreadyListening) {
    console.log(`PostgreSQL is already active on port ${PG_PORT}`);
    return true;
  }

  const pgBin = findPgBinDir();
  if (!pgBin) {
    console.warn('PostgreSQL binaries not found, assuming external/service database');
    return true;
  }

  const dataDir = path.join(APP_DATA, 'PostgreSQL', 'data');
  const pgCtl = path.join(pgBin, 'pg_ctl.exe');
  const initDb = path.join(pgBin, 'initdb.exe');
  const createdb = path.join(pgBin, 'createdb.exe');
  const logFile = path.join(APP_DATA, 'logs', 'postgresql.log');

  // 1. Initialize cluster if data directory is empty
  const pgVersionFile = path.join(dataDir, 'PG_VERSION');
  if (!fs.existsSync(pgVersionFile)) {
    console.log('Initializing new PostgreSQL cluster in:', dataDir);
    updateSplash(1, "PostgreSQL ma'lumotlar klasteri yaratilmoqda...");
    try {
      // Create cluster with user pos_user and trust auth for local loopback
      execSync(`"${initDb}" -D "${dataDir}" -U pos_user -E UTF8 --locale=C -A trust`, {
        windowsHide: true,
        stdio: 'pipe'
      });
    } catch (e) {
      console.error('initdb failed:', e.message);
    }
  }

  // 2. Start PostgreSQL via pg_ctl
  console.log(`Starting PostgreSQL on port ${PG_PORT}...`);
  updateSplash(1, "PostgreSQL xizmati ishga tushirilmoqda...");
  try {
    execSync(`"${pgCtl}" start -D "${dataDir}" -o "-p ${PG_PORT} -h 127.0.0.1" -l "${logFile}" -w -t 20`, {
      windowsHide: true,
      stdio: 'pipe'
    });
    startedPgLocally = true;
  } catch (e) {
    console.warn('pg_ctl start warning:', e.message);
  }

  // Wait for port to become active
  let attempts = 0;
  while (attempts < 20) {
    if (await checkTcpPort(PG_PORT)) {
      console.log(`PostgreSQL successfully listening on port ${PG_PORT}`);
      // Ensure 'pos' database exists
      try {
        execSync(`"${createdb}" -h 127.0.0.1 -p ${PG_PORT} -U pos_user pos`, {
          windowsHide: true,
          stdio: 'pipe'
        });
        console.log("Created 'pos' database");
      } catch (e) {
        // already exists or created
      }
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }

  throw new Error(`PostgreSQL ${PG_PORT}-portda ishga tushmadi.`);
}

/**
 * Starts Spring Boot API process and monitors health endpoint
 */
async function startSpringBoot() {
  updateSplash(2, "2/3: POS server ishga tushirilmoqda...");

  // Check if Spring Boot is already running
  if (await checkBackendHealth()) {
    console.log('Spring Boot backend is already running and healthy');
    return;
  }

  const javaBin = findJavaBinary();
  const jarPath = findBackendJar();

  if (!jarPath) {
    console.warn('Backend JAR not found. Will attempt to connect to existing API.');
    return;
  }

  console.log('Starting Spring Boot backend using:', javaBin);
  console.log('JAR:', jarPath);

  const configFile = path.join(APP_DATA, 'config', 'application.properties');
  const logFile = path.join(APP_DATA, 'logs', 'app.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const javaArgs = [
    '-Xms128m',
    '-Xmx512m',
    '-Dfile.encoding=UTF-8',
    '-Duser.timezone=Asia/Tashkent',
    `-Dspring.config.additional-location=file:${configFile}`,
    `-Dserver.port=${BACKEND_PORT}`,
    `-Dapp.upload.dir=${path.join(APP_DATA, 'uploads').replace(/\\/g, '/')}`,
    `-Dlogging.file.name=${path.join(APP_DATA, 'logs', 'app.log').replace(/\\/g, '/')}`,
    `-Dapp.backup.path=${path.join(APP_DATA, 'backups').replace(/\\/g, '/')}`,
    '-jar',
    jarPath
  ];

  backendProcess = spawn(javaBin, javaArgs, {
    cwd: path.dirname(jarPath),
    env: { ...process.env },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.pipe(logStream);
  backendProcess.stderr.pipe(logStream);

  backendProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.includes('Started RestaurantPosApplication')) {
      console.log('Spring Boot application startup banner detected');
    }
  });

  backendProcess.on('exit', (code) => {
    console.log('Spring Boot process exited with code:', code);
    backendProcess = null;
    backendReady = false;

    // Backend Crash Recovery: if server crashes unexpectedly and we are not quitting
    if (!isQuitting && currentAppMode === 'server') {
      const now = Date.now();
      if (now - lastCrashTime > 60000) {
        crashRestartCount = 0; // reset counter after 1 min of stable run
      }
      lastCrashTime = now;
      crashRestartCount++;

      if (crashRestartCount <= 5) {
        console.warn(`[Crash Recovery] Spring Boot server kutilmaganda to‘xtadi (code: ${code}). Qayta ishga tushirilmoqda (${crashRestartCount}/5)...`);
        setTimeout(async () => {
          try {
            await startSpringBoot();
            await waitForBackendReady();
            console.log('[Crash Recovery] Spring Boot server muvaffaqiyatli qayta tiklandi!');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('backend-recovered');
            }
            if (tray) {
              try {
                tray.displayBalloon({
                  title: 'Restaurant POS (Avtomatik Tiklash)',
                  content: 'Server avtomatik qayta ishga tushirildi va aloqa tiklandi.',
                  iconType: 'info'
                });
              } catch (e) {}
            }
          } catch (recErr) {
            console.error('[Crash Recovery] Qayta tiklash xatosi:', recErr);
          }
        }, 2000);
      } else {
        console.error('[Crash Recovery] Qisqa vaqt ichida juda ko‘p crash bo‘ldi. Avtomatik qayta ishga tushirish to‘xtatildi.');
      }
    }
  });
}

/**
 * Queries /actuator/health via HTTP GET
 */
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: 2000 }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(true);
            return;
          }
          const parsed = JSON.parse(rawData);
          resolve(parsed && parsed.status === 'UP');
        } catch {
          resolve(res.statusCode === 200);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Polls health endpoint until UP or timeout
 */
async function waitForBackendReady() {
  updateSplash(3, "3/3: Tizim sozlanmoqda va tekshirilmoqda...");
  const startTime = Date.now();

  while (Date.now() - startTime < STARTUP_TIMEOUT_MS) {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      backendReady = true;
      console.log('Backend health check passed: UP');
      updateSplash(4, "Tizim tayyor!");
      await new Promise(r => setTimeout(r, 600));
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  throw new Error("POS serveri belgilangan vaqt ichida ishga tushmadi. Iltimos, logs/app.log faylini tekshiring.");
}

/**
 * Manually restarts the Spring Boot backend
 */
async function restartBackendService() {
  console.log('[Backend] Restarting Spring Boot backend service...');
  try {
    if (backendProcess) {
      try { backendProcess.kill('SIGTERM'); } catch (e) {}
      backendProcess = null;
      backendReady = false;
    }
    await new Promise(r => setTimeout(r, 2000));
    await startSpringBoot();
    await waitForBackendReady();
    if (tray) {
      try {
        tray.displayBalloon({
          title: 'Restaurant POS',
          content: 'Spring Boot server muvaffaqiyatli qayta ishga tushirildi!',
          iconType: 'info'
        });
      } catch (e) {}
    }
    dialog.showMessageBox({
      type: 'info',
      title: 'Server Qayta Ishga Tushirildi',
      message: 'Spring Boot server muvaffaqiyatli qayta ishga tushirildi va LAN orqali ulanishga tayyor.',
      buttons: ['OK']
    });
  } catch (err) {
    dialog.showErrorBox('Server Qayta Ishga Tushirish Xatosi', err.message);
  }
}

/**
 * Creates and maintains the System Tray icon and menu
 */
function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    console.warn('[Tray] Failed to create Tray with icon.ico:', e.message);
    return;
  }

  const updateTrayMenu = async () => {
    const isHealthy = await checkBackendHealth();
    const ips = getLocalLanIps();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Restaurant POS Server',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Dasturni ochish',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.maximize();
            mainWindow.focus();
            mainWindow.webContents.focus();
          } else {
            createMainWindow();
          }
        }
      },
      {
        label: `Server holati: ${isHealthy ? 'Faol (Online)' : 'Aloqa yo‘q'}`,
        click: async () => {
          const healthy = await checkBackendHealth();
          const ipsList = getLocalLanIps();
          dialog.showMessageBox({
            type: 'info',
            title: 'POS Server Holati',
            message: `Server: ${healthy ? 'Faol (Online)' : 'Aloqa yo‘q'}\nPort: ${BACKEND_PORT}\nRejim: ${currentAppMode.toUpperCase()}\n\nLAN IP manzillar (Ofitsiantlar ulanishi uchun):\n${ipsList.map(ip => `  • http://${ip}:${BACKEND_PORT}`).join('\n') || 'Mavjud emas'}`,
            buttons: ['Tushunarli']
          });
        }
      },
      {
        label: 'Serverni qayta ishga tushirish',
        click: async () => {
          if (currentAppMode !== 'server') {
            dialog.showMessageBox({ type: 'info', title: 'Server', message: 'Client rejimida server qayta ishga tushirilmaydi.', buttons: ['OK'] });
            return;
          }
          const choice = dialog.showMessageBoxSync({
            type: 'question',
            title: 'Serverni qayta ishga tushirish',
            message: 'Haqiqatan ham Spring Boot serverini qayta ishga tushirmoqchimisiz?\n(Ofitsiantlar va KDS aloqasi bir necha soniyaga to‘xtashi mumkin)',
            buttons: ['Qayta ishga tushirish', 'Bekor qilish'],
            defaultId: 0,
            cancelId: 1
          });
          if (choice === 0) {
            await restartBackendService();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Dasturni butunlay yopish',
        click: () => {
          const choice = dialog.showMessageBoxSync({
            type: 'warning',
            title: 'Dasturni butunlay yopish',
            message: 'POS server to‘xtatiladi va LAN tarmog‘idagi ofitsiantlar, oshxona (KDS) serverga ulana olmay qoladi.\n\nDasturni butunlay yopishni tasdiqlaysizmi?',
            buttons: ['Ha, butunlay yopish', 'Bekor qilish'],
            defaultId: 1,
            cancelId: 1
          });
          if (choice === 0) {
            isQuitting = true;
            if (tray) {
              try { tray.destroy(); } catch (e) {}
              tray = null;
            }
            app.quit();
          }
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  };

  tray.setToolTip(`Restaurant POS Server (${currentAppMode === 'server' ? 'Port 8080' : 'Client'})`);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.focus();
        mainWindow.webContents.focus();
      }
    } else {
      createMainWindow();
    }
  });

  tray.on('right-click', () => {
    updateTrayMenu();
  });

  updateTrayMenu();
}

/**
 * Safely terminates backend and database on shutdown
 */
function stopProcesses() {
  console.log('Stopping POS application and child processes...');

  if (discoverySocket) {
    try {
      discoverySocket.close();
    } catch (e) {}
    discoverySocket = null;
  }

  if (backendProcess) {
    try {
      console.log('Killing Spring Boot backend process...');
      backendProcess.kill('SIGTERM');
    } catch (e) {
      console.error('Error stopping backend process:', e);
    }
    backendProcess = null;
  }

  if (startedPgLocally) {
    const pgBin = findPgBinDir();
    if (pgBin) {
      const dataDir = path.join(APP_DATA, 'PostgreSQL', 'data');
      const pgCtl = path.join(pgBin, 'pg_ctl.exe');
      try {
        console.log('Stopping local PostgreSQL cluster...');
        execSync(`"${pgCtl}" stop -D "${dataDir}" -m fast`, { windowsHide: true, stdio: 'ignore' });
      } catch (e) {
        console.warn('pg_ctl stop error:', e.message);
      }
    }
  }
}

// ============================================================
// LAN Auto-Discovery & Multi-Mode Functions
// ============================================================

function getLocalLanIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function getAppModeConfig() {
  // Check local app bundle folder first (installed app directory)
  const appDir = path.dirname(app.getPath('exe'));
  const localAppMode = path.join(appDir, 'app-mode.json');
  if (fs.existsSync(localAppMode)) {
    try {
      return JSON.parse(fs.readFileSync(localAppMode, 'utf-8'));
    } catch (e) {}
  }
  const resourcesAppMode = path.join(process.resourcesPath || '', 'app-mode.json');
  if (fs.existsSync(resourcesAppMode)) {
    try {
      return JSON.parse(fs.readFileSync(resourcesAppMode, 'utf-8'));
    } catch (e) {}
  }

  const modeFile = path.join(APP_DATA, 'config', 'app-mode.json');
  if (fs.existsSync(modeFile)) {
    try {
      return JSON.parse(fs.readFileSync(modeFile, 'utf-8'));
    } catch (e) {}
  }
  // Check CLI arguments
  if (process.argv.includes('--client')) {
    return { mode: 'client' };
  }
  if (process.argv.includes('--server')) {
    return { mode: 'server' };
  }
  // If backend JAR or JRE is missing, default to client mode
  const javaExe = findJavaBinary();
  const jarFile = findBackendJar();
  if (!jarFile || (javaExe === 'java' && app.isPackaged)) {
    return { mode: 'client' };
  }
  return { mode: 'server' };
}

function startDiscoveryResponder(httpPort = 8080) {
  try {
    discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    discoverySocket.on('message', (msg, rinfo) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.probe === 'RESTAURANT_POS_DISCOVER') {
          const ips = getLocalLanIps();
          const reply = JSON.stringify({
            service: 'RestaurantPOS-Server',
            version: app.getVersion(),
            ip: ips[0] || '127.0.0.1',
            allIps: ips,
            port: httpPort
          });
          discoverySocket.send(reply, rinfo.port, rinfo.address);
        }
      } catch (e) {}
    });

    discoverySocket.on('error', (err) => {
      console.warn('[Discovery] UDP socket error:', err.message);
    });

    discoverySocket.bind(DISCOVERY_PORT, () => {
      try {
        discoverySocket.setBroadcast(true);
      } catch (e) {}
      console.log(`[Discovery] UDP Server Discovery Responder listening on port ${DISCOVERY_PORT}`);
    });
  } catch (e) {
    console.warn('[Discovery] Failed to start UDP responder:', e.message);
  }
}

function discoverServerUdp(timeoutMs = 2500) {
  return new Promise((resolve) => {
    let client = null;
    let resolved = false;

    try {
      client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      client.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.service === 'RestaurantPOS-Server') {
            resolved = true;
            try { client.close(); } catch (e) {}
            resolve({
              ip: data.ip || rinfo.address,
              port: data.port || 8080,
              version: data.version,
              allIps: data.allIps
            });
          }
        } catch (e) {}
      });

      client.on('error', () => {
        if (!resolved) {
          try { client.close(); } catch (e) {}
          resolve(null);
        }
      });

      client.bind(0, () => {
        try {
          client.setBroadcast(true);
        } catch (e) {}
        const probe = Buffer.from(JSON.stringify({ probe: 'RESTAURANT_POS_DISCOVER' }));
        client.send(probe, 0, probe.length, DISCOVERY_PORT, '255.255.255.255');
      });

      setTimeout(() => {
        if (!resolved) {
          try { client.close(); } catch (e) {}
          resolve(null);
        }
      }, timeoutMs);
    } catch (err) {
      resolve(null);
    }
  });
}

function checkServerHealth(baseUrl, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const healthUrl = `${baseUrl.replace(/\/+$/, '')}/api/system/health`;
    const client = healthUrl.startsWith('https') ? https : http;
    const req = client.get(healthUrl, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startClientMode(savedConfig) {
  updateSplash(1, "1/2: LAN POS Server qidirilmoqda...");

  let targetUrl = savedConfig?.serverUrl;

  // 1. Try UDP Auto-Discovery first if targetUrl is not set or default localhost
  if (!targetUrl || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    console.log('[Client] Running UDP auto-discovery on LAN...');
    const discovered = await discoverServerUdp(2500);
    if (discovered && discovered.ip) {
      console.log('[Client] Server discovered via UDP:', discovered);
      targetUrl = `http://${discovered.ip}:${discovered.port || 8080}`;
      updateSplash(2, `Server topildi: ${discovered.ip}`);
    }
  }

  // 2. Test connectivity
  targetUrl = targetUrl || 'http://localhost:8080';
  activeServerUrl = targetUrl;

  updateSplash(2, `2/2: Serverga ulanilmoqda (${targetUrl})...`);
  const isHealthy = await checkServerHealth(targetUrl, 3000);
  if (isHealthy) {
    backendReady = true;
    updateSplash(3, "Serverga ulandi!");
    await new Promise(r => setTimeout(r, 500));
    createMainWindow();
    return;
  }

  // If not reachable, open window anyway so user can configure or see offline state
  backendReady = false;
  updateSplash(3, "Server javob bermadi. Sozlash oynasi ochilmoqda...");
  await new Promise(r => setTimeout(r, 600));
  createMainWindow();
}

// ============================================================
// IPC Handlers
// ============================================================
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-data-path', () => APP_DATA);
ipcMain.handle('is-backend-ready', () => backendReady);
ipcMain.handle('get-backend-url', () => activeServerUrl);
ipcMain.handle('get-server-mode', () => currentAppMode);

ipcMain.handle('get-lan-info', () => ({
  mode: currentAppMode,
  serverUrl: activeServerUrl,
  lanIps: getLocalLanIps(),
  port: BACKEND_PORT
}));

ipcMain.handle('discover-server', async () => {
  return discoverServerUdp(3000);
});

ipcMain.handle('save-server-config', (event, cfg) => {
  if (cfg && cfg.serverUrl) {
    activeServerUrl = cfg.serverUrl;
    const modeFile = path.join(APP_DATA, 'config', 'app-mode.json');
    try {
      fs.writeFileSync(modeFile, JSON.stringify({ mode: cfg.mode || currentAppMode, serverUrl: cfg.serverUrl }, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save app-mode.json:', e);
    }
  }
  return true;
});

ipcMain.handle('open-logs-folder', () => {
  shell.openPath(path.join(APP_DATA, 'logs'));
});

ipcMain.handle('open-backup-folder', () => {
  shell.openPath(path.join(APP_DATA, 'backups'));
});

ipcMain.handle('show-message-box', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('clear-all-storage', async () => {
  try {
    if (session && session.defaultSession) {
      await session.defaultSession.clearStorageData({
        storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
      });
      console.log('Explicit clear-all-storage executed successfully');
      return true;
    }
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
  return false;
});

// ============================================================
// Application Lifecycle
// ============================================================
app.whenReady().then(async () => {
  // If starting with Windows autostart/minimized, run silently into tray without splash
  if (!isAutostart) {
    createSplashWindow();
  }

  // Create System Tray icon immediately
  createTray();

  // Check for clean-install flag (placed by installer or reset request)
  const cleanFlag = path.join(APP_DATA, 'config', 'clean-install.flag');
  if (fs.existsSync(cleanFlag)) {
    console.log('Clean install flag detected! Purging all leftover Chromium storage, tokens and sessions...');
    try {
      if (session && session.defaultSession) {
        await session.defaultSession.clearStorageData({
          storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
        });
      }
      fs.unlinkSync(cleanFlag);
      console.log('Chromium storage completely purged for fresh clean start.');
    } catch (e) {
      console.error('Failed to purge storage on clean install flag:', e);
    }
  }

  const modeCfg = getAppModeConfig();
  currentAppMode = modeCfg.mode || 'server';

  try {
    if (currentAppMode === 'client') {
      console.log('=== RESTAURANT POS: RUNNING IN CLIENT MODE (NO POSTGRES, NO SPRING BOOT) ===');
      await startClientMode(modeCfg);
    } else {
      console.log('=== RESTAURANT POS: RUNNING IN SERVER MODE (CENTRAL POSTGRES + SPRING BOOT + LAN DISCOVERY) ===');
      // 1. Check and start PostgreSQL
      await ensurePostgreSQL();

      // 2. Start Spring Boot API
      await startSpringBoot();

      // 3. Start LAN UDP discovery responder
      startDiscoveryResponder(BACKEND_PORT);

      // 4. Wait for Health Check UP
      await waitForBackendReady();

      // 5. Open Main Window (or stay in tray if autostarted)
      if (isAutostart) {
        console.log('[Autostart] Dastur Windows bilan fonda ishga tushdi (System Tray).');
        if (tray) {
          try {
            tray.displayBalloon({
              title: 'Restaurant POS Server',
              content: 'POS server fonda muvaffaqiyatli ishga tushdi va LAN orqali ulanishga tayyor.',
              iconType: 'info'
            });
          } catch (e) {}
        }
      } else {
        createMainWindow();
      }
    }
  } catch (err) {
    console.error('Application startup error:', err);
    updateSplash(0, "Xatolik yuz berdi", err.message);
    dialog.showErrorBox('POS Ishga Tushish Xatosi', err.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // In system tray mode, do NOT terminate backend or app when windows close
  if (isQuitting) {
    stopProcesses();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopProcesses();
});
