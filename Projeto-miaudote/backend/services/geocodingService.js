const axios = require('axios');

// Remove acentos e padroniza para comparar nomes de cidade
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

class GeocodingService {
  constructor() {
    this.nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  }

  // Monta o endereço usando só as partes que existem.
  // Rua e numero sao opcionais no cadastro de pet, entao nunca podem
  // entrar na string como "undefined".
  montarEndereco(endereco) {
    const { rua, numero, bairro, cidade, estado, cep } = endereco || {};
    const partes = [];

    if (rua && numero) partes.push(`${rua}, ${numero}`);
    else if (rua) partes.push(rua);

    if (bairro) partes.push(bairro);
    if (cidade) partes.push(cidade);
    if (estado) partes.push(estado);

    // O CEP e o campo mais preciso disponivel e e obrigatorio no cadastro.
    const cepLimpo = String(cep || '').replace(/\D/g, '');
    if (cepLimpo.length === 8) partes.push(cepLimpo);

    partes.push('Brasil');
    return partes.join(', ');
  }

  // Converter endereço em coordenadas usando OpenStreetMap (GRATUITO)
  async geocodeEndereco(endereco) {
    if (!endereco) {
      console.log('❌ Geocoding chamado sem endereço');
      return null;
    }

    const { cidade, estado } = endereco;
    const enderecoCompleto = this.montarEndereco(endereco);

    try {
      console.log('🟡 Buscando coordenadas no OpenStreetMap para:', enderecoCompleto);

      const response = await axios.get(this.nominatimUrl, {
        params: {
          q: enderecoCompleto,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'br'
        },
        headers: {
          'User-Agent': 'MiaudoteApp/1.0 (vitor@miaudote.com)'
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        console.log('✅ Coordenadas encontradas:', location.lat, location.lon);
        return {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        };
      }

      console.log('❌ Endereço não encontrado no OpenStreetMap:', enderecoCompleto);
      return this.getCoordenadasAproximadas(cidade, estado);
    } catch (error) {
      console.error('🔴 Erro no geocoding OpenStreetMap:', error.message);
      return this.getCoordenadasAproximadas(cidade, estado);
    }
  }

  // Fallback para coordenadas aproximadas da cidade
  getCoordenadasAproximadas(cidade, estado) {
    const coordenadasCidades = {
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
      'Salvador': { lat: -12.9714, lng: -38.5014 },
      'Fortaleza': { lat: -3.7319, lng: -38.5267 },
      'Brasília': { lat: -15.7942, lng: -47.8822 },
      'Curitiba': { lat: -25.4284, lng: -49.2733 },
      'Manaus': { lat: -3.1190, lng: -60.0217 },
      'Cariacica': { lat: -20.2637, lng: -40.3989 },
      'Vitória': { lat: -20.3155, lng: -40.3128 },
      'Vila Velha': { lat: -20.3297, lng: -40.2922 },
      'Serra': { lat: -20.1286, lng: -40.3078 }
    };

    // Nunca usar uma cidade aleatoria como fallback: um endereco de Cariacica
    // virando Sao Paulo geraria ~900 km de erro na busca por proximidade.
    const alvo = normalizar(cidade);
    const encontrada = Object.keys(coordenadasCidades).find(
      (nome) => normalizar(nome) === alvo
    );

    if (encontrada) {
      console.log('📍 Usando coordenadas aproximadas de:', encontrada);
      return coordenadasCidades[encontrada];
    }

    console.log('❌ Sem coordenada aproximada conhecida para:', cidade, estado);
    return null;
  }

  // Calcular distância entre dois pontos (em km) — haversine, RNF07
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = new GeocodingService();