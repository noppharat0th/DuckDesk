import { db } from "../config/db.js"
import { randomInt } from "node:crypto"

export const createDeviceId = async (publicKey: string) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const deviceId = String(randomInt(100_000_000, 1_000_000_000))

    try {
      const { rows } = await db.query<{ device_id: string }>(
        `INSERT INTO devices (device_id, public_key)
         VALUES ($1, $2)
         ON CONFLICT (public_key)
         DO UPDATE SET public_key = EXCLUDED.public_key
         RETURNING device_id`,
        [deviceId, publicKey]
      )

      return {
        message: "success",
        data: rows[0].device_id
      }
    } catch (error) {
      const pgError = error as { code?: string; constraint?: string }

      if (pgError.code === '23505' && pgError.constraint === 'devices_pkey') {
        continue
      }

      throw error
    }
  }

  throw new Error('error create device id')
}