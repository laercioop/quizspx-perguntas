const fs = require('fs');
const vm = require('vm');

const sources = [
  ['general', 'perguntas/perguntas-conhecimentos-gerais-festa-sao-pio-x-revisado.txt'],
  ['sports', 'perguntas/perguntas-esportes-festa-sao-pio-x-revisado.txt'],
  ['portuguese', 'perguntas/perguntas-lingua-portuguesa-festa-sao-pio-x-revisado.txt']
];

function parseBank(topic, file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const answerSection = text.split(/\nGabarito\s*\n/i)[1];
  const answers = Object.fromEntries([...answerSection.matchAll(/(\d+)\.\s*([a-d])/gi)].map(match => [Number(match[1]), match[2].toLowerCase().charCodeAt(0) - 97]));
  let difficulty = 'easy';
  const items = [];
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^Gabarito$/i.test(line)) break;
    if (/^Fácil$/i.test(line)) difficulty = 'easy';
    else if (/^Médio$/i.test(line)) difficulty = 'medium';
    else if (/^Médio-Difícil$/i.test(line)) difficulty = 'medium-hard';
    else if (/^Difícil$/i.test(line)) difficulty = 'hard';
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (!match) continue;
    const number = Number(match[1]);
    let optionText = '';
    for (index += 1; index < lines.length; index += 1) {
      const next = lines[index].trim();
      if (/^(Fácil|Médio|Médio-Difícil|Difícil|Gabarito)$/i.test(next) || /^\d+\.\s+/.test(next)) { index -= 1; break; }
      optionText += ` ${next}`;
    }
    const options = optionText.trim().split(/(?:^|\s)[a-d]\)\s*/i).filter(Boolean).map(option => option.trim());
    if (options.length !== 4 || answers[number] === undefined) throw new Error(`Falha ao processar ${file}, questão ${number}`);
    items.push({ id: `${topic}-${number}`, topic, difficulty, question: match[2], answer: options[answers[number]], options });
  }
  return items;
}

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync('questions.js', 'utf8'), sandbox);
const quotes = sandbox.window.QUIZ_QUESTIONS.filter(item => item.categoryName === 'Quem disse essa frase?').map((item, index) => ({
  id: `quote-${index + 1}`, topic: 'quotes', difficulty: 'medium', question: item.question, answer: item.answer, options: item.options
}));
const questions = [...sources.flatMap(source => parseBank(...source)), ...quotes];
fs.writeFileSync('presenter-data.js', `window.PRESENTER_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Banco gerado: ${questions.length} perguntas.`);
