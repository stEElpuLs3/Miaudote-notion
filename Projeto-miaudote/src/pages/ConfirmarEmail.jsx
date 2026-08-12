import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';

function ConfirmarEmail() {
    const [parametros] = useSearchParams();
    const token = parametros.get('token');

    const [estado, setEstado] = useState('carregando');
    const [mensagem, setMensagem] = useState('');

    // Trava contra a execucao dupla do React em desenvolvimento. Sem ela, o
    // codigo seria gasto na primeira chamada e a segunda mostraria erro.
    const jaChamou = useRef(false);

    useEffect(() => {
        if (jaChamou.current) return;
        jaChamou.current = true;

        if (!token) {
            setEstado('erro');
            setMensagem('Link incompleto. Abra o link direto do e-mail que voce recebeu.');
            return;
        }

        api
            .post('/api/usuarios/confirmar-email', { token })
            .then((resposta) => {
                setEstado('sucesso');
                setMensagem(resposta.data.message || 'E-mail confirmado com sucesso!');
            })
            .catch((erro) => {
                setEstado('erro');
                setMensagem(
                    erro.response?.data?.message || 'Nao foi possivel confirmar o e-mail agora.'
                );
            });
    }, [token]);

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Confirmacao de e-mail
                </Typography>

                {estado === 'carregando' && (
                    <Box sx={{ mt: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Confirmando sua conta...
                        </Typography>
                    </Box>
                )}

                {estado === 'sucesso' && (
                    <Box sx={{ mt: 4 }}>
                        <Alert severity="success">{mensagem}</Alert>
                        <Typography sx={{ mt: 3 }} color="text.secondary">
                            Sua conta esta liberada para publicar pets e enviar mensagens.
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="contained"
                            sx={{ mt: 3 }}
                        >
                            Ir para o site
                        </Button>
                    </Box>
                )}

                {estado === 'erro' && (
                    <Box sx={{ mt: 4 }}>
                        <Alert severity="error">{mensagem}</Alert>
                        <Typography sx={{ mt: 3 }} color="text.secondary">
                            Links de confirmacao valem 24 horas. Se o seu venceu, entre na sua
                            conta e peca um novo pelo aviso que aparece no topo da tela.
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="outlined"
                            sx={{ mt: 3 }}
                        >
                            Voltar ao inicio
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default ConfirmarEmail;