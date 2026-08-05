// backend/api/favoritos.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requireSelf } = require('../middleware/auth');

// Adicionar pet aos favoritos (apenas o proprio usuario)
router.post('/:userId/favoritar/:petId', auth, requireSelf('userId'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario nao encontrado' });
    }
    if (!user.favoritos.includes(req.params.petId)) {
      user.favoritos.push(req.params.petId);
      await user.save();
    }
    res.json({ message: 'Pet adicionado aos favoritos', favoritos: user.favoritos });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao favoritar pet', error: error.message });
  }
});

// Remover pet dos favoritos (apenas o proprio usuario)
router.delete('/:userId/favoritar/:petId', auth, requireSelf('userId'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario nao encontrado' });
    }
    user.favoritos = user.favoritos.filter((id) => id.toString() !== req.params.petId);
    await user.save();
    res.json({ message: 'Pet removido dos favoritos', favoritos: user.favoritos });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover favorito', error: error.message });
  }
});

// Listar favoritos do usuario (apenas o proprio usuario)
router.get('/:userId', auth, requireSelf('userId'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favoritos');
    if (!user) {
      return res.status(404).json({ message: 'Usuario nao encontrado' });
    }
    res.json(user.favoritos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar favoritos', error: error.message });
  }
});

module.exports = router;
