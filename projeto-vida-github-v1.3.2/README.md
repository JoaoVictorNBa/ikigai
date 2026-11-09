# projeto.vida — Projeto de Vida com Ikigai

Aplicação em HTML, CSS e JavaScript puro, com API em Node.js para conversar com o Google Gemini. O repositório está preparado para ser enviado ao GitHub e publicado pela Vercel.

## Funcionalidades

- Mandala de autoconhecimento com quatro dimensões do Ikigai.
- Salvamento automático das respostas no navegador.
- Cruzamentos e declaração pessoal gerados a partir das respostas.
- Análise de possibilidades profissionais com IA.
- Checklist de primeiros passos e chat com o orientador.
- Exportação e restauração de backup em JSON.
- Impressão do relatório ou salvamento como PDF pelo navegador.
- Card de apresentação do desenvolvedor com GitHub, LinkedIn e Instagram.
- Layout responsivo para computador e celular.

## Estrutura de pastas

```text
projeto-de-vida/
├── api/
│   └── ikigai.js                 # Função de IA usada na publicação
├── public/
│   ├── index.html                # Página inicial do site
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── images/
│       └── desenvolvedor-joao-victor.jpg
├── .env.example                  # Exemplo, sem chave real
├── .gitignore                    # Impede enviar segredos e dependências
├── .nvmrc                        # Versão recomendada do Node.js
├── package.json
├── server.js                     # Servidor para executar localmente
└── vercel.json                   # Configura a página inicial e a API
```

## Como enviar ao GitHub

1. Extraia o arquivo ZIP.
2. Crie um repositório no GitHub.
3. Envie para o repositório **o conteúdo desta pasta**, incluindo `api`, `public`, `package.json`, `vercel.json` e os arquivos ocultos como `.gitignore`.
4. Não envie `.env.local`, sua chave do Gemini, `node_modules` ou a pasta `.vercel`.

> Importante: envie os arquivos que estão dentro da pasta `projeto-de-vida`, e não uma pasta extra contendo todo o projeto. Assim, `api/`, `public/` e `vercel.json` ficam diretamente na raiz do repositório.

## Publicar o site com IA (GitHub + Vercel)

O GitHub guarda o código. Para que a análise e o chat com IA funcionem online, publique o repositório pela Vercel, que executa a função Node.js da pasta `api`.

1. Entre em [vercel.com](https://vercel.com/) e conecte sua conta GitHub.
2. Escolha **Add New → Project** e importe este repositório.
3. Se for solicitado, escolha **Other** como Framework Preset.
4. Deixe Build Command sem comando e mantenha as configurações padrão de saída. O arquivo `vercel.json` já configura a rota inicial.
5. Em **Environment Variables**, crie `GEMINI_API_KEY` e cole sua chave do Google AI Studio como valor. Marque os ambientes em que deseja usar a chave (Production, Preview e/ou Development).
6. Clique em **Deploy**.

### Como a página inicial é localizada

O arquivo principal fica em `public/index.html`. A Vercel publica o conteúdo da pasta `public` na raiz do site. O `vercel.json` também direciona a rota `/` para `/index.html`, portanto não é necessário mover o arquivo para a raiz do repositório.

Os arquivos do site usam estes caminhos públicos:

- `/css/style.css`
- `/js/app.js`
- `/images/desenvolvedor-joao-victor.jpg`

A API fica em `api/ikigai.js` e é acessada pelo navegador em `/api/ikigai`.

> **Não use GitHub Pages para publicar a versão completa com IA.** O GitHub Pages hospeda arquivos estáticos, mas não executa a função Node.js da pasta `api`. Use o GitHub como repositório e a Vercel para hospedar o site e a API.

## Configuração local no Windows

1. Instale o Node.js 20.12 ou superior.
2. Copie `.env.example` e renomeie a cópia para `.env.local`.
3. Abra `.env.local` e substitua `COLOQUE_SUA_CHAVE_AQUI` por uma chave válida do Google AI Studio.
4. Abra o terminal na pasta do projeto e execute:

   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:3000`.
6. Para encerrar, pressione `Ctrl + C`.

Não há dependências externas para instalar; `npm install` não é necessário.

## Variáveis de ambiente

Obrigatória para usar a IA:

```env
GEMINI_API_KEY=COLOQUE_SUA_CHAVE_AQUI
```

Opcionalmente, você pode definir `GEMINI_MODEL` e `GEMINI_FALLBACK_MODEL` para selecionar modelos compatíveis. Se não definir, a API usa os valores padrão configurados em `api/ikigai.js`.

**Segurança:** a chave deve ficar apenas no arquivo `.env.local` local ou nas Environment Variables da Vercel. Nunca coloque a chave no HTML, no JavaScript do navegador ou no GitHub. O `.gitignore` já bloqueia arquivos `.env.*`, mantendo apenas `.env.example`.

## Backup e relatório

- Use **Exportar dados** para baixar um arquivo JSON com suas respostas e progresso.
- Use **Importar dados** para restaurar um backup compatível. A importação substitui o progresso atual.
- Em **Imprimir / salvar PDF**, escolha “Salvar como PDF” na janela de impressão do navegador.

## Privacidade e limitações

As respostas da mandala são armazenadas no `localStorage` do navegador utilizado. Ao solicitar análise ou enviar mensagens, os dados necessários são enviados ao backend e encaminhados ao Gemini. O backup JSON também contém suas respostas e deve ser guardado em local privado.

As sugestões da IA servem como apoio à reflexão e não são avaliação profissional nem determinação de carreira. Confira informações sobre cursos e profissões em fontes confiáveis e atualizadas.
