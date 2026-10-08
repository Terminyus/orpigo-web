// 9 · Your own text. Paste or open a small PDF; everything stays in the browser.
// pdf.js is loaded only when a file is chosen.
import { createReader, tokenize } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import { $ } from './util.js';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 30;

async function pdfText(file) {
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const pages = Math.min(doc.numPages, MAX_PAGES);
  let text = '';
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const c = await page.getTextContent();
    text += c.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n';
  }
  await doc.destroy();
  // Re-join words hyphenated across line ends.
  return { text: text.replace(/(\p{L})-\n(\p{L})/gu, '$1$2'), pages };
}

export function initTry() {
  const sec = $('#try');
  if (!sec) return;
  const area = $('#try-text');
  const status = $('.try__status', sec);
  const reader = createReader($('#try-reader'), { text: '', wpm: 300 });
  reader.root.hidden = true;

  function read() {
    const words = tokenize(area.value);
    if (!words.length) { status.textContent = t('try.empty'); area.focus(); return; }
    status.textContent = t('try.words', { n: words.length });
    reader.root.hidden = false;
    reader.load(words, { autoplay: true });
    reader.root.querySelector('.rsvp').focus({ preventScroll: true });
  }

  $('[data-act=read]', sec).addEventListener('click', read);
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) read(); });

  $('#try-pdf').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { status.textContent = t('try.pdfTooBig'); return; }
    status.textContent = t('try.pdfLoading');
    try {
      const { text, pages } = await pdfText(file);
      const n = tokenize(text).length;
      if (!n) throw new Error('empty');
      area.value = text.replace(/[ \t]+\n/g, '\n').trim();
      read();
      status.textContent = t('try.pdfDone', { w: n, p: pages });
    } catch {
      status.textContent = t('try.pdfError');
    }
  });
  onLang(() => { status.textContent = ''; });
}
