// backend/api/mensagens.js
const express = require('express');
const router = express.Router();
const Mensagem = require('../models/Mensagem');
const emailService = require('../services/emailService');
const User = require('../models/User');
const Pet = require('../models/Pet');
const { auth, requireSelf } = require('../middleware/auth');

// Enviar mensagem (o remetente vem do token, nunca do corpo da requisicao)
router.post('/', auth, async (req, res) => {
  try {
    const { destinatario, pet, mensagem, tipo } = req.body;
    const remetente = req.user.id;

    if (!destinatario || !mensagem) {
      return res.status(400).json({ message: 'Destinatario e mensagem sao obrigatorios' });
    }

    const novaMensagem = new Mensagem({ remetente, destinatario, pet, mensagem, tipo });
    await novaMensagem.save();

    // Popula os dados para retornar
    const mensagemPopulada = await Mensagem.findById(novaMensagem._id)
      .populate('remetente', 'nome email avatar telefone redeSocial')
      .populate('destinatario', 'nome email avatar telefone redeSocial')
      .populate('pet', 'nome fotos especie raca');

    // Enviar email de notificacao
    try {
      const destinatarioData = await User.findById(destinatario);
      const remetenteData = await User.findById(remetente);
      const petData = pet ? await Pet.findById(pet) : null;

      emailService.enviarEmailNovaMensagem(destinatarioData, remetenteData, petData)
        .catch((e) => console.error('Erro ao enviar email:', e.message));
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError.message);
      // Nao falha a requisicao se o email falhar
    }

    res.status(201).json({
      message: 'Mensagem enviada com sucesso!',
      mensagem: mensagemPopulada
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem', error: error.message });
  }
});

// Buscar mensagens de um usuario (somente as proprias)
router.get('/usuario/:userId', auth, requireSelf('userId'), async (req, res) => {
  try {
    const mensagens = await Mensagem.find({
      $or: [{ remetente: req.params.userId }, { destinatario: req.params.userId }]
    })
      .populate('remetente', 'nome email avatar')
      .populate('destinatario', 'nome email avatar')
      .populate('pet', 'nome fotos')
      .sort({ createdAt: -1 });

    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar mensagens', error: error.message });
  }
});

// Marcar mensagem como lida (somente o destinatario)
router.put('/:id/lida', auth, async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem nao encontrada' });
    }
    if (String(mensagem.destinatario) !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    mensagem.lida = true;
    await mensagem.save();
    res.json({ message: 'Mensagem marcada como lida' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar mensagem', error: error.message });
  }
});

// Deletar mensagem (somente remetente ou destinatario)
router.delete('/:id', auth, async (req, res) => {
  try {
    const mensagem = await Mensagem.findById(req.params.id);
    if (!mensagem) {
      return res.status(404).json({ message: 'Mensagem nao encontrada' });
    }
    const participante =
      String(mensagem.remetente) === req.user.id ||
      String(mensagem.destinatario) === req.user.id;
    if (!participante) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    await Mensagem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mensagem excluida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir mensagem', error: error.message });
  }
});

module.exports = router;
