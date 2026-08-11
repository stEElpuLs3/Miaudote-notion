// src/pages/Cadastro/Cadastro.jsx
import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { Container, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import api from '../../services/api';
import LoginForm from '../../components/LoginForm/LoginForm';
import {
  validarNome,
  validarEmail,
  validarSenha,
  validarConfirmacaoSenha,
  validarTelefone,
  mascaraTelefone,
  validarFormulario,
} from '../../utils/validacoes';

const REGRAS = {
  nome: validarNome,
  email: validarEmail,
  senha: validarSenha,
  confirmarSenha: validarConfirmacaoSenha,
  telefone: validarTelefone,
};

const VALORES_INICIAIS = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  telefone: '',
  avatar: '',
};

const Cadastro = () => {
  const [valores, setValores] = useState(VALORES_INICIAIS);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [openLoginModal, setOpenLoginModal] = useState(false);

  const handleOpenLogin = () => setOpenLoginModal(true);
  const handleCloseLogin = () => setOpenLoginModal(false);

  // Atualiza o campo e apaga o erro dele enquanto a pessoa digita
  const alterar = (campo) => (evento) => {
    const valor =
      campo === 'telefone'
        ? mascaraTelefone(evento.target.value)
        : evento.target.value;

    setValores((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: null }));
  };

  // Valida só aquele campo, quando a pessoa sai dele
  const validarCampo = (campo) => () => {
    const regra = REGRAS[campo];
    if (!regra) return;
    setErros((atual) => ({ ...atual, [campo]: regra(valores[campo], valores) }));
  };

  const handleCadastro = async () => {
    const { erros: novosErros, valido } = validarFormulario(valores, REGRAS);
    setErros(novosErros);
    if (!valido) return;

    setEnviando(true);
    try {
      const response = await api.post('/api/usuarios/register', {
        nome: valores.nome.trim(),
        email: valores.email.trim().toLowerCase(),
        senha: valores.senha,
        telefone: valores.telefone,
        avatar: valores.avatar.trim(),
      });

      alert(response.data.message || 'Cadastro realizado com sucesso!');
      setValores(VALORES_INICIAIS);
      setErros({});
      setOpenLoginModal(true);
    } catch (error) {
      const mensagem =
        error.response?.data?.message || 'Erro ao cadastrar usuário';

      // Se o backend reclamou do e-mail, mostra o aviso no próprio campo
      if (/e-?mail/i.test(mensagem)) {
        setErros((atual) => ({ ...atual, email: mensagem }));
      }
      alert(mensagem);
    } finally {
      setEnviando(false);
    }
  };

  const aoEnviar = (evento) => {
    evento.preventDefault();
    handleCadastro();
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={aoEnviar} noValidate sx={{ mt: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Cadastro
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Nome"
            required
            value={valores.nome}
            onChange={alterar('nome')}
            onBlur={validarCampo('nome')}
            error={Boolean(erros.nome)}
            helperText={erros.nome || ' '}
            fullWidth
          />

          <TextField
            label="E-mail"
            type="email"
            required
            value={valores.email}
            onChange={alterar('email')}
            onBlur={validarCampo('email')}
            error={Boolean(erros.email)}
            helperText={erros.email || ' '}
            fullWidth
          />

          <TextField
            label="Senha"
            type="password"
            required
            value={valores.senha}
            onChange={alterar('senha')}
            onBlur={validarCampo('senha')}
            error={Boolean(erros.senha)}
            helperText={erros.senha || 'Mínimo de 6 caracteres'}
            fullWidth
          />

          <TextField
            label="Confirmar senha"
            type="password"
            required
            value={valores.confirmarSenha}
            onChange={alterar('confirmarSenha')}
            onBlur={validarCampo('confirmarSenha')}
            error={Boolean(erros.confirmarSenha)}
            helperText={erros.confirmarSenha || ' '}
            fullWidth
          />

          <TextField
            label="Telefone"
            required
            placeholder="(27) 99999-9999"
            value={valores.telefone}
            onChange={alterar('telefone')}
            onBlur={validarCampo('telefone')}
            error={Boolean(erros.telefone)}
            helperText={erros.telefone || ' '}
            inputProps={{ inputMode: 'numeric' }}
            fullWidth
          />

          <TextField
            label="Avatar (URL)"
            value={valores.avatar}
            onChange={alterar('avatar')}
            helperText="Opcional — você pode escolher uma foto depois, no seu perfil"
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={enviando}
          >
            {enviando ? 'Cadastrando...' : 'Cadastrar'}
          </Button>

          <Button variant="outlined" onClick={handleOpenLogin}>
            Já tenho uma conta
          </Button>
        </Stack>
      </Box>

      {/* Modal de login */}
      <Modal
        open={openLoginModal}
        onClose={handleCloseLogin}
        aria-labelledby="modal-login"
        aria-describedby="modal-login-form"
      >
        <Box
          sx={{
            margin: '10% auto',
            padding: '20px',
            backgroundColor: 'white',
            width: '400px',
          }}
        >
          <LoginForm closeModal={handleCloseLogin} />
        </Box>
      </Modal>
    </Container>
  );
};

export default Cadastro;