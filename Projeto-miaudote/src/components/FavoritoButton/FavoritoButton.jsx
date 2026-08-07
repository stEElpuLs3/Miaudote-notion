import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import api from '../../services/api';

function FavoritoButton({ petId, size = 'medium' }) {
  const [isFavorito, setIsFavorito] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lê o usuário uma única vez e guarda só o ID (string).
  // Aceita _id (formato salvo pelo UserClass) e id (resposta da API).
  const userId = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      return stored?._id || stored?.id || null;
    } catch {
      return null;
    }
  }, []);

  const verificarFavorito = useCallback(async () => {
    if (!userId || !petId) return;
    try {
      const response = await api.get(`/api/favoritos/${userId}`);
      const lista = Array.isArray(response.data) ? response.data : [];
      setIsFavorito(lista.some((pet) => (pet?._id || pet) === petId));
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
    }
  }, [userId, petId]);

  useEffect(() => {
    verificarFavorito();
  }, [verificarFavorito]);

  const toggleFavorito = async () => {
    if (!userId) {
      alert('Faça login para favoritar pets!');
      return;
    }

    setLoading(true);
    try {
      if (isFavorito) {
        await api.delete(`/api/favoritos/${userId}/favoritar/${petId}`);
        setIsFavorito(false);
      } else {
        await api.post(`/api/favoritos/${userId}/favoritar/${petId}`);
        setIsFavorito(true);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      alert('Erro ao favoritar pet');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <Tooltip title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
      <IconButton
        onClick={toggleFavorito}
        disabled={loading}
        color={isFavorito ? "error" : "default"}
        size={size}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 0, 0, 0.1)'
          }
        }}
      >
        {isFavorito ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default FavoritoButton;