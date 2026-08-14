import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Link, Stack, Divider } from '@mui/material';

const EMAIL_SUPORTE = 'suporte.miaudote@gmail.com';

const ASSUNTO_DENUNCIA = 'Denuncia de anuncio no Miaudote';

const CORPO_DENUNCIA = [
    'Descreva abaixo o que voce encontrou. Quanto mais detalhes, mais rapido conseguimos agir.',
    '',
    'Link ou nome do anuncio:',
    '',
    'Motivo da denuncia (anuncio falso, venda de animal, suspeita de maus-tratos, outro):',
    '',
    'O que aconteceu:',
    '',
    '---',
    'Sua denuncia e tratada com sigilo. Em caso de maus-tratos, abandono ou crueldade,',
    'acione tambem a Policia Militar pelo 190 - e crime previsto no art. 32 da Lei 9.605/1998.',
].join('\n');

const LINK_DENUNCIA =
    'mailto:' +
    EMAIL_SUPORTE +
    '?subject=' +
    encodeURIComponent(ASSUNTO_DENUNCIA) +
    '&body=' +
    encodeURIComponent(CORPO_DENUNCIA);

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

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Link
                            component={RouterLink}
                            to="/termos"
                            variant="body2"
                            color="text.secondary"
                            underline="hover"
                        >
                            Termos de Uso e Privacidade
                        </Link>

                        <Link
                            href={LINK_DENUNCIA}
                            variant="body2"
                            color="error.main"
                            underline="hover"
                        >
                            Denunciar um anúncio
                        </Link>
                    </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" display="block">
                    Projeto acadêmico sem fins lucrativos — Atividade Extensionista do curso de Engenharia de
                    Software do Centro Universitário UNINTER. Contato:{' '}
                    <Link href={'mailto:' + EMAIL_SUPORTE} color="inherit" underline="hover">
                        {EMAIL_SUPORTE}
                    </Link>
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Suspeita de maus-tratos, abandono ou crueldade contra animais é crime (art. 32 da Lei
                    9.605/1998). Além de nos avisar, acione a Polícia Militar pelo 190.
                </Typography>
            </Container>
        </Box>
    );
}