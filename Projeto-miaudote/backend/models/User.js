// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  telefone: String,
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  avatar: String,
  redeSocial: {
    plataforma: String,
    usuario: String
  },
  endereco: {
    cep: String,
    rua: String,
    numero: String,
    cidade: String,
    estado: String
  },
  sobre: String,
  favoritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }],
  historico: { type: Array, default: [] },

  // --- Confirmacao de e-mail ---
  emailConfirmado: { type: Boolean, default: false },
  tokenConfirmacao: { type: String, default: null, select: false },
  tokenConfirmacaoExpira: { type: Date, default: null, select: false },

  // --- Recuperacao de senha ---
  tokenResetSenha: { type: String, default: null, select: false },
  tokenResetSenhaExpira: { type: Date, default: null, select: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);