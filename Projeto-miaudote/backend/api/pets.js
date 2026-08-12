const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const upload = require('../middleware/upload'); // Importar multer
const geocodingService = require('../services/geocodingService'); 

const storage = require('../services/storageService');
const { auth, authOptional, exigirEmailConfirmado } = require('../middleware/auth');

const Pet = require('../models/Pet');

// Rota de cadastro com geolocalização
router.post('/', auth, exigirEmailConfirmado, upload.array('images', 5), async (req, res) => {
  try {
    const { nome, especie, raca, idade, descricao, cep, rua, numero, bairro, cidade, estado } = req.body;

    const enderecoObj = {
      cep: (cep || '').trim(),
      rua: (rua || '').trim(),
      numero: (numero || '').trim(),
      bairro: (bairro || '').trim(),
      cidade: (cidade || '').trim(),
      estado: (estado || '').trim()
    };

    // O cadastro exige CEP, cidade e estado; rua e numero sao opcionais por
    // privacidade. Por isso a condicao NAO pode depender da rua — um pet sem
    // rua ficaria sem coordenada e nunca apareceria na busca por proximidade.
    const cepLimpo = enderecoObj.cep.replace(/\D/g, '');
    const podeGeocodificar =
      cepLimpo.length === 8 || Boolean(enderecoObj.cidade && enderecoObj.estado);

    let coordenadas = null;

    if (podeGeocodificar) {
      try {
        coordenadas = await geocodingService.geocodeEndereco(enderecoObj);
      } catch (geocodeError) {
        console.log('Geocoding falhou:', geocodeError.message);
      }
    }

    // Ultimo recurso: centro do municipio. Melhor um pet na cidade certa
    // do que um pet sem coordenada, invisivel na busca por proximidade.
    if (!coordenadas && enderecoObj.cidade && enderecoObj.estado) {
      coordenadas = await geocodingService.getCoordenadasAproximadas(
        enderecoObj.cidade,
        enderecoObj.estado
      );
      if (coordenadas) {
        console.log('Geocoding aproximado: centro do municipio');
      }
    }

    if (!coordenadas) {
      console.log('Pet sem coordenada: nao aparecera na busca por proximidade');
    }

    const imageUrls = await storage.saveFiles(req.files);

    const newPet = new Pet({
      nome,
      especie,
      raca: raca || undefined,
      idade: idade ? Number(idade) : undefined,
      descricao: descricao || '',
      user: req.user.id,
      fotos: imageUrls,
      endereco: enderecoObj,
      ...(coordenadas
        ? {
          localizacao: {
            type: 'Point',
            coordinates: [coordenadas.lng, coordenadas.lat]
          }
        }
        : {})
    });

    await newPet.save();
    res.status(201).json({ message: 'Pet cadastrado com sucesso!', pet: newPet });
  } catch (error) {
    console.error('Erro ao cadastrar pet:', error.message);

    // Campo obrigatorio faltando e erro do cliente, nao do servidor.
    if (error.name === 'ValidationError') {
      const campos = Object.keys(error.errors).join(', ');
      return res.status(400).json({ message: `Dados inválidos: ${campos}` });
    }

    res.status(500).json({ message: 'Erro ao cadastrar pet' });
  }
});

// NOVA ROTA: Buscar pets por proximidade
router.get('/proximidade', authOptional, async (req, res) => {
  try {
    const { lat, lng, raio = 10 } = req.query; // raio em km
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Coordenadas são obrigatórias' });
    }

    const pets = await Pet.find({
      localizacao: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: Math.min(Math.max(parseFloat(raio) || 10, 1), 100) * 1000 // km -> metros
        }
      },
      status: 'disponivel'
    }).populate('user', req.user ? 'nome email telefone avatar' : 'nome avatar');

    // Calcular distância para cada pet
    const petsComDistancia = pets.map(pet => {
      const coords =
        pet.localizacao && Array.isArray(pet.localizacao.coordinates)
          ? pet.localizacao.coordinates
          : null;

      if (!coords || coords.length < 2) {
        return { ...pet.toObject(), distancia: null };
      }

      const distancia = geocodingService.calcularDistancia(
        parseFloat(lat),
        parseFloat(lng),
        coords[1],
        coords[0]
      );
      
      return {
        ...pet.toObject(),
        distancia: Math.round(distancia * 10) / 10 // 1 casa decimal
      };
    });

    res.json(petsComDistancia);
  } catch (error) {
    console.error('Erro ao buscar pets por proximidade:', error);
    res.status(500).json({ message: 'Erro ao buscar pets' });
  }
});

// Pets de um usuário específico
router.get('/user/:userId', async (req, res) => {
  try {
    const pets = await Pet.find({ user: req.params.userId });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pets do usuário', error });
  }
});

// Rota para deletar pet
router.delete('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado' });
    }

    // Somente o dono pode excluir o pet
    if (String(pet.user) !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await Pet.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Pet deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pet:', error);
    res.status(500).json({ message: 'Erro ao deletar pet', error });
  }
});

// Rota para buscar todos os pets 
router.get('/', authOptional, async (req, res) => {
  try {
    // Visitantes nao logados nao recebem email/telefone dos usuarios (LGPD)
    const camposUsuario = req.user ? 'nome email telefone avatar' : 'nome avatar';

    const pets = await Pet.find()
      .populate('user', camposUsuario)
      .sort({ createdAt: -1 }); // Mais recentes primeiro
    
    res.json(pets);
  } catch (error) {
    console.error('Erro ao buscar pets:', error);
    res.status(500).json({ message: 'Erro ao buscar pets', error });
  }
});

// Rota para editar pet
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { 
      nome, especie, raca, idade, descricao,
      cep, rua, numero, bairro, cidade, estado
    } = req.body;

    // Verifica se o pet existe
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado' });
    }

    // Somente o dono pode editar o pet
    if (String(pet.user) !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Construir dados de atualização
    const updateData = {
      nome,
      especie,
      raca,
      idade,
      descricao,
      endereco: {
        cep: cep || '',
        rua: rua || '',
        numero: numero || '',
        bairro: bairro || '',
        cidade: cidade || '',
        estado: estado || ''
      }
    };

    // Processar novas imagens
    if (req.files && req.files.length > 0) {
      const newImageUrls = await storage.saveFiles(req.files);
      updateData.fotos = [...pet.fotos, ...newImageUrls];
    }

    // Atualizar pet
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('user', 'nome email telefone');

    res.json({ 
      message: 'Pet atualizado com sucesso!',
      pet: updatedPet
    });

  } catch (error) {
    console.error('Erro ao atualizar pet:', error);
    res.status(500).json({ message: 'Erro ao atualizar pet', error });
  }
});

module.exports = router;