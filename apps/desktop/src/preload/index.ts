import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface DeviceConfig {
  deviceId: string
  publicKey: string
  privateKey: string
}

const api = {
  getMyDevice: (): Promise<DeviceConfig> => ipcRenderer.invoke('get-my-device'),
  getScreenSources: (): Promise<Array<{ id: string; name: string }>> =>
    ipcRenderer.invoke('get-screen-sources'),
  getScreenResolution: (): Promise<{ width: number; height: number }> =>
    ipcRenderer.invoke('get-screen-resolution'),
  remoteMouseMove: (data: { x: number; y: number }): Promise<void> =>
    ipcRenderer.invoke('remote-mouse-move', data),
  remoteMouseClick: (data: {
    button: 'left' | 'right' | 'middle'
    double?: boolean
  }): Promise<void> => ipcRenderer.invoke('remote-mouse-click', data),
  remoteMouseScroll: (data: { deltaY: number }): Promise<void> =>
    ipcRenderer.invoke('remote-mouse-scroll', data),
  remoteKeyPress: (data: { key: string; modifiers?: string[] }): Promise<void> =>
    ipcRenderer.invoke('remote-key-press', data),
  remoteTypeText: (data: { text: string }): Promise<void> =>
    ipcRenderer.invoke('remote-type-text', data)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  const globalWindow = window as unknown as {
    electron: typeof electronAPI
    api: typeof api
  }

  globalWindow.electron = electronAPI
  globalWindow.api = api
}
