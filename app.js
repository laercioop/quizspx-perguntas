const BLOCKS = [
  { id: 'general', number: 1, title: 'Conhecimentos gerais', note: 'Fácil e médio', topics: ['general'], levels: ['easy', 'medium'], count: 5 },
  { id: 'sports-language', number: 2, title: 'Esportes & Língua Portuguesa', note: 'Fácil e médio', topics: ['sports', 'portuguese'], levels: ['easy', 'medium'], count: 5, balanced: true },
  { id: 'quotes', number: 3, title: 'Quem disse essa frase?', note: 'Com alternativas', topics: ['quotes'], levels: ['medium'], count: 5 },
  { id: 'general-hard', number: 4, title: 'Conhecimentos gerais difíceis', note: 'Nível avançado', topics: ['general'], levels: ['hard', 'medium-hard', 'medium'], count: 5 },
  { id: 'apostles', number: 5, title: 'Quais eram os 12 Apóstolos?', note: 'Pergunta especial', fixed: true },
  { id: 'sports-language-hard', number: 6, title: 'Esportes & Língua Portuguesa', note: 'Nível difícil', topics: ['sports', 'portuguese'], levels: ['hard', 'medium-hard', 'medium'], count: 5, balanced: true }
];
const APOSTLES = { id: 'apostles', question: 'Quais eram os doze Apóstolos de Nosso Senhor Jesus Cristo?', answer: 'Simão Pedro, André, Tiago Maior, João, Filipe, Bartolomeu, Mateus, Tomé, Tiago Menor, Judas Tadeu, Simão Zelote e Judas Iscariotes (posteriormente substituído por São Matias).' };
const state = { answers: false, options: false, selections: {}, pendingAction: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function poolFor(block) { return window.PRESENTER_QUESTIONS.filter(item => block.topics.includes(item.topic) && block.levels.includes(item.difficulty)); }
function selectFor(block) {
  if (block.fixed) return [APOSTLES];
  const pool = poolFor(block);
  if (!block.balanced) return shuffle(pool).slice(0, block.count);
  const selected = block.topics.flatMap(topic => shuffle(pool.filter(item => item.topic === topic)).slice(0, 3));
  return shuffle(selected).slice(0, block.count);
}
function shuffledOptions(item) { return shuffle(item.options).map(text => ({ text, isAnswer: text === item.answer })); }
function questionMarkup(item, index) {
  const options = item.options ? shuffledOptions(item) : [];
  return `<li class="question-item"><div class="question-line"><span class="question-number">${index + 1}</span><p>${item.question}</p></div>${options.length ? `<ol class="options" data-options>${options.map((option, optionIndex) => `<li><b>${'ABCD'[optionIndex]}</b><span>${option.text}</span></li>`).join('')}</ol>` : ''}<p class="answer" data-answer><span>Resposta</span> ${item.answer}</p></li>`;
}
function blockMarkup(block) {
  const items = state.selections[block.id];
  return `<section class="quiz-block" data-block="${block.id}"><header class="block-header"><button class="collapse-button" type="button" aria-expanded="true" aria-controls="content-${block.id}"><span class="block-index">${String(block.number).padStart(2, '0')}</span><span class="block-heading"><strong>${block.title}</strong><small>${block.note} · ${items.length} ${items.length === 1 ? 'pergunta' : 'perguntas'}</small></span><span class="chevron" aria-hidden="true">⌃</span></button>${block.fixed ? '' : `<button class="regenerate-button" type="button" data-regenerate="${block.id}" aria-label="Regerar bloco ${block.number}"><span aria-hidden="true">↻</span><span>Regerar</span></button>`}</header><div class="block-content" id="content-${block.id}"><ol class="question-list">${items.map((item, index) => questionMarkup(item, index)).join('')}</ol></div></section>`;
}
function applyVisibility() { document.body.classList.toggle('hide-answers', !state.answers); document.body.classList.toggle('hide-options', !state.options); }
function bindBlockEvents() {
  $$('.collapse-button').forEach(button => button.addEventListener('click', () => { const expanded = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!expanded)); button.closest('.quiz-block').classList.toggle('collapsed', expanded); }));
  $$('[data-regenerate]').forEach(button => button.addEventListener('click', () => {
    const block = BLOCKS.find(item => item.id === button.dataset.regenerate);
    requestConfirmation(() => { state.selections[block.id] = selectFor(block); $(`[data-block="${block.id}"]`).outerHTML = blockMarkup(block); bindBlockEvents(); applyVisibility(); $(`[data-block="${block.id}"]`).classList.add('just-generated'); }, `As ${block.count} perguntas atuais do bloco “${block.title}” serão substituídas.`);
  }));
}
function render() { $('[data-blocks]').innerHTML = BLOCKS.map(blockMarkup).join(''); $('[data-round-id]').textContent = `Sorteio ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`; bindBlockEvents(); applyVisibility(); }
function generateAll() { BLOCKS.forEach(block => { state.selections[block.id] = selectFor(block); }); render(); }
function requestConfirmation(action, message) { state.pendingAction = action; $('[data-confirm-message]').textContent = message; $('[data-confirm-dialog]').showModal(); }

$$('[data-toggle]').forEach(toggle => toggle.addEventListener('change', event => { state[event.target.dataset.toggle] = event.target.checked; applyVisibility(); }));
$('[data-regenerate-all]').addEventListener('click', () => requestConfirmation(generateAll, 'Todas as perguntas da rodada atual serão substituídas por um novo sorteio.'));
$('[data-confirm-dialog]').addEventListener('close', event => { if (event.target.returnValue === 'confirm' && state.pendingAction) state.pendingAction(); state.pendingAction = null; });
generateAll();
