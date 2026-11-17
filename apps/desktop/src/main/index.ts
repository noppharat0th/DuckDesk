import { app, shell, BrowserWindow, ipcMain, session, desktopCapturer, screen } from 'electron'
import { join } from 'path'
import fs from 'node:fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { windowChrome } from '../shared/window-chrome'
import { getOrCreateDevice } from './device'
import { getServerUrl, toWebSocketUrl } from './server-url'
import {
  disposeInputHelper,
  keyPress,
  mouseButton,
  mouseClick,
  mouseMove,
  mouseScroll,
  typeText
} from './input'

const LOG_PATH = join(app.getPath('userData'), 'duckdesk.log')

function log(message: string): void {
  try {
    fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    // Logging must never stop the app from starting.
  }
}

function resetLog(): void {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.writeFileSync(LOG_PATH, '')
    log(
      `DuckDesk ${app.getVersion()} starting · Electron ${process.versions.electron} · ${process.platform} ${process.arch}`
    )
  } catch {
    // Ignore a missing/read-only user data directory.
  }
}

resetLog()

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error.stack ?? error.message}`)
  console.error(error)
})

process.on('unhandledRejection', (reason) => {
  log(`unhandledRejection: ${String(reason)}`)
})

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workAreaSize
  const width = Math.min(1200, Math.max(480, workArea.width - 32))
  const height = Math.min(800, Math.max(400, workArea.height - 32))

  log(`createWindow · workArea=${workArea.width}x${workArea.height} · window=${width}x${height}`)

  // Let the renderer capture the screen without a picker dialog.
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer
      .getSources({ types: ['screen'] })
      .then((sources) => {
        if (sources && sources.length > 0) {
          callback({ video: sources[0] })
        } else {
          callback({})
        }
      })
      .catch((err) => {
        console.error('Error in setDisplayMediaRequestHandler:', err)
        callback({})
      })
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })

  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: Math.min(900, width),
    minHeight: Math.min(640, height),
    show: false,
    backgroundColor: '#f6f4ef',
    titleBarStyle: 'hidden' as const,
    titleBarOverlay: windowChrome,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const revealWindow = (source: string): void => {
    if (mainWindow.isDestroyed() || mainWindow.isVisible()) return
    log(`showWindow · ${source}`)
    mainWindow.show()
    mainWindow.focus()
  }

  // Some GPU/session combinations never emit ready-to-show. Never leave the
  // process running without a visible window.
  const fallbackReveal = setTimeout(() => revealWindow('fallback-timeout'), 2500)

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show')
    revealWindow('ready-to-show')
  })

  mainWindow.on('closed', () => {
    clearTimeout(fallbackReveal)
    log('window-closed')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    log('did-finish-load')
  })

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    log(`did-fail-load · ${code} ${description} · ${url}`)
    revealWindow('did-fail-load')
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log(`render-process-gone · reason=${details.reason} · exitCode=${details.exitCode}`)
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
    log(`loadURL · ${process.env['ELECTRON_RENDERER_URL']}`)
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch((error) => {
      log(`loadURL failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  } else {
    const rendererPath = join(__dirname, '../renderer/index.html')
    log(`loadFile · ${rendererPath}`)
    mainWindow.loadFile(rendererPath).catch((error) => {
      log(`loadFile failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }
}

app
  .whenReady()
  .then(() => {
    log('app-ready')
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

    ipcMain.handle('get-screen-resolution', () => {
      const primary = screen.getPrimaryDisplay()
      return { width: primary.size.width, height: primary.size.height }
    })

    ipcMain.handle('get-server-config', () => {
      const baseUrl = getServerUrl()
      return { baseUrl, wsUrl: toWebSocketUrl(baseUrl) }
    })

    // Input injection (Windows SendInput via the native helper).
    ipcMain.handle('remote-mouse-move', (_event, data: { x: number; y: number }) => {
      if (Number.isFinite(data?.x) && Number.isFinite(data?.y)) mouseMove(data.x, data.y)
    })

    ipcMain.handle(
      'remote-mouse-click',
      (
        _event,
        data: {
          button: 'left' | 'right' | 'middle'
          double?: boolean
          action?: 'click' | 'down' | 'up'
        }
      ) => {
        if (!data?.button) return
        if (data.action === 'down') mouseButton(data.button, true)
        else if (data.action === 'up') mouseButton(data.button, false)
        else mouseClick(data.button, Boolean(data.double))
      }
    )

    ipcMain.handle('remote-mouse-scroll', (_event, data: { deltaY: number }) => {
      if (Number.isFinite(data?.deltaY)) mouseScroll(data.deltaY)
    })

    ipcMain.handle('remote-key-press', (_event, data: { key: string; modifiers?: string[] }) => {
      if (typeof data?.key !== 'string') return
      keyPress(data.key, Array.isArray(data.modifiers) ? data.modifiers : [])
    })

    ipcMain.handle('remote-type-text', (_event, data: { text: string }) => {
      if (typeof data?.text === 'string') typeText(data.text)
    })

    createWindow()
  })
  .catch((error) => {
    log(`whenReady error: ${error instanceof Error ? error.stack : String(error)}`)
    console.error(error)
  })

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  log('window-all-closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  disposeInputHelper()
  log('before-quit')
})
