import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getMyDevice: () => ipcRenderer.invoke('get-my-device'),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  getScreenResolution: (): Promise<{ width: number; height: number }> =>
    ipcRenderer.invoke('get-screen-resolution'),
  remoteMouseMove: (data: { x: number; y: number }) =>
    ipcRenderer.invoke('remote-mouse-move', data),
  remoteMouseClick: (data: { button: 'left' | 'right' | 'middle'; double?: boolean }) =>
    ipcRenderer.invoke('remote-mouse-click', data),
  remoteMouseScroll: (data: { deltaY: number }) =>
    ipcRenderer.invoke('remote-mouse-scroll', data),
  remoteKeyPress: (data: { key: string; modifiers?: string[] }) =>
    ipcRenderer.invoke('remote-key-press', data),
  remoteTypeText: (data: { text: string }) =>
    ipcRenderer.invoke('remote-type-text', data),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
