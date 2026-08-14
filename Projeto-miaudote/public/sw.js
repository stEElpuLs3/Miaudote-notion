// Service worker do Miaudote.
// Troque a versão abaixo sempre que quiser forçar todos os navegadores a
// descartar o cache antigo.
const VERSAO = 'miaudote-v1';

const ESSENCIAIS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png',
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(VERSAO).then((cache) => cache.addAll(ESSENCIAIS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches
            .keys()
            .then((chaves) =>
                Promise.all(
                    chaves.filter((chave) => chave !== VERSAO).map((chave) => caches.delete(chave))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (evento) => {
    const requisicao = evento.request;

    // Só mexe em leitura. POST, PUT e DELETE passam direto.
    if (requisicao.method !== 'GET') return;

    const url = new URL(requisicao.url);

    // Nada de outro domínio é interceptado: a API no Render, as fotos no
    // Cloudinary e os scripts da Vercel seguem o caminho normal.
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    // Navegação entre páginas: tenta a rede primeiro. Se estiver sem internet,
    // devolve a casca do app guardada no cache.
    if (requisicao.mode === 'navigate') {
        evento.respondWith(
            fetch(requisicao).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Arquivos estáticos: cache primeiro, porque o nome deles carrega um hash
    // que muda a cada build.
    evento.respondWith(
        caches.match(requisicao).then((emCache) => {
            if (emCache) return emCache;
            return fetch(requisicao).then((resposta) => {
                if (resposta.ok && resposta.type === 'basic') {
                    const copia = resposta.clone();
                    caches.open(VERSAO).then((cache) => cache.put(requisicao, copia));
                }
                return resposta;
            });
        })
    );
});