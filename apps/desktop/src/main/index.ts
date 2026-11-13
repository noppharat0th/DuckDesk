import { app, shell, BrowserWindow, ipcMain, session, desktopCapturer, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { windowChrome } from '../shared/window-chrome'
import { getOrCreateDevice } from './device'
// import { mouseMove, mouseClick, mouseScroll, keyPress, typeText } from './input'



function createWindow(): void {
  // เปิดสิทธิ์ให้ Renderer ใช้ navigator.mediaDevices.getDisplayMedia ดึงหน้าจอได้ทันที
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources && sources.length > 0) {
        callback({ video: sources[0] })
      } else {
        callback({})
      }
    }).catch((err) => {
      console.error('Error in setDisplayMediaRequestHandler:', err)
      callback({})
    })
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })

  const mainWindow = new BrowserWindow({
    width: 1060,
    height: 700,
    minWidth: 820,
    minHeight: 580,
    show: false,
    backgroundColor: '#f0f0f0',
    titleBarStyle: 'hidden' as const,
    titleBarOverlay: windowChrome,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-my-device', async () => {
    return await getOrCreateDevice()
  })

  ipcMain.handle('get-screen-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    return sources.map((s) => ({ id: s.id, name: s.name }))
  })

  // ---- Remote Control IPC Handlers ----

  ipcMain.handle('get-screen-resolution', () => {
    const primary = screen.getPrimaryDisplay()
    return { width: primary.size.width, height: primary.size.height }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
