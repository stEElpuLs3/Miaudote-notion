// backend/middleware/auth.js
// Verificacao real do token JWT. Sem isso, qualquer pessoa poderia editar
// ou apagar pets e perfis de outros usuarios.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET nao configurado nas variaveis de ambiente');
  }
  return secret;
}

function extrairToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

// Exige usuario autenticado
function auth(req, res, next) {
  const token = extrairToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Autenticacao necessaria' });
  }
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = { id: String(payload.id), email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Sessao expirada ou token invalido' });
  }
}

// Autenticacao opcional: se houver token valido preenche req.user,
// caso contrario segue como visitante (usado para esconder dados de contato)
function authOptional(req, res, next) {
  const token = extrairToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, getSecret());
    req.user = { id: String(payload.id), email: payload.email };
  } catch (error) {
    // ignora token invalido e segue como visitante
  }
  return next();
}

// Garante que o usuario autenticado e o dono do recurso da rota
function requireSelf(param) {
  const nome = param || 'id';
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Autenticacao necessaria' });
    }
    if (String(req.params[nome]) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    return next();
  };
}

// Porteiro extra: roda depois do auth e exige o e-mail confirmado.
// Consulta o banco de proposito. O token foi emitido no login e nao sabe
// de nada que aconteceu depois; consultando o banco, quem confirma o e-mail
// passa a poder publicar na hora, sem sair e entrar de novo.
async function exigirEmailConfirmado(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Faca login para continuar.' });
    }

    const usuario = await User.findById(req.user.id).select('emailConfirmado');
    if (!usuario) {
      return res.status(401).json({ message: 'Conta nao encontrada.' });
    }

    if (usuario.emailConfirmado !== true) {
      return res.status(403).json({
        message: 'Confirme seu e-mail para publicar pets e enviar mensagens.',
        emailNaoConfirmado: true
      });
    }

    return next();
  } catch (error) {
    console.error('Erro ao verificar confirmacao de email:', error.message);
    return res.status(500).json({ message: 'Erro ao verificar a conta' });
  }
}

module.exports = { auth, authOptional, requireSelf, getSecret, exigirEmailConfirmado };
