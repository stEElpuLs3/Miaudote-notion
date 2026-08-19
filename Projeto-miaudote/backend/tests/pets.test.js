const request = require('supertest')
const app = require('../server.cjs')
const User = require('../models/User')
const Pet = require('../models/Pet')

// Praça Osório, Curitiba. Coordenadas reais para o $near ter sentido.
const CURITIBA = { lat: -25.4284, lng: -49.2733 }

// O indice 2dsphere e' criado de forma assincrona pelo Mongoose. Sem esperar
// por ele, o primeiro $near pode falhar por indice inexistente — e a falha
// seria de infraestrutura de teste, nao do codigo.
beforeAll(async () => {
    await Pet.init()
})

async function criarUsuario(email) {
    const senha = 'SenhaForte123'

    const registro = await request(app)
        .post('/api/usuarios/register')
        .send({ nome: 'Tutor Teste', telefone: '41999998888', email, senha })

    if (registro.statusCode !== 201) {
        throw new Error(`Falha ao criar usuario: ${registro.statusCode} ${JSON.stringify(registro.body)}`)
    }

    await User.updateOne({ email }, { $set: { emailConfirmado: true } })

    const login = await request(app).post('/api/usuarios/login').send({ email, senha })

    if (login.statusCode !== 200) {
        throw new Error(`Falha ao autenticar: ${login.statusCode} ${JSON.stringify(login.body)}`)
    }

    return { id: login.body.user.id, token: login.body.token }
}

// Cria o pet direto pelo model: a rota POST exige multipart com imagens,
// e o objetivo aqui e' testar leitura e permissao, nao upload.
async function criarPet(userId, coordinates = [CURITIBA.lng, CURITIBA.lat]) {
    return Pet.create({
        nome: 'Rex',
        especie: 'cachorro',
        raca: 'SRD',
        idade: 3,
        descricao: 'Docil e brincalhao',
        user: userId,
        endereco: {
            cep: '80020-030',
            rua: 'Rua XV de Novembro',
            numero: '100',
            bairro: 'Centro',
            cidade: 'Curitiba',
            estado: 'PR',
        },
        localizacao: { type: 'Point', coordinates },
        status: 'disponivel',
    })
}

describe('GET /api/pets/proximidade', () => {
    it('exige as coordenadas', async () => {
        const res = await request(app).get('/api/pets/proximidade').query({ raio: 10 })

        expect(res.statusCode).toBe(400)
    })

    it('encontra um pet proximo e devolve a distancia calculada', async () => {
        const tutor = await criarUsuario('tutor@exemplo.com')
        await criarPet(tutor.id)

        const res = await request(app)
            .get('/api/pets/proximidade')
            .query({ lat: CURITIBA.lat, lng: CURITIBA.lng, raio: 10 })

        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].nome).toBe('Rex')
        expect(typeof res.body[0].distancia).toBe('number')
    })

    it('nao traz pet fora do raio pedido', async () => {
        const tutor = await criarUsuario('tutor@exemplo.com')
        // Sao Paulo: cerca de 340 km de Curitiba, fora de qualquer raio valido.
        await criarPet(tutor.id, [-46.6333, -23.5505])

        const res = await request(app)
            .get('/api/pets/proximidade')
            .query({ lat: CURITIBA.lat, lng: CURITIBA.lng, raio: 10 })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(0)
    })

    it('limita o raio em vez de recusar valor absurdo', async () => {
        // Codigo real: Math.min(Math.max(parseFloat(raio) || 10, 1), 100).
        // O raio e' saneado, nao rejeitado: 999999 vira 100 km.
        const res = await request(app)
            .get('/api/pets/proximidade')
            .query({ lat: CURITIBA.lat, lng: CURITIBA.lng, raio: 999999 })

        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    it('trata raio nao numerico usando o padrao', async () => {
        const res = await request(app)
            .get('/api/pets/proximidade')
            .query({ lat: CURITIBA.lat, lng: CURITIBA.lng, raio: 'muito longe' })

        expect(res.statusCode).toBe(200)
    })
})

describe('GET /api/pets — protecao de dados pessoais', () => {
    it('nao expoe telefone nem e-mail do tutor para visitante nao autenticado', async () => {
        const tutor = await criarUsuario('tutor@exemplo.com')
        await criarPet(tutor.id)

        const res = await request(app).get('/api/pets')
        const corpo = JSON.stringify(res.body)

        expect(res.statusCode).toBe(200)
        expect(corpo).not.toContain('tutor@exemplo.com')
        expect(corpo).not.toContain('41999998888')
        // O nome continua visivel: navegar e' livre, contatar exige conta.
        expect(res.body[0].user.nome).toBe('Tutor Teste')
    })

    it('libera o contato do tutor para usuario autenticado', async () => {
        const tutor = await criarUsuario('tutor@exemplo.com')
        await criarPet(tutor.id)

        const res = await request(app)
            .get('/api/pets')
            .set('Authorization', `Bearer ${tutor.token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body[0].user.email).toBe('tutor@exemplo.com')
        expect(res.body[0].user.telefone).toBe('41999998888')
    })

    it('nunca devolve rua e numero do endereco na listagem', async () => {
        // O schema marca esses dois campos como select: false. Cidade e bairro
        // bastam para a busca; rua e numero identificariam a casa do tutor.
        const tutor = await criarUsuario('tutor@exemplo.com')
        await criarPet(tutor.id)

        const res = await request(app).get('/api/pets')

        expect(res.body[0].endereco.cidade).toBe('Curitiba')
        expect(res.body[0].endereco.rua).toBeUndefined()
        expect(res.body[0].endereco.numero).toBeUndefined()
    })
})

describe('Permissao de dono nos pets', () => {
    it('impede que outro usuario apague um pet alheio', async () => {
        const dono = await criarUsuario('dono@exemplo.com')
        const invasor = await criarUsuario('invasor@exemplo.com')
        const pet = await criarPet(dono.id)

        const res = await request(app)
            .delete(`/api/pets/${pet._id}`)
            .set('Authorization', `Bearer ${invasor.token}`)

        expect(res.statusCode).toBe(403)
        // O pet precisa continuar existindo depois da tentativa.
        expect(await Pet.findById(pet._id)).not.toBeNull()
    })

    it('impede que outro usuario edite um pet alheio', async () => {
        const dono = await criarUsuario('dono@exemplo.com')
        const invasor = await criarUsuario('invasor@exemplo.com')
        const pet = await criarPet(dono.id)

        const res = await request(app)
            .put(`/api/pets/${pet._id}`)
            .set('Authorization', `Bearer ${invasor.token}`)
            .send({ nome: 'Sequestrado' })

        expect(res.statusCode).toBe(403)
        expect((await Pet.findById(pet._id)).nome).toBe('Rex')
    })

    it('permite que o dono apague o proprio pet', async () => {
        const dono = await criarUsuario('dono@exemplo.com')
        const pet = await criarPet(dono.id)

        const res = await request(app)
            .delete(`/api/pets/${pet._id}`)
            .set('Authorization', `Bearer ${dono.token}`)

        expect(res.statusCode).toBe(200)
        expect(await Pet.findById(pet._id)).toBeNull()
    })

    it('exige autenticacao para apagar', async () => {
        const dono = await criarUsuario('dono@exemplo.com')
        const pet = await criarPet(dono.id)

        const res = await request(app).delete(`/api/pets/${pet._id}`)

        expect(res.statusCode).toBe(401)
    })
})