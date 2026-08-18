const request = require('supertest')
const app = require('../server.cjs')
const User = require('../models/User')

const usuarioValido = {
    nome: 'Teste Silva',
    email: 'teste@exemplo.com',
    senha: 'SenhaForte123',
}

// Cria o usuario pelo endpoint real para que a senha passe pelo mesmo
// bcrypt.hash(senha, 10) usado em producao. Criar direto no model com
// senha em texto puro faria o bcrypt.compare falhar sempre.
async function criarUsuarioConfirmado() {
    const res = await request(app).post('/api/usuarios/register').send(usuarioValido)

    if (res.statusCode !== 201) {
        throw new Error(
            `Falha ao preparar usuario: ${res.statusCode} ${JSON.stringify(res.body)}`
        )
    }

    await User.updateOne(
        { email: usuarioValido.email },
        { $set: { emailConfirmado: true } }
    )
}

describe('POST /api/usuarios/register', () => {
    it('cria a conta e responde 201 sem devolver token', async () => {
        const res = await request(app)
            .post('/api/usuarios/register')
            .send(usuarioValido)

        expect(res.statusCode).toBe(201)
        // O cadastro nao autentica: o usuario precisa confirmar o e-mail.
        expect(res.body).not.toHaveProperty('token')
    })

    it('recusa senha com menos de 6 caracteres', async () => {
        const res = await request(app)
            .post('/api/usuarios/register')
            .send({ nome: 'Curta', email: 'curta@exemplo.com', senha: '123' })

        expect(res.statusCode).toBe(400)
    })

    it('recusa e-mail já cadastrado', async () => {
        await request(app).post('/api/usuarios/register').send(usuarioValido)

        const res = await request(app)
            .post('/api/usuarios/register')
            .send(usuarioValido)

        expect(res.statusCode).toBe(400)
    })

    it('nunca guarda a senha em texto puro', async () => {
        await request(app).post('/api/usuarios/register').send(usuarioValido)

        const noBanco = await User.findOne({ email: usuarioValido.email }).select('+senha')

        expect(noBanco.senha).not.toBe(usuarioValido.senha)
        // Hash de bcrypt sempre comeca com $2a$, $2b$ ou $2y$.
        expect(noBanco.senha).toMatch(/^\$2[aby]\$/)
    })
})

describe('POST /api/usuarios/login', () => {
    it('autentica com credenciais corretas e devolve token', async () => {
        await criarUsuarioConfirmado()

        const res = await request(app)
            .post('/api/usuarios/login')
            .send({ email: usuarioValido.email, senha: usuarioValido.senha })

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('token')
        expect(res.body.user.email).toBe(usuarioValido.email)
        expect(res.body.user.emailConfirmado).toBe(true)
    })

    it('devolve o id do usuário sob a chave `id`', async () => {
        // Regressao do bug que apareceu em 5 arquivos: a API devolve `id`
        // e o frontend guarda como `_id` no localStorage.
        await criarUsuarioConfirmado()

        const res = await request(app)
            .post('/api/usuarios/login')
            .send({ email: usuarioValido.email, senha: usuarioValido.senha })

        expect(res.body.user.id).toBeDefined()
        expect(String(res.body.user.id)).toMatch(/^[a-f\d]{24}$/i)
    })

    it('rejeita senha incorreta', async () => {
        await criarUsuarioConfirmado()

        const res = await request(app)
            .post('/api/usuarios/login')
            .send({ email: usuarioValido.email, senha: 'SenhaErrada999' })

        expect(res.statusCode).toBe(401)
        expect(res.body).not.toHaveProperty('token')
    })

    it('não revela se o e-mail existe na base', async () => {
        const inexistente = await request(app)
            .post('/api/usuarios/login')
            .send({ email: 'naoexiste@exemplo.com', senha: 'QualquerCoisa1' })

        await criarUsuarioConfirmado()
        const senhaErrada = await request(app)
            .post('/api/usuarios/login')
            .send({ email: usuarioValido.email, senha: 'SenhaErrada999' })

        // Enumeracao de usuarios: as duas respostas precisam ser
        // indistinguiveis, no status e na mensagem.
        expect(inexistente.statusCode).toBe(401)
        expect(inexistente.statusCode).toBe(senhaErrada.statusCode)
        expect(inexistente.body.message).toBe(senhaErrada.body.message)
    })

    it('exige e-mail e senha no corpo', async () => {
        const res = await request(app).post('/api/usuarios/login').send({})

        expect(res.statusCode).toBe(400)
    })

    it('nunca devolve o hash da senha na resposta', async () => {
        await criarUsuarioConfirmado()

        const res = await request(app)
            .post('/api/usuarios/login')
            .send({ email: usuarioValido.email, senha: usuarioValido.senha })

        expect(JSON.stringify(res.body)).not.toContain('$2')
        expect(res.body.user.senha).toBeUndefined()
    })
})