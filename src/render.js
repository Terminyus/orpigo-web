// Pure string renderers for list content. Used in the browser on language
// change and at build time (vite.config.js) to pre-render Turkish HTML, so
// the page has real content before JS runs.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const icons = {
  exam: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5',
  report: 'M5 20V10M10 20V4M15 20v-7M20 20v-4M3 20h19',
  contract: 'M7 3h10v18H7zM10 8h4M10 12h4M9 17c1.5-1.5 2.5 1 4 0s2 .5 2 .5',
  article: 'M4 5h16M4 10h16M4 15h10M4 20h7',
  thesis: 'M3 9l9-5 9 5-9 5-9-5zM7 11v5c3 2 7 2 10 0v-5',
  novel: 'M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1zM20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1z',
  manual: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  slides: 'M3 4h18v12H3zM12 16v4M8 20h8',
  newsletter: 'M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4',
};
const icon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[id] || icons.article}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const renderers = {
  faq: (t) => t('faq.items').map(([q, a]) => `
    <details class="faq__item"><summary><span>${esc(q)}</span><i aria-hidden="true"></i></summary><p>${esc(a)}</p></details>`).join(''),

  premium: (t) => `
    <article class="plan">
      <h3>${esc(t('premium.free'))}</h3>
      <ul>${t('premium.freeItems').map((x) => `<li>${check}${esc(x)}</li>`).join('')}</ul>
    </article>
    <article class="plan plan--pro">
      <h3>${esc(t('premium.pro'))}</h3>
      <ul>${t('premium.proItems').map((x) => `<li>${check}${esc(x)}</li>`).join('')}</ul>
    </article>`,

  tour: (t) => t('tour.steps').map((s, i) => `
    <li class="tour__step" data-step="${i}">
      <span class="tour__num">${String(i + 1).padStart(2, '0')}</span>
      <h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>
    </li>`).join(''),

  life: (t) => t('life.cards').map((c) => `
    <li><button type="button" class="life-card" data-card="${c.id}">
      ${icon(c.id)}<strong>${esc(c.title)}</strong><small>${esc(c.kind)}</small>
    </button></li>`).join(''),

  classics: (t) => t('classics.items').map((c, i) => `
    <li><button type="button" class="book" data-book="${i}" aria-pressed="false">
      <span class="book__author">${esc(c.author)}</span>
      <span class="book__work">${esc(c.work)}</span>
      <span class="book__meta">${esc(c.year)} · ${esc(t('classics.died').replace('{y}', c.died))}</span>
    </button></li>`).join(''),

  ticker: (t) => {
    const items = t('brief.ticker');
    const row = items.map((x, i) => `<span${i === 0 ? ' class="tick__tag"' : ''}>${esc(x)}</span>`).join('<i aria-hidden="true">•</i>');
    return `<div class="tick__track"><div class="tick__row">${row}</div><div class="tick__row" aria-hidden="true">${row}</div></div>`;
  },

  rules: (t) => `
    <thead><tr>${t('orp.ruleHead').map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t('orp.rules').map(([a, b], i) => `<tr data-rule="${i}"><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody>`,

  tourAlt: (t, b = '/') => t('tour.steps').map((s, i) => `
    <picture class="tour__shot${i === 0 ? ' is-active' : ''}" data-shot="${i}">
      <source srcset="${b}img/${s.img}.avif" type="image/avif">
      <img src="${b}img/${s.img}.webp" width="440" height="${s.img.startsWith('android') ? 871 : 956}" alt="${esc(s.alt)}" loading="lazy" decoding="async">
    </picture>`).join(''),
};

export function renderAll(t, base = '/', root = document) {
  root.querySelectorAll('[data-render]').forEach((el) => {
    const fn = renderers[el.dataset.render];
    if (fn) el.innerHTML = fn(t, base);
  });
}
