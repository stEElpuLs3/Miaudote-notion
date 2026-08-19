const request = require('supertest')
const app = require('../server.cjs')

describe('GET /api/health', () => {
    it('responde 200 com status ok', async () => {
        const res = await request(app).get('/api/health')

        expect(res.statusCode).toBe(200)
        expect(res.body.status).toBe('ok')
    })

    it('informa o estado da conexão com o banco', async () => {
        const res = await request(app).get('/api/health')

        // O health check lê mongoose.connection.readyState, e o setup.js
        // conectou essa mesma instância no banco em memória.
        expect(res.body.banco).toBe('conectado')
    })
})