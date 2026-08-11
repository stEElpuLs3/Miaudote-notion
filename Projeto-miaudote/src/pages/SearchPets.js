import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Slider,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import api from '../services/api';
import PetCard from '../components/PetCard/PetCard';

const MIN = 1;
const MAX = 100;

const marks = [
  { value: MIN, label: '1 km' },
  { value: MAX, label: '100 km' }
];

// Converte centro + raio numa caixa de coordenadas para o mapa.
// 1 grau de latitude equivale a ~111,32 km em qualquer ponto do planeta.
// Na longitude a distancia encolhe conforme se afasta do equador: dai o cosseno.
function calcularBbox(lat, lng, raioKm) {
  const grausLat = raioKm / 111.32;
  const grausLng = raioKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [
    (lng - grausLng).toFixed(6),
    (lat - grausLat).toFixed(6),
    (lng + grausLng).toFixed(6),
    (lat + grausLat).toFixed(6)
  ].join(',');
}

function SearchPets() {
  const [raio, setRaio] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pets, setPets] = useState([]);
  const [localizacao, setLocalizacao] = useState(null);
  const [buscou, setBuscou] = useState(false);

  const obterLocalizacao = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Seu navegador não oferece geolocalização.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          setLocalizacao(coords);
          resolve(coords);
        },
        (erro) => {
          const mensagens = {
            1: 'Você negou o acesso à localização. Libere a permissão no cadeado da barra de endereço e tente de novo.',
            2: 'Não foi possível determinar sua localização agora.',
            3: 'A busca pela sua localização demorou demais.'
          };
          reject(new Error(mensagens[erro.code] || 'Erro desconhecido ao obter a localização.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const buscarPetsProximos = async () => {
    setLoading(true);
    setError(null);

    try {
      const coords = localizacao || (await obterLocalizacao());

      const response = await api.get('/api/pets/proximidade', {
        params: { lat: coords.lat, lng: coords.lng, raio }
      });

      setPets(Array.isArray(response.data) ? response.data : []);
      setBuscou(true);
    } catch (erro) {
      setError(erro.response?.data?.message || erro.message);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const atualizarLocalizacao = async () => {
    setError(null);
    try {
      await obterLocalizacao();
    } catch (erro) {
      setError(erro.message);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Buscar Pets por Região
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ajuste o raio de busca e encontre pets disponíveis para adoção perto de você.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 520, mx: 'auto' }}>
        {/* Mapa da área de busca */}
        <Box
          sx={{
            height: 260,
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {localizacao ? (
            <Box
              component="iframe"
              title="Área de busca"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${calcularBbox(
                localizacao.lat,
                localizacao.lng,
                raio
              )}&layer=mapnik&marker=${localizacao.lat},${localizacao.lng}`}
              sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                bgcolor: 'grey.100',
                px: 3,
                textAlign: 'center'
              }}
            >
              <MyLocationIcon color="disabled" fontSize="large" />
              <Typography variant="body2" color="text.secondary">
                O mapa aparece aqui depois que você permitir o acesso à sua localização.
              </Typography>
            </Box>
          )}
        </Box>

        <Typography gutterBottom>
          Raio de busca: <strong>{raio} km</strong>
        </Typography>
        <Slider
          marks={marks}
          step={1}
          value={raio}
          valueLabelDisplay="auto"
          min={MIN}
          max={MAX}
          onChange={(_, valor) => setRaio(valor)}
        />

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={buscarPetsProximos}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Buscando...' : 'Buscar pets próximos'}
          </Button>

          {localizacao && (
            <Button variant="text" onClick={atualizarLocalizacao} disabled={loading}>
              Atualizar localização
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {buscou && !loading && !error && pets.length === 0 && (
        <Alert severity="info" sx={{ mt: 4, maxWidth: 520, mx: 'auto' }}>
          Nenhum pet encontrado num raio de {raio} km. Tente aumentar a distância.
        </Alert>
      )}

      {pets.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom>
            {pets.length === 1 ? '1 pet encontrado' : `${pets.length} pets encontrados`}
          </Typography>

          <Grid container spacing={3}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet._id} sx={{ display: 'flex' }}>
                <PetCard pet={pet} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default SearchPets;