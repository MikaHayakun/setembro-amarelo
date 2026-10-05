'use strict';
const container = document.getElementById('campaign');
let currentText = '';
let requestSequence = 0;
function element(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function paragraph(text, parent, className) { parent.append(element('p', text, className)); }
function sectionTitle(text, parent) { parent.append(element('h3', text)); }
function refs(ids) { return ids.map(id => `[${id}]`).join(' '); }
function addSeptemberButtons(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => /\bsetembro\b/i.test(node.textContent) &&
      !node.parentElement.closest('button, a, script, style, title, textarea')
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;
    let start = 0;
    for (const match of text.matchAll(/\bsetembro\b/gi)) {
      fragment.append(document.createTextNode(text.slice(start, match.index)));
      const button = element('button', match[0], 'september-trigger');
      button.type = 'button';
      button.setAttribute('aria-label', `${match[0]}: acionar fumaça amarela nos quatro cantos por 12 segundos`);
      button.title = 'Acionar fumaça amarela por 12 segundos';
      fragment.append(button);
      start = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(start)));
    node.replaceWith(fragment);
  });
}
async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível carregar o conteúdo.');
  return response.json();
}
function cancelSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
async function showMonth(month, moveFocus = false) {
  const sequence = ++requestSequence;
  cancelSpeech();
  container.setAttribute('aria-busy', 'true');
  container.replaceChildren(element('p', 'Carregando o conteúdo...'));
  document.querySelectorAll('[data-month]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.month) === month)));
  const months = document.getElementById('months');
  const selected = months.querySelector('[aria-pressed="true"]');
  if (selected && months.scrollWidth > months.clientWidth) {
    months.scrollLeft = selected.offsetLeft - months.offsetLeft - (months.clientWidth - selected.offsetWidth) / 2;
  }
  try {
    const c = await json(`/api/campaigns/${month}`);
    if (sequence !== requestSequence) return;
    container.replaceChildren();
    container.append(element('p', c.color, 'eyebrow'));
    const title = element('h2', `${c.name} ${c.color.toLowerCase()}`);
    title.tabIndex = -1; container.append(title);
    paragraph(c.theme, container, 'campaign-theme');
    const smoke = element('button', `Acionar fumaça de ${c.name}`, 'smoke-button');
    smoke.type = 'button';
    smoke.dataset.smokeMonth = c.month;
    smoke.addEventListener('click', () => monthSmoke.play(c.color, c.month));
    container.append(smoke);
    paragraph(`${c.summary} ${refs(c.sources.map(s => s.id))}`, container, 'campaign-summary');
    sectionTitle('Por que a campanha existe', container);
    paragraph(c.purpose, container);
    if (c.history) {
      sectionTitle('Uma história com marcos diferentes', container);
      const list = element('ol', undefined, 'timeline');
      c.history.forEach(item => {
        const li = element('li'); li.append(element('strong', item.year));
        paragraph(`${item.text} ${refs(item.source_ids)}`, li); list.append(li);
      });
      container.append(list);
      sectionTitle('O que a ciência permite afirmar', container);
      paragraph(c.evidence_note, container);
      sectionTitle('Como oferecer apoio', container);
      const ul = element('ul'); c.care.forEach(t => ul.append(element('li', t))); container.append(ul);
      paragraph(`Orientações gerais da OMS. ${refs(c.care_source_ids)}`, container);
      const help = element('a', 'Ver canais de ajuda no Brasil', 'primary-link'); help.href = '#ajuda'; container.append(help);
    }
    const tools = element('div', undefined, 'tools');
    const speak = element('button', 'Ouvir texto'); speak.type = 'button';
    const stop = element('button', 'Parar leitura'); stop.type = 'button';
    const status = element('span'); status.setAttribute('role', 'status');
    currentText = `${c.name}. ${c.theme}. ${c.summary}. ${c.purpose}. ` +
      (c.history ? c.history.map(i => `${i.year}. ${i.text}`).join(' ') + ' ' + c.evidence_note + ' ' + c.care.join(' ') : '');
    speak.addEventListener('click', () => {
      cancelSpeech();
      if (!('speechSynthesis' in window)) { status.textContent = 'A leitura por voz não está disponível neste navegador.'; return; }
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => /^pt-BR$/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang));
      if (!voice) { status.textContent = 'Não há voz em português disponível neste navegador. O texto continua disponível para leitura.'; return; }
      const utterance = new SpeechSynthesisUtterance(currentText.replace(/\[\d+\]/g, ''));
      utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = 0.95;
      utterance.onend = () => { status.textContent = 'Leitura concluída.'; };
      utterance.onerror = () => { status.textContent = 'A voz não pôde ser reproduzida.'; };
      status.textContent = 'Lendo o texto...'; window.speechSynthesis.speak(utterance);
    });
    stop.addEventListener('click', () => { cancelSpeech(); status.textContent = 'Leitura interrompida.'; });
    tools.append(speak, stop, status); container.append(tools);
    sectionTitle('Fontes para consultar', container);
    const sources = element('ul', undefined, 'sources');
    c.sources.forEach(s => {
      const li = element('li');
      const label = `[${s.id}] ${s.institution} · ${s.title} (${s.year})`;
      const hasSeptember = /\bsetembro\b/i.test(label);
      const a = element('a', hasSeptember ? 'Abrir fonte ↗' : label);
      if (hasSeptember) li.append(element('span', label), document.createTextNode(' · '));
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); sources.append(li);
    });
    container.append(sources);
    paragraph(`Conteúdo revisado em ${c.reviewed_on.split('-').reverse().join('/')}.`, container, 'review-date');
    addSeptemberButtons(container);
    if (moveFocus) title.focus({preventScroll: true});
  } catch (error) {
    if (sequence !== requestSequence) return;
    container.replaceChildren(element('p', 'O conteúdo não pôde ser carregado. Os canais de ajuda continuam disponíveis abaixo.'));
    const retry = element('button', 'Tentar novamente'); retry.type = 'button';
    retry.addEventListener('click', () => showMonth(month)); container.append(retry);
  } finally {
    if (sequence === requestSequence) container.setAttribute('aria-busy', 'false');
  }
}
async function init() {
  try {
    const campaigns = await json('/api/campaigns');
    campaigns.forEach(c => {
      const button = element('button'); button.type = 'button'; button.dataset.month = c.month;
      const number = element('span', String(c.month).padStart(2, '0'), 'month-number');
      number.setAttribute('aria-hidden', 'true');
      const label = element('span', undefined, 'month-label');
      label.append(element('span', c.name), element('small', c.color));
      button.append(number, label);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        monthSmoke.play(c.color, c.month);
        showMonth(c.month, true);
      });
      document.getElementById('months').append(button);
    });
    await showMonth(9);
  } catch (error) {
    container.setAttribute('aria-busy', 'false');
    container.replaceChildren(element('p', 'O servidor não respondeu. Reinicie o projeto e recarregue a página.'));
  }
}
window.addEventListener('beforeunload', cancelSpeech);
document.addEventListener('click', event => {
  if (event.target.closest('.september-trigger')) monthSmoke.play('Amarelo', 9);
});
addSeptemberButtons(document.body);
init();
