import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Avatar, IconButton,
  Grid, MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../services/api';

function EditarPerfil({ open, onClose, user, onUserUpdate }) {
  const [userData, setUserData] = useState({
    nome: '',
    telefone: '',
    redeSocial: { plataforma: '', usuario: '' },
    endereco: { cep: '', rua: '', numero: '', cidade: '', estado: '' },
    sobre: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset do estado quando o modal abre/fecha
  useEffect(() => {
    if (open && user) {
      // O localStorage pode ter as chaves em português ou em inglês.
      setUserData({
        nome: user.nome || user.name || '',
        telefone: user.telefone || user.phone || '',
        redeSocial: user.redeSocial || user.socialMedia || { plataforma: '', usuario: '' },
        endereco: user.endereco || user.address || { cep: '', rua: '', numero: '', cidade: '', estado: '' },
        sobre: user.sobre || user.about || ''
      });
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
    }
  }, [open, user]); // Só executa quando open ou user mudam

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('redeSocial.')) {
      const field = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        redeSocial: {
          ...prev.redeSocial,
          [field]: value
        }
      }));
    } else if (name.startsWith('endereco.')) {
      const field = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [field]: value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nome', userData.nome);
      formData.append('telefone', userData.telefone);
      formData.append('sobre', userData.sobre);

      // Envia campos individuais em vez de JSON stringify
      formData.append('redeSocialPlataforma', userData.redeSocial.plataforma || '');
      formData.append('redeSocialUsuario', userData.redeSocial.usuario || '');

      formData.append('enderecoCep', userData.endereco.cep || '');
      formData.append('enderecoRua', userData.endereco.rua || '');
      formData.append('enderecoNumero', userData.endereco.numero || '');
      formData.append('enderecoCidade', userData.endereco.cidade || '');
      formData.append('enderecoEstado', userData.endereco.estado || '');

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const userId = user?._id || user?.id;

      // Sem Content-Type manual: o navegador precisa montar o boundary do FormData.
      const response = await api.put(`/api/usuarios/${userId}`, formData);

      // O backend pode devolver { user: {...} } ou o objeto direto.
      const dadosAtualizados = response.data?.user || response.data || {};

      const updatedUser = {
        ...user,
        ...dadosAtualizados,
        _id: dadosAtualizados._id || dadosAtualizados.id || userId
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onClose();
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);

      if (error.response?.status === 401) {
        alert('Sua sessão expirou. Faça login novamente.');
      } else {
        alert(error.response?.data?.message || 'Erro ao atualizar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  // Se o modal não estiver aberto, não renderiza nada
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth> 
      <DialogTitle>Editar Perfil</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Avatar */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={avatarPreview}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: -10,
                    backgroundColor: 'white'
                  }}
                >
                  <CloudUploadIcon />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </IconButton>
              </Box>
            </Grid>

            {/* Dados Básicos */}
            <Grid item xs={12} md={6}>
              <TextField
                name="nome"
                label="Nome Completo"
                fullWidth
                value={userData.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="telefone"
                label="Telefone"
                fullWidth
                value={userData.telefone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />
            </Grid>

            {/* Rede Social */}
            <Grid item xs={12} md={6}>
              <TextField
                name="redeSocial.plataforma"
                label="Rede Social"
                fullWidth
                select
                value={userData.redeSocial.plataforma || ''}
                onChange={handleInputChange}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="twitter">Twitter</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="outro">Outro</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="redeSocial.usuario"
                label="Usuário"
                fullWidth
                value={userData.redeSocial.usuario || ''}
                onChange={handleInputChange}
                placeholder="@usuario"
                disabled={!userData.redeSocial.plataforma}
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12} md={3}>
              <TextField
                name="endereco.cep"
                label="CEP"
                fullWidth
                value={userData.endereco.cep || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.rua"
                label="Rua"
                fullWidth
                value={userData.endereco.rua || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                name="endereco.numero"
                label="Número"
                fullWidth
                value={userData.endereco.numero || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.cidade"
                label="Cidade"
                fullWidth
                value={userData.endereco.cidade || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.estado"
                label="Estado"
                fullWidth
                value={userData.endereco.estado || ''}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Sobre */}
            <Grid item xs={12}>
              <TextField
                name="sobre"
                label="Sobre mim"
                fullWidth
                multiline
                rows={3}
                value={userData.sobre || ''}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre você..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditarPerfil;