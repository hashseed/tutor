# Agent guide: Lern-Werkstatt

Read this first. It is short on purpose and points to the details.

## What this repo is

A family of small, interactive learning apps for a 10-year-old who attends a **German school**, published with GitHub Pages at `https://hashseed.github.io/tutor/`. The landing page (`index.html`) links to one folder per app (e.g. `brueche/`). All apps share one look through the design kit in `kit/`.

## Rules that apply to every change

1. **Everything a child sees is German**: short sentences, "du" form, friendly, precise. Use the terms of the German school (the child's schoolbook wins over any other convention). Division `:`, multiplication `·`, decimal comma `0,75`, percent with a space `75 %`.
2. **No framework, no build step, no npm.** Plain HTML, CSS and JavaScript that GitHub Pages serves as-is. Each app is one `index.html` in its own folder (it may add more files next to it).
3. **Use the kit, never re-invent it.** Link `kit/tokens.css` and `kit/kit.css`, load `kit/kit.js`, and use the existing classes and helpers. See [docs/DESIGN.md](docs/DESIGN.md).
4. **Never hard-code a colour, font or radius** in an app. Use `var(--token)` from `kit/tokens.css`. That is what makes dark mode and later restyling work.
5. **Show, then explain, then check.** Every section has an animated drawing (`.stage`), a panel that explains in words what the drawing shows (`.readout`), and a "Teste dich selbst" check where every wrong answer gets its own kind explanation.
6. **Works on a phone** (390 px wide, no sideways scrolling), in dark mode, with keyboard, and with "reduce motion" (the kit's `tween` handles that).
7. **No external resources** besides the Google Fonts link that every page already has. No trackers, no analytics.
8. **Progress lives in `localStorage`**, through `Kit.store('<prefix>')`, with one prefix per app (listed in [docs/NEW-APP.md](docs/NEW-APP.md)). All apps share the origin `hashseed.github.io`, so prefixes must never collide.

## Where to go next

| Task | Read |
| --- | --- |
| Build a new app | [docs/NEW-APP.md](docs/NEW-APP.md), then copy `vorlage/` |
| Change the look of everything | [docs/DESIGN.md](docs/DESIGN.md), section "Restyling" |
| Add or change a shared component | [docs/DESIGN.md](docs/DESIGN.md), section "Changing the kit" |
| Work on the comma app | `komma/`: rules in `komma/regeln.json`, texts in `komma/texte.json`; new texts: [komma/werkzeug/SCHREIBEN.md](komma/werkzeug/SCHREIBEN.md), check with `python3 komma/werkzeug/pruefen.py` |
| Work on the history app | `geschichte/`: questions in `geschichte/fragen.json` (format and Lernstoff in [geschichte/FRAGEN.md](geschichte/FRAGEN.md)), animated stages in `geschichte/buehnen.js`, engine in `geschichte/app.js` |
| Work on the fractions app | `brueche/` and its own notes; move plan in [docs/MOVE-FRACTIONS.md](docs/MOVE-FRACTIONS.md) |

## Checking your work

Serve the repo root (`python3 -m http.server 8000`) and open the page in a browser, at 1280 px and 390 px wide, light and dark. With Playwright, emulate `colorScheme: 'dark'`, check `document.documentElement.scrollWidth <= 390`, and log `pageerror` and console errors; there must be none. Open `kit/galerie.html` after any kit change.
