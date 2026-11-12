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
    }
  }
}
