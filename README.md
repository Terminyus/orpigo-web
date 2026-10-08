# orpigo-web

New orpigo.com, built from scratch. **Preview only:** https://terminyus.github.io/orpigo-web/

The live site (orpigo.com server, hosting, DNS) is not touched by this repo.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/orpigo-web/
npm test         # RSVP engine unit tests
npm run build    # → dist/
npm run images   # rebuild public/img from assets-src + ~/Desktop/Orpigo store screenshots
```

- `src/rsvp/` — the RSVP engine. `orp.js` and `timing.js` are 1:1 ports of
  `lib/core/speed_reader_engine.dart` and `lib/core/constants/app_constants.dart`.
  Every demo on the site goes through `createReader()` in `src/rsvp/index.js`.
- `src/i18n/tr.json`, `src/i18n/en.json` — all copy.
- `docs/brand.md` — colours, fonts and algorithm extracted from the app.
- `docs/plan.md` — section plan and what each animation explains.

Pushing to `main` runs `.github/workflows/pages.yml` (tests → build → Pages).

## Going live (only after approval)

1. **Remove preview blockers**
   - delete `<meta name="robots" content="noindex, nofollow">` from every HTML page
   - replace `public/robots.txt` with `User-agent: *` / `Allow: /` / `Sitemap: https://orpigo.com/sitemap.xml`
   - remove the "Preview build" line in the footer (`footer.preview`)
2. **Build for the root path:** `BASE=/ npm run build`
3. **Check preserved URLs** exist in `dist/`: `/blog/` (+3 posts), `/privacy/`, `/terms/`, `/support/`, `/delete-account/`.
4. **Analytics:** the current privacy policy mentions GA4 on orpigo.com. The preview has no analytics.
   Add the GA4 tag (and a consent banner if required) before going live, or update the policy.
5. Back up the current server files, then upload `dist/` to the orpigo.com web root
   (the server-side `/api/` path must stay untouched).
6. Smoke-test: home, every preserved URL, store links, TR/EN, dark mode, mobile.
