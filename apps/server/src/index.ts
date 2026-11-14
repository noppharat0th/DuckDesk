import fastify from "fastify";
import 'dotenv/config'
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { createDeviceRoute } from "./routes/create-device.js";
import type { WebSocket } from "ws";

const server = fastify({ ignoreTrailingSlash: true })

await server.register(cors, { origin: '*' })
await server.register(websocket)
server.register(createDeviceRoute)

const connectedDevices = new Map<string, WebSocket>()

server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        let currentDeviceId: string | null = null

        socket.on("message", (raw) => {
            try {
                const message = JSON.parse(raw.toString())

                // 1. ลงทะเบียนเบอร์เครื่องตัวเอง
                if (message.type === 'register') {
                    currentDeviceId = message.deviceId
                    connectedDevices.set(message.deviceId, socket)
                    console.log(`✅ เครื่องออนไลน์: ${message.deviceId} (รวมออนไลน์: ${connectedDevices.size} เครื่อง)`)
                }

                // 2. ส่งสัญญาณต่อให้เครื่องเป้าหมาย
                if (message.type === 'signal') {
                    const targetSocket = connectedDevices.get(message.targetId)
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify({
                            type: 'signal',
                            fromId: currentDeviceId,
                            payload: message.payload
                        }))
                    } else {
                        socket.send(JSON.stringify({
                            type: 'error',
                            message: `เครื่องปลายทาง ${message.targetId} ไม่ออนไลน์`
                        }))
                    }
                }
            } catch (err) {
                console.error("Invalid message format:", err)
            }
        })

        socket.on("close", () => {
            if (currentDeviceId) {
                connectedDevices.delete(currentDeviceId)
                console.log(`🔌 เครื่องออฟไลน์: ${currentDeviceId} (เหลือ ${connectedDevices.size} เครื่อง)`)
            }
        })
    })
})

const start = async () => {
    try {
        const address = await server.listen({
            port: Number(process.env.PORT) || 8000,
            host: process.env.HOST || '0.0.0.0'
        })
        console.log(`🚀 Server รันสำเร็จแล้วที่: ${address}`)
    } catch (err) {
        console.error("❌ เริ่มต้น Server ไม่สำเร็จ:", err)
        process.exit(1)
    }
}

start()
