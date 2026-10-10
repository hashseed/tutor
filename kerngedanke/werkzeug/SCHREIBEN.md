# Texte für die Kerngedanken-Werkstatt schreiben

Anleitung für jeden, der neue Übungstexte schreibt (Mensch oder KI). Vorbild sind die ersten Texte in `kerngedanke/texte.json`.

## Ablauf

1. Eine Zeile aus `seeds.json` nehmen: Id, Textart, Thema, Form, bei Erzählungen ein Name, und die drei Arten der Ablenker (`nah`, `teils`, `falsch`).
2. Den Text schreiben, dann die vier Antworten, jede mit ihrer Erklärung (Format unten).
3. `python3 kerngedanke/werkzeug/pruefen.py <datei.json>` laufen lassen. Alle **FEHLER** beheben, jeden **Hinweis** ansehen.
4. Blind-Probe: Jemand, der die Lösung nicht kennt, liest Text und Antworten (gemischt) und wählt. Wählt er nicht die richtige, oder schwankt er zwischen zwei Antworten, ist eine Antwort unklar. Dann umschreiben.

## Der Text

- Für ein Kind von 11 Jahren (Klasse 5/6) an einer deutschen Schule: klare, lebendige Sprache, sachlich richtig, keine Fremdwörter ohne Erklärung.
- **150 bis 230 Wörter**, **2 bis 4 Absätze** (Absätze im JSON mit `\n` trennen).
- Der Text hat **einen klaren Kerngedanken**, der sich aus dem ganzen Text ergibt, nicht aus einem einzelnen Satz. Er steht **nicht** wörtlich als ein Satz im Text. Bei Erzählungen ist er meist: Wer will was, was passiert, wie geht es aus, was ändert sich (oft: was lernt die Figur). Bei Sachtexten: Worum geht es, und was ist die wichtigste Aussage dazu.
- Der Text enthält genug **Einzelheiten** (Zahlen, Namen, Nebenfiguren, Beispiele), damit es lohnende falsche Antworten gibt.
- Erzählungen: Hauptfigur heißt wie im Seed. Fabeln: Tiere, eine Lehre, die der Text **nicht** ausspricht. Berichte: Zeitungsstil, W-Fragen, sachlich.
- Wörtliche Rede mit deutschen Anführungszeichen „…“. Kommas nach den Regeln der Schule (die Kinder üben sie gerade auch).

## Die vier Antworten

Jede Antwort ist **ein Satz, höchstens zwei**, 14 bis 32 Wörter. Alle vier sind etwa **gleich lang** (die längste höchstens 1,6-mal so lang wie die kürzeste) und im gleichen Ton. Die richtige darf nicht an der Länge, an besonders vielen Wörtern aus dem Text oder an Wörtern wie „insgesamt“ zu erkennen sein.

| `art` | Was sie ist | Arten (`typ`, aus dem Seed) |
| --- | --- | --- |
| `richtig` | Fasst den **ganzen** Text in seinem Kern zusammen: Thema plus wichtigste Aussage bzw. Anfang, Wendung und Ende. | |
| `nah` | **Sehr nah dran.** Alles darin stimmt, aber es fehlt etwas Wesentliches. | `zu-eng`: trifft nur einen Teil des Textes (z. B. nur den Anfang oder nur einen Absatz). `ohne-ende`: lässt die entscheidende Wendung oder das Ergebnis weg. `zu-allgemein`: stimmt, ist aber so allgemein, dass es auf viele Texte passt. |
| `teils` | **Nicht ganz richtig.** Hat mit dem Text zu tun, aber stellt etwas Falsches in den Mittelpunkt oder enthält einen Fehler. | `detail`: eine Nebensache wird zur Hauptsache gemacht. `verdreht`: das Thema stimmt, aber ein wichtiger Punkt ist falsch (z. B. Ursache und Folge vertauscht, die falsche Figur). `uebertrieben`: sagt viel mehr, als der Text sagt („immer“, „alle“, „nie“). |
| `falsch` | **Eindeutig falsch.** | `anderes-thema`: benutzt ein Wort aus dem Text, handelt aber von etwas ganz anderem. `gegenteil`: behauptet das Gegenteil des Kerngedankens. `erfunden`: erzählt etwas, das im Text gar nicht vorkommt. |

Jede Antwort bekommt ein `warum`: ein bis drei kurze Sätze in „du“-Form, freundlich, die **genau diese** Antwort mit dem Text vergleichen. Beim `richtig`-Eintrag: warum sie den ganzen Text trifft. Bei den anderen: was stimmt, und was fehlt oder falsch ist, mit einem konkreten Hinweis auf den Text („Im zweiten Absatz steht aber …“).

## Der Tipp

`tipp`: eine Frage, die beim Finden hilft, ohne die Lösung zu verraten. Zum Beispiel „Was hat sich für Lena am Ende verändert?“ oder „Was ist das Wichtigste, das du über Fledermäuse erfährst?“

## Format (ein Eintrag in `"texte"`)

```json
{
  "id": "e-001",
  "art": "erzaehlung",
  "titel": "Kurzer Titel",
  "thema": "Thema aus dem Seed",
  "text": "Erster Absatz …\nZweiter Absatz …",
  "tipp": "Eine hilfreiche Frage?",
  "antworten": [
    { "art": "richtig", "text": "…", "warum": "…" },
    { "art": "nah", "typ": "zu-eng", "text": "…", "warum": "…" },
    { "art": "teils", "typ": "detail", "text": "…", "warum": "…" },
    { "art": "falsch", "typ": "gegenteil", "text": "…", "warum": "…" }
  ]
}
```

Die App mischt die Antworten selbst. In der Datei stehen sie immer in der Reihenfolge `richtig`, `nah`, `teils`, `falsch`.
