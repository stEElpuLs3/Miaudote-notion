require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

// O Render coloca um proxy na frente do servidor. Sem esta linha, o Express
// enxerga o IP do proxy em vez do IP de quem acessou, e o limite de tentativas
// puniria todos os usuarios de uma vez. O valor 1 significa "confie em um
// proxy". Nunca use true aqui: isso permitiria forjar o IP e furar o limite.
app.set('trust proxy', 1);

// Cabecalhos de seguranca. A excecao do crossOriginResourcePolicy e necessaria
// porque o site esta na Vercel e as imagens em /uploads sao servidas por aqui.
// Com o valor padrao, o navegador baixaria a imagem e a descartaria em silencio.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS: em producao defina CORS_ORIGINS com a URL do site
// (ex.: CORS_ORIGINS=https://miaudote.vercel.app)
const origensPermitidas = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors(origensPermitidas.length ? { origin: origensPermitidas, credentials: true } : {}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Avisos de configuracao
if (!process.env.JWT_SECRET) {
  console.warn('\u26a0\ufe0f  JWT_SECRET nao definido: as rotas protegidas irao recusar requisicoes.');
}
if (!process.env.MONGODB_URI) {
  console.warn('\u26a0\ufe0f  MONGODB_URI nao definido: o banco nao sera conectado.');
}

// Limite de tentativas de login: 10 falhas por IP a cada 15 minutos.
// Logins bem-sucedidos nao contam, entao quem acerta a senha nunca e barrado.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' }
});

// Limite de criacao de contas: 5 cadastros por IP a cada hora.
const limiteCadastro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Muitos cadastros a partir deste endereco. Tente novamente mais tarde.' }
});

// Rotas
const usuariosRouter = require('./api/usuarios');
// Os limitadores valem em producao e em desenvolvimento. Na suite de testes
// todas as chamadas vem do mesmo IP, e o limite de 5 cadastros por hora
// transformaria testes legitimos em falhas intermitentes.
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/usuarios/login', limiteLogin);
  app.use('/api/usuarios/register', limiteCadastro);
  app.use('/api/usuarios/esqueci-senha', limiteCadastro);
  app.use('/api/usuarios/reenviar-confirmacao', limiteCadastro);
}
app.use('/api/usuarios', usuariosRouter);

const petsRouter = require('./api/pets');
app.use('/api/pets', petsRouter);

const mensagensRouter = require('./api/mensagens');
app.use('/api/mensagens', mensagensRouter);

const emailRouter = require('./api/email');
app.use('/api/email', emailRouter);

const favoritosRouter = require('./api/favoritos');
app.use('/api/favoritos', favoritosRouter);

// Health check (util para monitorar o servico em producao)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    banco: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
    horario: new Date().toISOString()
  });
});

// Tratamento de erros (inclui limite de tamanho do multer)
app.use((error, req, res, next) => {
  console.error('Erro nao tratado:', error.message);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Imagem muito grande (maximo 5MB)' });
  }
  return res.status(500).json({ message: error.message || 'Erro interno do servidor' });
});

// Conexao com o MongoDB Atlas
if (process.env.MONGODB_URI && process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch((err) => console.error('❌ Erro ao conectar:', err.message));
}


// Só sobe a porta quando o arquivo é executado direto (node server.cjs),
// nunca quando é importado por um teste.
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log('🚀 Servidor rodando na porta ' + PORT));
}

module.exports = app;

module.exports = app;