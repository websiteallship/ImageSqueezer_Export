import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { registerIpcHandlers } from './ipc-handlers'
import { getSetting, setSetting } from './store'

let mainWindow: BrowserWindow | null = null

function createMainWindow(): BrowserWindow {
  const bounds = getSetting('windowBounds')

  const win = new BrowserWindow({
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      // ── SECURITY DEFAULTS (mandatory — never change) ──
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // Block navigation outside the app
  win.webContents.on('will-navigate', (event, url) => {
    const isDevUrl = url.startsWith('http://localhost')
    const isFileUrl = url.startsWith('file://')
    if (!isDevUrl && !isFileUrl) {
      event.preventDefault()
    }
  })

  // Open external links in browser, block new Electron windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Load renderer
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.on('ready-to-show', () => {
    win.show()
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // Persist window bounds on close
  win.on('close', () => {
    if (win && !win.isDestroyed()) {
      setSetting('windowBounds', win.getBounds() as { x: number; y: number; width: number; height: number })
    }
  })

  return win
}

app.whenReady().then(() => {
  mainWindow = createMainWindow()
  registerIpcHandlers(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Block webview creation (extra hardening)
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })
})
