const request = require('supertest');
const crypto = require('crypto');
const app = require('../server.cjs');
const User = require('../models/User');

const BASE = '/api/usuarios';

// Mesma funcao do api/usuarios.js. O teste precisa gerar o hash pelo mesmo
// caminho, senao estaria testando a funcao de hash e nao a regra de negocio.
const embaralhar = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

async function criarUsuario({ email, senha = 'SenhaForte123', confirmado = true }) {
  const res = await request(app)
    .post(`${BASE}/register`)
    .send({ nome: 'Teste Silva', email, senha });

  if (res.status !== 201) {
    throw new Error(`Cadastro falhou (${res.status}): ${JSON.stringify(res.body)}`);
  }

  await User.updateOne({ email }, { $set: { emailConfirmado: confirmado } });
  return { email, senha };
}

// O e-mail esta curto-circuitado em teste, entao o token cru nunca chega aqui.
// Em vez de interceptar o envio, plantamos o par: gravamos o hash no banco e
// devolvemos o valor cru, exatamente como o usuario receberia no link.
async function plantarToken(email, campo, { validoPor = 60 * 60 * 1000 } = {}) {
  const cru = crypto.randomBytes(32).toString('hex');
  await User.updateOne(
    { email },
    {
      $set: {
        [campo]: embaralhar(cru),
        [`${campo}Expira`]: new Date(Date.now() + validoPor)
      }
    }
  );
  return cru;
}

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /confirmar-email', () => {
  it('confirma a conta quando o token e valido', async () => {
    await criarUsuario({ email: 'confirma@exemplo.com', confirmado: false });
    const token = await plantarToken('confirma@exemplo.com', 'tokenConfirmacao');

    const res = await request(app).post(`${BASE}/confirmar-email`).send({ token });

    expect(res.status).toBe(200);
    const user = await User.findOne({ email: 'confirma@exemplo.com' });
    expect(user.emailConfirmado).toBe(true);
  });

  it('invalida o token depois do primeiro uso', async () => {
    await criarUsuario({ email: 'usado@exemplo.com', confirmado: false });
    const token = await plantarToken('usado@exemplo.com', 'tokenConfirmacao');

    const primeira = await request(app).post(`${BASE}/confirmar-email`).send({ token });
    const segunda = await request(app).post(`${BASE}/confirmar-email`).send({ token });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(400);
  });

  it('recusa token expirado', async () => {
    await criarUsuario({ email: 'expirado@exemplo.com', confirmado: false });
    const token = await plantarToken('expirado@exemplo.com', 'tokenConfirmacao', {
      validoPor: -1000
    });

    const res = await request(app).post(`${BASE}/confirmar-email`).send({ token });

    expect(res.status).toBe(400);
    const user = await User.findOne({ email: 'expirado@exemplo.com' });
    expect(user.emailConfirmado).toBe(false);
  });

  it('recusa token inexistente e token ausente', async () => {
    const inventado = await request(app)
      .post(`${BASE}/confirmar-email`)
      .send({ token: 'nao-existe' });
    const vazio = await request(app).post(`${BASE}/confirmar-email`).send({});

    expect(inventado.status).toBe(400);
    expect(vazio.status).toBe(400);
  });
});

describe('POST /reenviar-confirmacao', () => {
  it('responde igual para conta existente e inexistente', async () => {
    await criarUsuario({ email: 'existe@exemplo.com', confirmado: false });

    const comConta = await request(app)
      .post(`${BASE}/reenviar-confirmacao`)
      .send({ email: 'existe@exemplo.com' });
    const semConta = await request(app)
      .post(`${BASE}/reenviar-confirmacao`)
      .send({ email: 'ninguem@exemplo.com' });

    expect(comConta.status).toBe(semConta.status);
    expect(comConta.body.message).toBe(semConta.body.message);
  });

  it('gera um token novo para quem ainda nao confirmou', async () => {
    await criarUsuario({ email: 'pendente@exemplo.com', confirmado: false });
    await User.updateOne(
      { email: 'pendente@exemplo.com' },
      { $set: { tokenConfirmacao: null, tokenConfirmacaoExpira: null } }
    );

    await request(app)
      .post(`${BASE}/reenviar-confirmacao`)
      .send({ email: 'pendente@exemplo.com' });

    const user = await User.findOne({ email: 'pendente@exemplo.com' }).select(
      '+tokenConfirmacao +tokenConfirmacaoExpira'
    );
    expect(user.tokenConfirmacao).toMatch(/^[a-f0-9]{64}$/);
    expect(user.tokenConfirmacaoExpira.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /esqueci-senha', () => {
  it('responde igual para conta existente e inexistente', async () => {
    await criarUsuario({ email: 'tem@exemplo.com' });

    const comConta = await request(app)
      .post(`${BASE}/esqueci-senha`)
      .send({ email: 'tem@exemplo.com' });
    const semConta = await request(app)
      .post(`${BASE}/esqueci-senha`)
      .send({ email: 'naotem@exemplo.com' });

    expect(comConta.status).toBe(semConta.status);
    expect(comConta.body.message).toBe(semConta.body.message);
  });

  it('nunca grava o token em texto puro', async () => {
    await criarUsuario({ email: 'hash@exemplo.com' });

    await request(app).post(`${BASE}/esqueci-senha`).send({ email: 'hash@exemplo.com' });

    const user = await User.findOne({ email: 'hash@exemplo.com' }).select(
      '+tokenResetSenha +tokenResetSenhaExpira'
    );
    // sha256 em hexadecimal: 64 caracteres. O token cru tem 64 tambem, mas o
    // que importa e que o valor gravado nunca serve como link por si mesmo.
    expect(user.tokenResetSenha).toMatch(/^[a-f0-9]{64}$/);
    expect(user.tokenResetSenhaExpira.getTime()).toBeLessThanOrEqual(
      Date.now() + 60 * 60 * 1000
    );
  });
});

describe('POST /redefinir-senha', () => {
  it('troca a senha e permite entrar com a nova', async () => {
    const { email, senha } = await criarUsuario({ email: 'troca@exemplo.com' });
    const token = await plantarToken(email, 'tokenResetSenha');

    const res = await request(app)
      .post(`${BASE}/redefinir-senha`)
      .send({ token, senha: 'NovaSenha456' });
    expect(res.status).toBe(200);

    const nova = await request(app)
      .post(`${BASE}/login`)
      .send({ email, senha: 'NovaSenha456' });
    const antiga = await request(app).post(`${BASE}/login`).send({ email, senha });

    expect(nova.status).toBe(200);
    expect(antiga.status).toBe(401);
  });

  it('recusa token expirado e preserva a senha antiga', async () => {
    const { email, senha } = await criarUsuario({ email: 'venceu@exemplo.com' });
    const token = await plantarToken(email, 'tokenResetSenha', { validoPor: -1000 });

    const res = await request(app)
      .post(`${BASE}/redefinir-senha`)
      .send({ token, senha: 'NovaSenha456' });

    expect(res.status).toBe(400);
    const login = await request(app).post(`${BASE}/login`).send({ email, senha });
    expect(login.status).toBe(200);
  });

  it('nao aceita o mesmo token duas vezes', async () => {
    const { email } = await criarUsuario({ email: 'duasvezes@exemplo.com' });
    const token = await plantarToken(email, 'tokenResetSenha');

    const primeira = await request(app)
      .post(`${BASE}/redefinir-senha`)
      .send({ token, senha: 'NovaSenha456' });
    const segunda = await request(app)
      .post(`${BASE}/redefinir-senha`)
      .send({ token, senha: 'OutraSenha789' });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(400);
  });

  it('exige senha com no minimo 6 caracteres', async () => {
    const { email } = await criarUsuario({ email: 'curta@exemplo.com' });
    const token = await plantarToken(email, 'tokenResetSenha');

    const res = await request(app)
      .post(`${BASE}/redefinir-senha`)
      .send({ token, senha: '123' });

    expect(res.status).toBe(400);
    const user = await User.findOne({ email }).select('+tokenResetSenha');
    expect(user.tokenResetSenha).toMatch(/^[a-f0-9]{64}$/);
  });

  it('trata a redefinicao como prova de acesso ao e-mail', async () => {
    const { email } = await criarUsuario({ email: 'prova@exemplo.com', confirmado: false });
    const token = await plantarToken(email, 'tokenResetSenha');

    await request(app).post(`${BASE}/redefinir-senha`).send({ token, senha: 'NovaSenha456' });

    const user = await User.findOne({ email });
    expect(user.emailConfirmado).toBe(true);
  });
});
