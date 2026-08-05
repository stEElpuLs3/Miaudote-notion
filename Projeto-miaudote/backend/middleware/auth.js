// backend/middleware/auth.js
// Verificacao real do token JWT. Sem isso, qualquer pessoa poderia editar
// ou apagar pets e perfis de outros usuarios.
const jwt = require('jsonwebtoken');

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

module.exports = { auth, authOptional, requireSelf, getSecret };
