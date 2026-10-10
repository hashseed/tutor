#!/usr/bin/env python3
"""Prüft die Texte der Kerngedanken-Werkstatt ohne Sprachmodell.
Aufruf: python3 kerngedanke/werkzeug/pruefen.py [weitere.json …]
Prüft immer kerngedanke/texte.json und dazu die genannten Dateien (z. B. Entwürfe)."""
import json, re, sys
from collections import Counter
from pathlib import Path

HIER = Path(__file__).resolve().parent
APP = HIER.parent
ARTEN = ('richtig', 'nah', 'teils', 'falsch')
TYPEN = {'nah': {'zu-eng', 'ohne-ende', 'zu-allgemein'}, 'teils': {'detail', 'verdreht', 'uebertrieben'},
         'falsch': {'anderes-thema', 'gegenteil', 'erfunden'}}
VERRAETER = ('insgesamt', 'zusammenfassend', 'der text', 'in diesem text', 'die geschichte zeigt', 'richtig')
STOP = set('der die das den dem des ein eine einen einem einer eines und oder aber sie er es ich du wir ihr in im an am auf aus bei mit nach von vor zu zum zur für über unter um ist sind war waren hat haben hatte hatten wird werden wurde wurden nicht auch noch nur sich so wie als dass weil wenn sehr mehr man was wer'.split())


def woerter(s):
    return re.findall(r'[\wÄÖÜäöüß-]+', s)


def inhalt(s):
    return {w.lower() for w in woerter(s) if w.lower() not in STOP and len(w) > 2}


def pruefe(t, seeds):
    f, h = [], []
    for k in ('id', 'art', 'titel', 'thema', 'text', 'tipp', 'antworten'):
        if not t.get(k): f.append(f'Feld {k} fehlt')
    if f: return f, h
    s = seeds.get(t['id'])
    if not s: h.append('Id steht nicht in seeds.json')
    else:
        if s['thema'] != t['thema']: f.append(f'Thema passt nicht zum Seed: „{s["thema"]}“')
        if s['art'] != t['art']: f.append(f'Art passt nicht zum Seed: {s["art"]}')
        if s.get('name') and s['name'] not in t['text']: f.append(f'Name {s["name"]} aus dem Seed fehlt im Text')
    text = t['text']
    n = len(woerter(text))
    if not 150 <= n <= 230: (f if not 135 <= n <= 250 else h).append(f'Text hat {n} Wörter (soll 150 bis 230)')
    absaetze = [p for p in text.split('\n') if p.strip()]
    if not 2 <= len(absaetze) <= 4: f.append(f'{len(absaetze)} Absätze (soll 2 bis 4)')
    if any('"' in x for x in [text, t['tipp']] + [a.get('text', '') + a.get('warum', '') for a in t['antworten']]):
        f.append('Gerade Anführungszeichen " gefunden, deutsche „…“ verwenden')
    if re.search(r'\s[,.!?]', text) or '  ' in text: f.append('Leerzeichen vor Satzzeichen oder doppelt')
    a = t['antworten']
    if [x.get('art') for x in a] != list(ARTEN): f.append('antworten müssen genau richtig, nah, teils, falsch sein (in dieser Reihenfolge)')
    else:
        for x in a[1:]:
            if x.get('typ') not in TYPEN[x['art']]: f.append(f'{x["art"]}: typ „{x.get("typ")}“ unbekannt')
            elif s and s.get(x['art']) != x['typ']: h.append(f'{x["art"]}: typ {x["typ"]} statt {s.get(x["art"])} aus dem Seed')
    laengen = []
    for x in a:
        if not x.get('text') or not x.get('warum'): f.append(f'{x.get("art")}: text oder warum fehlt'); continue
        w = len(woerter(x['text']))
        laengen.append(w)
        if not 10 <= w <= 36: (f if not 8 <= w <= 40 else h).append(f'{x["art"]}: {w} Wörter (soll 14 bis 32)')
        if x['text'] in text: f.append(f'{x["art"]}: Antwort steht wörtlich im Text')
        if any(v in x['text'].lower() for v in VERRAETER): h.append(f'{x["art"]}: verräterisches Wort in „{x["text"]}“')
        if len(woerter(x['warum'])) < 8: h.append(f'{x["art"]}: warum sehr kurz')
    if len(laengen) == 4:
        if max(laengen) > 1.6 * min(laengen): f.append(f'Antworten ungleich lang: {laengen} Wörter')
        if laengen[0] == max(laengen) and laengen[0] - sorted(laengen)[-2] >= 4: h.append(f'richtige Antwort ist deutlich die längste: {laengen}')
        tw = inhalt(text)
        ov = [len(inhalt(x['text']) & tw) / max(1, len(inhalt(x['text']))) for x in a]
        if ov[0] > max(ov[1:]) + 0.25: h.append(f'richtige Antwort hat viel mehr Wörter aus dem Text: {[round(o, 2) for o in ov]}')
    if len({x.get('text') for x in a}) < 4: f.append('zwei Antworten sind gleich')
    return f, h


def main(dateien):
    seeds = {s['id']: s for s in json.loads((HIER / 'seeds.json').read_text())}
    alle = []
    for d in [APP / 'texte.json'] + [Path(p) for p in dateien]:
        if not Path(d).exists(): continue
        for t in json.loads(Path(d).read_text())['texte']:
            alle.append((Path(d).name, t))
    fehler = 0
    ids, titel, themen = Counter(t.get('id') for _, t in alle), Counter(t.get('titel') for _, t in alle), Counter(t.get('thema') for _, t in alle)
    for quelle, t in alle:
        f, h = pruefe(t, seeds)
        if ids[t.get('id')] > 1: f.append('Id kommt mehrfach vor')
        if titel[t.get('titel')] > 1: f.append('Titel kommt mehrfach vor')
        if themen[t.get('thema')] > 1: f.append('Thema kommt mehrfach vor')
        fehler += len(f)
        if f or h:
            print(f'\n{t.get("id")} {t.get("titel")} ({quelle})')
            for x in f: print('  FEHLER  ', x)
            for x in h: print('  Hinweis ', x)
    l = [[len(woerter(x['text'])) for x in t['antworten']] for _, t in alle if len(t.get('antworten', [])) == 4]
    if l:
        laengste = Counter(max(range(4), key=lambda i: (r[i], -i)) for r in l)
        print('\nWie oft welche Antwort die längste ist (richtig, nah, teils, falsch):', [laengste[i] for i in range(4)])
    print(f'{len(alle)} Texte, {fehler} Fehler.')
    return 1 if fehler else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
