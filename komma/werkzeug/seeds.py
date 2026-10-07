#!/usr/bin/env python3
"""Erzeugt komma/werkzeug/seeds.json: eine Zeile pro Text, der noch geschrieben werden soll.
Jedes Thema kommt genau einmal vor; Schwerpunkt-Regeln werden gleichmäßig verteilt. Reproduzierbar."""
import json, random
from pathlib import Path

ERZ = ['Ein verlorener Hund im Park', 'Die Klassenfahrt an die Ostsee', 'Ein Gewitter beim Zelten', 'Der erste Tag an der neuen Schule',
 'Ein Kuchen, der schiefgeht', 'Ein Geheimgang im Schulkeller', 'Das Kanurennen am See', 'Streit unter zwei Freundinnen',
 'Die Geburtstagsüberraschung für Opa', 'Der Flohmarkt in der Nachbarschaft', 'Ein Schneetag ohne Schule', 'Die Theateraufführung der Klasse',
 'Im Kletterwald', 'Das Rätsel im Museum', 'Ein Papagei, der Wörter nachplappert', 'Die Fahrradpanne im Wald', 'Umzug in eine neue Stadt',
 'Das Baumhaus', 'Ferien auf dem Bauernhof', 'Die verlorene Brille von Oma', 'Ein Hamster ist ausgebüxt', 'Der Wettlauf beim Sportfest',
 'Eine Nacht im Schullandheim', 'Der Schulhofgarten', 'Ein Brief von einer Brieffreundin', 'Der Drache aus dem Märchenbuch',
 'Die Zeitreise in die Ritterzeit', 'Ein Roboter hilft im Haushalt', 'Das Lagerfeuer am Strand', 'Der Besuch beim Zahnarzt',
 'Ein Tag als Zirkusartist', 'Die Schatzkarte auf dem Dachboden', 'Das neue Geschwisterchen', 'Ein Ausflug in die Tropfsteinhöhle',
 'Die Schneeballschlacht', 'Ein verzauberter Regenschirm', 'Der Ausflug in den Freizeitpark', 'Die Bücherei nach Ladenschluss',
 'Ein Pony namens Wolke', 'Der Laternenumzug', 'Der Kochwettbewerb in der Küche', 'Ein Abenteuer mit dem Floß', 'Der Stromausfall am Abend',
 'Die Mutprobe am Sprungturm', 'Ein Fuchs in der Stadt', 'Das Weihnachtsgeschenk für Mama', 'Ein Nachmittag im Tierheim', 'Die Mondrakete aus Pappe']
SACH = ['Wie Bienen Honig machen', 'Der Wasserkreislauf', 'Warum Blätter im Herbst bunt werden', 'Das Leben der Pinguine',
 'Wie ein Regenbogen entsteht', 'Ritter im Mittelalter', 'Wie Mülltrennung funktioniert', 'Der Mond und seine Phasen',
 'Wie aus einer Raupe ein Schmetterling wird', 'Die Römer in Germanien', 'Das Wattenmeer', 'Wie Kartoffeln wachsen',
 'Fledermäuse', 'Wie ein Brief zum Empfänger kommt', 'Die Erfindung des Buchdrucks', 'Der tropische Regenwald', 'Wie Ameisen zusammenarbeiten',
 'Warum wir schlafen müssen', 'Die Olympischen Spiele', 'Der Eisbär', 'Wie ein Flugzeug fliegen kann', 'Die Pyramiden in Ägypten',
 'Der Maulwurf', 'Wie Brot gebacken wird', 'Die Sonne', 'Wale im Ozean', 'Wie unser Herz arbeitet', 'Der Rhein',
 'Wie Papier hergestellt wird', 'Die Wikinger', 'Eichhörnchen im Winter', 'Wie ein Gewitter entsteht', 'Das Fahrrad und seine Teile',
 'Die Feuerwehr', 'Wie Pflanzen trinken', 'Dinosaurier', 'Der Wolf', 'Die Zähne', 'Schokolade und Kakao', 'Die Alpen', 'Wie ein Kompass funktioniert',
 'Der Storch', 'Korallenriffe', 'Die Steinzeit', 'Wie Ebbe und Flut entstehen', 'Das Smartphone', 'Wie Salz aus dem Meer gewonnen wird']

FORM_E = ['Ich-Erzählung im Präteritum', 'Er-/Sie-Erzählung im Präteritum', 'Erzählung mit viel wörtlicher Rede (Präteritum)', 'Ich-Erzählung im Präsens', 'Tagebucheintrag (Präteritum)']
FORM_S = ['Lexikonartikel (Präsens)', 'Erklärtext für Kinder (Präsens)', 'kurzer Bericht (Präteritum)', 'Sachtext mit einer Frage als Überschrift (Präsens)']
NAMEN = ['Lena', 'Noah', 'Emilia', 'Ben', 'Mila', 'Elias', 'Hannah', 'Finn', 'Lina', 'Moritz', 'Ella', 'Leo', 'Clara', 'Theo', 'Amira', 'Leon', 'Ida', 'Karim', 'Sophie',
 'Mats', 'Zoe', 'Emil', 'Nele', 'Anton', 'Frieda', 'Yusuf', 'Marie', 'Jakob', 'Aylin', 'Oskar', 'Greta', 'Milan', 'Luisa', 'David', 'Johanna', 'Samuel', 'Mia', 'Henri',
 'Elif', 'Felix', 'Pia', 'Niklas', 'Tilda', 'Ole', 'Romy', 'Vincent', 'Lotta', 'Arne']
R_E = ['woertliche_rede', 'anrede', 'ausruf', 'nebensatz', 'relativsatz', 'aufzaehlung', 'gegensatz', 'satzreihe']
R_S = ['nebensatz', 'relativsatz', 'aufzaehlung', 'gegensatz', 'satzreihe']

rnd = random.Random(20261007)
rows = []
erz, sach, namen = rnd.sample(ERZ, len(ERZ)), rnd.sample(SACH, len(SACH)), rnd.sample(NAMEN, len(NAMEN))
cnt = {r: 0 for r in R_E}
def fokus(pool, k):  # die bisher seltensten Regeln zuerst, damit sich alles ausgleicht
    p = sorted(pool, key=lambda r: (cnt[r], rnd.random()))[:k]
    for r in p: cnt[r] += 1
    return p
for i in range(95):
    if i % 2 == 0 and erz or not sach:
        f = fokus(R_E[:3], 1) + fokus(R_E[3:], 2)
        rows.append({'id': f'e-{len([r for r in rows if r["art"] == "erzaehlung"]) + 4:03d}', 'art': 'erzaehlung', 'thema': erz.pop(), 'form': rnd.choice(FORM_E), 'fokus': f, 'name': namen[len(rows) % len(namen)]})
    else:
        rows.append({'id': f's-{len([r for r in rows if r["art"] == "sachtext"]) + 3:03d}', 'art': 'sachtext', 'thema': sach.pop(), 'form': rnd.choice(FORM_S), 'fokus': fokus(R_S, 3)})
Path(__file__).with_name('seeds.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
print(len(rows), cnt, sum(r['art'] == 'erzaehlung' for r in rows))
