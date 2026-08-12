const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const storage = require('../services/storageService');
const { auth, requireSelf, getSecret } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

const User = require('../models/User');

// Rota de cadastro
router.post('/register', async (req, res) => {
  const { nome, telefone, email, senha } = req.body;

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
    const newUser = new User({ nome, telefone, email, senha: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Usuário criado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar usuário", error });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  console.log('Tentativa de login:'); // ← Log para debug

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:');
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    console.log('Usuário encontrado, verificando senha...');

    // Verifica senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      console.log('Senha incorreta para:');
      return res.status(401).json({ message: "Senha incorreta" });
    }

    console.log('Login bem-sucedido para:');

    // Geração do token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      getSecret(),
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        avatar: user.avatar, // ← ADICIONADO AQUI
        redeSocial: user.redeSocial,
        endereco: user.endereco,
        sobre: user.sobre,
        favoritos: user.favoritos
      }
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({
      message: "Erro no login",
      error: error.message
    });
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
      message: 'Erro ao atualizar avatar',
      error: error.message
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

    const updateData = {
      nome,
      telefone,
      sobre,
      redeSocial: {
        plataforma: redeSocialPlataforma || '',
        usuario: redeSocialUsuario || ''
      },
      endereco: {
        cep: enderecoCep || '',
        rua: enderecoRua || '',
        numero: enderecoNumero || '',
        cidade: enderecoCidade || '',
        estado: enderecoEstado || ''
      }
    };

    // Remove campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

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
    res.status(500).json({ message: 'Erro ao atualizar perfil', error: error.message });
  }
});

module.exports = router;
