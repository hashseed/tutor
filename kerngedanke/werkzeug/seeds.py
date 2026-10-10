#!/usr/bin/env python3
"""Erzeugt kerngedanke/werkzeug/seeds.json: eine Zeile pro Text, der geschrieben werden soll.
Jedes Thema kommt genau einmal vor, so wiederholt sich kein Text. Die Arten der Ablenker-Antworten
werden gleichmäßig verteilt, damit die falschen Antworten abwechslungsreich sind. Reproduzierbar."""
import json, random
from pathlib import Path

ERZ = ['Das verschwundene Fahrrad', 'Ein neues Kind in der Klasse', 'Die Generalprobe für das Schulkonzert', 'Opas alter Fotoapparat',
 'Die Wette um den höchsten Turm aus Bauklötzen', 'Ein verletzter Igel im Garten', 'Der Streit um den Fensterplatz', 'Das Fußballspiel im Regen',
 'Die erste Nacht im Zelt', 'Ein Brief, der zu spät ankommt', 'Die kaputte Vase', 'Ein Hund aus dem Tierheim', 'Der Vorlesewettbewerb',
 'Die Suche nach dem Schlüssel', 'Ein Tag ohne Handy', 'Die Kürbissuppe für die Nachbarin', 'Das Geheimnis der alten Truhe',
 'Die Angst vor dem Sprungbrett', 'Ein Umzug in eine andere Stadt', 'Der verpasste Bus', 'Das Schulprojekt über Bienen', 'Eine Freundschaft per Brief',
 'Der Flohmarktstand', 'Das verlorene Kuscheltier des kleinen Bruders', 'Der Ausflug in die Berge', 'Ein Schachturnier', 'Die Klassensprecherwahl',
 'Ein Gewitter auf dem Heimweg', 'Der Kuchen für den Schulbasar', 'Das Baumhaus der Nachbarskinder', 'Die Reise mit dem Nachtzug',
 'Ein Missverständnis unter Freunden', 'Die Reparatur des Rollers', 'Der Besuch bei der Uroma', 'Die Theaterrolle, die keiner wollte',
 'Ein Wettlauf gegen die Zeit beim Bäcker', 'Die Katze auf dem Dach', 'Der Schneemann-Wettbewerb', 'Die Mathearbeit', 'Ein Tag als Gärtner im Schulgarten',
 'Das Geschenk, das selbst gebastelt war', 'Der Streit um die Fernbedienung', 'Ein Abend im Planetarium', 'Die Mutprobe im dunklen Keller']
SACH = ['Wie Zugvögel ihren Weg finden', 'Warum es Jahreszeiten gibt', 'Wie ein Vulkan ausbricht', 'Das Leben der Honigbienen', 'Wie Recycling von Plastik funktioniert',
 'Warum der Regenwald wichtig ist', 'Wie Fledermäuse im Dunkeln jagen', 'Die Erfindung des Rades', 'Wie unser Gehirn lernt', 'Warum Wasser so kostbar ist',
 'Wie Wale miteinander sprechen', 'Das Leben im Mittelalter auf einer Burg', 'Wie Elektrizität ins Haus kommt', 'Warum Bäume Jahresringe haben',
 'Wie Ameisen ihren Staat organisieren', 'Warum der Mond leuchtet', 'Wie Brücken gebaut werden', 'Das Wattenmeer bei Ebbe und Flut', 'Wie Impfungen schützen',
 'Warum Dinosaurier ausgestorben sind', 'Wie Schokolade hergestellt wird', 'Warum wir Träume haben', 'Wie Chamäleons ihre Farbe ändern',
 'Die alten Ägypter und ihre Schrift', 'Wie Wind entsteht', 'Warum Meerwasser salzig ist', 'Wie Pflanzen Sonnenlicht nutzen', 'Wie das Internet funktioniert',
 'Warum Eisbären bedroht sind', 'Wie Kinder im alten Rom lebten', 'Wie Erdbeben entstehen', 'Warum Bewegung gesund ist', 'Wie Brieftauben heimfinden',
 'Wie Bienen und Blumen sich gegenseitig helfen', 'Warum Lärm krank machen kann', 'Wie Höhlen entstehen', 'Die Geschichte der Eisenbahn', 'Wie Kraken jagen und sich verstecken',
 'Wie ein Fluss von der Quelle zum Meer fließt', 'Warum Schlaf für Kinder wichtig ist']
FABEL = ['Der Fuchs und der Storch', 'Die Ameise und die Taube', 'Der Löwe und die Maus', 'Der Hase und der Igel', 'Der Rabe und der Krug',
 'Der Wolf und der Kranich', 'Die Stadtmaus und die Feldmaus', 'Der Esel in der Löwenhaut']
BERICHT = ['Schulfest sammelt Geld für einen neuen Spielplatz', 'Jugendfeuerwehr übt mit der Schule', 'Kinder retten Kröten an der Landstraße',
 'Neue Stadtbücherei öffnet mit Leseclub', 'Klasse 6b gewinnt Müllsammelaktion', 'Storch brütet erstmals wieder im Dorf',
 'Schülerzeitung deckt Problem mit Schulweg auf', 'Sportverein sucht Trainer für Kindermannschaft']

FORM = {
 'erzaehlung': ['Ich-Erzählung im Präteritum', 'Er-/Sie-Erzählung im Präteritum', 'Erzählung mit wörtlicher Rede (Präteritum)', 'Ich-Erzählung im Präsens'],
 'sachtext': ['Erklärtext für Kinder (Präsens)', 'Lexikonartikel (Präsens)', 'Sachtext mit Frage als Überschrift (Präsens)'],
 'fabel': ['Fabel im Präteritum, die Lehre wird NICHT ausgesprochen'],
 'bericht': ['Zeitungsbericht (Präteritum, W-Fragen)'],
}
NAMEN = ['Lena', 'Noah', 'Emilia', 'Ben', 'Mila', 'Elias', 'Hannah', 'Finn', 'Lina', 'Moritz', 'Ella', 'Leo', 'Clara', 'Theo', 'Amira', 'Leon', 'Ida', 'Karim',
 'Sophie', 'Mats', 'Zoe', 'Emil', 'Nele', 'Anton', 'Frieda', 'Yusuf', 'Marie', 'Jakob', 'Aylin', 'Oskar', 'Greta', 'Milan', 'Luisa', 'David', 'Johanna', 'Samuel',
 'Mia', 'Henri', 'Elif', 'Felix', 'Pia', 'Niklas', 'Tilda', 'Ole']
# Wie die drei falschen Antworten danebenliegen (siehe SCHREIBEN.md).
NAH = ['zu-eng', 'ohne-ende', 'zu-allgemein']
TEILS = ['detail', 'verdreht', 'uebertrieben']
FALSCH = ['anderes-thema', 'gegenteil', 'erfunden']

rnd = random.Random(20261010)
pools = {'erzaehlung': rnd.sample(ERZ, len(ERZ)), 'sachtext': rnd.sample(SACH, len(SACH)),
         'fabel': rnd.sample(FABEL, len(FABEL)), 'bericht': rnd.sample(BERICHT, len(BERICHT))}
assert sum(map(len, pools.values())) == 100 and len(set(ERZ + SACH + FABEL + BERICHT)) == 100
order = [a for a, p in pools.items() for _ in p]
rnd.shuffle(order)
namen = rnd.sample(NAMEN, len(NAMEN))
cnt = {}
def balanced(pool):  # die bisher seltenste Art zuerst, damit sich alles ausgleicht
    k = min(pool, key=lambda x: (cnt.get(x, 0), rnd.random()))
    cnt[k] = cnt.get(k, 0) + 1
    return k
rows, nr = [], {}
for art in order:
    nr[art] = nr.get(art, 0) + 1
    row = {'id': f'{art[0]}-{nr[art]:03d}', 'art': art, 'thema': pools[art].pop(), 'form': rnd.choice(FORM[art]),
           'nah': balanced(NAH), 'teils': balanced(TEILS), 'falsch': balanced(FALSCH)}
    if art == 'erzaehlung': row['name'] = namen[nr[art] % len(namen)]
    rows.append(row)
Path(__file__).with_name('seeds.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
print(len(rows), {a: nr[a] for a in nr}, cnt)
