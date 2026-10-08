# orpigo-web

The new orpigo.com, built from scratch. **Preview only:** https://terminyus.github.io/orpigo-web/

This repo never touches the live site (orpigo.com server, hosting or DNS).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/orpigo-web/
npm test           # RSVP engine unit tests (Vitest)
npm run build      # preview build → dist/ (base /orpigo-web/, noindex)
npm run images     # rebuild public/img from assets-src + ~/Desktop/Orpigo store screenshots
python3 -I scripts/check_links.py          # broken-link scan over dist/
```

| Path | What |
|---|---|
| `src/rsvp/` | RSVP engine. `orp.js` and `timing.js` are 1:1 ports of `lib/core/speed_reader_engine.dart` and `app_constants.dart`. Every demo uses `createReader()` from `index.js`. |
| `src/sections/` | One module per home-page section (2–14). |
| `src/i18n/tr.json`, `en.json` | All copy. Section copy is edited in `scripts/content_tr.py` / `content_en.py` and merged with `python3 -I scripts/build_i18n.py`. |
| `partials/` | Shared head/header/footer/store buttons and the home sections, stitched in by `vite.config.js`, which also pre-renders Turkish text into the HTML. |
| `privacy/`, `terms/`, `support/`, `delete-account/`, `blog/` | Pages migrated from orpigo.com by `scripts/migrate.py` (text unchanged). |
| `docs/` | `brand.md` (tokens, fonts, algorithm), `plan.md`, `copyright.md`, `credits.md`, `lighthouse/`. |

Pushing to `main` runs `.github/workflows/pages.yml`: tests → build → GitHub Pages.

## Going live (only after Candemsoft approves)

1. **Build for the root path with preview blockers removed:**
   ```bash
   LIVE=1 npm run build
   ```
   `LIVE=1` sets `base: '/'`, removes `noindex` from every page (the 404 page keeps it),
   removes the "Önizleme sürümü" footer line and writes the real `robots.txt`
   (`Allow: /` + sitemap). Check: `grep -r noindex dist --include=index.html` must print nothing.
2. **Check the preserved URLs** exist in `dist/`: `/blog/` (+3 posts), `/privacy/`, `/terms/`, `/support/`, `/delete-account/`.
   The App Store and Google Play listings link to these.
3. **Analytics:** the privacy policy says orpigo.com uses Google Analytics (GA4). The new site has no analytics.
   Before going live, either add the GA4 tag (with consent handling if required) or update the policy text.
4. **Back up** the current web root on the server, then upload the **contents** of `dist/` to it.
   Leave the server-side `/api/` path untouched (the app uses `https://orpigo.com/api/...`).
5. **Smoke test** on the live domain: home, each preserved URL, store links, TR/EN (`?lang=en`), dark mode,
   a phone, `https://orpigo.com/robots.txt`, `https://orpigo.com/sitemap.xml`, OG preview in a link debugger.
6. Run `python3 -I scripts/check_links.py --base /` against the live build and Lighthouse on the live URL.
