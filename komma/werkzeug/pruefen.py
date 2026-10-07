#!/usr/bin/env python3
"""Prüft Texte für die Komma-Werkstatt, ohne Modell. Nur Standardbibliothek.

    python3 komma/werkzeug/pruefen.py                 # komma/texte.json
    python3 komma/werkzeug/pruefen.py datei.json ...  # weitere Dateien im Format von texte.json, zusammen mit texte.json

Meldet pro Text Fehler (muss behoben werden) und Hinweise (genau ansehen), dann Ähnlichkeiten zwischen
allen Texten und wie oft jede Regel vorkommt. Exit-Code 1, wenn es Fehler gibt.
"""
import json, re, sys
from collections import Counter
from pathlib import Path

KOMMA = Path(__file__).resolve().parent.parent

def nackt(w):
    return re.sub(r'[^\wäöüÄÖÜß]', '', w).lower()


def kommastellen(text):
    """Liste der Wortpositionen i, nach denen ein Komma steht (Wörter = Leerzeichen-getrennt)."""
    toks = text.split(' ')
    return toks, [i for i, t in enumerate(toks) if t.endswith(',')]


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
        st = [t.lstrip('„') for t in toks]  # „Oh nein, …“ zählt auch als Ausruf am Satzanfang
        if r == 'ausruf' and not (nackt(toks[i]) in AUSRUF and (satzanfang(st, i) or (nackt(toks[i - 1]) in AUSRUF and satzanfang(st, i - 1)))):
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



def ngramme(text, n=3):
    w = [nackt(t) for t in text.split()]
    return {tuple(w[i:i + n]) for i in range(len(w) - n + 1)}


def aehnlichkeit(a, b):
    x, y = ngramme(a), ngramme(b)
    return len(x & y) / max(1, len(x | y))


def satz_wiederholung(text):
    s = [x.strip().lower() for x in re.split(r'(?<=[.!?])\s+', text) if len(x.split()) > 3]
    return [x for x, n in Counter(s).items() if n > 1]

def main(dateien):
    regel_ids = {r['id'] for r in json.loads((KOMMA / 'regeln.json').read_text())['regeln']}
    alle = []
    for d in [KOMMA / 'texte.json'] + [Path(p) for p in dateien]:
        for t in json.loads(Path(d).read_text())['texte']:
            alle.append((Path(d).name, t))
    fehler_gesamt, ids = 0, Counter(t['id'] for _, t in alle)
    for quelle, t in alle:
        f, h = pruefe_text(t, regel_ids)
        f += [f'Satz doppelt: „{s}“' for s in satz_wiederholung(t['text'])]
        if ids[t['id']] > 1: f.append(f'Id {t["id"]} kommt mehrfach vor')
        for k in ('id', 'art', 'titel', 'thema', 'text', 'kommas'):
            if not t.get(k): f.append(f'Feld {k} fehlt')
        if t.get('art') not in ('erzaehlung', 'sachtext'): f.append('art muss erzaehlung oder sachtext sein')
        if any(not k.get('warum') for k in t.get('kommas', [])): f.append('Komma ohne warum')
        if len({k['regel'] for k in t.get('kommas', [])}) < 3: h.append('weniger als 3 verschiedene Regeln')
        fehler_gesamt += len(f)
        if f or h:
            print(f'\n{t["id"]} {t["titel"]} ({quelle})')
            for x in f: print('  FEHLER  ', x)
            for x in h: print('  Hinweis ', x)
    print('\nÄhnliche Paare (Wort-3-Gramme > 0,12):')
    for i in range(len(alle)):
        for j in range(i + 1, len(alle)):
            a = aehnlichkeit(alle[i][1]['text'], alle[j][1]['text'])
            if a > 0.12: print(f'  {a:.2f} {alle[i][1]["id"]} {alle[j][1]["id"]}')
    titel = Counter(t['titel'] for _, t in alle)
    for x, n in titel.items():
        if n > 1: print('  Titel doppelt:', x); fehler_gesamt += 1
    regeln = Counter(k['regel'] for _, t in alle for k in t['kommas'])
    texte_mit = Counter(r for _, t in alle for r in {k['regel'] for k in t['kommas']})
    print(f'\n{len(alle)} Texte, {sum(regeln.values())} Kommas. Kommas je Regel / Texte mit der Regel:')
    for r in sorted(regel_ids): print(f'  {r:16} {regeln[r]:4} {texte_mit[r]:4}')
    print(f'\n{fehler_gesamt} Fehler.')
    return 1 if fehler_gesamt else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
