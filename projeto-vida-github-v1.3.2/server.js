// Servidor LOCAL para desenvolvimento.
// Ele serve a pasta "public" e executa a função "api/ikigai.js",
// imitando o que a Vercel faz depois da publicação.
// Na Vercel este arquivo NÃO é usado.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const pastaPublica = path.join(raiz, 'public');
const PORTA = Number(process.env.PORT) || 3000;

// Carrega a chave do arquivo .env.local (sem instalar nada)
try {
  process.loadEnvFile(path.join(raiz, '.env.local'));
} catch {
  console.warn('Aviso: não encontrei o arquivo .env.local. A IA não vai funcionar até você criá-lo.');
}

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Lê o corpo da requisição e transforma em objeto (como a Vercel faz)
function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let texto = '';
    req.on('data', (pedaco) => {
      texto += pedaco;
      if (texto.length > 100_000) { reject(new Error('Corpo grande demais')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(texto ? JSON.parse(texto) : {}); } catch (erro) { reject(erro); }
    });
    req.on('error', reject);
  });
}

// Cria res.status(...).json(...) igual ao da Vercel
function prepararResposta(res) {
  res.status = (codigo) => { res.statusCode = codigo; return res; };
  res.json = (dados) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(dados));
    return res;
  };
  return res;
}

async function rotaApi(req, res, nome) {
  prepararResposta(res);
  try {
    // Importa de novo a cada chamada para você ver alterações sem reiniciar
    const arquivo = path.join(raiz, 'api', `${nome}.js`);
    await stat(arquivo);
    const modulo = await import(`${new URL(`file://${arquivo.replace(/\\/g, '/')}`).href}?t=${Date.now()}`);
    if (req.method === 'POST') {
      try { req.body = await lerCorpo(req); }
      catch { return res.status(400).json({ error: 'Corpo da requisição inválido.' }); }
    }
    await modulo.default(req, res);
  } catch (erro) {
    if (erro.code === 'ENOENT') return res.status(404).json({ error: 'Rota da API não encontrada.' });
    console.error(erro);
    if (!res.headersSent) res.status(500).json({ error: 'Erro interno no servidor local.' });
  }
}

async function arquivoEstatico(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let caminho = decodeURIComponent(url.pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const completo = path.normalize(path.join(pastaPublica, caminho));

  // Segurança: impede acessar arquivos fora da pasta "public"
  if (!completo.startsWith(pastaPublica + path.sep)) {
    res.statusCode = 403;
    return res.end('Acesso negado');
  }
  try {
    const conteudo = await readFile(completo);
    res.setHeader('Content-Type', tipos[path.extname(completo).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(conteudo);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Página não encontrada');
  }
}

const servidor = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const api = pathname.match(/^\/api\/([a-zA-Z0-9_-]+)$/);
  if (api) return rotaApi(req, res, api[1]);
  return arquivoEstatico(req, res);
});

servidor.listen(PORTA, () => {
  console.log(`\n  projeto.vida rodando em: http://localhost:${PORTA}`);
  console.log(`  Chave do Gemini: ${process.env.GEMINI_API_KEY ? 'encontrada ✔' : 'NÃO encontrada ✘'}`);
  console.log('  Para parar: Ctrl + C\n');
});