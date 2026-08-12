// src/pages/RegisterPet.js
import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, Modal,
  MenuItem, Chip, Grid, IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import {
  obrigatorio,
  validarTexto,
  validarIdade,
  validarCep,
  mascaraCep,
} from '../utils/validacoes';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const MAX_IMAGENS = 5;
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// As chaves com ponto acompanham o atributo name dos campos de endereço
const REGRAS = {
  nome: (v) => validarTexto(v, { nome: 'Nome do pet', minimo: 2, maximo: 40 }),
  especie: (v) => obrigatorio(v, 'Espécie'),
  idade: (v) => (String(v).trim() === '' ? null : validarIdade(v)),
  descricao: (v) =>
    String(v).trim() === '' ? null : validarTexto(v, { nome: 'Descrição', maximo: 500 }),
  'endereco.cep': (v) => validarCep(v, { exigir: true }),
  'endereco.cidade': (v) => validarTexto(v, { nome: 'Cidade', minimo: 2, maximo: 60 }),
  'endereco.estado': (v) => obrigatorio(v, 'Estado'),
};

const valoresIniciais = () => ({
  nome: '',
  especie: '',
  raca: '',
  idade: '',
  descricao: '',
  endereco: { cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' },
});

// Lê um valor pelo caminho, aceitando "nome" ou "endereco.cep"
const lerValor = (dados, campo) => {
  if (!campo.includes('.')) return dados[campo];
  const [pai, filho] = campo.split('.');
  return dados[pai][filho];
};

function RegisterPet() {
  const [open, setOpen] = useState(false);
  const [petData, setPetData] = useState(valoresIniciais);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const handleInputChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'endereco.cep') value = mascaraCep(value);

    setErros((atual) => ({ ...atual, [name]: null }));

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPetData((prev) => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setPetData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validarCampo = (campo) => () => {
    const regra = REGRAS[campo];
    if (!regra) return;
    setErros((atual) => ({ ...atual, [campo]: regra(lerValor(petData, campo)) }));
  };

  const handleImageUpload = (e) => {
    const escolhidos = Array.from(e.target.files);
    e.target.value = ''; // permite escolher o mesmo arquivo outra vez

    const vagas = MAX_IMAGENS - images.length;
    if (vagas <= 0) {
      setErros((a) => ({ ...a, imagens: `Máximo de ${MAX_IMAGENS} fotos` }));
      return;
    }

    const aceitos = [];
    let pesados = 0;

    escolhidos.slice(0, vagas).forEach((arquivo) => {
      if (arquivo.size > TAMANHO_MAXIMO) pesados += 1;
      else aceitos.push(arquivo);
    });

    let aviso = null;
    if (pesados > 0) aviso = `${pesados} foto(s) acima de 5 MB foram ignoradas`;
    else if (escolhidos.length > vagas) aviso = `Só cabem mais ${vagas} foto(s)`;

    setImages((prev) => [...prev, ...aceitos]);
    setImagePreviews((prev) => [
      ...prev,
      ...aceitos.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    setErros((a) => ({ ...a, imagens: aviso }));
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setErros((a) => ({ ...a, imagens: null }));
  };

  const validarTudo = () => {
    const novos = {};
    Object.keys(REGRAS).forEach((campo) => {
      const erro = REGRAS[campo](lerValor(petData, campo));
      if (erro) novos[campo] = erro;
    });
    if (images.length === 0) novos.imagens = 'Adicione ao menos uma foto do pet';
    return novos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const novosErros = validarTudo();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch {
      user = null;
    }
    const userId = user?._id || user?.id || null;

    if (!userId) {
      alert('Sua sessão expirou. Faça login novamente para cadastrar um pet.');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('nome', petData.nome.trim());
      formData.append('especie', petData.especie);
      formData.append('raca', petData.raca.trim());
      formData.append('idade', petData.idade);
      formData.append('descricao', petData.descricao.trim());
      formData.append('user', userId);
      formData.append('cep', petData.endereco.cep);
      formData.append('rua', petData.endereco.rua.trim());
      formData.append('numero', petData.endereco.numero.trim());
      formData.append('bairro', petData.endereco.bairro.trim());
      formData.append('cidade', petData.endereco.cidade.trim());
      formData.append('estado', petData.endereco.estado);

      images.forEach((image) => formData.append('images', image));

      await api.post('/api/pets', formData);

      imagePreviews.forEach((p) => URL.revokeObjectURL(p.preview));
      setPetData(valoresIniciais());
      setImages([]);
      setImagePreviews([]);
      setErros({});
      setOpen(true);
    } catch (error) {
      const mensagem =
        error.response?.data?.message || error.message || 'Erro desconhecido';
      if (error.response?.data?.emailNaoConfirmado) {
        alert(
          mensagem +
          '\n\nAbra o e-mail que enviamos no cadastro e clique no link de confirmação. Se não encontrar, use o botão "Reenviar" na faixa amarela no topo do site.'
        );
      } else {
        alert('Erro ao cadastrar pet: ' + mensagem);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Cadastrar Pet
      </Typography>

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="nome"
              label="Nome do Pet"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={petData.nome}
              onChange={handleInputChange}
              onBlur={validarCampo('nome')}
              error={Boolean(erros.nome)}
              helperText={erros.nome || ' '}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="especie"
              label="Espécie"
              variant="outlined"
              fullWidth
              margin="normal"
              select
              required
              value={petData.especie}
              onChange={handleInputChange}
              onBlur={validarCampo('especie')}
              error={Boolean(erros.especie)}
              helperText={erros.especie || ' '}
            >
              <MenuItem value="cachorro">Cachorro</MenuItem>
              <MenuItem value="gato">Gato</MenuItem>
              <MenuItem value="outro">Outro</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="raca"
              label="Raça"
              variant="outlined"
              fullWidth
              margin="normal"
              value={petData.raca}
              onChange={handleInputChange}
              helperText="Opcional — deixe em branco se não souber"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="idade"
              label="Idade (anos)"
              variant="outlined"
              fullWidth
              margin="normal"
              type="number"
              inputProps={{ min: 0, max: 30 }}
              value={petData.idade}
              onChange={handleInputChange}
              onBlur={validarCampo('idade')}
              error={Boolean(erros.idade)}
              helperText={erros.idade || 'Opcional — deixe em branco se não souber'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="descricao"
              label="Diga mais sobre o pet"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={petData.descricao}
              onChange={handleInputChange}
              onBlur={validarCampo('descricao')}
              error={Boolean(erros.descricao)}
              helperText={
                erros.descricao || `${petData.descricao.length}/500 caracteres`
              }
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Localização do Pet
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              name="endereco.cep"
              label="CEP"
              variant="outlined"
              fullWidth
              required
              placeholder="29145-795"
              inputProps={{ inputMode: 'numeric' }}
              value={petData.endereco.cep}
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
              variant="outlined"
              fullWidth
              value={petData.endereco.rua}
              onChange={handleInputChange}
              helperText=" "
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              name="endereco.numero"
              label="Número"
              variant="outlined"
              fullWidth
              value={petData.endereco.numero}
              onChange={handleInputChange}
              helperText=" "
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="endereco.bairro"
              label="Bairro"
              variant="outlined"
              fullWidth
              value={petData.endereco.bairro}
              onChange={handleInputChange}
              helperText=" "
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="endereco.cidade"
              label="Cidade"
              variant="outlined"
              fullWidth
              required
              value={petData.endereco.cidade}
              onChange={handleInputChange}
              onBlur={validarCampo('endereco.cidade')}
              error={Boolean(erros['endereco.cidade'])}
              helperText={erros['endereco.cidade'] || ' '}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="endereco.estado"
              label="Estado"
              variant="outlined"
              fullWidth
              select
              required
              value={petData.endereco.estado}
              onChange={handleInputChange}
              onBlur={validarCampo('endereco.estado')}
              error={Boolean(erros['endereco.estado'])}
              helperText={erros['endereco.estado'] || ' '}
            >
              <MenuItem value="AC">Acre</MenuItem>
              <MenuItem value="AL">Alagoas</MenuItem>
              <MenuItem value="AP">Amapá</MenuItem>
              <MenuItem value="AM">Amazonas</MenuItem>
              <MenuItem value="BA">Bahia</MenuItem>
              <MenuItem value="CE">Ceará</MenuItem>
              <MenuItem value="DF">Distrito Federal</MenuItem>
              <MenuItem value="ES">Espírito Santo</MenuItem>
              <MenuItem value="GO">Goiás</MenuItem>
              <MenuItem value="MA">Maranhão</MenuItem>
              <MenuItem value="MT">Mato Grosso</MenuItem>
              <MenuItem value="MS">Mato Grosso do Sul</MenuItem>
              <MenuItem value="MG">Minas Gerais</MenuItem>
              <MenuItem value="PA">Pará</MenuItem>
              <MenuItem value="PB">Paraíba</MenuItem>
              <MenuItem value="PR">Paraná</MenuItem>
              <MenuItem value="PE">Pernambuco</MenuItem>
              <MenuItem value="PI">Piauí</MenuItem>
              <MenuItem value="RJ">Rio de Janeiro</MenuItem>
              <MenuItem value="RN">Rio Grande do Norte</MenuItem>
              <MenuItem value="RS">Rio Grande do Sul</MenuItem>
              <MenuItem value="RO">Rondônia</MenuItem>
              <MenuItem value="RR">Roraima</MenuItem>
              <MenuItem value="SC">Santa Catarina</MenuItem>
              <MenuItem value="SP">São Paulo</MenuItem>
              <MenuItem value="SE">Sergipe</MenuItem>
              <MenuItem value="TO">Tocantins</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Preview das Imagens */}
        {imagePreviews.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Imagens do Pet ({imagePreviews.length}/{MAX_IMAGENS})
            </Typography>
            <Grid container spacing={1}>
              {imagePreviews.map((preview, index) => (
                <Grid item key={index}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: index === 0 ? '3px solid #1976d2' : '1px solid #ddd',
                      }}
                    />
                    {index === 0 && (
                      <Chip
                        label="Principal"
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: 5,
                          left: 5,
                          fontSize: '0.6rem',
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                      }}
                      onClick={() => removeImage(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button
            component="label"
            variant="outlined"
            color={erros.imagens ? 'error' : 'primary'}
            startIcon={<CloudUploadIcon />}
          >
            Adicionar Imagens *
            <VisuallyHiddenInput
              type="file"
              onChange={handleImageUpload}
              multiple
              accept="image/*"
            />
          </Button>

          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Cadastrar Pet'}
          </Button>
        </Box>

        {erros.imagens && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {erros.imagens}
          </Typography>
        )}
      </form>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            🎉 Parabéns!
          </Typography>
          <Typography sx={{ mt: 2 }}>O pet foi cadastrado com sucesso!</Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </Box>
      </Modal>
    </Container>
  );
}

export default RegisterPet;