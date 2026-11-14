import { app } from 'electron'
import { generateKeyPairSync } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { api } from './api'

const CONFIG_PATH = path.join(app.getPath('userData'), 'device.json')

export interface DeviceConfig {
  deviceId: string
  publicKey: string
  privateKey: string
}

interface DeviceKeyPair {
  publicKey: string
  privateKey: string
}

interface CreateDeviceResponse {
  data: string
}

export const createDeviceKeys = (): DeviceKeyPair => {
  return generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
}

export const getOrCreateDevice = async (): Promise<DeviceConfig> => {
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as DeviceConfig
  }

  const keys = createDeviceKeys()
  const response = await api.post('/duckdesk-api/create-device', {
    public_key: keys.publicKey
  })
  const result = (await response.json()) as CreateDeviceResponse

  if (typeof result.data !== 'string' || result.data.length === 0) {
    throw new Error('The DuckDesk server did not return a valid device ID.')
  }

  const config: DeviceConfig = {
    deviceId: result.data,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
  return config
}
