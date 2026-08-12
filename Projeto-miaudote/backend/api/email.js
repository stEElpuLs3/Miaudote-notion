// backend/api/email.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const User = require('../models/User');
const Pet = require('../models/Pet');
const { auth } = require('../middleware/auth');

// Rota para enviar email de interesse (o interessado vem do token)
router.post('/interesse', auth, async (req, res) => {
  try {
    const { petId } = req.body;
    const interessadoId = req.user.id;

    console.log('Solicitacao de email de interesse:', { petId, interessadoId });

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet nao encontrado' });
    }

    const interessado = await User.findById(interessadoId);
    if (!interessado) {
      return res.status(404).json({ message: 'Usuario interessado nao encontrado' });
    }

    const donoPet = await User.findById(pet.user);
    if (!donoPet) {
      return res.status(404).json({ message: 'Dono do pet nao encontrado' });
    }

    await emailService.enviarEmailInteresse(donoPet, interessado, pet);

    res.json({
      message: 'Notificacao de interesse enviada com sucesso!',
      enviadoPara: donoPet.email
    });
  } catch (error) {
    console.error('Erro ao enviar email de interesse:', error.message);
    res.status(500).json({ message: 'Erro ao enviar notificacao', error: error.message });
  }
});

module.exports = router;
