import fastify from "fastify";
import 'dotenv/config'
import { createDeviceRoute } from "./routes/create-device.js";
import websocket from "@fastify/websocket";

const server = fastify()

await server.register(websocket)
server.register(createDeviceRoute)
// server.register(async function (fastify) {
//     fastify.get('/ws', { websocket: true }, (socket, req) => {
//         socket.on("message", (msg) => {
//             console.log("ได้รับข้อความ" + msg)
//         })
//     })
// })

const start = async () => {
    server.listen({
        port: Number(process.env.PORT),
        host: process.env.HOST
    })
    console.log("start server")
}


start()