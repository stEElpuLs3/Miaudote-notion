require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const upload = require('../middleware/upload');
const storage = require('../services/storageService');
const { auth, requireSelf, getSecret } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();
const User = require('../models/User');

// Gera um codigo aleatorio em duas versoes: a crua vai no link do e-mail,
// a embaralhada vai para o banco. Se o banco vazar, os codigos guardados
// nao servem para nada, porque nao da para voltar do embaralhado ao cru.
function gerarToken() {
  const cru = crypto.randomBytes(32).toString('hex');
  const embaralhado = crypto.createHash('sha256').update(cru).digest('hex');
  return { cru, embaralhado };
}

function embaralhar(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Rota de cadastro
router.post('/register', async (req, res) => {
  const { nome, telefone, email, senha } = req.body || {};

  try {
    if (!email || !senha || senha.length < 6) {
      return res
        .status(400)
        .json({ message: 'Informe email e uma senha com no minimo 6 caracteres' });
    }

    // Verifica se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Usuário já existe" });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criação do usuário
    const { cru, embaralhado } = gerarToken();

    const newUser = new User({
      nome,
      telefone,
      email,
      senha: hashedPassword,
      emailConfirmado: false,
      tokenConfirmacao: embaralhado,
      tokenConfirmacaoExpira: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await newUser.save();

    emailService.enviarEmailConfirmacao(newUser, cru)
      .catch((e) => console.error('Erro ao enviar email de confirmacao:', e.message));

    res.status(201).json({ message: "Usuário criado com sucesso. Confira seu e-mail para confirmar a conta." });
  } catch (error) {
    console.error('Erro ao criar usuario:', error.message);
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};

  // Mesma resposta para "conta inexistente" e "senha errada". Respostas
  // diferentes permitiriam descobrir quais e-mails tem conta no Miaudote
  // sem precisar de senha nenhuma (enumeracao de usuarios).
  const credenciaisInvalidas = { message: 'E-mail ou senha incorretos' };

  try {
    if (!email || !senha) {
      return res.status(400).json({ message: 'Informe e-mail e senha.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(credenciaisInvalidas);
    }

    // Verifica senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json(credenciaisInvalidas);
    }

    // Geração do token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      getSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        avatar: user.avatar,
        redeSocial: user.redeSocial,
        endereco: user.endereco,
        sobre: user.sobre,
        favoritos: user.favoritos,
        emailConfirmado: user.emailConfirmado === true
      }
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({ message: 'Erro no login' });
  }
});

// Rota específica para upload de avatar
router.put('/:id/avatar', auth, requireSelf('id'), upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem enviada'
      });
    }

    // URL da imagem
    const avatarUrl = await storage.saveFile(req.file);

    // Atualizar apenas o campo avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, select: '-senha' } // Não retornar a senha
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar atualizado com sucesso!',
      avatar: avatarUrl,
      user: {
        id: updatedUser._id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar avatar'
    });
  }
});

// Rota para atualizar usuário
router.put('/:id', auth, requireSelf('id'), upload.single('avatar'), async (req, res) => {
  try {
    const {
      nome,
      telefone,
      sobre,
      redeSocialPlataforma,
      redeSocialUsuario,
      enderecoCep,
      enderecoRua,
      enderecoNumero,
      enderecoCidade,
      enderecoEstado
    } = req.body;

    const updateData = {};

    if (nome !== undefined) updateData.nome = nome;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (sobre !== undefined) updateData.sobre = sobre;

    // Notacao de ponto: grava so o subcampo que veio na requisicao e preserva
    // os demais. Montar os objetos `redeSocial` e `endereco` inteiros com
    // `|| ''` apagava o que o cliente nao enviou.
    if (redeSocialPlataforma !== undefined) updateData['redeSocial.plataforma'] = redeSocialPlataforma;
    if (redeSocialUsuario !== undefined) updateData['redeSocial.usuario'] = redeSocialUsuario;
    if (enderecoCep !== undefined) updateData['endereco.cep'] = enderecoCep;
    if (enderecoRua !== undefined) updateData['endereco.rua'] = enderecoRua;
    if (enderecoNumero !== undefined) updateData['endereco.numero'] = enderecoNumero;
    if (enderecoCidade !== undefined) updateData['endereco.cidade'] = enderecoCidade;
    if (enderecoEstado !== undefined) updateData['endereco.estado'] = enderecoEstado;

    // Se há nova imagem de avatar
    if (req.file) {
      updateData.avatar = await storage.saveFile(req.file);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        avatar: user.avatar,
        redeSocial: user.redeSocial,
        endereco: user.endereco,
        sobre: user.sobre
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.message);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// --- Confirmacao de e-mail ---
router.post('/confirmar-email', async (req, res) => {
  const { token } = req.body || {};

  try {
    if (!token) return res.status(400).json({ message: 'Link invalido.' });

    const user = await User.findOne({
      tokenConfirmacao: embaralhar(token),
      tokenConfirmacaoExpira: { $gt: new Date() }
    }).select('+tokenConfirmacao +tokenConfirmacaoExpira');

    if (!user) {
      return res.status(400).json({ message: 'Link invalido ou expirado. Peca um novo e-mail de confirmacao.' });
    }

    user.emailConfirmado = true;
    user.tokenConfirmacao = null;
    user.tokenConfirmacaoExpira = null;
    await user.save();

    res.json({ message: 'E-mail confirmado com sucesso!' });
  } catch (error) {
    console.error('Erro ao confirmar email:', error.message);
    res.status(500).json({ message: 'Erro ao confirmar e-mail' });
  }
});

router.post('/reenviar-confirmacao', async (req, res) => {
  const { email } = req.body || {};
  const respostaPadrao = {
    message: 'Se houver uma conta pendente com esse endereco, enviamos um novo e-mail.'
  };

  try {
    if (!email) return res.status(400).json({ message: 'Informe o e-mail.' });

    const user = await User.findOne({ email });
    if (!user || user.emailConfirmado) return res.json(respostaPadrao);

    const { cru, embaralhado } = gerarToken();
    user.tokenConfirmacao = embaralhado;
    user.tokenConfirmacaoExpira = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    emailService.enviarEmailConfirmacao(user, cru)
      .catch((e) => console.error('Erro ao reenviar confirmacao:', e.message));

    res.json(respostaPadrao);
  } catch (error) {
    console.error('Erro ao reenviar confirmacao:', error.message);
    res.status(500).json({ message: 'Erro ao reenviar confirmacao' });
  }
});

// --- Recuperacao de senha ---
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body || {};
  const respostaPadrao = {
    message: 'Se houver uma conta com esse endereco, enviamos um link para redefinir a senha.'
  };

  try {
    if (!email) return res.status(400).json({ message: 'Informe o e-mail.' });

    const user = await User.findOne({ email });
    if (!user) return res.json(respostaPadrao);

    const { cru, embaralhado } = gerarToken();
    user.tokenResetSenha = embaralhado;
    user.tokenResetSenhaExpira = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    emailService.enviarEmailRecuperacaoSenha(user, cru)
      .catch((e) => console.error('Erro ao enviar recuperacao:', e.message));

    res.json(respostaPadrao);
  } catch (error) {
    console.error('Erro ao pedir recuperacao:', error.message);
    res.status(500).json({ message: 'Erro ao processar o pedido' });
  }
});

router.post('/redefinir-senha', async (req, res) => {
  const { token, senha } = req.body || {};

  try {
    if (!token || !senha || senha.length < 6) {
      return res.status(400).json({ message: 'Informe uma senha com no minimo 6 caracteres.' });
    }

    const user = await User.findOne({
      tokenResetSenha: embaralhar(token),
      tokenResetSenhaExpira: { $gt: new Date() }
    }).select('+tokenResetSenha +tokenResetSenhaExpira');

    if (!user) {
      return res.status(400).json({ message: 'Link invalido ou expirado. Peca um novo.' });
    }

    user.senha = await bcrypt.hash(senha, 10);
    user.tokenResetSenha = null;
    user.tokenResetSenhaExpira = null;
    // Quem redefiniu a senha provou que tem acesso ao e-mail, entao ja vale
    // como confirmacao. Evita pedir duas provas da mesma coisa.
    user.emailConfirmado = true;
    await user.save();

    res.json({ message: 'Senha alterada com sucesso! Voce ja pode entrar.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error.message);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
});

module.exports = router;