import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import api from '../services/api';
import { validarEmail } from '../utils/validacoes';

function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [erro, setErro] = useState(null);
    const [aviso, setAviso] = useState('');
    const [enviando, setEnviando] = useState(false);

    const aoEnviar = async (evento) => {
        evento.preventDefault();

        const problema = validarEmail(email);
        setErro(problema);
        if (problema) return;

        setEnviando(true);
        try {
            const resposta = await api.post('/api/usuarios/esqueci-senha', {
                email: email.trim().toLowerCase()
            });
            setAviso(resposta.data.message || 'Pronto. Confira sua caixa de entrada.');
        } catch (falha) {
            setAviso(
                falha.response?.data?.message ||
                'Nao foi possivel processar o pedido agora. Tente de novo em alguns minutos.'
            );
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box component="form" onSubmit={aoEnviar} noValidate sx={{ mt: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Esqueci minha senha
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Digite o e-mail da sua conta. Vamos enviar um link para voce criar uma
                    senha nova.
                </Typography>

                {aviso && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {aviso}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(evento) => setEmail(evento.target.value)}
                        onBlur={() => setErro(validarEmail(email))}
                        error={Boolean(erro)}
                        helperText={erro || ' '}
                        fullWidth
                        required
                    />

                    <Button type="submit" variant="contained" disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Enviar link'}
                    </Button>

                    <Button component={RouterLink} to="/" variant="text">
                        Voltar ao inicio
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
}

export default EsqueciSenha;