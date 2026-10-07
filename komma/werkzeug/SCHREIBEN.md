# Texte für die Komma-Werkstatt schreiben

Anleitung für jeden, der neue Übungstexte schreibt (Mensch oder KI). Vorbild sind die ersten fünf Texte in `komma/texte.json`.

## Ablauf

1. Eine Zeile aus `seeds.json` nehmen: Id, Textart, Thema, Form, Schwerpunkt-Regeln, bei Erzählungen ein Name.
2. Den Text schreiben, jedes Komma mit Regel und Erklärung versehen (Format unten).
3. `python3 komma/werkzeug/pruefen.py <datei.json>` laufen lassen. Alle **FEHLER** beheben, jeden **Hinweis** ansehen.
4. Jeden Text einmal laut lesen: Stimmt jedes Komma? Fehlt eines? Ist jede Erklärung richtig?

## Der Text

- Für ein Kind in Klasse 5 einer deutschen Schule: klare, lebendige Sprache, kurze bis mittellange Sätze, sachlich richtig.
- **90 bis 130 Wörter**, ein Absatz, **9 bis 13 Kommas**, mindestens **4 verschiedene Regeln**, die Schwerpunkt-Regeln mehrfach.
- Jedes Komma gehört zu einer der 8 Regeln in `komma/regeln.json`. Kein Satz darf ein Komma aus einer anderen Regel brauchen. Deshalb **vermeiden**:
  - Beisätze (Appositionen): „Bruno, der Dackel, …“ ohne Verb
  - Infinitivgruppen: „um … zu“, „ohne … zu“, „statt … zu“, „Er versprach, bald zu kommen“
  - Partizipgruppen: „Laut lachend, rannte …“
  - nachgestellte Erklärungen: „z. B.“, „vor allem“, „und zwar“, „also“ mit Komma
  - Datum, Uhrzeit mit Komma, Zahlen mit Komma, Semikolon, Gedankenstrich, Klammern
  - Wortpaare wie „ja, ja“ oder „nein, nein“, Höflichkeitsformeln wie „Bitte, …“
- **Zwei Hauptsätze mit „und“ oder „oder“**: Komma ist freiwillig. Möglichst vermeiden. Wenn doch, Komma setzen und `"optional": true` angeben.
- **Gute Stolpersteine** (ohne Komma!) sind erwünscht: „und“ / „oder“ in einer Aufzählung, Vergleiche mit „als“ / „wie“ ohne Verb („größer als ein Hund“), Begleitsatz **vor** der wörtlichen Rede mit Doppelpunkt (`Mia rief: „Komm!“`), „sowohl … als auch“.
- Wörtliche Rede immer mit deutschen Anführungszeichen „…“. Steht der Begleitsatz danach, folgt das Komma **nach** dem schließenden Zeichen: `„Komm mit!“, rief Mia.` Ein Satz in der Rede endet ohne Punkt vor dem schließenden Zeichen: `„Ich komme gleich“, sagte Papa.`
- Kommas innerhalb der wörtlichen Rede zählen auch (z. B. Anrede oder Ausruf in der Rede).
- Bei Erzählungen den Namen aus dem Seed für die Hauptfigur verwenden. Andere Namen frei wählen, aber abwechslungsreich.

## Die Regeln (Ids)

| Id | Wann |
| --- | --- |
| `aufzaehlung` | zwischen gleichrangigen Wörtern oder Wortgruppen, nicht vor „und“ / „oder“ |
| `gegensatz` | vor „aber“, „sondern“, „doch“, „jedoch“ (auch „nicht nur …, sondern auch“) |
| `satzreihe` | zwischen zwei Hauptsätzen ohne „und“ / „oder“, auch vor „denn“ |
| `nebensatz` | vor und nach Nebensätzen mit weil, dass, wenn, als, ob, obwohl, damit, nachdem, bevor, während, wer, wie, wo, warum (indirekte Fragen) |
| `relativsatz` | vor und nach Relativsätzen mit der, die, das, welche (auch „in dem“, „mit der“ …) |
| `woertliche_rede` | zwischen wörtlicher Rede und nachgestelltem oder eingeschobenem Begleitsatz |
| `anrede` | um eine direkte Anrede („Tim, komm!“, „Komm, Tim!“) |
| `ausruf` | nach Ausrufe- und Antwortwörtern am Satzanfang: ach, oh, ja, nein, hurra, au, igitt, juhu |

Ein Nebensatz oder Relativsatz mitten im Satz braucht **zwei** Kommas, beide mit derselben Regel.

## Format (ein Eintrag in `"texte"`)

```json
{
  "id": "e-004",
  "art": "erzaehlung",
  "titel": "Kurzer Titel",
  "thema": "Thema aus dem Seed",
  "text": "Der ganze Text mit allen Kommas, ein Absatz, Leerzeichen nach jedem Komma.",
  "kommas": [
    { "regel": "nebensatz", "warum": "„weil“ leitet einen Nebensatz ein. Das Verb „regnete“ steht am Ende." }
  ]
}
```

- `kommas` hat **genau einen Eintrag pro Komma im Text, in derselben Reihenfolge**.
- `warum`: ein oder zwei kurze Sätze in „du“-freundlicher Kindersprache, die **genau dieses** Komma erklären. Das Signalwort und das Verb nennen, die wirklich im Text stehen. Typische Muster stehen in `komma/texte.json`.

## Warum kein lokales Sprachmodell

Am 7. Oktober 2026 wurden 5 Texte mit Ollama (`qwen3:30b-a3b-instruct-2507`) erzeugt. Keiner war brauchbar: Die Regel-Einträge passten nicht zur Zahl der Kommas, die Erklärungen waren oft falsch („denn“ als Nebensatz), Sätze wiederholten sich, und die Länge stimmte nicht. Deshalb schreibt Claude die Texte, und `pruefen.py` prüft sie ohne Modell.
