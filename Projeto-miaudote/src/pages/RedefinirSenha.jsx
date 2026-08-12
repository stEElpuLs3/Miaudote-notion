import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import api from '../services/api';
import { validarSenha } from '../utils/validacoes';

function RedefinirSenha() {
    const [parametros] = useSearchParams();
    const navegar = useNavigate();
    const token = parametros.get('token');

    const [senha, setSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [erros, setErros] = useState({});
    const [falha, setFalha] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [enviando, setEnviando] = useState(false);

    const validarTudo = () => {
        const encontrados = {};
        const problemaSenha = validarSenha(senha);
        if (problemaSenha) encontrados.senha = problemaSenha;
        if (confirmar !== senha) encontrados.confirmar = 'As senhas nao sao iguais';
        setErros(encontrados);
        return Object.keys(encontrados).length === 0;
    };

    const aoEnviar = async (evento) => {
        evento.preventDefault();
        setFalha('');

        if (!token) {
            setFalha('Link incompleto. Abra o link direto do e-mail que voce recebeu.');
            return;
        }
        if (!validarTudo()) return;

        setEnviando(true);
        try {
            const resposta = await api.post('/api/usuarios/redefinir-senha', { token, senha });
            setSucesso(resposta.data.message || 'Senha alterada com sucesso!');
            setTimeout(() => navegar('/'), 2500);
        } catch (erro) {
            setFalha(
                erro.response?.data?.message || 'Nao foi possivel alterar a senha agora.'
            );
        } finally {
            setEnviando(false);
        }
    };

    if (sucesso) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, textAlign: 'center' }}>
                    <Alert severity="success">{sucesso}</Alert>
                    <Typography sx={{ mt: 3 }} color="text.secondary">
                        Levando voce de volta ao inicio...
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box component="form" onSubmit={aoEnviar} noValidate sx={{ mt: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Criar nova senha
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Escolha uma senha com pelo menos 6 caracteres.
                </Typography>

                {falha && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {falha}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <TextField
                        label="Nova senha"
                        type="password"
                        value={senha}
                        onChange={(evento) => setSenha(evento.target.value)}
                        error={Boolean(erros.senha)}
                        helperText={erros.senha || ' '}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Repita a nova senha"
                        type="password"
                        value={confirmar}
                        onChange={(evento) => setConfirmar(evento.target.value)}
                        error={Boolean(erros.confirmar)}
                        helperText={erros.confirmar || ' '}
                        fullWidth
                        required
                    />

                    <Button type="submit" variant="contained" disabled={enviando}>
                        {enviando ? 'Salvando...' : 'Salvar nova senha'}
                    </Button>

                    <Button component={RouterLink} to="/esqueci-senha" variant="text">
                        Pedir um link novo
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
}

export default RedefinirSenha;