# Lern-Werkstatt

Interaktive Lern-Apps für Kinder (ca. 10 Jahre), auf Deutsch und passend zu den Begriffen der deutschen Schule. Jede App erklärt ein Thema mit bewegten Bildern, Aufgaben zum Selberbauen und Tests mit Erklärungen zu jeder falschen Antwort.

Live: <https://hashseed.github.io/tutor/>

## Apps

| App | Ordner | Thema |
| --- | --- | --- |
| Brüche (Bruch-Werkstatt) | [`brueche/`](https://hashseed.github.io/tutor/brueche/) | Brüche und Dezimalbrüche, Kapitel 1–5 |
| Kommas (Komma-Werkstatt) | [`komma/`](https://hashseed.github.io/tutor/komma/) | Kommaregeln, Kommas in Texte setzen |

## Aufbau

- `index.html`: Startseite mit allen Apps.
- `kit/`: gemeinsames Design-System. `tokens.css` (alle Farben, Schriften, Formen), `kit.css` (Bausteine), `kit.js` (Hilfsfunktionen), `galerie.html` (alle Bausteine zum Ansehen).
- `vorlage/`: Startpunkt für eine neue App.
- `docs/`: Anleitungen, vor allem für KI-Agenten, die hier weiterbauen.

Kein Framework, kein Build-Schritt: reines HTML, CSS und JavaScript. GitHub Pages liefert die Dateien direkt aus.

## Aussehen ändern

Alle Apps holen ihre Farben und Schriften aus [`kit/tokens.css`](kit/tokens.css). Wer dort einen Wert ändert, ändert ihn in allen Apps. In der [Stil-Galerie](https://hashseed.github.io/tutor/kit/galerie.html) sieht man das Ergebnis sofort, hell und dunkel.

## Lokal ansehen

Im Repository-Ordner `python3 -m http.server` starten und <http://localhost:8000/> öffnen. (Direkt per Doppelklick geöffnet funktionieren die gemeinsamen Dateien in `kit/` nicht in jedem Browser.)

## Veröffentlichen

Jeder Push auf `main` wird automatisch veröffentlicht (Settings → Pages → "Deploy from a branch", `main`, `/ (root)`).

## Lizenz

© 2026 Yang ([@hashseed](https://github.com/hashseed)). Dieses Werk ist lizenziert unter [Creative Commons Namensnennung - Nicht kommerziell - Weitergabe unter gleichen Bedingungen 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de). Der vollständige Lizenztext steht in [`LICENSE`](LICENSE).
