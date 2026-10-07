# Moving the fractions app into this repo

Status (2026-10-07): **copied, not yet on the kit.** After the schoolbook rebuild ("Brüche und Dezimalbrüche", Kapitel 1–5) the finished app was copied unchanged into `brueche/index.html` (steps 1 and 6 done), and the landing card links there. It still carries its own copy of the styles and has no link back to the overview. Steps 2–5, 7 and 8 are open. The app's working source is assembled from `prototype/src` (`build.py`) in the project's shared files, with `doctype`/charset/viewport lines prepended, and is published as `brueche/index.html` here.

## Steps

1. **Copy the app.** Put the finished `index.html` from `fraction-tutor` into `brueche/index.html` (keep it a single file; history stays in the old repo).
2. **Link the kit.** In `<head>` add `../kit/logo.svg` (icon), `../kit/tokens.css` and `../kit/kit.css` after the Google Fonts link.
3. **Delete what the kit now provides** from the app's `<style>`: the `:root` token blocks (light and both dark blocks), base rules (`*`, `[hidden]`, `body`, `.wrap`, `button`, `:focus-visible`), and the generic components (`.navbar` and its parts, `.mod-head`, `.eyebrow`, `.lede`, `.lab`, `.stage`, `.hint`, `.panel`, `.controls`, `.ctl*`, `.stepper`, `.step`, `.seg`, `.actions`, `.btn*`, `.readout`, `.check` and quiz parts, `.term`, `.gloss`, `.gcard`, `.frac`, `.mixed`). Keep everything fraction-specific (cookies, plates, number-line pieces, games, tests layout) and its tokens (`--cookie`, `--cookie-edge`, `--chip`) in the app.
   - The app's `--piece*` names keep working: `tokens.css` defines them as aliases of `--accent*`. Renaming them to `--accent*` is optional cleanup.
   - The app's old `.navbar .unit`/`.navbar .tab` overrides become the kit's `.unit`/`.tab` rules; the kit selectors are the same class names, so markup does not change.
   - Remove the app's `.tabs{grid-template-columns…!important}` and the old non-navbar `.tab`/`.unit` card styles; the kit replaces them.
4. **Home link.** Replace the logo `<svg class="nav-logo">` at the start of the navbar with
   `<a class="nav-home" href="../" title="Zur Übersicht"><img class="logo" src="../kit/logo.svg" width="30" height="30" alt=""><b>Übersicht</b></a>`.
   Rename the "Fachbegriffe" part's extra class `gl` to `end` (or keep `gl` and add `end`).
5. **JS (optional, can be later).** The app defines its own `$`, `S`, `tween`, `makeStepper`, `makeSeg`, `mountCheck` globals. They can stay. To share them, load `../kit/kit.js` and replace the generic helpers with `const { $, S, … } = Kit;`. Note: `Kit.mountCheck(host, items, opts)` has no `key` argument; the app's score saving goes into `opts.onDone`, and "next module" into `opts.next`. Also take over the kit's `tween` fix (progress clamped to ≥ 0; rAF timestamps can be slightly earlier than `performance.now()`, which gave negative SVG radii).
6. **Landing card.** In `index.html`, change the Brüche card's `href` to `brueche/`.
7. **Check** every part (all modules, Tests, Spiele, Fachbegriffe) at 1280 and 390 px, light and dark, against the old site side by side; no console errors.
8. **Redirect the old address.** Replace `fraction-tutor`'s `index.html` with a short page that sends visitors on, keeping any `#hash`:
   ```html
   <!doctype html><meta charset="utf-8"><title>Bruch-Werkstatt ist umgezogen</title>
   <meta http-equiv="refresh" content="0; url=https://hashseed.github.io/tutor/brueche/">
   <script>location.replace('https://hashseed.github.io/tutor/brueche/' + location.hash)</script>
   <p>Die Bruch-Werkstatt ist umgezogen: <a href="https://hashseed.github.io/tutor/brueche/">hashseed.github.io/tutor/brueche</a></p>
   ```
   Then update `fraction-tutor`'s README to point to the new repo (or archive the repo).

## Progress is kept

Saved progress (`localStorage` keys `bw-*`: module scores, ready games, best game scores, tests) belongs to the origin `https://hashseed.github.io`, which both addresses share. So scores carry over without any migration code, as long as the key names stay the same.
