(() => {
  'use strict';

  const STORAGE_KEY = 'projeto-vida-ikigai-v1';
  const dimensions = ['love', 'good', 'needs', 'paid'];
  const BACKUP_VERSION = 1;
  const labels = { love: 'O que você ama', good: 'No que você é bom', needs: 'O que o mundo precisa', paid: 'Pelo que pode ser pago' };
  const ids = { love: 'Love', good: 'Good', needs: 'Needs', paid: 'Paid' };
  const state = { love: [], good: [], needs: [], paid: [], analysis: null, analysisAnswers: null, checklist: {}, chat: [] };
  let analysisController = null;
  let activeChatController = null;
  const $ = (id) => document.getElementById(id);

  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove('show'), 2800);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast('Não foi possível salvar neste navegador.');
    }
  }

  function normalizeList(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim().replace(/\s+/g, ' ').slice(0, 70))
      .filter(Boolean)
      .slice(0, 15);
  }

  function currentAnswers() {
    return Object.fromEntries(dimensions.map((key) => [key, [...state[key]]]));
  }

  function normalizeAnswers(value) {
    if (!value || typeof value !== 'object') return null;
    const normalized = Object.fromEntries(dimensions.map((key) => [key, normalizeList(value[key])]));
    return dimensions.every((key) => normalized[key].length) ? normalized : null;
  }

  function normalizeAnalysis(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.profissoes)) return null;
    const profissoes = value.profissoes.slice(0, 4).map((career) => ({
      titulo: typeof career?.titulo === 'string' ? career.titulo.slice(0, 100) : 'Possibilidade profissional',
      explicacao: typeof career?.explicacao === 'string' ? career.explicacao.slice(0, 500) : '',
      primeiro_passo: typeof career?.primeiro_passo === 'string' ? career.primeiro_passo.slice(0, 300) : ''
    }));
    if (!profissoes.length) return null;
    return {
      resumo: typeof value.resumo === 'string' ? value.resumo.slice(0, 1000) : '',
      profissoes
    };
  }

  function normalizeChecklist(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).slice(0, 60).map(([key, checked]) => [String(key).slice(0, 400), checked === true]));
  }

  function normalizeChat(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-20).filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      dimensions.forEach((key) => { state[key] = normalizeList(saved[key]); });
      state.analysis = normalizeAnalysis(saved.analysis);
      state.analysisAnswers = state.analysis ? (normalizeAnswers(saved.analysisAnswers) || currentAnswers()) : null;
      state.checklist = normalizeChecklist(saved.checklist);
      state.chat = normalizeChat(saved.chat);
    } catch (error) {
      console.warn('Não foi possível carregar os dados locais.', error);
    }
  }

  function invalidateAnalysis() {
    if (analysisController) analysisController.abort();
    if (activeChatController) activeChatController.abort();
    analysisController = null;
    activeChatController = null;
    state.analysis = null;
    state.analysisAnswers = null;
    state.checklist = {};
    $('aiLoading').hidden = true;
    state.chat = [];
    $('aiResults').replaceChildren();
    $('aiSummary').hidden = true;
    $('checklistBox').hidden = true;
    $('chatBox').hidden = true;
    $('chatMessages').replaceChildren();
  }

  function addTag(dimension) {
    const input = $('input' + ids[dimension]);
    const value = input.value.trim().replace(/\s+/g, ' ');
    if (!value) return;
    if (state[dimension].some((item) => item.toLocaleLowerCase('pt-BR') === value.toLocaleLowerCase('pt-BR'))) {
      toast('Essa ideia já foi adicionada.'); input.value = ''; return;
    }
    if (state[dimension].length >= 15) { toast('Você pode adicionar até 15 itens por dimensão.'); return; }
    state[dimension].push(value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1));
    input.value = '';
    invalidateAnalysis();
    save(); render();
  }

  function removeTag(dimension, index) {
    state[dimension].splice(index, 1);
    invalidateAnalysis();
    save(); render();
  }

  function renderTags() {
    dimensions.forEach((dimension) => {
      const container = $('tags' + ids[dimension]);
      container.replaceChildren();
      state[dimension].forEach((value, index) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        const text = document.createElement('span');
        text.textContent = value;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = '×';
        remove.setAttribute('aria-label', `Remover ${value}`);
        remove.addEventListener('click', () => removeTag(dimension, index));
        chip.append(text, remove); container.append(chip);
      });
    });
  }

  function renderResults() {
    const pairs = [
      ['resultPassion', 'love', 'good', 'Preencha o que você ama e no que é bom.'],
      ['resultMission', 'love', 'needs', 'Preencha o que você ama e o que o mundo precisa.'],
      ['resultVocation', 'needs', 'paid', 'Preencha o que o mundo precisa e pelo que pode ser pago.'],
      ['resultProfession', 'good', 'paid', 'Preencha no que você é bom e pelo que pode ser pago.']
    ];
    pairs.forEach(([id, first, second, placeholder]) => {
      $(id).textContent = state[first].length && state[second].length
        ? `${state[first].join(', ')} + ${state[second].join(', ')}` : placeholder;
    });
    const complete = dimensions.every((key) => state[key].length);
    $('ikigaiStatement').textContent = complete
      ? `Você se interessa por ${state.love.join(', ')}; reconhece habilidades em ${state.good.join(', ')}; gostaria de contribuir com ${state.needs.join(', ')}; e pode desenvolver oportunidades envolvendo ${state.paid.join(', ')}. Essas conexões podem ajudar você a explorar seu caminho.`
      : 'Sua frase de Ikigai aparecerá aqui quando você preencher as quatro dimensões.';
    $('copyStatement').hidden = !complete;
    $('shareStatement').hidden = !complete;
  }

  function renderProgress() {
    const filled = dimensions.filter((key) => state[key].length > 0).length;
    const total = dimensions.reduce((sum, key) => sum + state[key].length, 0);
    $('progressText').textContent = `${filled} de 4 dimensões preenchidas · ${total} ${total === 1 ? 'ideia adicionada' : 'ideias adicionadas'}`;
    $('progressFill').style.width = `${filled * 25}%`;
    const hasSavedAnalysis = Boolean(state.analysis && JSON.stringify(state.analysisAnswers) === JSON.stringify(currentAnswers()));
    $('analyzeButton').disabled = filled !== 4;
    $('aiStatus').textContent = filled !== 4
      ? `Faltam preencher ${4 - filled} dimensão(ões).`
      : (hasSavedAnalysis ? 'Sua análise já está salva. Você pode abri-la sem esperar uma nova resposta.' : 'Suas respostas estão prontas para análise.');
  }

  function render() { renderTags(); renderResults(); renderProgress(); }

  function renderAnalysis(result) {
    $('aiSummary').hidden = !result.resumo;
    $('aiSummary').textContent = result.resumo || '';
    const container = $('aiResults'); container.replaceChildren();
    (Array.isArray(result.profissoes) ? result.profissoes : []).forEach((career) => {
      const card = document.createElement('article'); card.className = 'career-card';
      const title = document.createElement('h3'); title.textContent = career.titulo || 'Possibilidade profissional';
      const explanation = document.createElement('p'); explanation.textContent = career.explicacao || '';
      const step = document.createElement('div'); step.className = 'career-step'; step.textContent = `Primeiro passo: ${career.primeiro_passo || 'Pesquise sobre essa área.'}`;
      card.append(title, explanation, step); container.append(card);
    });
    renderChecklist(result.profissoes || []);
    restoreChat();
    $('chatBox').hidden = !(result.profissoes && result.profissoes.length);
    if (result.profissoes && result.profissoes.length) $('chatBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderChecklist(careers) {
    const box = $('checklistBox'); const container = $('checklistItems'); container.replaceChildren();
    if (!careers.length) { box.hidden = true; return; }
    box.hidden = false;
    careers.forEach((career, index) => {
      const label = document.createElement('label'); label.className = 'check-item';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
      const key = `${career.titulo || index}:${career.primeiro_passo || ''}`;
      checkbox.checked = Boolean(state.checklist[key]);
      const text = document.createElement('span'); text.textContent = `${career.titulo || 'Carreira'}: ${career.primeiro_passo || 'Pesquisar sobre a área.'}`;
      if (checkbox.checked) label.classList.add('done');
      checkbox.addEventListener('change', () => { state.checklist[key] = checkbox.checked; label.classList.toggle('done', checkbox.checked); save(); });
      label.append(checkbox, text); container.append(label);
    });
  }

  async function callAI(payload, signal) {
    const response = await fetch('/api/ikigai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Não foi possível obter uma resposta da IA.');
    return body;
  }

  async function streamChat(payload, onUpdate, signal) {
    const response = await fetch('/api/ikigai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Não foi possível obter uma resposta da IA.');
    }

    if (!response.body) {
      const body = await response.json().catch(() => ({}));
      const answer = body.resposta || '';
      if (answer) onUpdate(answer);
      return answer;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completeText = '';

    function consumeEvent(eventText) {
      const dataLines = eventText.split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());

      dataLines.forEach((raw) => {
        if (!raw || raw === '[DONE]') return;
        let chunk;
        try { chunk = JSON.parse(raw); } catch { return; }
        if (chunk.error) throw new Error(chunk.error);
        const parts = chunk?.candidates?.[0]?.content?.parts || [];
        const nextText = parts.filter((part) => !part.thought).map((part) => part.text || '').join('');
        if (nextText) {
          completeText += nextText;
          onUpdate(completeText);
        }
      });
    }

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';
      events.forEach(consumeEvent);
      if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
    if (!completeText.trim()) throw new Error('A IA encerrou a resposta sem enviar texto. Tente novamente.');
    return completeText.trim();
  }

  async function analyze() {
    if (!dimensions.every((key) => state[key].length)) return;
    const answers = currentAnswers();
    const submittedSnapshot = JSON.stringify(answers);

    // Reaproveita a análise salva quando as respostas não mudaram.
    if (state.analysis && JSON.stringify(state.analysisAnswers) === submittedSnapshot) {
      renderAnalysis(state.analysis);
      toast('Sua análise salva foi recuperada.');
      return;
    }

    const controller = new AbortController();
    analysisController = controller;
    $('analyzeButton').disabled = true;
    $('aiLoading').hidden = false;
    $('aiResults').replaceChildren();
    $('aiSummary').hidden = true;

    try {
      const result = await callAI({ mode: 'analysis', answers }, controller.signal);
      if (controller.signal.aborted) return;
      const currentSnapshot = JSON.stringify(currentAnswers());
      if (currentSnapshot !== submittedSnapshot) {
        toast('Suas respostas mudaram durante a análise. Gere uma nova análise.');
        return;
      }
      const normalized = normalizeAnalysis(result);
      if (!normalized || !normalized.resumo) throw new Error('A resposta da IA veio em um formato inesperado. Tente novamente.');
      state.analysis = normalized;
      state.analysisAnswers = answers;
      save();
      renderAnalysis(normalized);
      renderProgress();
      toast('Análise concluída!');
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast(error.message);
        $('aiSummary').hidden = false;
        $('aiSummary').textContent = error.message;
      }
    } finally {
      if (analysisController === controller) {
        analysisController = null;
        $('aiLoading').hidden = true;
        $('analyzeButton').disabled = !dimensions.every((key) => state[key].length);
      }
    }
  }

  // Mostra o texto do chat transformando **negrito** em <strong>, sem usar innerHTML (mais seguro).
  function fillMessage(element, text) {
    element.replaceChildren();
    String(text).replace(/^\s*\*\s+/gm, '• ').split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        const strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        element.append(strong);
      } else if (part) {
        element.append(document.createTextNode(part.replace(/\*/g, '')));
      }
    });
  }

  function addChatMessage(role, content, persist = true) {
    const message = document.createElement('div'); message.className = `chat-message ${role}`; fillMessage(message, content);
    $('chatMessages').append(message); $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
    if (persist) { state.chat.push({ role, content }); state.chat = state.chat.slice(-20); save(); }
    return message;
  }

  async function sendChat(event) {
    event.preventDefault();
    const input = $('chatInput');
    const question = input.value.trim();
    if (!question || activeChatController) return;

    const answers = currentAnswers();
    const submittedSnapshot = JSON.stringify(answers);
    const sendButton = $('chatForm').querySelector('button[type="submit"]');
    const controller = new AbortController();
    activeChatController = controller;
    sendButton.disabled = true;
    sendButton.textContent = 'Respondendo...';

    addChatMessage('user', question);
    input.value = '';
    const loading = addChatMessage('assistant', 'Conectando ao orientador...', false);
    loading.classList.add('streaming');

    try {
      const responseText = await streamChat({
        mode: 'chat',
        answers,
        analysis: state.analysis,
        history: state.chat.slice(-7, -1),
        question
      }, (text) => fillMessage(loading, text), controller.signal);

      const currentSnapshot = JSON.stringify(currentAnswers());
      if (currentSnapshot !== submittedSnapshot || controller.signal.aborted) return;
      loading.classList.remove('streaming');
      fillMessage(loading, responseText);
      state.chat.push({ role: 'assistant', content: responseText });
      state.chat = state.chat.slice(-20);
      save();
    } catch (error) {
      loading.classList.remove('streaming');
      if (error.name === 'AbortError') {
        loading.remove();
      } else {
        loading.textContent = error.message;
      }
    } finally {
      if (activeChatController === controller) activeChatController = null;
      sendButton.disabled = false;
      sendButton.textContent = 'Enviar';
    }
  }

  function restoreChat() {
    const container = $('chatMessages');
    container.replaceChildren();
    if (!state.chat.length) {
      const welcome = document.createElement('div');
      welcome.className = 'chat-message assistant';
      welcome.textContent = 'Olá! Posso explicar melhor as profissões sugeridas ou ajudar você a pensar em um primeiro passo.';
      container.append(welcome);
      return;
    }
    state.chat.forEach((message) => addChatMessage(message.role, message.content, false));
  }

  function exportBackup() {
    const backup = {
      app: 'projeto.vida',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        love: state.love,
        good: state.good,
        needs: state.needs,
        paid: state.paid,
        analysis: state.analysis,
        analysisAnswers: state.analysisAnswers,
        checklist: state.checklist,
        chat: state.chat
      }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projeto-vida-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup exportado com sucesso!');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { toast('O arquivo é muito grande para importar.'); return; }
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.app !== 'projeto.vida' || backup?.version !== BACKUP_VERSION || !backup.data || typeof backup.data !== 'object') {
        throw new Error('Este arquivo não é um backup compatível do projeto.vida.');
      }
      if (!confirm('Importar este backup substituirá as respostas e o progresso atuais. Deseja continuar?')) return;
      dimensions.forEach((key) => { state[key] = normalizeList(backup.data[key]); });
      state.analysis = dimensions.every((key) => state[key].length) ? normalizeAnalysis(backup.data.analysis) : null;
      state.analysisAnswers = state.analysis ? currentAnswers() : null;
      state.checklist = normalizeChecklist(backup.data.checklist);
      state.chat = normalizeChat(backup.data.chat);
      if (!state.analysis) { state.checklist = {}; state.chat = []; }
      save();
      $('aiResults').replaceChildren();
      $('aiSummary').hidden = true;
      $('checklistBox').hidden = true;
      $('chatBox').hidden = true;
      render();
      if (state.analysis) renderAnalysis(state.analysis);
      restoreChat();
      toast('Backup restaurado com sucesso!');
    } catch (error) {
      toast(error instanceof SyntaxError ? 'Não foi possível ler o arquivo JSON.' : error.message);
    }
  }

  function printReport() {
    $('printDate').textContent = new Date().toLocaleDateString('pt-BR');
    window.print();
  }

  function bindEvents() {
    dimensions.forEach((dimension) => {
      document.querySelector(`[data-add="${dimension}"]`).addEventListener('click', () => addTag(dimension));
      $('input' + ids[dimension]).addEventListener('keydown', (event) => { if (event.key === 'Enter') addTag(dimension); });
    });
    $('clearAll').addEventListener('click', () => {
      if (!confirm('Deseja apagar todas as respostas da sua mandala?')) return;
      dimensions.forEach((key) => { state[key] = []; });
      invalidateAnalysis();
      save(); render(); restoreChat(); toast('Mandala limpa. Você pode recomeçar!');
    });
    $('analyzeButton').addEventListener('click', analyze);
    $('exportBackup').addEventListener('click', exportBackup);
    $('importBackupButton').addEventListener('click', () => $('importBackupInput').click());
    $('importBackupInput').addEventListener('change', importBackup);
    $('printReport').addEventListener('click', printReport);
    $('chatForm').addEventListener('submit', sendChat);
    $('copyStatement').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('ikigaiStatement').textContent); toast('Frase copiada!'); }
      catch { toast('Não foi possível copiar automaticamente.'); }
    });
    $('shareStatement').addEventListener('click', () => {
      const text = encodeURIComponent($('ikigaiStatement').textContent);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    });
  }

  load(); bindEvents(); render();
  if (state.analysis) renderAnalysis(state.analysis);
  restoreChat();
})();