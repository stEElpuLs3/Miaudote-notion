// src/components/EditarPerfil/EditarPerfil.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Avatar, IconButton, Typography,
  Grid, MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../services/api';
import {
  validarNome,
  validarTelefone,
  validarCep,
  validarTexto,
  mascaraTelefone,
  mascaraCep,
  somenteNumeros
} from '../../utils/validacoes';

const TAMANHO_MAXIMO_AVATAR = 5 * 1024 * 1024; // 5 MB

const ESTADOS = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

// As chaves com ponto acompanham o atributo name dos campos aninhados
const REGRAS = {
  nome: validarNome,
  telefone: (v) => validarTelefone(v, { exigir: true }),
  sobre: (v) =>
    String(v).trim() === '' ? null : validarTexto(v, { nome: 'Sobre mim', maximo: 500 }),
  'endereco.cep': (v) => validarCep(v, { exigir: false }),
};

const lerValor = (dados, campo) => {
  if (!campo.includes('.')) return dados[campo];
  const [pai, filho] = campo.split('.');
  return dados[pai]?.[filho] ?? '';
};

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
  const [erros, setErros] = useState({});

  // Reset do estado quando o modal abre/fecha
  useEffect(() => {
    if (open && user) {
      // O localStorage pode ter as chaves em português ou em inglês.
      setUserData({
        nome: user.nome || user.name || '',
        telefone: mascaraTelefone(user.telefone || user.phone || ''),
        redeSocial: user.redeSocial || user.socialMedia || { plataforma: '', usuario: '' },
        endereco: user.endereco || user.address || { cep: '', rua: '', numero: '', cidade: '', estado: '' },
        sobre: user.sobre || user.about || ''
      });
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
      setErros({});
    }
  }, [open, user]); // Só executa quando open ou user mudam

  const handleInputChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'telefone') value = mascaraTelefone(value);
    if (name === 'endereco.cep') value = mascaraCep(value);

    setErros((atual) => ({ ...atual, [name]: null }));

    if (name.startsWith('redeSocial.')) {
      const field = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        redeSocial: {
          ...prev.redeSocial,
          [field]: value,
          // Trocar para "Nenhuma" limpa o usuário junto
          ...(field === 'plataforma' && value === '' ? { usuario: '' } : {})
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

  const validarCampo = (campo) => () => {
    const regra = REGRAS[campo];
    if (!regra) return;
    setErros((atual) => ({ ...atual, [campo]: regra(lerValor(userData, campo)) }));
  };

  const validarTudo = () => {
    const novos = {};
    Object.keys(REGRAS).forEach((campo) => {
      const erro = REGRAS[campo](lerValor(userData, campo));
      if (erro) novos[campo] = erro;
    });
    return novos;
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // permite escolher o mesmo arquivo outra vez
    if (!file) return;

    if (file.size > TAMANHO_MAXIMO_AVATAR) {
      setErros((a) => ({ ...a, avatar: 'A imagem precisa ter no máximo 5 MB' }));
      return;
    }

    if (avatarFile) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErros((a) => ({ ...a, avatar: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const novosErros = validarTudo();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nome', userData.nome.trim());
      formData.append('telefone', somenteNumeros(userData.telefone));
      formData.append('sobre', userData.sobre.trim());

     
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
      <form onSubmit={handleSubmit} noValidate>
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
              {erros.avatar && (
                <Typography color="error" variant="body2">
                  {erros.avatar}
                </Typography>
              )}
            </Grid>

            {/* Dados Básicos */}
            <Grid item xs={12} md={6}>
              <TextField
                name="nome"
                label="Nome Completo"
                fullWidth
                required
                value={userData.nome}
                onChange={handleInputChange}
                onBlur={validarCampo('nome')}
                error={Boolean(erros.nome)}
                helperText={erros.nome || ' '}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="E-mail"
                fullWidth
                value={user?.email || ''}
                InputProps={{ readOnly: true }}
                helperText="Usado para entrar no site — não pode ser alterado"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="telefone"
                label="Telefone"
                fullWidth
                required
                value={userData.telefone}
                onChange={handleInputChange}
                onBlur={validarCampo('telefone')}
                error={Boolean(erros.telefone)}
                helperText={erros.telefone || 'É por aqui que o adotante entra em contato'}
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
                helperText=" "
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
                helperText=" "
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12} md={3}>
              <TextField
                name="endereco.cep"
                label="CEP"
                fullWidth
                placeholder="29145-795"
                inputProps={{ inputMode: 'numeric' }}
                value={userData.endereco.cep || ''}
                onChange={handleInputChange}
                onBlur={validarCampo('endereco.cep')}
                error={Boolean(erros['endereco.cep'])}
                helperText={erros['endereco.cep'] || ' '}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.rua"
                label="Rua"
                fullWidth
                value={userData.endereco.rua || ''}
                onChange={handleInputChange}
                helperText=" "
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                name="endereco.numero"
                label="Número"
                fullWidth
                value={userData.endereco.numero || ''}
                onChange={handleInputChange}
                helperText=" "
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.cidade"
                label="Cidade"
                fullWidth
                value={userData.endereco.cidade || ''}
                onChange={handleInputChange}
                helperText=" "
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="endereco.estado"
                label="Estado"
                fullWidth
                select
                value={userData.endereco.estado || ''}
                onChange={handleInputChange}
                helperText=" "
              >
                <MenuItem value="">Não informado</MenuItem>
                {ESTADOS.map(([sigla, nome]) => (
                  <MenuItem key={sigla} value={sigla}>{nome}</MenuItem>
                ))}
              </TextField>
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
                onBlur={validarCampo('sobre')}
                error={Boolean(erros.sobre)}
                helperText={erros.sobre || `${(userData.sobre || '').length}/500 caracteres`}
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