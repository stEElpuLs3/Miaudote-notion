import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Divider,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';

const EMAIL_CONTATO = 'contato.miaudote@gmail.com';
const ATUALIZADO_EM = '11 de agosto de 2026';

function Titulo({ children }) {
    return (
        <Typography variant="h4" component="h2" sx={{ mt: 5, mb: 1, fontWeight: 700 }}>
            {children}
        </Typography>
    );
}

function Secao({ numero, titulo, children }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                {numero}. {titulo}
            </Typography>
            {children}
        </Box>
    );
}

function P({ children }) {
    return (
        <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.75 }}>
            {children}
        </Typography>
    );
}

function Lista({ itens }) {
    return (
        <Box component="ul" sx={{ pl: 3, mb: 2, mt: 0 }}>
            {itens.map((item, i) => (
                <Typography component="li" variant="body1" key={i} sx={{ mb: 0.8, lineHeight: 1.75 }}>
                    {item}
                </Typography>
            ))}
        </Box>
    );
}

function Tabela({ colunas, linhas }) {
    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {colunas.map((coluna) => (
                            <TableCell key={coluna} sx={{ fontWeight: 700 }}>
                                {coluna}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {linhas.map((linha, i) => (
                        <TableRow key={i}>
                            {linha.map((celula, j) => (
                                <TableCell key={j}>{celula}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default function Termos() {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                    Termos de Uso e Privacidade
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Última atualização: {ATUALIZADO_EM}
                </Typography>

                <Titulo>Termos de Uso</Titulo>

                <Secao numero={1} titulo="O que é o Miaudote">
                    <P>
                        O Miaudote é uma plataforma web gratuita que aproxima quem precisa doar um animal de
                        quem tem interesse em adotar, com foco no município de Cariacica – ES.
                    </P>
                    <P>
                        Ele foi desenvolvido como Atividade Extensionista do curso de Bacharelado em Engenharia
                        de Software do Centro Universitário UNINTER. <strong>Não é uma empresa, não tem fins
                            lucrativos e não cobra por nenhuma funcionalidade.</strong>
                    </P>
                </Secao>

                <Secao numero={2} titulo="O que o Miaudote não faz">
                    <P>Esta parte importa mais do que a anterior. O Miaudote é um mural, não um intermediário:</P>
                    <Lista
                        itens={[
                            'Não verifica a identidade de quem se cadastra',
                            'Não visita, examina nem avalia os animais anunciados',
                            'Não participa da conversa entre as partes nem da entrega do animal',
                            'Não garante que as informações de um anúncio sejam verdadeiras',
                            'Não se responsabiliza pelo que acontecer entre as pessoas fora da plataforma',
                        ]}
                    />
                    <P>
                        A relação de adoção é entre o doador e o adotante. Cabe a vocês dois conferir tudo antes
                        de combinar qualquer coisa.
                    </P>
                </Secao>

                <Secao numero={3} titulo="Quem pode usar">
                    <P>
                        Você precisa ter <strong>18 anos ou mais</strong> para criar uma conta. Os dados que
                        você informar devem ser verdadeiros e seus. Uma pessoa, uma conta.
                    </P>
                </Secao>

                <Secao numero={4} titulo="O que não é permitido">
                    <Lista
                        itens={[
                            <><strong>Vender animais ou cobrar qualquer valor</strong> pela adoção, incluindo taxa de vacina ou ajuda de custo</>,
                            'Publicar anúncio falso, ou animal que não está sob seus cuidados',
                            'Usar fotos de terceiros sem autorização',
                            'Qualquer forma de maus-tratos, abandono ou crueldade contra animais, conduta que é crime pelo art. 32 da Lei 9.605/1998',
                            'Usar os contatos obtidos aqui para outra finalidade que não seja tratar da adoção',
                            'Assediar, ameaçar ou ofender outras pessoas',
                        ]}
                    />
                    <P>Anúncios e contas que descumprirem estas regras podem ser removidos sem aviso.</P>
                </Secao>

                <Secao numero={5} titulo="Conteúdo que você publica">
                    <P>
                        As fotos e os textos continuam sendo seus. Ao publicá-los, você autoriza o Miaudote a
                        exibi-los no site enquanto o anúncio estiver ativo.
                    </P>
                </Secao>

                <Secao numero={6} titulo="Cuidados ao combinar um encontro">
                    <Lista
                        itens={[
                            <>Marque em <strong>local público</strong> e, se possível, acompanhado</>,
                            'Desconfie de quem pede dinheiro adiantado, seja a que título for',
                            'Desconfie de quem tem pressa e evita conversar por telefone',
                            'Combine a entrega no local onde o animal está, quando fizer sentido',
                        ]}
                    />
                </Secao>

                <Secao numero={7} titulo="Disponibilidade do serviço">
                    <P>
                        O Miaudote é gratuito e roda em serviços de hospedagem de plano gratuito. Isso significa,
                        com todas as letras:
                    </P>
                    <Lista
                        itens={[
                            <><strong>Não há garantia de que o site estará no ar</strong> em qualquer momento</>,
                            <><strong>Não há garantia de backup.</strong> Guarde uma cópia das suas fotos</>,
                            'O serviço pode ser encerrado a qualquer tempo, com aviso prévio sempre que possível',
                        ]}
                    />
                </Secao>

                <Secao numero={8} titulo="Encerramento da conta">
                    <P>
                        Você pode pedir a exclusão da sua conta e de todos os seus dados a qualquer momento, pelo
                        e-mail indicado no Aviso de Privacidade. O pedido é atendido em até 15 dias.
                    </P>
                </Secao>

                <Secao numero={9} titulo="Lei aplicável">
                    <P>
                        Estes termos seguem as leis brasileiras. Fica eleito o foro da comarca de Cariacica – ES.
                    </P>
                </Secao>

                <Divider sx={{ my: 5 }} />

                <Titulo>Aviso de Privacidade</Titulo>

                <Secao numero={1} titulo="Quem responde pelos seus dados">
                    <P>
                        Contato para assuntos de privacidade: <strong>{EMAIL_CONTATO}</strong>
                    </P>
                </Secao>

                <Secao numero={2} titulo="Quais dados coletamos">
                    <Tabela
                        colunas={['Dado', 'Quando é coletado', 'Para que serve']}
                        linhas={[
                            ['Nome', 'No cadastro', 'Identificar você para os outros usuários'],
                            ['E-mail', 'No cadastro', 'Login, avisos de mensagem e contato de adoção'],
                            ['Senha', 'No cadastro', 'Acesso à conta. Guardada cifrada, nunca em texto legível'],
                            ['Telefone', 'No cadastro', 'Contato direto entre doador e adotante'],
                            ['Foto de perfil', 'Opcional', 'Exibição no seu perfil'],
                            ['Texto de apresentação', 'Opcional', 'Exibição no seu perfil'],
                            ['Rede social', 'Opcional', 'Exibição no seu perfil'],
                            ['CEP, cidade e estado', 'Ao cadastrar um pet', 'Calcular a distância até quem busca'],
                            ['Rua e número', 'Opcional', 'Refinar a localização do anúncio'],
                            ['Fotos dos animais', 'Ao cadastrar um pet', 'Exibição do anúncio'],
                            ['Localização do aparelho', 'Apenas se você permitir', 'Ordenar os pets por proximidade. Não é gravada'],
                        ]}
                    />
                    <P>
                        Não coletamos CPF, RG, dados bancários nem qualquer dado sensível na acepção do art. 5º,
                        II da LGPD.
                    </P>
                </Secao>

                <Secao numero={3} titulo="O que fica visível para outras pessoas">
                    <P>Esta é a seção mais importante deste aviso, e vale ler com atenção.</P>
                    <Tabela
                        colunas={['Dado', 'Quem enxerga']}
                        linhas={[
                            ['Seu nome', 'Qualquer visitante, mesmo sem conta'],
                            ['Foto de perfil', 'Qualquer visitante'],
                            ['Fotos e descrição dos pets', 'Qualquer visitante'],
                            ['Cidade e estado do anúncio', 'Qualquer visitante'],
                            [<strong>Seu e-mail</strong>, 'Somente usuários logados, ao abrir o contato de um anúncio seu'],
                            [<strong>Seu telefone</strong>, 'Somente usuários logados, ao abrir o contato de um anúncio seu'],
                            ['Sua senha', 'Ninguém, nem o responsável pelo site'],
                        ]}
                    />
                    <Alert severity="info" sx={{ mb: 2 }}>
                        E-mail e telefone não são enviados ao navegador de quem não está logado. Isso é uma
                        decisão técnica do servidor, e não apenas um campo escondido na tela — um visitante
                        anônimo não consegue coletar esses contatos nem inspecionando a página.
                    </Alert>
                </Secao>

                <Secao numero={4} titulo="Com que base legal tratamos seus dados">
                    <Lista
                        itens={[
                            <><strong>Consentimento</strong> (art. 7º, I da LGPD) para exibir seus dados de contato aos demais usuários e para usar sua localização</>,
                            <><strong>Execução de contrato</strong> (art. 7º, V) para manter sua conta, autenticar o login e enviar avisos de mensagens recebidas</>,
                        ]}
                    />
                </Secao>

                <Secao numero={5} titulo="Com quem seus dados são compartilhados">
                    <P>
                        Não vendemos nem cedemos seus dados. Eles passam apenas pelos serviços necessários para
                        o site funcionar:
                    </P>
                    <Tabela
                        colunas={['Serviço', 'Para que', 'Onde ficam']}
                        linhas={[
                            ['MongoDB Atlas', 'Banco de dados', 'Estados Unidos'],
                            ['Cloudinary', 'Armazenamento das fotos', 'Estados Unidos'],
                            ['Brevo', 'Envio dos e-mails de aviso', 'União Europeia'],
                            ['Render', 'Hospedagem do servidor', 'Estados Unidos'],
                            ['Vercel', 'Hospedagem do site', 'Estados Unidos'],
                        ]}
                    />
                    <P>
                        Como esses serviços ficam fora do Brasil, há <strong>transferência internacional de
                            dados</strong>. Todos eles operam sob compromissos de proteção compatíveis com a
                        legislação brasileira e europeia.
                    </P>
                </Secao>

                <Secao numero={6} titulo="Por quanto tempo guardamos">
                    <P>
                        Seus dados ficam enquanto sua conta existir. Ao pedir a exclusão, apagamos tudo em até 15
                        dias, com uma única exceção: mensagens já entregues a outro usuário permanecem na caixa
                        dele, porque também são dados daquela pessoa.
                    </P>
                </Secao>

                <Secao numero={7} titulo="Seus direitos">
                    <P>O art. 18 da LGPD garante a você:</P>
                    <Lista
                        itens={[
                            'Saber se tratamos seus dados e quais são',
                            'Acessar uma cópia deles',
                            'Corrigir dados incompletos ou errados',
                            'Pedir a eliminação',
                            'Saber com quem foram compartilhados',
                            'Revogar o consentimento',
                        ]}
                    />
                    <P>
                        Boa parte disso você faz sozinho, pela tela de edição de perfil. Para o resto, escreva
                        para <strong>{EMAIL_CONTATO}</strong>. Respondemos em até 15 dias.
                    </P>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        O e-mail é a credencial de login e não pode ser alterado depois do cadastro. Se precisar
                        trocar de e-mail, peça pelo endereço de contato acima.
                    </Alert>
                </Secao>

                <Secao numero={8} titulo="Cookies e armazenamento no navegador">
                    <P>
                        O Miaudote <strong>não usa cookies de rastreamento, nem análise de comportamento, nem
                            publicidade.</strong>
                    </P>
                    <P>
                        Usamos apenas o armazenamento local do seu navegador para guardar o token da sessão e os
                        dados básicos do seu perfil, de modo que você não precise digitar a senha a cada página.
                        Ao sair da conta, isso é apagado.
                    </P>
                </Secao>

                <Secao numero={9} titulo="Segurança">
                    <P>O que existe hoje:</P>
                    <Lista
                        itens={[
                            'Senhas guardadas com bcrypt, uma função que impede recuperar a senha original mesmo com acesso ao banco',
                            'Autenticação por token JWT, com validade limitada',
                            'Todo o tráfego em HTTPS',
                            'Contatos ocultos de visitantes não logados',
                        ]}
                    />
                    <P>
                        Sendo honesto sobre o limite: nenhum sistema é inviolável, e este é um projeto acadêmico
                        mantido por uma pessoa. Não publique aqui nada que você não publicaria num grupo aberto
                        de bairro.
                    </P>
                </Secao>

                <Secao numero={10} titulo="Menores de idade">
                    <P>
                        O Miaudote não se destina a menores de 18 anos e não coleta dados de crianças e
                        adolescentes de forma consciente. Se identificarmos um cadastro nessa situação, a conta
                        será removida.
                    </P>
                </Secao>

                <Secao numero={11} titulo="Mudanças neste aviso">
                    <P>
                        Se algo mudar, a data no topo é atualizada. Mudanças relevantes serão avisadas por e-mail.
                    </P>
                </Secao>
            </Paper>
        </Container>
    );
}