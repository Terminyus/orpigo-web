import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/reader.css';
import './styles/layout.css';
import './styles/sections.css';

import { apply, onLang, t } from './i18n/index.js';
import { renderAll } from './render.js';
import * as store from './state.js';
import { initChrome } from './chrome.js';
import { initHero } from './sections/hero.js';
import { initHow } from './sections/how.js';
import { initOrp } from './sections/orp.js';
import { initTest } from './sections/test.js';
import { initCalc } from './sections/calc.js';
import { initLife } from './sections/life.js';
import { initClassics } from './sections/classics.js';
import { initBrief } from './sections/brief.js';
import { initTry } from './sections/try.js';
import { initTour } from './sections/tour.js';
import { initPersonal, loadUiFont } from './sections/personal.js';
import { initFinal } from './sections/final.js';
import { reveal } from './sections/util.js';

const BASE = import.meta.env.BASE_URL;

// Lists first, so section modules registered below see fresh DOM on language change.
const rerender = () => { renderAll(t, BASE); apply(); document.title = t('meta.title'); };
onLang(rerender);
rerender();
loadUiFont(store.get('uiFont'));

initChrome();
for (const init of [initHero, initHow, initOrp, initTest, initCalc, initLife, initClassics, initBrief, initTry, initTour, initPersonal, initFinal]) {
  try { init(); } catch (err) { console.error(err); }
}
reveal();
