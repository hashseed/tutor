# Geschichts-Werkstatt: question format and Lernstoff

Questions live in `fragen.json`: `{"abschnitte": [...], "begriffe": [{"wort","kurz","text"}]}`. Section ids a1–a12 and s1 (Stolperstellen) match `SEC` in `app.js`. Some transfer tasks are generated in `app.js` (`GEN`: timeline events, objects for Quellenarten and Überrest/Tradition).

App for a 10-year-old at a German school (Gymnasium/Realschule Klasse 5), preparing a Geschichtsprobe.
Everything the child reads is German: short sentences, "du" form, friendly, precise. Use the terms of the
schoolbook/worksheets (below). Plain text only in all strings (no HTML, no Markdown). Use „…“ for quotes.

## Sections

```json
[{ "id": "a5", "heft": [ ...items ], "transfer": [ ...items ] }]
```

- `heft`: 4–6 items that ask exactly what the worksheets/schoolbook ask, with the same examples ("Wie im Heft").
- `transfer`: 8–12 items that check the SAME understanding with NEW content (new examples, new situations,
  new wording). Never reuse a worksheet example as the answer in transfer. Include 1–2 `explain` items per section.

## Item types (exact JSON)

mcq — every wrong option MUST have a `why` that kindly explains this specific mistake (1–2 sentences).
```json
{"type":"mcq","prompt":"…?","options":[{"text":"…","correct":true},{"text":"…","why":"…"}],"explain":"Why the right answer is right (1–2 sentences)."}
```
3–4 options, exactly one correct.

sort — put each item into a bucket. `b` is the bucket id, or an array of accepted ids. `why` is shown when the item is put in a wrong bucket.
```json
{"type":"sort","prompt":"…","buckets":[{"id":"s","name":"Schriftliche Quelle"},{"id":"b","name":"Bildliche Quelle"}],
 "items":[{"text":"Tagebuch","b":"s","why":"Ein Tagebuch ist geschrieben. Darum ist es eine schriftliche Quelle."}],"explain":"…"}
```
2–4 buckets, 4–8 items, item texts short (max ~5 words).

order — items in the CORRECT order; the app shuffles them.
```json
{"type":"order","prompt":"Bring in die richtige Reihenfolge.","items":["erstes","zweites","drittes"],"why":"Hint shown when the order is wrong.","explain":"…"}
```

gap — Lückentext. Gaps in `{…}`; alternatives with `|` (first is shown in the solution). All gap answers appear as word cards, plus `extra` distractors. Each distractor has a `why`. Each answer word should be unique in the text.
```json
{"type":"gap","prompt":"Fülle die Lücken.","text":"Die Menschen waren Jäger und {Sammler}. Sie wohnten in {Zelten}.","extra":[{"word":"Häusern","why":"Feste Häuser bauten sie noch nicht. Sie zogen den Tieren hinterher."}],"explain":"…"}
```
2–6 gaps per text.

num — number answer. `answer` may use the word `heute` for the current year, e.g. "heute-1969" or "753+heute".
```json
{"type":"num","prompt":"…","answer":"heute-1969","tol":0,"unit":"Jahre","why":"Hint when wrong.","explain":"…"}
```

explain — the child writes a short answer; the app checks for key ideas by word stems (lowercase, umlauts may be
written ae/oe/ue; the app normalises both). `words` are stems that count for that idea (e.g. "zufäll" matches zufällig).
```json
{"type":"explain","prompt":"Erkläre …","keys":[{"label":"zufällig erhalten","words":["zufäll","nicht absicht"]},{"label":"absichtlich überliefert","words":["absicht","mit absicht","extra"]}],"need":2,"model":"Musterantwort in 2–3 Sätzen.","explain":"Short comment."}
```

## Lernstoff (what the worksheets and schoolbook say; follow this)

Zeitstrahl (Arbeitsblatt): ca. 2,6 Mio. v. Chr. Menschen stellen die ersten Steinwerkzeuge her; ca. 10.000 v. Chr.
Menschen betreiben Ackerbau und Viehzucht, Siedlungen; ca. 2.600 v. Chr. Ägypter bauen die Pyramiden; 753 v. Chr. Rom
wird gegründet; 800 Karl der Große wird Kaiser; 1825 die erste Eisenbahn fährt; 1969 der erste Mensch betritt den Mond;
heute: KI wird Teil unseres Alltags. v. Chr. = vor Christus, n. Chr. = nach Christus (Christi Geburt in der Mitte).
"Mit einem Zeitstrahl und Jahreszahlen können wir Ereignisse zeitlich ordnen." "Vergangenheit ist nicht gleich
Geschichte. Die Vergangenheit ist alles, was früher passiert ist. Geschichte beschäftigt sich mit einem Ausschnitt der
Vergangenheit und versucht, diese zu verstehen und zu erforschen." Never use a to-scale timeline.

Schulbuch S. 16–17 "Woher wissen wir etwas über die Vergangenheit?": Geschichtsforscher arbeiten wie
Kriminalkommissare. M2 "Wie gehen Geschichtsforscher vor?": 1 Fragen an die Vergangenheit (z. B. Wie sah der Alltag
unserer Vorfahren aus? Wie wohnten die Menschen früher? Wie kleideten sie sich?) → 2 Quellen sammeln (z. B. Briefe,
Tagebücher, Fotos) → 3 Quellen auswerten (mit Fragen nach dem Fundort, dem Urheber, dem Zweck und dem Nutzer der
Quelle) → 4 Erkenntnisse formulieren. "Grundlegender Begriff Quellen: Historiker unterscheiden zwischen schriftlichen,
mündlichen, bildlichen und gegenständlichen Quellen. Diese können zufällig erhalten geblieben (Überreste) oder
absichtlich überliefert worden sein (Tradition)."
Was machen Historiker? Sie werten schriftliche Quellen wie Urkunden aus, aber auch Bildquellen (z. B. Fotos),
gegenständliche Quellen wie Gebäude sowie mündliche Quellen, z. B. Aussagen von Zeitzeugen; auch Bräuche und religiöse
Feste. Jede Quelle zeigt nur einen Ausschnitt. Schlussfolgerungen beruhen zunächst auf Vermutungen und hängen von der
Sichtweise ab; durch weitere Quellen lassen sich Vermutungen erhärten; neue Quellen können das Ergebnis ändern.
Was machen Archäologen? Je weiter wir in die Vergangenheit zurückgehen, desto weniger Quellen gibt es; es gab noch
keine Schrift, also fehlen schriftliche Zeugnisse; viele Funde sind schwer zu deuten, weil nur Bruchstücke vorliegen,
z. B. Knochensplitter oder Grabbeigaben (Überreste), oft durch Ausgrabungen gewonnen. Archäologen ordnen Fundstücke
zeitlich ein und finden heraus, wie Menschen früher lebten und dachten; sie nutzen auch naturwissenschaftliche Technik.
M1 (Historiker über vorgeschichtliche Funde): Archäologie von griech. archaios = alt und logos = Lehre. Sie arbeiten mit
Geologen, Anthropologen, Biologen, Physikern. Sie legen Fundstellen frei (Siedlungen, Befestigungen, Kultstätten,
Gräber), vermessen, fotografieren, zeichnen, beschreiben, entnehmen Proben; Fundstücke werden restauriert
(ausgebessert, wiederhergestellt), die schönsten im Museum ausgestellt.
M3: Keltischer Kessel aus dem Fürstengrab von Hochdorf bei Stuttgart, 1979 entdeckt, ca. 2500 Jahre alt, Durchmesser
104 cm, fasst 500 Liter; restauriert, im Keltenmuseum Hochdorf. M4: In Erding bei München fand man 2014 beim Ausheben
einer Kellergrube Gräber, über 4000 Jahre alt ("Der Zufall führte zu dem Skelettfund").
M5 Werkzeuge der Archäologen: Spitzhacke, Senkblei, Zeichenbrett/Schreibblock, Fotoapparat, Bandmaß, Maßstab, Pinsel,
Zahnarztinstrumente, Maurerkelle.

Arbeitsblatt Historiker: Überrestquellen z. B. Waffen, Vasen, Einkaufsnotizen. Traditionsquellen z. B. Reden,
Schriften (Chroniken). Überschneidungen: Gemälde, Gebäude, Statuen. IMPORTANT: never use "Urkunde" in an
Überrest/Tradition task (the worksheet and the scholarly view disagree). Leitfrage: "Wurde es gemacht, damit Menschen
später davon erfahren?" Ja → Tradition (absichtlich überliefert), Nein → Überrest (zufällig erhalten).

Truhe (Arbeitsblatt): Claras Großonkel Walther (über 80) zieht aus; in einer alten Truhe im Keller: Urkunde von einem
Fußballturnier, Mappe mit Grundschulzeugnissen, Kassette mit Liedern aus den 1980er-Jahren, Berichte über den Mauerfall
aus der Zeitung (in einem Ordner), ein Paket verschnürter Briefe vom Bruder Michael aus den USA (1950er nach New York
ausgewandert), Halstücher aus der Pfadfinderzeit, ein Fotoalbum aus der Zeit des Zweiten Weltkriegs, ein Säckchen mit
D-Mark- und Ost-Mark-Münzen. Correct: schriftlich = Urkunde, Zeugnisse, Zeitungsberichte, Briefe; bildlich = Fotoalbum
(Fotos); mündlich = Kassette mit Liedern (man hört sie; the cassette as a mere object would be gegenständlich, but what
counts is the content); gegenständlich = Halstücher, Münzen. The Ordner is only the container: the source is the
Zeitungsberichte inside.

Altsteinzeit (Arbeitsblätter): vor ca. 2 Mio. Jahren bis vor etwa 10.000 Jahren (Zeitstrahl: ab ca. 2,6 Mio. v. Chr.,
erste Steinwerkzeuge). Schutz vor Kälte, Nahrung beschaffen; Dunkelheit brachte Gefahren; lernten durch Beobachten,
Ausprobieren, Nachdenken. Folgten den gejagten Tieren über viele Kilometer (Risiko zu verhungern senken; Tiere je nach
Jahreszeit dort, wo sie Futter finden). Wohnten in leicht auf- und abzubauenden Zelten. Sammelten essbare Pflanzen wie
Beeren und Wurzeln: Jäger und Sammler. Zur Jagd, zur Verteidigung und zum Verarbeiten der Tiere brauchten sie Waffen
und Werkzeuge. Sie schlugen gerundete Steine (z. B. Feuerstein), bis sie messerscharfe Kanten hatten und gut in einer
Hand lagen: Faustkeil (M3: Faustkeile, ca. 500.000–300.000 Jahre alt). Faustkeil = Werkzeug zum Schneiden, Schaben,
Hacken, Fell abziehen, Fleisch zerlegen, Knochen aufschlagen, Holz bearbeiten. Wichtigste Jagdwaffe: Speer (Holz,
später mit Steinspitze). Pfeil und Bogen kamen erst ganz am Ende der Altsteinzeit. Hilfsmittel aus natürlichen
Materialien der Umgebung (Stein, Holz, Knochen, Fell). Feuer: lange vor allem eine Gefahr; im Lauf der Altsteinzeit
lernten sie es zu kontrollieren und zu nutzen: Essen besser genießbar und haltbar machen, wilde Tiere fernhalten, sich
im Winter wärmen, Licht; Feuerstelle = Mittelpunkt des Lagerplatzes, förderte die Gemeinschaft.
M1: Nachbau (Rekonstruktion) eines altsteinzeitlichen Zeltes (Archäopark Vogelherd, Niederstotzingen). M2: Wandmalerei
in der Höhle von Lascaux (Südfrankreich), Stiere. M4: Wandmalerei in Lascaux: Jagd auf einen Bison mit Waffen.
Questions on the sheets: Beschreibe die Bilder in Stichwörtern; was erfährst du aus M1 über die Lebensweise; warum
fertigten die Menschen womöglich Wandmalereien an (Vermutungen: Jagdglück, Erinnerung, Geschichten erzählen, den
Jüngeren zeigen); wofür verwendeten die Menschen den Faustkeil; warum sind über das Leben in der Altsteinzeit kaum
sichere Aussagen möglich (keine Schrift, nur Überreste/Bruchstücke, Forscher müssen vermuten).

Stolperstellen (typical mistakes; section s1 and the other sections practise the correct version, never mention "dein Heft"):
"Pfeil und Bogen" instead of "Waffen und Werkzeuge"; "wilde Tiere braten" instead of "fernhalten"; Schritt 4
"Erkenntnisse auswerten" instead of "formulieren"; Schritt 3 only Fundort/Zweck (missing Urheber, Nutzer); Kassette as
gegenständlich; Ordner as source; "es war kalt, als sie noch kein Feuer machen konnten" (they did use fire); M1 seen as
"altes zerfallenes Zelt" (it's a Nachbau); Faustkeil "um Waffen und Werkzeuge zu bauen" (it IS the tool).
