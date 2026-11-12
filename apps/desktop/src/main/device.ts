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

export const createDeviceKeys = () => {
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
  const body = { public_key: keys.publicKey }
  const res = await api.post("/duckdesk-api/create-device", body)

  const result = await res.json()
  const deviceId = result.data

  const config: DeviceConfig = {
    deviceId,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))

  return config
}