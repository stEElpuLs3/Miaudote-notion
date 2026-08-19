const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer

// Variáveis que o app espera existir. Nunca reutilizar segredo de produção.
// MONGODB_URI fica DE FORA de propósito: sem ela o server.cjs não conecta no Atlas.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste-nao-usar-em-producao'
process.env.JWT_EXPIRES_IN = '7d'
process.env.NODE_ENV = 'test'

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

// A trava de host é o freio de mão: se a conexão não for local, aborta
// em vez de apagar coleções de um banco real.
afterEach(async () => {
    const host = mongoose.connection.host || ''
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
        throw new Error(
            `ABORTADO: a conexão de teste aponta para "${host}", não para o banco em memória.`
        )
    }

    const collections = await mongoose.connection.db.collections()
    for (const collection of collections) {
        await collection.deleteMany({})
    }
})

afterAll(async () => {
    await mongoose.disconnect()
    if (mongoServer) await mongoServer.stop()
})