# Adding a new app

1. **Pick a folder name**: short, German, lowercase, ASCII only (`ue` for `ü`), e.g. `brueche`, `geometrie`, `englisch-verben`. The app will live at `https://hashseed.github.io/tutor/<folder>/`.
2. **Pick a storage prefix** (2–3 letters) and add it to the table below. Apps share one origin, so prefixes must be unique.
3. **Copy `vorlage/`** to `<folder>/`. It is a working one-section app that shows the expected structure: navigation bar with a link back to the overview, a section with stage, panel and readout, and a quiz.
4. **Build the content** following [DESIGN.md](DESIGN.md) and the rules in [AGENTS.md](../AGENTS.md). App-specific CSS goes in the app's `<style>` block, classes prefixed with the app prefix, colours only via tokens.
5. **Add a card to the landing page** (`index.html`): put an `<a class="app-card" href="<folder>/">` into the right `<section class="subject">`, or add a new subject section. Give it the subject colour with `style="--c:var(--subj-N)"` and a 44×44 SVG icon drawn with tokens.
6. **Update the app table in `README.md`.**
7. **Check** at 1280 px and 390 px, light and dark, no console errors, no sideways scroll, keyboard reachable.

## Structure of a bigger app

Larger apps (like the fractions app) are organised as **parts** (`.unit` in the top row, e.g. "Teil 1", "Tests", "Spiele", "Fachbegriffe") containing **sections/modules** (`.tab` in the second row). Common parts worth reusing:

- a **"Fachbegriffe" glossary** of `.gcard`s, linked from running text with `.term` buttons,
- a **"Tests" part** with randomly generated questions across chosen sections,
- **games** that are never locked; at most a `.tip` suggests which test to do first.

## Storage prefixes in use

| Prefix | App |
| --- | --- |
| `bw` | Brüche (Bruch-Werkstatt) |
| `km` | Kommas (Komma-Werkstatt) |
| `gs` | Geschichte (Geschichts-Werkstatt) |
| `kg` | Kerngedanken (Kerngedanken-Werkstatt) |
| `vl` | `vorlage/` (example only) |
