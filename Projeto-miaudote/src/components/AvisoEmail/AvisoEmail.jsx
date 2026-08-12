import React, { useState } from 'react';
import { Alert, Button } from '@mui/material';
import api from '../../services/api';

function lerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

export default function AvisoEmail() {
    const usuario = lerUsuario();
    const [estado, setEstado] = useState('parado');
    const [mensagem, setMensagem] = useState('');

    // Aparece somente quando o campo vale false, ou seja, quando o servidor
    // disse com todas as letras que falta confirmar. Quem entrou antes desta
    // versao nao tem esse campo guardado e fica de fora de proposito.
    if (!usuario || usuario.logado !== true || usuario.emailConfirmado !== false) {
        return null;
    }

    const reenviar = async () => {
        setEstado('enviando');
        try {
            const resposta = await api.post('/api/usuarios/reenviar-confirmacao', {
                email: usuario.email
            });
            setMensagem(resposta.data.message || 'Pronto. Confira sua caixa de entrada.');
        } catch (erro) {
            setMensagem(
                erro.response?.data?.message ||
                'Nao foi possivel reenviar agora. Tente de novo em alguns minutos.'
            );
        } finally {
            setEstado('enviado');
        }
    };

    if (estado === 'enviado') {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                {mensagem}
            </Alert>
        );
    }

    return (
        <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
                <Button color="inherit" size="small" onClick={reenviar} disabled={estado === 'enviando'}>
                    {estado === 'enviando' ? 'Enviando...' : 'Reenviar'}
                </Button>
            }
        >
            Confirme seu e-mail para publicar pets e enviar mensagens. Enviamos o link para {usuario.email}.
        </Alert>
    );
}