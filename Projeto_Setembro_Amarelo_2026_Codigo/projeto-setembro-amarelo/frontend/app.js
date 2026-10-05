'use strict';
const container = document.getElementById('campaign');
let narrator = null;
let locale;
let recordings = {};
let campaigns = [];
let selectedMonth = 9;
let languageSequence = 0;
const localeCache = new Map();
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
  const terms = [...new Set(['Setembro', locale?.campaigns['9'].name].filter(Boolean))];
  const pattern = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const september = new RegExp(pattern, 'giu');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => terms.some(term => node.textContent.toLocaleLowerCase().includes(term.toLocaleLowerCase())) &&
      !node.parentElement.closest('button, a, script, style, title, textarea')
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;
    let start = 0;
    for (const match of text.matchAll(september)) {
      fragment.append(document.createTextNode(text.slice(start, match.index)));
      const button = element('button', match[0], 'september-trigger');
      button.type = 'button';
      button.setAttribute('aria-label', `${match[0]}: ${locale.ui.smokeAction}`);
      button.title = locale.ui.smokeAction;
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
function cancelReading() { narrator?.dispose(); narrator = null; }
async function showMonth(month, moveFocus = false) {
  selectedMonth = month;
  const sequence = ++requestSequence;
  cancelReading();
  container.setAttribute('aria-busy', 'true');
  container.replaceChildren(element('p', locale.ui.loading));
  document.querySelectorAll('[data-month]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.month) === month)));
  const months = document.getElementById('months');
  const selected = months.querySelector('[aria-pressed="true"]');
  if (selected && months.scrollWidth > months.clientWidth) {
    months.scrollLeft = selected.offsetLeft - months.offsetLeft - (months.clientWidth - selected.offsetWidth) / 2;
  }
  try {
    const original = await json(`/api/campaigns/${month}`);
    const c = locale.lang === 'pt-BR' ? original : {...original, ...locale.campaigns[String(month)]};
    if (sequence !== requestSequence) return;
    container.replaceChildren();
    const title = element('h2', `${c.name} ${c.color.toLowerCase()}`);
    title.tabIndex = -1; container.append(title);
    paragraph(c.theme, container, 'campaign-theme');
    paragraph(`${c.summary} ${refs(c.sources.map(s => s.id))}`, container, 'campaign-summary');
    sectionTitle(locale.ui.purposeTitle, container);
    paragraph(c.purpose, container);
    if (c.history) {
      sectionTitle(locale.ui.historyTitle, container);
      const list = element('ol', undefined, 'timeline');
      c.history.forEach(item => {
        const li = element('li'); li.append(element('strong', item.year));
        paragraph(`${item.text} ${refs(item.source_ids)}`, li); list.append(li);
      });
      container.append(list);
      sectionTitle(locale.ui.evidenceTitle, container);
      const evidence = element('p', c.evidence_note);
      if (c.evidence_link) {
        const {text, url} = c.evidence_link;
        const position = c.evidence_note.indexOf(text);
        if (position !== -1) {
          const link = element('a'); link.append(element('strong', text));
          link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          evidence.replaceChildren(c.evidence_note.slice(0, position), link,
            c.evidence_note.slice(position + text.length));
        }
      }
      container.append(evidence);
      sectionTitle(locale.ui.careTitle, container);
      const ul = element('ul'); c.care.forEach(t => ul.append(element('li', t))); container.append(ul);
      paragraph(`${locale.ui.careSource} ${refs(c.care_source_ids)}`, container);
      const actions = element('div', undefined, 'support-actions');
      const help = element('a', locale.ui.helpLink, 'primary-link'); help.href = '#ajuda';
      const suggestion = element('a', locale.ui.suggestion, 'support-link');
      suggestion.href = 'https://www.mikaweiai.com.br/';
      suggestion.target = '_blank'; suggestion.rel = 'noopener noreferrer';
      const arrow = element('span', '↗'); arrow.setAttribute('aria-hidden', 'true');
      suggestion.append(arrow);
      actions.append(help, suggestion); container.append(actions);
    }
    narrator = createNarrator(c, locale, recordings[locale.lang]);
    container.append(narrator.element);
    sectionTitle(locale.ui.sourcesTitle, container);
    const sources = element('ul', undefined, 'sources');
    c.sources.forEach(s => {
      const li = element('li');
      const label = `[${s.id}] ${s.institution} · ${s.title} (${s.year})`;
      const hasSeptember = /\bsetembro\b/i.test(label);
      const a = element('a', hasSeptember ? locale.ui.openSource : label);
      if (hasSeptember) li.append(element('span', label), document.createTextNode(' · '));
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); sources.append(li);
    });
    container.append(sources);
    paragraph(`${locale.ui.reviewed} ${new Intl.DateTimeFormat(locale.lang, {timeZone: 'UTC'}).format(new Date(c.reviewed_on + 'T00:00:00Z'))}.`, container, 'review-date');
    addSeptemberButtons(container);
    if (moveFocus) title.focus({preventScroll: true});
  } catch (error) {
    if (sequence !== requestSequence) return;
    container.replaceChildren(element('p', locale.ui.loadError));
    const retry = element('button', locale.ui.retry); retry.type = 'button';
    retry.addEventListener('click', () => showMonth(month)); container.append(retry);
  } finally {
    if (sequence === requestSequence) container.setAttribute('aria-busy', 'false');
  }
}
function renderMonths() {
  const months = document.getElementById('months');
  months.replaceChildren();
  campaigns.forEach(c => {
    const translated = locale.lang === 'pt-BR' ? c : locale.campaigns[String(c.month)];
    const button = element('button'); button.type = 'button'; button.dataset.month = c.month;
    const number = element('span', String(c.month).padStart(2, '0'), 'month-number');
    number.setAttribute('aria-hidden', 'true');
    const label = element('span', undefined, 'month-label');
    label.append(element('span', translated.name), element('small', translated.color));
    button.append(number, label);
    button.setAttribute('aria-pressed', String(c.month === selectedMonth));
    button.addEventListener('click', () => {
      monthSmoke.play(c.color, c.month);
      showMonth(c.month, true);
    });
    months.append(button);
  });
}
function applyLocale() {
  document.documentElement.lang = locale.lang;
  document.title = locale.ui.pageTitle;
  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = locale.ui[node.dataset.i18n];
  });
  document.querySelector('.intro-emblem').alt = locale.ui.emblemAlt;
  document.getElementById('campanhas').setAttribute('aria-label', locale.ui.campaignsLabel);
  document.querySelector('.calendar').setAttribute('aria-label', locale.ui.monthsLabel);
  document.querySelector('.persistent-support').setAttribute('aria-label', locale.ui.whereHelp);
  addSeptemberButtons(document.querySelector('header'));
  addSeptemberButtons(document.querySelector('.intro'));
}
async function loadLocale(lang) {
  if (!localeCache.has(lang)) localeCache.set(lang, await json(`/locales/${lang}.json`));
  return localeCache.get(lang);
}
async function init() {
  const select = document.getElementById('language');
  select.disabled = true;
  try {
    let initial = 'pt-BR';
    const requested = new URL(window.location.href).searchParams.get('lang');
    try {
      const saved = localStorage.getItem('site-language');
      if ([...select.options].some(option => option.value === saved)) initial = saved;
    } catch (_) { /* Browsing without storage remains supported. */ }
    if ([...select.options].some(option => option.value === requested)) initial = requested;
    locale = await loadLocale(initial).catch(() => loadLocale('pt-BR'));
    select.value = locale.lang;
    applyLocale();
    [campaigns, recordings] = await Promise.all([
      json('/api/campaigns'), json('/assets/audio/manifest.json').catch(() => ({}))
    ]);
    renderMonths();
    await showMonth(selectedMonth);
    select.disabled = false;
  } catch (error) {
    container.setAttribute('aria-busy', 'false');
    container.replaceChildren(element('p', locale?.ui.serverError || 'O servidor não respondeu. Reinicie o projeto e recarregue a página.'));
  }
  select.addEventListener('change', async () => {
    const sequence = ++languageSequence;
    const status = document.getElementById('language-status');
    cancelReading();
    status.textContent = locale.ui.loading;
    try {
      const next = await loadLocale(select.value);
      if (sequence !== languageSequence) return;
      locale = next;
      applyLocale(); renderMonths();
      await showMonth(selectedMonth);
      if (sequence !== languageSequence) return;
      status.textContent = locale.ui.languageChanged;
      const url = new URL(window.location.href);
      url.searchParams.set('lang', locale.lang);
      window.history.replaceState(null, '', url);
      try { localStorage.setItem('site-language', locale.lang); } catch (_) {}
    } catch (error) {
      if (sequence !== languageSequence) return;
      select.value = locale.lang; status.textContent = locale.ui.languageError;
    }
  });
}
const supportBar = document.querySelector('.persistent-support');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--support-height', `${supportBar.getBoundingClientRect().height}px`);
}).observe(supportBar);
window.addEventListener('pagehide', cancelReading);
document.addEventListener('click', event => {
  if (event.target.closest('.september-trigger')) monthSmoke.play('Amarelo', 9);
});
init();
