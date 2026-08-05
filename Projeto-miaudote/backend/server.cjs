require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

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

// Rotas
const usuariosRouter = require('./api/usuarios');
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
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('\u2705 Conectado ao MongoDB'))
    .catch((err) => console.error('\u274c Erro ao conectar:', err.message));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('\ud83d\ude80 Servidor rodando na porta ' + PORT));

module.exports = app;
