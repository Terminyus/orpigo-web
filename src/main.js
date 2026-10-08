import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/reader.css';
import './styles/layout.css';

import { apply, setLang, getLang, onLang, t } from './i18n/index.js';
import * as store from './state.js';
import { initChrome } from './chrome.js';
import { initHero } from './sections/hero.js';

apply();
initChrome();
initHero();

onLang(() => { document.title = t('meta.title'); });
document.title = t('meta.title');
