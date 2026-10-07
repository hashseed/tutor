#!/usr/bin/env python3
"""Erzeugt Übungstexte für die Komma-Werkstatt mit einem lokalen Ollama-Modell.

Nur Python-Standardbibliothek. Läuft auf dem Rechner, auf dem Ollama läuft (oder der es erreicht).

    python3 komma/werkzeug/erzeugen.py --anzahl 5
    python3 komma/werkzeug/erzeugen.py --pruefe-vorhandene   # nur die Prüfungen auf texte.json

Ablauf pro Text:
  1. Seed (Textart, Thema, Schwerpunkt-Regeln, Form, Name, Zeitform) aus festen Listen, reproduzierbar.
  2. Schreiben: Modell A liefert JSON (Ollama "format" = JSON-Schema) mit Text und einem Eintrag pro Komma.
  3. Skript-Prüfungen: Format, Zuordnung Komma <-> Regel, Plausibilität der Regel, verdächtige fehlende Kommas.
  4. Blinde Gegenprobe: Text ohne Kommas, das Modell setzt sie neu (mehrere Läufe); Abweichungen werden gemeldet.
  5. Ähnlichkeit zu allen vorhandenen Texten (Wort-3-Gramme).
Ergebnis: werkzeug/ausgabe/kandidaten.json (im Format von texte.json, mit "pruefung") und bericht.md.
Nichts landet automatisch in texte.json: Texte werden erst nach der Durchsicht übernommen.
"""
import argparse, json, os, random, re, sys, time, urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
KOMMA = HIER.parent
HOST = os.environ.get('OLLAMA_HOST', 'http://host.docker.internal:11434')
MODELL = 'qwen3:30b-a3b-instruct-2507-q4_K_M'
PRUEF_MODELLE = ['qwen3:30b-a3b-instruct-2507-q4_K_M', 'qwen3:30b-a3b-instruct-2507-q4_K_M', 'qwen3-vl:8b']

# ---------------- Seeds ----------------
THEMEN_ERZ = [
    'Ein verlorener Hund im Park', 'Die Klassenfahrt an die Ostsee', 'Ein Gewitter beim Zelten', 'Der erste Schultag an der neuen Schule',
    'Ein Kuchen, der schiefgeht', 'Ein Geheimgang im Schulkeller', 'Das Kanurennen am See', 'Ein Streit unter Freundinnen',
    'Die Geburtstagsüberraschung für Opa', 'Ein Igel im Gartenhaus', 'Der Flohmarkt in der Nachbarschaft', 'Ein Schneetag ohne Schule',
    'Die Theateraufführung der Klasse', 'Ein Ausflug in den Kletterwald', 'Das Rätsel im Museum', 'Ein Papagei, der Wörter klaut',
    'Die Fahrradpanne im Wald', 'Ein Umzug in eine neue Stadt', 'Das Baumhaus', 'Ein Besuch auf dem Bauernhof',
]
THEMEN_SACH = [
    'Wie Bienen Honig machen', 'Der Wasserkreislauf', 'Warum Blätter im Herbst bunt werden', 'Das Leben der Pinguine',
    'Wie ein Regenbogen entsteht', 'Die Ritter im Mittelalter', 'Wie Mülltrennung funktioniert', 'Der Mond und seine Phasen',
    'Wie Schmetterlinge entstehen', 'Die Römer in Germanien', 'Wie ein Fahrraddynamo Strom erzeugt', 'Das Wattenmeer',
    'Wie Kartoffeln wachsen', 'Fledermäuse in der Nacht', 'Wie ein Brief zum Empfänger kommt', 'Die Erfindung des Buchdrucks',
    'Der Regenwald', 'Wie Ameisen zusammenarbeiten', 'Warum wir schlafen müssen', 'Die Olympischen Spiele',
]
FORM_ERZ = ['Ich-Erzählung im Präteritum', 'Er-/Sie-Erzählung im Präteritum', 'Erzählung mit viel wörtlicher Rede im Präteritum', 'Ich-Erzählung im Präsens']
FORM_SACH = ['Lexikonartikel im Präsens', 'Erklärtext für Kinder im Präsens', 'kurzer Zeitungsbericht im Präteritum', 'Sachtext mit Fragen und Antworten im Präsens']
NAMEN = ['Lena', 'Noah', 'Emilia', 'Ben', 'Mila', 'Elias', 'Hannah', 'Finn', 'Lina', 'Jonas', 'Ella', 'Paul', 'Clara', 'Theo', 'Amira', 'Leon', 'Ida', 'Karim', 'Sophie', 'Mats', 'Zoe', 'Emil', 'Nele', 'Anton']
REGELN_ERZ = ['woertliche_rede', 'anrede', 'ausruf', 'nebensatz', 'relativsatz', 'aufzaehlung', 'gegensatz', 'satzreihe']
REGELN_SACH = ['nebensatz', 'relativsatz', 'aufzaehlung', 'gegensatz', 'satzreihe']


def seeds(anzahl, start=0):
    """Reproduzierbare Seeds. Erzählungen und Sachtexte abwechselnd, Themen ohne Wiederholung."""
    rnd = random.Random(20261007 + start)
    erz, sach = rnd.sample(THEMEN_ERZ, len(THEMEN_ERZ)), rnd.sample(THEMEN_SACH, len(THEMEN_SACH))
    out = []
    for i in range(anzahl):
        art = 'erzaehlung' if (start + i) % 2 == 0 else 'sachtext'
        if art == 'erzaehlung':
            thema, form = erz.pop(), rnd.choice(FORM_ERZ)
            fokus = rnd.sample(REGELN_ERZ[:3], 1) + rnd.sample(REGELN_ERZ[3:], 2)
        else:
            thema, form = sach.pop(), rnd.choice(FORM_SACH)
            fokus = rnd.sample(REGELN_SACH, 3)
        out.append({'nr': start + i + 1, 'art': art, 'thema': thema, 'form': form, 'fokus': fokus,
                    'name': rnd.choice(NAMEN), 'seed': rnd.randrange(1, 2**31)})
    return out

# ---------------- Ollama ----------------
def ollama(model, messages, schema=None, seed=1, temperature=0.7, timeout=600):
    body = {'model': model, 'messages': messages, 'stream': False,
            'options': {'seed': seed, 'temperature': temperature, 'num_ctx': 8192}}
    if schema: body['format'] = schema
    req = urllib.request.Request(HOST.rstrip('/') + '/api/chat', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())['message']['content']


SCHEMA = {
    'type': 'object',
    'properties': {
        'titel': {'type': 'string'},
        'text': {'type': 'string'},
        'kommas': {'type': 'array', 'items': {'type': 'object', 'properties': {
            'vor': {'type': 'string'}, 'nach': {'type': 'string'},
            'regel': {'type': 'string', 'enum': REGELN_ERZ}, 'warum': {'type': 'string'}},
            'required': ['vor', 'nach', 'regel', 'warum']}},
    },
    'required': ['titel', 'text', 'kommas'],
}


def regel_text(regeln):
    return '\n'.join(f'- {r["id"]}: {r["name"]}. {r["regel"]} Beispiel: {r["beispiele"][0].replace("[,]", ",").replace("{", "").replace("}", "").replace("*", "")}' for r in regeln)


def prompt_schreiben(s, regeln):
    art = 'eine Erzählung' if s['art'] == 'erzaehlung' else 'einen Sachtext'
    fokus = ', '.join(s['fokus'])
    name = f' Die Hauptfigur heißt {s["name"]}.' if s['art'] == 'erzaehlung' else ''
    return f"""Schreibe {art} für ein Kind in der 5. Klasse einer deutschen Schule. Der Text dient zum Üben der Kommasetzung.

Thema: {s['thema']}. Form: {s['form']}.{name}
Länge: 90 bis 130 Wörter, ein einziger Absatz.
Kommas: genau 9 bis 12 Kommas. Jedes Komma muss nach einer dieser Regeln stehen:
{regel_text(regeln)}
Verwende besonders diese Regeln: {fokus}. Insgesamt sollen mindestens vier verschiedene Regeln vorkommen.

Wichtig:
- Setze ALLE Kommas, die nach der amtlichen Rechtschreibung nötig sind, und keine anderen.
- Vermeide Satzbau, der Kommas aus anderen Regeln braucht: keine Beisätze (Appositionen), keine Infinitivgruppen mit „zu“, keine Partizipgruppen, kein „z. B.“, keine Datumsangaben, keine Zahlen mit Komma, keine Einschübe mit Gedankenstrich, kein Semikolon.
- Wörtliche Rede steht in deutschen Anführungszeichen „so“. Steht der Begleitsatz danach, folgt ein Komma nach dem schließenden Anführungszeichen, auch nach ? oder !.
- Zwei Hauptsätze, die mit „und“ oder „oder“ verbunden sind, bitte vermeiden (dort ist das Komma freiwillig).
- Einfache, lebendige Sprache, kurze bis mittellange Sätze, sachlich richtig, freundlich.

Gib zu jedem Komma im Text, in der Reihenfolge im Text, einen Eintrag an: "vor" = das Wort direkt vor dem Komma, "nach" = das Wort direkt danach (ohne Satzzeichen), "regel" = die Regel-Id, "warum" = ein kurzer Satz für ein Kind, der genau dieses Komma erklärt (zum Beispiel: „weil“ leitet einen Nebensatz ein, das Verb „regnet“ steht am Ende.)."""


def prompt_blind(text_ohne):
    return f"""In diesem deutschen Text wurden alle Kommas entfernt. Setze alle Kommas, die nach der amtlichen deutschen Rechtschreibung nötig sind, und keine weiteren. Ändere sonst nichts am Text: keine Wörter, keine anderen Satzzeichen. Gib nur den Text mit Kommas zurück.

{text_ohne}"""

# ---------------- Text-Werkzeuge ----------------
def normalisiere(t):
    t = re.sub(r'\s+', ' ', t).strip()
    t = t.replace('‚', '„').replace('”', '“')
    # Gerade Anführungszeichen abwechselnd in „ und “ umwandeln.
    n = [0]
    def q(m):
        n[0] += 1
        return '„' if n[0] % 2 else '“'
    t = re.sub(r'"', q, t)
    t = re.sub(r'\s+,', ',', t)
    return t


def nackt(w):
    return re.sub(r'[^\wäöüÄÖÜß]', '', w).lower()


def kommastellen(text):
    """Liste der Wortpositionen i, nach denen ein Komma steht (Wörter = Leerzeichen-getrennt)."""
    toks = text.split(' ')
    return toks, [i for i, t in enumerate(toks) if t.endswith(',')]


def ohne_kommas(text):
    return re.sub(r',(?=\s|$)', '', text)

NS = {'weil', 'dass', 'obwohl', 'damit', 'nachdem', 'bevor', 'während', 'wenn', 'ob', 'als', 'sodass', 'falls', 'seit', 'seitdem', 'bis', 'wer', 'was', 'wo', 'wie', 'warum', 'weshalb', 'wohin', 'woher', 'indem'}
NS_STARK = {'weil', 'dass', 'obwohl', 'damit', 'nachdem', 'bevor', 'sodass', 'falls', 'indem', 'seitdem'}
REL = {'der', 'die', 'das', 'den', 'dem', 'dessen', 'deren', 'denen', 'welcher', 'welche', 'welches', 'welchen', 'welchem', 'wo', 'was'}
PRAEP = {'in', 'an', 'auf', 'mit', 'von', 'zu', 'bei', 'für', 'über', 'unter', 'aus', 'nach', 'vor', 'durch', 'um', 'hinter', 'neben', 'zwischen', 'ohne', 'gegen'}
GEG = {'aber', 'sondern', 'doch', 'jedoch'}
AUSRUF = {'ach', 'oh', 'ja', 'nein', 'hurra', 'au', 'aua', 'oje', 'juhu', 'hey', 'na', 'ah', 'igitt', 'pst', 'okay', 'tja'}


def satzanfang(toks, i):
    return i == 0 or re.search(r'[.!?:]["“]?$', toks[i - 1]) is not None


def pruefe_text(item, regel_ids):
    """Skript-Prüfungen. Gibt (fehler, hinweise) zurück: Fehler = Text verwerfen, Hinweise = genauer ansehen."""
    fehler, hinweise = [], []
    text, kommas = item['text'], item['kommas']
    toks, pos = kommastellen(text)
    worte = len(toks)
    if not 80 <= worte <= 150: fehler.append(f'{worte} Wörter (erlaubt 80 bis 150)')
    if not 8 <= len(pos) <= 14: fehler.append(f'{len(pos)} Kommas (erlaubt 8 bis 14)')
    if re.search(r'\d,\d', text): fehler.append('Zahl mit Komma')
    if ';' in text or ' – ' in text or ' - ' in text: fehler.append('Semikolon oder Gedankenstrich')
    if re.search(r',\S', text): fehler.append('Komma ohne Leerzeichen danach')
    if '"' in text or text.count('„') != text.count('“'): fehler.append('Anführungszeichen unvollständig')
    if len(kommas) != len(pos):
        fehler.append(f'{len(pos)} Kommas im Text, aber {len(kommas)} Regel-Einträge')
        return fehler, hinweise
    for k, (i, e) in enumerate(zip(pos, kommas)):
        if e['regel'] not in regel_ids: fehler.append(f'Komma {k+1}: unbekannte Regel {e["regel"]}')
        vor, nach = nackt(toks[i]), nackt(toks[i + 1]) if i + 1 < len(toks) else ''
        if 'vor' in e and (nackt(e['vor']) != vor or nackt(e['nach']) != nach):
            fehler.append(f'Komma {k+1}: Eintrag „{e["vor"]}, {e["nach"]}“ passt nicht zum Text „{toks[i]} {toks[i+1]}“')
        # Plausibilität der Regel
        r, ctx = e['regel'], f'„{toks[i]} {toks[i+1] if i + 1 < len(toks) else ""}“'
        satz = []
        j = i
        while j >= 0 and not (j < i and re.search(r'[.!?]["“]?$', toks[j])): satz.append(nackt(toks[j])); j -= 1
        nach2 = nackt(toks[i + 2]) if i + 2 < len(toks) else ''
        if r == 'gegensatz' and nach not in GEG: hinweise.append(f'Komma {k+1} {ctx}: Regel gegensatz, aber kein aber/sondern/doch/jedoch danach')
        if r == 'aufzaehlung' and nach in ('und', 'oder'): fehler.append(f'Komma {k+1} {ctx}: Komma vor und/oder in einer Aufzählung')
        if r == 'nebensatz' and nach not in NS and not (set(satz) & NS): hinweise.append(f'Komma {k+1} {ctx}: Regel nebensatz, aber kein Bindewort zu sehen')
        if r == 'relativsatz' and nach not in REL and not (nach in PRAEP and nach2 in REL) and not (set(satz) & REL):
            hinweise.append(f'Komma {k+1} {ctx}: Regel relativsatz, aber kein Relativpronomen zu sehen')
        if r == 'woertliche_rede' and not (toks[i].endswith('“,') or toks[i + 1].startswith('„')):
            hinweise.append(f'Komma {k+1} {ctx}: Regel woertliche_rede, aber kein Anführungszeichen am Komma')
        if r == 'ausruf' and not (nackt(toks[i]) in AUSRUF and satzanfang([t.lstrip('„') for t in toks], i)):
            hinweise.append(f'Komma {k+1} {ctx}: Regel ausruf, aber kein Ausrufewort am Satzanfang')
    # Verdächtige fehlende Kommas
    for i in range(1, len(toks) - 1):
        if toks[i - 1].endswith(',') or satzanfang(toks, i): continue
        w = nackt(toks[i])
        prev = nackt(toks[i - 1])
        if prev in ('und', 'oder', 'aber', 'sowie', 'als', 'so', 'auch', 'nur', 'ohne', 'statt'): continue
        if w in NS_STARK or w in ('aber', 'sondern'):
            hinweise.append(f'Vor „{toks[i]}“ steht kein Komma: „{toks[i-1]} {toks[i]}“. Fehlt eins?')
        if toks[i - 1].endswith('“') and toks[i][0].islower():
            hinweise.append(f'Nach der wörtlichen Rede „…{toks[i-1]} {toks[i]}“ fehlt vielleicht ein Komma.')
    return fehler, hinweise


def vergleiche(text, blind):
    """Vergleicht die Kommastellen der Lösung mit einem blind gesetzten Text. Gibt (fehlen_blind, extra_blind) als Kontexte zurück."""
    toks, pos = kommastellen(text)
    btoks, bpos = kommastellen(normalisiere(blind))
    if [nackt(t) for t in btoks] != [nackt(t) for t in toks]:
        return None  # Modell hat den Text verändert
    ctx = lambda i: ' '.join(t.rstrip(',') for t in toks[max(0, i - 3):i + 1]) + ' | ' + ' '.join(t.rstrip(',') for t in toks[i + 1:i + 4])
    return [ctx(i) for i in pos if i not in bpos], [ctx(i) for i in bpos if i not in pos]


def ngramme(text, n=3):
    w = [nackt(t) for t in text.split()]
    return {tuple(w[i:i + n]) for i in range(len(w) - n + 1)}


def aehnlichkeit(a, b):
    x, y = ngramme(a), ngramme(b)
    return len(x & y) / max(1, len(x | y))

# ---------------- Ablauf ----------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--anzahl', type=int, default=5)
    ap.add_argument('--start', type=int, default=0, help='Nummer des ersten Seeds (für weitere Läufe)')
    ap.add_argument('--blind', type=int, default=len(PRUEF_MODELLE), help='Anzahl blinder Gegenproben pro Text')
    ap.add_argument('--pruefe-vorhandene', action='store_true')
    a = ap.parse_args()
    regeln = json.loads((KOMMA / 'regeln.json').read_text())['regeln']
    regel_ids = {r['id'] for r in regeln}
    vorhanden = json.loads((KOMMA / 'texte.json').read_text())['texte']

    if a.pruefe_vorhandene:
        for t in vorhanden:
            f, h = pruefe_text(t, regel_ids)
            print(t['id'], t['titel'], 'Fehler:', f or '-', 'Hinweise:', h or '-')
        return

    aus = HIER / 'ausgabe'; aus.mkdir(exist_ok=True)
    kandidaten, bericht = [], [f'# Bericht: {a.anzahl} Texte, Modell {MODELL}, {time.strftime("%Y-%m-%d %H:%M")}\n']
    for s in seeds(a.anzahl, a.start):
        t0 = time.time()
        print(f'[{s["nr"]}] {s["art"]}: {s["thema"]} …', file=sys.stderr, flush=True)
        roh = ollama(MODELL, [{'role': 'user', 'content': prompt_schreiben(s, regeln)}], schema=SCHEMA, seed=s['seed'], temperature=0.8)
        try:
            d = json.loads(roh)
        except json.JSONDecodeError:
            bericht.append(f'## {s["nr"]}. {s["thema"]}\n\nKein gültiges JSON.\n'); continue
        item = {'id': f'{"e" if s["art"] == "erzaehlung" else "s"}-g{s["nr"]:03d}', 'art': s['art'], 'titel': d['titel'].strip(),
                'thema': s['thema'], 'text': normalisiere(d['text']),
                'kommas': [{'regel': k['regel'], 'warum': k['warum'].strip(), 'vor': k['vor'], 'nach': k['nach']} for k in d['kommas']]}
        fehler, hinweise = pruefe_text(item, regel_ids)
        blind = []
        for m_i, m in enumerate(PRUEF_MODELLE[:a.blind]):
            b = ollama(m, [{'role': 'user', 'content': prompt_blind(ohne_kommas(item['text']))}], seed=1000 + m_i, temperature=0.3 if m_i else 0)
            v = vergleiche(item['text'], b)
            blind.append({'modell': m, 'veraendert': v is None, 'fehlt_bei_blind': v[0] if v else [], 'extra_bei_blind': v[1] if v else []})
        aehnlich = sorted(((round(aehnlichkeit(item['text'], o['text']), 3), o['id']) for o in vorhanden + kandidaten), reverse=True)[:1]
        item['pruefung'] = {'seed': s, 'fehler': fehler, 'hinweise': hinweise, 'blind': blind, 'aehnlichste': aehnlich, 'sekunden': round(time.time() - t0)}
        kandidaten.append(item)
        toks, pos = kommastellen(item['text'])
        bericht.append(f'## {item["id"]}: {item["titel"]} ({s["art"]}, {s["form"]}; Fokus {", ".join(s["fokus"])})\n')
        bericht.append(item['text'] + '\n')
        bericht.append(f'{len(toks)} Wörter, {len(pos)} Kommas.\n')
        for k, (i, e) in enumerate(zip(pos, item['kommas'])):
            bericht.append(f'{k+1}. `{toks[i]} {toks[i+1] if i + 1 < len(toks) else ""}` **{e["regel"]}**: {e["warum"]}')
        bericht.append('\n**Skript-Fehler:** ' + ('; '.join(fehler) or 'keine'))
        bericht.append('\n**Hinweise:** ' + ('; '.join(hinweise) or 'keine'))
        for b in blind:
            if b['veraendert']: bericht.append(f'\n**Blind {b["modell"]}:** hat den Text verändert, nicht vergleichbar')
            else: bericht.append(f'\n**Blind {b["modell"]}:** fehlt bei blind: {b["fehlt_bei_blind"] or "-"}; zusätzlich bei blind: {b["extra_bei_blind"] or "-"}')
        bericht.append(f'\n**Ähnlichster vorhandener Text:** {aehnlich}\n')
    (aus / 'kandidaten.json').write_text(json.dumps({'texte': kandidaten}, ensure_ascii=False, indent=2) + '\n')
    (aus / 'bericht.md').write_text('\n'.join(bericht) + '\n')
    print(f'Fertig: {aus / "kandidaten.json"} und {aus / "bericht.md"}', file=sys.stderr)


if __name__ == '__main__':
    main()
