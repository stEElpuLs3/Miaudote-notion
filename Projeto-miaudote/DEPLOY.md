# Guia de implantação — Miaudote

Este guia cobre a publicação da plataforma para uso real por pessoas e instituições.

## 1. Variáveis de ambiente

Copie `.env.example` (frontend) e `backend/.env.example` (backend) e preencha os valores.
**Nunca** comite o arquivo `.env`. Se ele já foi enviado ao GitHub em algum commit,
troque imediatamente a senha do MongoDB Atlas, o `JWT_SECRET` e a senha de app do e-mail.

### Backend

| Variável | Para que serve |
| --- | --- |
| `MONGODB_URI` | Conexão com o MongoDB Atlas |
| `JWT_SECRET` | Assinatura dos tokens de login (valor longo e aleatório) |
| `BASE_URL` | URL pública do backend, usada nas URLs das imagens locais |
| `PORT` | Porta do servidor (o host normalmente define automaticamente) |
| `CORS_ORIGINS` | Domínios autorizados a chamar a API, separados por vírgula |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Envio das notificações por e-mail |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Armazenamento das fotos em nuvem |

### Frontend

| Variável | Para que serve |
| --- | --- |
| `REACT_APP_API_URL` | URL pública do backend (ex.: `https://miaudote-api.onrender.com`) |

## 2. Fotos dos pets (Cloudinary)

Em hospedagens de nuvem o disco é efêmero: a cada novo deploy os arquivos enviados
pelos usuários são apagados. Por isso o projeto usa o Cloudinary quando configurado.

1. Crie uma conta gratuita em cloudinary.com
2. Copie *Cloud name*, *API Key* e *API Secret* do painel
3. Preencha as três variáveis no backend
4. Instale a dependência: `cd backend && npm install`

Sem essas variáveis o sistema continua salvando em `backend/uploads/`, o que só serve
para desenvolvimento local.

## 3. Backend (recomendado: Render)

A Vercel é ótima para o frontend, mas roda funções serverless — um servidor Express
com `app.listen` e upload de arquivos funciona melhor em um serviço de processo contínuo.

1. Acesse render.com → **New** → **Web Service** → conecte o repositório
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Cadastre todas as variáveis de ambiente do backend
6. Após o deploy, copie a URL gerada e use-a em `BASE_URL` e em `REACT_APP_API_URL`

Observação: no plano gratuito o serviço "dorme" após inatividade e a primeira
requisição pode levar ~30 segundos. Se houver demonstração ao vivo para as
instituições, abra o site alguns minutos antes.

## 4. Frontend (Vercel)

1. Importe o repositório na Vercel
2. **Framework Preset**: Create React App (raiz do projeto)
3. Em **Settings → Environment Variables**, adicione `REACT_APP_API_URL` com a URL do backend
4. Refaça o deploy — variáveis do CRA são lidas no momento do build

## 5. Checklist antes do lançamento real

- [ ] `GET /api/health` do backend responde `status: ok` e `banco: conectado`
- [ ] Cadastro e login funcionando no domínio público
- [ ] Cadastro de pet com foto: a imagem continua visível após um novo deploy
- [ ] Busca por proximidade retornando distâncias coerentes em Cariacica
- [ ] Mensagem de interesse chega por e-mail
- [ ] Testado em celular Android e iPhone, em rede móvel (não só no Wi-Fi)
- [ ] Tentativa de excluir o pet de outra pessoa retorna "Acesso negado"
- [ ] Credenciais antigas do `.env` rotacionadas
