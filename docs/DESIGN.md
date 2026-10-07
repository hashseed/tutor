# Design system ("kit")

Everything that makes the apps look and feel the same lives in `kit/`:

| File | What it holds |
| --- | --- |
| `kit/tokens.css` | Design tokens: every colour, font, size, radius, shadow, as CSS custom properties. Light and dark values. |
| `kit/kit.css` | Base styles and components (navigation bar, cards, stage, controls, buttons, quiz, glossary, landing cards, SVG primitives). Uses only tokens. |
| `kit/kit.js` | Shared helpers on `window.Kit`: DOM/SVG creation, animation, storage, stepper, segmented control, quiz. |
| `kit/logo.svg` | Site logo and favicon. |
| `kit/galerie.html` | Living style guide: every token and component, with a light/dark switch. The source of truth for "what does X look like". |

## Why no framework

The apps are hand-drawn SVG animations plus a few controls. A framework (React, Vue, Svelte…) would add a build step and tooling to every change while helping with none of the actual work (the animations). Plain files keep GitHub Pages deployment trivial, and any agent can edit an app by opening one file. CSS custom properties already give us theming. Revisit only if apps start sharing complex stateful UI; even then, prefer native Web Components (still no build) before a framework.

## Page skeleton

Every page links the kit like this (paths relative to the page; an app in `/<app>/` uses `../kit/`):

```html
<link rel="icon" href="../kit/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap">
<link rel="stylesheet" href="../kit/tokens.css">
<link rel="stylesheet" href="../kit/kit.css">
…
<script src="../kit/kit.js"></script>
<script>const { $, S, tween, makeStepper, mountCheck, store } = Kit; …</script>
```

## Tokens

Use tokens for every colour, font and radius. Never write `#hex`, `rgb()` or a font name in an app.

| Token | Use |
| --- | --- |
| `--paper` | Page background |
| `--card` | Cards, stage, panels; also the "empty" fill of drawn shapes |
| `--plate` | Recessed area inside a card |
| `--ink` | Text, outlines of drawings, the dark `.btn` |
| `--muted` | Secondary text, captions, labels |
| `--line` | Borders, dividers, empty slots |
| `--accent` / `--accent-soft` / `--on-accent` | Primary colour: selected states, links, filled parts of drawings / hover and light highlight / text on accent |
| `--sun` / `--sun-soft` / `--on-sun` | Main action button (`.btn.go`), focus ring, markers on drawings (beads) / tip boxes / text on sun |
| `--good`, `--good-soft`, `--bad`, `--bad-soft` | Right / wrong feedback |
| `--subj-1` … `--subj-4` | One colour per subject, for landing cards (`style="--c:var(--subj-2)"`) |
| `--display` | Headings, numbers, big fractions (Bricolage Grotesque) |
| `--body` | All other text (Atkinson Hyperlegible, chosen for legibility) |
| `--fs-*` | Type scale: body 17, small 14, label 12, lede 19, prompt 21, h3 24, h2 28–40 |
| `--bw` | Border width (2px) |
| `--r-sm` 12 / `--r-md` 16 / `--r-lg` 22 / `--r-pill` | Inputs / options and tiles / cards and stage / buttons and pills |
| `--page-max`, `--gutter`, `--gap` | Page width, side padding, section gap |
| `--piece`, `--piece-soft`, `--on-piece` | Aliases of the accent tokens, kept for the fractions app. Don't use in new apps. |

App-specific tokens (e.g. the fractions app's cookie colours) belong in the app's own `<style>` block, defined for light and dark in the same pattern as `tokens.css`, and named with the app prefix.

## Components (kit.css)

See them live in `kit/galerie.html`.

- **Navigation bar** `.navbar` (sticky). Row 1 `.nav-row`: `.nav-home` (logo + "Übersicht", links to `../`), `.units` with `.unit` buttons for the app's parts (`aria-pressed="true"` for the current one; add `.end` to push one to the right, e.g. "Fachbegriffe"). Row 2 `.nav-row.sub`: `.tabs` with `.tab` (`.tab-num` + `.tab-name`, `aria-selected="true"` for current, `.done` when finished). Row 2 hides itself when `.tabs` is `hidden`.
- **Page column** `.wrap`.
- **Section** `.module` containing `.mod-head` (`.eyebrow` "Modul 3 · Titel", `h2`, `.lede`), then `.lab`, then the check.
- **Lab** `.lab` = `.stage` (SVG drawing, `viewBox` about 640 wide, plus a `.hint`) and `.panel` (`.controls`, `.actions`, `.readout`). Two columns from 880px, stacked below.
- **Readout** `.readout` with `aria-live="polite"`: explains in words what the drawing shows. `.big` for a big number.
- **Controls** `.ctl` + `.ctl-label`; `.stepper`, `.seg` (build them with `Kit.makeStepper` / `Kit.makeSeg`), `.toggle` (checkbox with label), `.field` (number input), `.chips` / `.chip[aria-pressed]`.
- **Buttons** `.btn` (dark), `.btn.go` (yellow, the one main action of an area), `.btn.ghost` (secondary), `.link` (text button), `.term` (glossary word in running text).
- **Cards** `.card`, `.tip` (yellow notice), `.tip.good` (success), `.gcard` (glossary card, `.flash` to highlight after a jump), `.dlg` + `.dlg-body` (`<dialog>`).
- **Quiz** `.check` and its parts: built by `Kit.mountCheck`.
- **Maths type** `.frac` (`<span class="frac"><span>3</span><span>4</span></span>`, `.sm` inline), `.mixed` (`.whole` + `.frac`).
- **SVG primitives** `.shape` (outlined shape; `.on` = filled with accent; `.tap` = clickable with hover and focus ring), `.axis`, `.tick`, `.guide`, `.bead`, `.cap` (caption text), `.lbl` (big label text).
- **Landing** `.hero`, `.subject`, `.apps`, `.app-card` (`--c` = subject colour; `.app-icon`, `.eyebrow`, `h3`, `p`, `.go-row`), `.app-card.soon`, `.foot`.

Visual language: rounded, flat, 2px outlines, no gradients, almost no shadows. Drawings are outlined in `--ink`, filled parts in `--accent`, markers in `--sun`. One yellow `.btn.go` per area at most.

## kit.js

All on `window.Kit`:

| Helper | Does |
| --- | --- |
| `$(sel, root?)`, `$$(sel, root?)` | querySelector / querySelectorAll as array |
| `S(tag, attrs, parent)` | Create an SVG element |
| `svgPoint(svg, event)` | Pointer position in SVG coordinates (dragging) |
| `esc(text)` | Escape for innerHTML |
| `lerp`, `clamp`, `range(a,b)`, `shuffle(arr)`, `deNum(x, digits)` | Numbers; `deNum(0.75)` → "0,75" |
| `tween(ms, fn(p), easing?)` → Promise | Animate p from 0 to 1. Instant when the user prefers reduced motion. Guard overlapping runs with a `token` counter (see `vorlage/`). |
| `wait(ms)`, `ease`, `easeOut`, `lin`, `reducedMotion` | Timing |
| `store(prefix)` → `{get, set, remove}` | JSON in localStorage under `prefix-key`. Never throws. |
| `makeStepper(host, {label, values, value, onChange})` → `{get, set, setValues}` | − value + control |
| `makeSeg(host, {label, options:[{v,t}], value, onChange})` → `{get, set}` | Segmented choice |
| `mountCheck(host, items, {title?, tag?, onDone?, next?})` → `{restart}` | "Teste dich selbst". Items are `{type:'mcq', prompt, visual?, options:[{text, pic?, correct?, why?}], explain, after?}` or `{type:'task', prompt, visual?, mount(body) → () => ({ok, msg})}`. Every wrong option needs a `why`. |

Subject-specific helpers (e.g. German fraction words, `fr()` for fraction HTML) stay in their app. Move a helper into the kit only when a second app needs it.

## Restyling

- **Change the look of all apps:** edit the values in `kit/tokens.css` (both the light block and the two dark blocks). Check `kit/galerie.html` in light and dark.
- **A whole new theme:** add `kit/theme-<name>.css` that overrides the same variables on `:root` (and the dark blocks), and link it after `tokens.css` in the pages. Nothing else needs to change if apps followed the "tokens only" rule.
- **Fonts:** change the Google Fonts `<link>` in each page and `--display` / `--body` in tokens.
- Keep contrast readable for a child: body text on `--paper` and `--card` should stay at WCAG AA (4.5:1) or better in both themes.

## Changing the kit

The kit is shared, so a change reaches every app. Before changing a component, search all apps for its class. Prefer adding a new class or modifier over changing what an existing one looks like. Add every new component to `kit/galerie.html` and to the list above in the same change.
