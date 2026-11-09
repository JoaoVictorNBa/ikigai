# Histórico de alterações

## 1.3.2 — Preparação para GitHub e Vercel
- Adicionado `vercel.json` para localizar explicitamente a página inicial em `/index.html` e configurar a função da API.
- Mantida a página principal em `public/index.html`, sem precisar movê-la para a raiz.
- Adicionado `.nvmrc` com Node.js 22 e requisito de versão no `package.json`.
- Atualizado o README com a estrutura do repositório, publicação pelo GitHub + Vercel e proteção da chave Gemini.
- Documentado que GitHub Pages não executa a API Node.js necessária para os recursos de IA.

## 1.3.1 — Links do desenvolvedor
- Os botões GitHub, LinkedIn e Instagram do card do desenvolvedor agora são links externos funcionais.
- Adicionados estados de hover e foco por teclado aos links.

## 1.3.0 — Card do desenvolvedor
- Adicionado card de apresentação de João Victor Nunes Bagatim dentro da seção da mandala.
- Incluída foto de perfil e descrição do propósito do Projeto de Vida.
- Criado visual responsivo com links para GitHub, LinkedIn e Instagram.

## 1.2.0 — Respostas mais rápidas e chat em tempo real
- Adicionado streaming no chat para exibir a resposta conforme é gerada.
- Reduzidos o tamanho do histórico enviado ao chat e o limite de saída.
- Simplificados os prompts e removida a espera artificial entre tentativas de modelos.
- Adicionado modelo reserva para falhas temporárias.
- API key enviada em cabeçalho, em vez de query string.
- Análise salva é reutilizada enquanto as respostas da mandala não mudarem.
- Solicitações em andamento são canceladas no navegador quando a mandala é alterada.
- Melhorados estados de carregamento e acessibilidade do chat.

## 1.1.0 — Backup e relatório
- Exportação e importação de backup JSON.
- Impressão do relatório para salvar em PDF.
- Validação de dados importados.
- Ajustes na documentação e configuração local.
