import fastify from "fastify";
import 'dotenv/config'

const server = fastify()

server.get('/test', async() => ({
    status: 'ok'
}))

server.listen({
    port: Number(process.env.PORT),
    host: process.env.HOST
})