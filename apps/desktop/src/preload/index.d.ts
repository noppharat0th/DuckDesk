import { ElectronAPI } from '@electron-toolkit/preload'

interface DeviceConfig {
  deviceId: string
  publicKey: string
  privateKey: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getMyDevice: () => Promise<DeviceConfig>
      getScreenSources: () => Promise<Array<{ id: string; name: string }>>
      getScreenResolution: () => Promise<{ width: number; height: number }>
      getServerConfig: () => Promise<{ baseUrl: string; wsUrl: string }>
      remoteMouseMove: (data: { x: number; y: number }) => Promise<void>
      remoteMouseClick: (data: {
        button: 'left' | 'right' | 'middle'
        double?: boolean
        action?: 'click' | 'down' | 'up'
      }) => Promise<void>
      remoteMouseScroll: (data: { deltaY: number }) => Promise<void>
      remoteKeyPress: (data: { key: string; modifiers?: string[] }) => Promise<void>
      remoteTypeText: (data: { text: string }) => Promise<void>
    }
  }
}
