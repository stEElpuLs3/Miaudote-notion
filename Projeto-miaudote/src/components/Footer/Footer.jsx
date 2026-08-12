import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Link, Stack, Divider } from '@mui/material';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: 8,
                py: 3,
                px: 2,
                backgroundColor: (theme) => theme.palette.grey[100],
                borderTop: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Miaudote — adoção responsável de animais em Cariacica – ES
                    </Typography>
                    <Link
                        component={RouterLink}
                        to="/termos"
                        variant="body2"
                        color="text.secondary"
                        underline="hover"
                    >
                        Termos de Uso e Privacidade
                    </Link>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                    Projeto acadêmico sem fins lucrativos — Atividade Extensionista do curso de Engenharia de
                    Software do Centro Universitário UNINTER. Contato: suporte.miaudote@gmail.com
                </Typography>
            </Container>
        </Box>
    );
}