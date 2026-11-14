import type { FastifyPluginAsync } from 'fastify'
import { createDeviceId } from '../core/device.js'

export const createDeviceRoute: FastifyPluginAsync = async(server) => {
    server.post<{ Body: {public_key: string}}>('/duckdesk-api/create-device', async(request, reply) => {
        const publicKey = request.body.public_key

        const device_id = await createDeviceId(publicKey)
        return device_id
    })
}   