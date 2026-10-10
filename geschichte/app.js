/* Geschichts-Werkstatt: navigation, scene player, task types, tests and games.
   Questions live in fragen.json, the animated stages in buehnen.js. App prefix "gs". */
'use strict';
const { $, $$, S, esc, shuffle, tween, wait, makeSeg, mountCheck, store } = Kit;
const save = store('gs');
const YEAR = new Date().getFullYear();

/* ================= Sections and parts ================= */
const PARTS = [
  { id: 'p1', name: 'Teil 1', sub: 'Zeit', secs: ['a1', 'a2', 'a3'] },
  { id: 'p2', name: 'Teil 2', sub: 'Quellen', secs: ['a4', 'a5', 'a6', 'a7'] },
  { id: 'p3', name: 'Teil 3', sub: 'Altsteinzeit', secs: ['a8', 'a9', 'a10', 'a11', 'a12'] },
  { id: 'stolper', name: 'Stolperstellen', sub: 'Knifflige Stellen', secs: ['s1'] },
  { id: 'probe', name: 'Probe üben', sub: 'Gemischte Aufgaben' },
  { id: 'spiele', name: 'Spiele' },
  { id: 'glossar', name: 'Fachbegriffe', end: true }
];
const SEC = {
  a1: { n: 1, name: 'Vergangenheit und Geschichte', h: 'Ist Vergangenheit dasselbe wie Geschichte?', lede: 'Alles, was früher passiert ist, gehört zur Vergangenheit. Aber nur einen Teil davon erforschen die Geschichtsforscher.' },
  a2: { n: 2, name: 'Der Zeitstrahl', h: 'Wie ordnet man Ereignisse?', lede: 'Mit einem Zeitstrahl und Jahreszahlen können wir Ereignisse zeitlich ordnen. In der Mitte steht Christi Geburt.' },
  a3: { n: 3, name: 'Wie lange ist das her?', h: 'Wie viele Jahre liegen dazwischen?', lede: 'Auf dem Zeitstrahl kannst du ablesen, wie lange etwas her ist. Vor Christus musst du dabei zusammenzählen.' },
  a4: { n: 4, name: 'Wie Forscher arbeiten', h: 'Woher wissen wir etwas über die Vergangenheit?', lede: 'Geschichtsforscher arbeiten wie Kriminalkommissare. Sie gehen in vier Schritten vor.' },
  a5: { n: 5, name: 'Vier Quellenarten', h: 'Was steckt in der Truhe?', lede: 'Claras Eltern finden bei Großonkel Walther eine alte Truhe. Jeder Gegenstand darin ist eine Quelle.' },
  a6: { n: 6, name: 'Überrest oder Tradition', h: 'Zufällig erhalten oder absichtlich überliefert?', lede: 'Manche Quellen sind zufällig erhalten geblieben, andere wurden absichtlich für später gemacht.' },
  a7: { n: 7, name: 'Historiker und Archäologen', h: 'Wer erforscht was?', lede: 'Historiker werten vor allem schriftliche Quellen aus. Archäologen graben Überreste aus dem Boden aus.' },
  a8: { n: 8, name: 'Wann war die Altsteinzeit?', h: 'Die längste Zeit der Menschen', lede: 'Die Altsteinzeit beginnt, als Menschen die ersten Steinwerkzeuge herstellen. Sie dauert mehr als zwei Millionen Jahre.' },
  a9: { n: 9, name: 'Jäger und Sammler', h: 'Wie wohnten die Menschen?', lede: 'Die Menschen der Altsteinzeit zogen den Tieren hinterher. Darum brauchten sie Wohnungen, die man schnell abbauen konnte.' },
  a10: { n: 10, name: 'Werkzeuge und Waffen', h: 'Vom Stein zum Faustkeil', lede: 'Aus Steinen, Holz und Knochen stellten die Menschen alles her, was sie brauchten.' },
  a11: { n: 11, name: 'Feuer', h: 'Von der Gefahr zum Helfer', lede: 'Lange war Feuer vor allem gefährlich. Dann lernten die Menschen, es zu nutzen.' },
  a12: { n: 12, name: 'Höhlenmalerei', h: 'Was wissen wir sicher?', lede: 'In der Höhle von Lascaux haben Menschen vor langer Zeit Tiere an die Wände gemalt. Warum, wissen wir nicht genau.' },
  s1: { n: 1, name: 'Stolperstellen', h: 'Knifflige Stellen', lede: 'Hier stehen die Stellen, an denen man leicht stolpert. Füll die Lücken und lies die Erklärungen genau.' }
};
const partOf = id => PARTS.find(p => p.secs && p.secs.includes(id));

let DATA = null; // fragen.json
const BANK = {};  // id → {heft, transfer}

/* ================= Text helpers ================= */
// [[Quelle]] or [[Quellen|Quelle]] in texts become glossary links.
function terms(html) {
  return html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, shown, key) => `<button type="button" class="term" data-term="${esc(key || shown)}">${esc(shown)}</button>`);
}
const norm = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function evalAnswer(expr) {
  // "heute-1969", "753+heute", "2026" → number
  const s = String(expr).replace(/\s/g, '').replace(/heute/g, String(YEAR));
  if (!/^[0-9+\-]+$/.test(s)) return NaN;
  return s.match(/[+-]?\d+/g).reduce((a, b) => a + Number(b), 0);
}
const fmtYear = y => y < 0 ? `${(-y).toLocaleString('de-DE')} v. Chr.` : String(y);
const pick = (arr, n) => shuffle(arr).slice(0, n);

/* ================= Task types (turn a JSON item into a Kit.mountCheck item) ================= */
function toKit(it) {
  const prompt = esc(it.prompt);
  if (it.type === 'mcq') return { type: 'mcq', prompt, options: shuffle(it.options.map(o => ({ text: esc(o.text), correct: !!o.correct, why: esc(o.why || '') }))), explain: esc(it.explain || '') };
  const mount = { sort: sortTask, order: orderTask, gap: gapTask, num: numTask, explain: explainTask }[it.type];
  if (!mount) return null;
  return { type: 'task', prompt, mount: body => mount(it, body) };
}

/* Sort: tap a card, then tap a box. Tapping a placed card sends it back. Works with keyboard too. */
function sortTask(it, body) {
  const one = !!it.one;
  const items = shuffle(it.items.map((x, k) => ({ ...x, k })));
  body.innerHTML = `<div class="gs-pool" aria-label="Karten"></div>
    <div class="gs-buckets ${one ? 'one' : ''}">${it.buckets.map(b => `<div class="gs-bucket" data-b="${esc(b.id)}"><button type="button" class="gs-bhead">${esc(b.name).replace('Gegenständliche', 'Gegen\u00ADständliche')}</button><div class="gs-bin"></div></div>`).join('')}</div>`;
  const pool = $('.gs-pool', body);
  let sel = null;
  const cards = items.map(x => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'gs-card'; c.textContent = x.text; c.dataset.k = x.k;
    c.addEventListener('click', () => {
      if (c.parentElement !== pool) { pool.appendChild(c); c.classList.remove('bad', 'ok'); select(null); return; }
      select(sel === c ? null : c);
    });
    pool.appendChild(c); return c;
  });
  function select(c) { sel = c; cards.forEach(x => x.setAttribute('aria-pressed', x === c)); body.classList.toggle('gs-picking', !!c); }
  $$('.gs-bucket', body).forEach(b => {
    const drop = () => {
      if (!sel) return;
      const bin = $('.gs-bin', b);
      if (one && bin.firstElementChild) pool.appendChild(bin.firstElementChild);
      bin.appendChild(sel); sel.classList.remove('bad', 'ok'); select(null);
      const next = $('.gs-card', pool); if (next) select(next);
    };
    $('.gs-bhead', b).addEventListener('click', drop);
    $('.gs-bin', b).addEventListener('click', e => { if (e.target === e.currentTarget) drop(); });
  });
  if (cards[0]) select(cards[0]);
  return () => {
    if ($('.gs-card', pool)) return { ok: false, msg: 'Lege zuerst alle Karten in einen Kasten.' };
    const wrong = [];
    $$('.gs-bucket', body).forEach(b => $$('.gs-card', b).forEach(c => {
      const x = it.items[Number(c.dataset.k)], ok = [].concat(x.b).includes(b.dataset.b);
      c.classList.toggle('bad', !ok); c.classList.toggle('ok', ok);
      if (!ok) wrong.push(x);
    }));
    if (!wrong.length) { cards.forEach(c => c.disabled = true); return { ok: true, msg: esc(it.explain || 'Alles richtig sortiert.') }; }
    return { ok: false, msg: wrong.map(x => `<span class="gs-why"><b>${esc(x.text)}:</b> ${esc(x.why || 'Das passt in einen anderen Kasten.')}</span>`).join('') + ' Tippe die rot markierten Karten an und lege sie neu.' };
  };
}

/* Order: drag a row with finger or mouse, or move it with the arrow buttons (keyboard). */
function orderTask(it, body) {
  let order = shuffle(it.items.map((_, k) => k));
  if (order.every((v, k) => v === k) && order.length > 1) order.reverse();
  body.innerHTML = '<p class="gs-hint">Zieh die Karten an die richtige Stelle oder benutze die Pfeile.</p><ol class="gs-order"></ol>';
  const list = $('.gs-order', body);
  let marks = null, locked = false;
  list.addEventListener('pointerdown', e => {
    const li = e.target.closest('.gs-row');
    if (locked || !li || e.target.closest('.gs-mv') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const startY = e.clientY, top0 = li.offsetTop, scroll0 = scrollY;
    let moved = false, lastY = startY, raf = 0;
    li.setPointerCapture(e.pointerId);
    const midOf = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
    function follow() {
      const dy = lastY - startY + scrollY - scroll0;
      for (;;) { // the finger decides: pass a neighbour's middle and the two swap
        const prev = li.previousElementSibling, next = li.nextElementSibling;
        if (next && lastY > midOf(next)) list.insertBefore(next, li);
        else if (prev && lastY < midOf(prev)) list.insertBefore(prev, li.nextElementSibling); // move the neighbour, never li, so pointer capture stays
        else break;
      }
      li.style.transform = `translateY(${dy - (li.offsetTop - top0)}px)`;
      $$('.gs-pos', list).forEach((p, i) => p.textContent = i + 1);
    }
    function edgeScroll() { // near the top or bottom of the screen the page scrolls along
      const edge = 70, v = lastY > innerHeight - edge ? 10 : lastY < edge ? -10 : 0;
      if (v) { const y = scrollY; scrollBy(0, v); if (scrollY !== y) follow(); }
      raf = requestAnimationFrame(edgeScroll);
    }
    const onMove = ev => {
      lastY = ev.clientY;
      if (!moved && Math.abs(lastY - startY) < 4) return;
      if (!moved) { moved = true; li.classList.add('drag'); list.classList.add('gs-dragging'); raf = requestAnimationFrame(edgeScroll); }
      follow();
    };
    const onEnd = () => {
      cancelAnimationFrame(raf);
      li.removeEventListener('pointermove', onMove);
      li.removeEventListener('pointerup', onEnd);
      li.removeEventListener('pointercancel', onEnd);
      list.classList.remove('gs-dragging');
      if (!moved) return;
      const next = [...list.children].map(r => Number(r.dataset.k));
      if (next.some((k, i) => k !== order[i])) marks = null;
      order = next;
      draw();
    };
    li.addEventListener('pointermove', onMove);
    li.addEventListener('pointerup', onEnd);
    li.addEventListener('pointercancel', onEnd);
  });
  function draw(focusK, dir) {
    list.innerHTML = order.map((k, i) => `<li class="gs-row${marks ? (marks[i] ? ' ok' : ' bad') : ''}" data-k="${k}"><span class="gs-pos">${i + 1}</span><span class="gs-txt">${esc(it.items[k])}</span>
      <span class="gs-move"><button type="button" class="gs-mv" data-i="${i}" data-d="-1" aria-label="Nach oben: ${esc(it.items[k])}" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" class="gs-mv" data-i="${i}" data-d="1" aria-label="Nach unten: ${esc(it.items[k])}" ${i === order.length - 1 ? 'disabled' : ''}>▼</button></span></li>`).join('');
    $$('.gs-mv', list).forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.i), j = i + Number(b.dataset.d);
      [order[i], order[j]] = [order[j], order[i]]; marks = null; draw(order[j], b.dataset.d);
    }));
    if (focusK !== undefined) {
      const i = order.indexOf(focusK), btn = $(`.gs-mv[data-i="${i}"][data-d="${dir}"]`, list) || $(`.gs-mv[data-i="${i}"]:not(:disabled)`, list);
      if (btn) btn.focus();
    }
  }
  draw();
  return () => {
    marks = order.map((k, i) => k === i);
    draw();
    if (marks.every(Boolean)) { locked = true; list.classList.add('gs-locked'); $$('.gs-mv', list).forEach(b => b.disabled = true); return { ok: true, msg: esc(it.explain || 'Die Reihenfolge stimmt.') }; }
    return { ok: false, msg: `${marks.filter(m => !m).length} Karten stehen noch nicht am richtigen Platz. ${esc(it.why || '')}` };
  };
}

/* Gap text: tap a gap (the first empty one is chosen), then tap a word. */
function gapTask(it, body) {
  const parts = [], gaps = [];
  it.text.split(/(\{[^}]+\})/).forEach(s => {
    if (s.startsWith('{')) { const alts = s.slice(1, -1).split('|'); gaps.push(alts); parts.push({ gap: gaps.length - 1 }); }
    else if (s) parts.push({ text: s });
  });
  const extra = it.extra || [];
  const words = shuffle([...gaps.map(a => a[0]), ...extra.map(e => e.word)]);
  const whyOf = w => (extra.find(e => e.word === w) || {}).why;
  body.innerHTML = `<p class="gs-gaptext">${parts.map(p => p.text !== undefined ? esc(p.text) : `<button type="button" class="gs-gap" data-g="${p.gap}" aria-label="Lücke ${p.gap + 1}"><span>&nbsp;</span></button>`).join('')}</p>
    <div class="gs-words">${words.map(w => `<button type="button" class="gs-word">${esc(w)}</button>`).join('')}</div>`;
  const fill = new Array(gaps.length).fill(null);
  let cur = 0;
  const gapEls = $$('.gs-gap', body), wordEls = $$('.gs-word', body);
  function sync() {
    gapEls.forEach((g, k) => { g.classList.toggle('sel', k === cur); g.classList.toggle('full', fill[k] !== null); $('span', g).textContent = fill[k] === null ? ' ' : fill[k]; });
    const used = fill.filter(x => x !== null);
    wordEls.forEach(w => { w.hidden = used.includes(w.textContent); });
  }
  gapEls.forEach((g, k) => g.addEventListener('click', () => {
    if (fill[k] !== null && cur === k) { fill[k] = null; g.classList.remove('ok', 'bad'); }
    cur = k; sync();
  }));
  wordEls.forEach(w => w.addEventListener('click', () => {
    if (cur === null || cur < 0) cur = fill.indexOf(null);
    if (cur < 0) return;
    fill[cur] = w.textContent; gapEls[cur].classList.remove('ok', 'bad');
    const nxt = fill.findIndex((x, k) => x === null && k > cur);
    cur = nxt >= 0 ? nxt : fill.indexOf(null);
    sync();
  }));
  sync();
  return () => {
    if (fill.includes(null)) return { ok: false, msg: 'Fülle zuerst alle Lücken.' };
    const msgs = [];
    gaps.forEach((alts, k) => {
      const ok = alts.includes(fill[k]);
      gapEls[k].classList.toggle('ok', ok); gapEls[k].classList.toggle('bad', !ok);
      if (!ok) msgs.push(`<span class="gs-why"><b>„${esc(fill[k])}“:</b> ${esc(whyOf(fill[k]) || 'Dieses Wort passt hier nicht. Lies den ganzen Satz noch einmal.')}</span>`);
    });
    if (!msgs.length) { gapEls.forEach(g => g.disabled = true); wordEls.forEach(w => w.disabled = true); return { ok: true, msg: esc(it.explain || 'Alle Lücken stimmen.') }; }
    cur = gapEls.findIndex(g => g.classList.contains('bad')); sync();
    return { ok: false, msg: msgs.join('') + ' Tippe eine rote Lücke an und wähle ein anderes Wort.' };
  };
}

/* Number answer. */
function numTask(it, body) {
  const ans = evalAnswer(it.answer), tol = it.tol || 0;
  body.innerHTML = `<label class="gs-num"><input class="field gs-field" type="text" inputmode="numeric" autocomplete="off" aria-label="Deine Antwort"><span>${esc(it.unit || '')}</span></label>`;
  const inp = $('input', body);
  setTimeout(() => inp.focus({ preventScroll: true }), 50);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = body.parentElement.querySelector('.q-actions .btn.go'); if (b) b.click(); } });
  return () => {
    const v = Number(inp.value.replace(/[.\s]/g, ''));
    if (!inp.value.trim() || isNaN(v)) return { ok: false, msg: 'Schreib eine Zahl in das Feld.' };
    if (Math.abs(v - ans) <= tol) return { ok: true, msg: esc(it.explain || '') + (tol ? ` Genau sind es ${ans.toLocaleString('de-DE')}.` : '') };
    return { ok: false, msg: esc(it.why || 'Rechne noch einmal nach.') };
  };
}

/* Explain: write an answer, the app looks for the key ideas. */
function explainTask(it, body) {
  body.innerHTML = `<textarea class="gs-text" rows="4" aria-label="Deine Antwort" placeholder="Schreib deine Antwort hier hinein."></textarea>
    <div class="gs-keys" hidden></div>`;
  const ta = $('textarea', body), keysEl = $('.gs-keys', body);
  let tries = 0;
  return () => {
    const t = ' ' + norm(ta.value) + ' ';
    if (t.trim().split(' ').length < 4) return { ok: false, msg: 'Schreib mindestens einen ganzen Satz.' };
    tries++;
    const found = it.keys.map(k => k.words.some(w => t.includes(norm(w))));
    const n = found.filter(Boolean).length, need = it.need || it.keys.length;
    keysEl.hidden = false;
    keysEl.innerHTML = `<p class="ctl-label">Wichtige Ideen</p><ul>${it.keys.map((k, i) => `<li class="${found[i] ? 'ok' : ''}">${found[i] ? '✓' : '○'} ${esc(k.label)}</li>`).join('')}</ul>`;
    const model = `<span class="gs-model"><b>Musterantwort:</b> ${esc(it.model)}</span>`;
    if (n >= need) { ta.readOnly = true; return { ok: true, msg: `Du hast ${n} von ${it.keys.length} wichtigen Ideen genannt. ${esc(it.explain || '')}${model}` }; }
    return { ok: false, msg: `Du hast ${n} von ${need} nötigen Ideen genannt. Schau dir die Liste an und ergänze deine Antwort.${tries > 1 ? model : ''}` };
  };
}

/* ================= Generated transfer tasks ================= */
const EVENTS = [
  [-2600000, 'Menschen stellen die ersten Steinwerkzeuge her', 'ca. 2,6 Mio. v. Chr.'],
  [-10000, 'Menschen betreiben Ackerbau und bauen Siedlungen', 'ca. 10.000 v. Chr.'],
  [-2600, 'Die Ägypter bauen die Pyramiden', 'ca. 2.600 v. Chr.'],
  [-776, 'Die ersten Olympischen Spiele finden statt', '776 v. Chr.'],
  [-753, 'Rom wird gegründet', '753 v. Chr.'],
  [800, 'Karl der Große wird Kaiser', '800'],
  [1450, 'Gutenberg erfindet den Buchdruck', 'um 1450'],
  [1492, 'Kolumbus erreicht Amerika', '1492'],
  [1825, 'Die erste Eisenbahn fährt', '1825'],
  [1903, 'Das erste Motorflugzeug fliegt', '1903'],
  [1969, 'Der erste Mensch betritt den Mond', '1969'],
  [1989, 'Die Berliner Mauer fällt', '1989']
];
const HEFT_EVENTS = [0, 1, 2, 4, 5, 8, 10];
const OBJECTS = [ // text, Quellenart, Überrest/Tradition (u, t, x or '' when unclear), why-Quellenart
  ['Tagebuch', 's', '', 'Ein Tagebuch ist geschrieben.'], ['Brief an die Oma', 's', 'u', 'Ein Brief ist geschrieben.'],
  ['Zeitungsartikel', 's', '', 'Ein Zeitungsartikel ist geschrieben.'], ['Einkaufszettel', 's', 'u', 'Auf einem Einkaufszettel steht Geschriebenes.'],
  ['Zeugnis', 's', 'u', 'Ein Zeugnis ist geschrieben.'], ['Kochbuch mit Rezepten', 's', '', 'In einem Kochbuch stehen geschriebene Rezepte.'],
  ['Fahrkarte', 's', 'u', 'Auf einer Fahrkarte steht Geschriebenes: Ort, Datum, Preis.'], ['Chronik einer Stadt', 's', 't', 'Eine Chronik ist geschrieben.'],
  ['Foto vom Schulfest', 'b', '', 'Auf einem Foto sieht man ein Bild.'], ['Gemälde einer Königin', 'b', 'x', 'Ein Gemälde ist ein Bild.'],
  ['Zeichnung eines Kindes', 'b', 'u', 'Eine Zeichnung ist ein Bild.'], ['Plakat für ein Konzert', 'b', 'u', 'Ein Plakat zeigt vor allem ein Bild.'],
  ['Höhlenmalerei', 'b', '', 'Eine Höhlenmalerei ist ein Bild an der Wand.'],
  ['Interview mit einer Zeitzeugin', 'm', 't', 'Bei einem Interview erzählt jemand. Das hört man.'], ['Kassette mit Liedern', 'm', '', 'Auf der Kassette hört man Lieder. Für Forscher zählt, was man hört.'],
  ['Schallplatte mit Märchen', 'm', '', 'Auf der Schallplatte hört man eine Stimme. Das ist eine mündliche Quelle.'], ['Opas Erzählung vom Krieg', 'm', 't', 'Opa erzählt. Das ist eine mündliche Quelle.'],
  ['Sprachnachricht', 'm', 'u', 'Eine Sprachnachricht hört man.'],
  ['Münze', 'g', 'u', 'Eine Münze ist ein Gegenstand.'], ['Faustkeil', 'g', 'u', 'Ein Faustkeil ist ein Gegenstand aus Stein.'],
  ['Tonkrug', 'g', 'u', 'Ein Tonkrug ist ein Gegenstand.'], ['Teddybär', 'g', 'u', 'Ein Teddybär ist ein Gegenstand.'],
  ['Schulranzen', 'g', 'u', 'Ein Schulranzen ist ein Gegenstand.'], ['Alte Kamera', 'g', 'u', 'Die Kamera macht zwar Bilder, sie selbst ist aber ein Gegenstand.'],
  ['Speerspitze', 'g', 'u', 'Eine Speerspitze ist ein Gegenstand.'], ['Statue eines Kaisers', 'g', 'x', 'Eine Statue ist ein Gegenstand.']
];
const ART = { s: 'Schriftliche Quelle', b: 'Bildliche Quelle', m: 'Mündliche Quelle', g: 'Gegenständliche Quelle' };
const UT = {
  u: 'Das wurde nicht für die Nachwelt gemacht. Es ist zufällig erhalten geblieben: ein Überrest.',
  t: 'Das wurde absichtlich gemacht, damit Menschen später davon erfahren: Tradition.',
  x: 'Das kann beides sein: Es wurde für die eigene Zeit gemacht, soll aber auch an etwas erinnern.'
};
const GEN = {
  a2: [
    () => {
      const [a, b] = pick(EVENTS, 2);
      const early = a[0] < b[0] ? a : b;
      return { type: 'mcq', prompt: 'Was war früher?', options: [a, b].map(e => ({ text: `${e[1]} (${e[2]})`, correct: e === early, why: `${e[2]} liegt auf dem Zeitstrahl weiter rechts als ${early[2]}. Weiter rechts heißt später.` })), explain: `${early[2]} liegt weiter links auf dem Zeitstrahl. Was weiter links liegt, war früher.` };
    },
    () => {
      const ev = pick(EVENTS, 5).sort((x, y) => x[0] - y[0]);
      return { type: 'order', prompt: 'Bring die Ereignisse in die richtige Reihenfolge. Das früheste kommt nach oben.', items: ev.map(e => `${e[2]}: ${e[1]}`), why: 'Denk daran: Vor Christus ist die größere Zahl früher. 776 v. Chr. war also vor 753 v. Chr.', explain: 'So stehen die Ereignisse auch auf dem Zeitstrahl, von links nach rechts.' };
    },
    () => {
      const pairs = [[500, 200], [1000, 100], [753, 776], [2600, 3000], [50, 10]];
      const [x, y] = pick(pairs, 1)[0], early = Math.max(x, y);
      return { type: 'mcq', prompt: `Was war früher: ${x} v. Chr. oder ${y} v. Chr.?`, options: [x, y].map(v => ({ text: `${v} v. Chr.`, correct: v === early, why: `Vor Christus zählt man rückwärts. Die kleinere Zahl ${v} liegt näher an Christi Geburt, also war ${v} v. Chr. später.` })), explain: `Vor Christus zählen die Jahre rückwärts. Die größere Zahl ${early} liegt weiter links, also war ${early} v. Chr. früher.` };
    }
  ],
  a3: [
    () => {
      const e = pick(EVENTS.filter(x => x[0] > 0), 1)[0];
      return { type: 'num', prompt: `Wie viele Jahre ist das her? ${e[1]} (${e[2]})`, answer: `heute-${e[0]}`, tol: e[2].startsWith('um') ? 5 : 0, unit: 'Jahre', why: `Rechne: ${YEAR} minus ${e[0]}.`, explain: `${YEAR} − ${e[0]} = ${YEAR - e[0]}.` };
    },
    () => {
      const e = pick(EVENTS.filter(x => x[0] < 0 && x[0] > -5000), 1)[0], v = -e[0];
      return { type: 'num', prompt: `Wie viele Jahre ist das ungefähr her? ${e[1]} (${e[2]})`, answer: `${v}+heute`, tol: 2, unit: 'Jahre', why: `Vor Christus zählst du zusammen: ${v} Jahre bis Christi Geburt und dann noch ${YEAR} Jahre bis heute.`, explain: `${v} + ${YEAR} = ${(v + YEAR).toLocaleString('de-DE')}. Das ist ungefähr so lange her.` };
    },
    () => {
      const [a, b] = pick(EVENTS.filter(x => x[0] > -5000), 2).sort((x, y) => x[0] - y[0]);
      const d = b[0] - a[0], both = a[0] < 0 && b[0] > 0;
      return { type: 'num', prompt: `Wie viele Jahre liegen ungefähr zwischen diesen Ereignissen? ${a[1]} (${a[2]}) und ${b[1]} (${b[2]})`, answer: String(d), tol: both ? 2 : (a[2].startsWith('um') || b[2].startsWith('um') ? 5 : 0), unit: 'Jahre',
        why: both ? `Ein Ereignis liegt vor, eins nach Christus. Zähl die beiden Zahlen zusammen: ${-a[0]} + ${b[0]}.` : a[0] < 0 ? `Beide liegen vor Christus. Zieh die kleinere Zahl von der größeren ab: ${-a[0]} − ${-b[0]}.` : `Zieh die kleinere Jahreszahl von der größeren ab: ${b[0]} − ${a[0]}.`,
        explain: `Es sind ungefähr ${d.toLocaleString('de-DE')} Jahre.` };
    }
  ],
  a5: [
    () => {
      const by = k => pick(OBJECTS.filter(o => o[1] === k), 2);
      const objs = shuffle([...by('s'), ...by('b'), ...by('m'), ...by('g')]).slice(0, 7);
      return { type: 'sort', prompt: 'Ordne jede Quelle der richtigen Quellenart zu.', buckets: Object.keys(ART).map(k => ({ id: k, name: ART[k] })), items: objs.map(o => ({ text: o[0], b: o[1], why: `${o[3]} Darum ist es eine ${ART[o[1]].toLowerCase().replace('quelle', 'Quelle')}.` })), explain: 'Frag dich: Ist es geschrieben, ein Bild, etwas zum Hören oder ein Ding?' };
    },
    () => {
      const o = pick(OBJECTS, 1)[0];
      return { type: 'mcq', prompt: `Welche Quellenart ist „${o[0]}“?`, options: Object.keys(ART).map(k => ({ text: ART[k], correct: k === o[1], why: k === o[1] ? '' : `${o[3]}` })), explain: `${o[3]} Darum ist es eine ${ART[o[1]].replace('Quelle', 'Quelle')}.` };
    }
  ],
  a6: [
    () => {
      const objs = shuffle([...pick(OBJECTS.filter(o => o[2] === 'u'), 3), ...pick(OBJECTS.filter(o => o[2] === 't'), 2), ...pick(OBJECTS.filter(o => o[2] === 'x'), 1)]);
      return { type: 'sort', prompt: 'Überrest, Tradition oder beides? Frag dich: Wurde es gemacht, damit Menschen später davon erfahren?', buckets: [{ id: 'u', name: 'Überrest' }, { id: 'x', name: 'Überschneidung' }, { id: 't', name: 'Tradition' }], items: objs.map(o => ({ text: o[0], b: o[2], why: UT[o[2]] })), explain: 'Zufällig erhalten heißt Überrest, absichtlich überliefert heißt Tradition.' };
    }
  ]
};

/* ================= Section pages ================= */
function sectionHTML(id) {
  const s = SEC[id], p = partOf(id);
  const eyebrow = id === 's1' ? 'Stolperstellen' : `${p.name} · Abschnitt ${s.n}`;
  const stage = id === 's1' ? '' : `<div class="lab"><div class="stage"><svg id="${id}-svg" viewBox="0 0 640 360" role="img" aria-label="${esc(s.name)}: animierte Zeichnung"></svg><p class="hint" id="${id}-hint"></p></div>
      <div class="panel"><div class="gs-player"><div class="dots" id="${id}-dots" aria-hidden="true"></div><div class="actions"><button type="button" class="btn ghost" id="${id}-prev">Zurück</button><button type="button" class="btn go" id="${id}-next">Weiter</button></div></div>
      <div class="actions" id="${id}-acts"></div><div class="readout" id="${id}-out" aria-live="polite"></div></div></div>`;
  return `<section class="module" id="${id}" role="tabpanel" hidden>
    <div class="mod-head"><p class="eyebrow">${esc(eyebrow)} · ${esc(s.name)}</p><h2>${esc(s.h)}</h2><p class="lede">${terms(esc(s.lede))}</p></div>
    ${stage}
    <div class="gs-checkwrap"><div class="controls" id="${id}-lvl"></div><div id="${id}-check"></div></div>
  </section>`;
}

/* Scene player: Buehnen[id] = {scenes:[{text, hint?, draw(svg, ctx)}]} */
const players = {};
function initPlayer(id) {
  const B = window.Buehnen && window.Buehnen[id];
  if (!B) return;
  const svg = $(`#${id}-svg`), out = $(`#${id}-out`), acts = $(`#${id}-acts`), dots = $(`#${id}-dots`), prev = $(`#${id}-prev`), next = $(`#${id}-next`), hint = $(`#${id}-hint`);
  let i = 0, token = 0, cleanup = null;
  function show(k, anim = true) {
    i = k; const my = ++token;
    if (cleanup) { cleanup(); cleanup = null; }
    svg.textContent = ''; acts.innerHTML = '';
    const sc = B.scenes[i];
    const ctx = {
      anim, alive: () => my === token,
      tween: (ms, fn, e) => tween(ms, p => { if (my === token) fn(p); }, e),
      wait: ms => wait(ms),
      say: html => { if (my === token) out.innerHTML = terms(html); },
      action(label, fn, cls = 'btn') { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.addEventListener('click', fn); acts.appendChild(b); return b; },
      onLeave(fn) { cleanup = fn; }
    };
    out.innerHTML = terms(sc.text);
    hint.textContent = sc.hint || `Bild ${i + 1} von ${B.scenes.length}. Mit „Weiter“ geht es zum nächsten Bild.`;
    dots.innerHTML = B.scenes.map((_, k) => `<span class="dot ${k < i ? 'done' : k === i ? 'cur' : ''}"></span>`).join('');
    prev.disabled = i === 0;
    next.textContent = i === B.scenes.length - 1 ? 'Von vorn' : 'Weiter';
    sc.draw(svg, ctx);
  }
  prev.addEventListener('click', () => i > 0 && show(i - 1));
  next.addEventListener('click', () => show(i < B.scenes.length - 1 ? i + 1 : 0));
  players[id] = { show, started: false };
}

/* "Wie im Heft" and "Transfer" checks below every section */
function initCheck(id) {
  const bank = BANK[id] || { heft: [], transfer: [] };
  const host = $(`#${id}-check`), lvl = $(`#${id}-lvl`);
  const run = level => {
    let items = level === 'heft' ? bank.heft : bank.transfer;
    if (level === 'transfer') {
      const gen = (GEN[id] || []).map(g => g());
      items = shuffle([...pick(items, Math.min(items.length, 6)), ...gen]).slice(0, 7);
    }
    const kit = items.map(toKit).filter(Boolean);
    if (!kit.length) { host.innerHTML = '<p class="muted">Hier kommen bald Aufgaben.</p>'; return; }
    host.innerHTML = '';
    host.className = '';
    mountCheck(host, kit, {
      title: level === 'heft' ? 'Teste dich: wie im Heft' : 'Teste dich: Transfer',
      onDone(first) {
        const r = first.filter(Boolean).length / first.length;
        const d = save.get('done', {}); d[id] = d[id] || {};
        d[id][level] = Math.max(d[id][level] || 0, r); save.set('done', d); markTabs();
      },
      next: level === 'heft' ? { label: 'Weiter zum Transfer', go: () => { seg.set('transfer'); run('transfer'); } } : nextSection(id)
    });
  };
  const seg = makeSeg(lvl, { label: 'Aufgaben', options: [{ v: 'heft', t: 'Wie im Heft' }, { v: 'transfer', t: 'Transfer: neue Beispiele' }], value: 'heft', onChange: run });
  run('heft');
}
function nextSection(id) {
  const p = partOf(id), k = p.secs.indexOf(id);
  if (k < p.secs.length - 1) { const n = p.secs[k + 1]; return { label: `Weiter: ${SEC[n].name}`, go: () => Nav.go(p.id, n) }; }
  const pi = PARTS.indexOf(p), np = PARTS[pi + 1];
  return np ? { label: `Weiter: ${np.name}`, go: () => Nav.go(np.id) } : null;
}
function markTabs() {
  const d = save.get('done', {});
  $$('.tab[data-sec]').forEach(t => { const x = d[t.dataset.sec]; t.classList.toggle('done', !!(x && x.transfer >= .8)); });
}

/* ================= Probe üben ================= */
function initProbe() {
  const host = $('#probe');
  host.innerHTML = `<div class="mod-head"><p class="eyebrow">Probe üben</p><h2>Bist du bereit für die Probe?</h2><p class="lede">Hier kommen gemischte Aufgaben mit neuen Beispielen, wie in einer echten Probe. Bei „Erkläre“-Aufgaben schreibst du selbst eine Antwort.</p></div>
    <div class="card"><div class="controls"><div class="ctl"><span class="ctl-label">Themen</span><div class="chips" id="pr-parts">${PARTS.slice(0, 4).map(p => `<button type="button" class="chip" aria-pressed="true" data-p="${p.id}">${esc(p.sub)}</button>`).join('')}</div></div><div id="pr-n"></div></div>
    <div class="actions"><button type="button" class="btn go" id="pr-go">Probe starten</button></div><p class="gs-best" id="pr-best"></p></div>
    <div id="pr-check"></div>`;
  const nSeg = makeSeg($('#pr-n'), { label: 'Aufgaben', options: [{ v: 8, t: '8' }, { v: 12, t: '12' }, { v: 16, t: '16' }], value: 12, onChange: () => {} });
  $$('#pr-parts .chip').forEach(c => c.addEventListener('click', () => { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); }));
  const best = () => { const b = save.get('probe', null); $('#pr-best').textContent = b ? `Dein bestes Ergebnis: ${b.r} von ${b.n} beim ersten Versuch.` : ''; };
  best();
  $('#pr-go').addEventListener('click', () => {
    const ps = $$('#pr-parts .chip[aria-pressed="true"]').map(c => c.dataset.p);
    if (!ps.length) { $('#pr-best').textContent = 'Wähle mindestens ein Thema.'; return; }
    const secs = PARTS.filter(p => ps.includes(p.id)).flatMap(p => p.secs);
    const n = nSeg.get();
    // round-robin over sections so every chosen topic appears
    const pools = shuffle(secs).map(s => shuffle([...(BANK[s] ? BANK[s].transfer : []), ...(GEN[s] || []).map(g => g())]));
    const items = [];
    for (let k = 0; items.length < n && k < 40; k++) { const pl = pools[k % pools.length]; if (pl.length) items.push(pl.pop()); }
    const host2 = $('#pr-check'); host2.className = '';
    mountCheck(host2, items.map(toKit).filter(Boolean), {
      title: 'Probe', onDone(first) { const r = first.filter(Boolean).length, b = save.get('probe', null); if (!b || r / first.length > b.r / b.n) save.set('probe', { r, n: first.length }); best(); }
    });
    host2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ================= Spiele ================= */
function initSpiele() {
  const host = $('#spiele');
  const GAMES = [
    { id: 'zeit', name: 'Zeitreise', text: 'Bring Ereignisse so schnell wie möglich in die richtige Reihenfolge.', make: () => GEN.a2[1]() },
    { id: 'truhe', name: 'Truhe ausräumen', text: 'Sortiere die Dinge aus der Truhe nach Quellenarten.', make: () => GEN.a5[0]() },
    { id: 'grabung', name: 'Ausgrabung', text: 'In welcher Reihenfolge arbeiten Archäologen?', make: () => ({ type: 'order', prompt: 'Bring die Arbeitsschritte der Archäologen in die richtige Reihenfolge.', items: pick([['Fundstelle freilegen', 'vermessen und fotografieren', 'zeichnen und beschreiben', 'Fundstücke restaurieren', 'im Museum ausstellen'], ['Erde vorsichtig abtragen', 'Fund mit dem Pinsel säubern', 'Fund vermessen', 'Fund fotografieren', 'Fund ausbessern']], 1)[0], why: 'Erst muss man den Fund freilegen, dann wird er genau festgehalten, erst ganz am Ende kommt er ins Museum.', explain: 'Genau so steht es im Schulbuch: freilegen, vermessen, fotografieren, zeichnen, restaurieren, ausstellen.' }) }
  ];
  host.innerHTML = `<div class="mod-head"><p class="eyebrow">Spiele</p><h2>Spiel gegen die Uhr</h2><p class="lede">Drei Runden pro Spiel. Die Uhr läuft, bis du alle Runden geschafft hast.</p></div>
    <div class="gs-games">${GAMES.map(g => `<div class="card"><h3>${g.name}</h3><p>${g.text}</p><p class="gs-best" data-best="${g.id}"></p><div class="actions"><button type="button" class="btn go" data-game="${g.id}">Spielen</button></div></div>`).join('')}</div>
    <div class="gs-timer" id="sp-timer" hidden></div><div id="sp-check"></div>`;
  const best = () => GAMES.forEach(g => { const b = save.get('spiel-' + g.id, null); $(`[data-best="${g.id}"]`).textContent = b ? `Bestzeit: ${b} Sekunden` : 'Noch keine Bestzeit'; });
  best();
  let timer = null;
  $$('[data-game]', host).forEach(b => b.addEventListener('click', () => {
    const g = GAMES.find(x => x.id === b.dataset.game), t0 = Date.now(), tEl = $('#sp-timer');
    clearInterval(timer); tEl.hidden = false;
    timer = setInterval(() => { tEl.textContent = `⏱ ${Math.round((Date.now() - t0) / 1000)} s`; }, 250);
    const c = $('#sp-check'); c.className = '';
    mountCheck(c, [g.make(), g.make(), g.make()].map(toKit), {
      title: g.name, onDone() {
        clearInterval(timer); const s = Math.round((Date.now() - t0) / 1000); tEl.textContent = `Geschafft in ${s} Sekunden!`;
        const old = save.get('spiel-' + g.id, null); if (!old || s < old) save.set('spiel-' + g.id, s); best();
      }
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

/* ================= Fachbegriffe ================= */
function initGlossar() {
  const host = $('#glossar');
  host.innerHTML = `<div class="mod-head"><p class="eyebrow">Fachbegriffe</p><h2>Wichtige Wörter</h2><p class="lede">Hier stehen alle Fachbegriffe. Im Text kannst du unterstrichene Wörter antippen, dann springst du hierher.</p></div>
    <div class="gloss">${(DATA.begriffe || []).map(b => `<article class="gcard" id="begriff-${esc(norm(b.wort).replace(/ /g, '-'))}"><h3>${esc(b.wort)}<small>${esc(b.kurz)}</small></h3><p>${esc(b.text)}</p></article>`).join('')}</div>`;
}
function jumpTerm(word) {
  const key = norm(word);
  const cards = $$('#glossar .gcard');
  const c = cards.find(x => norm($('h3', x).firstChild.textContent) === key) || cards.find(x => norm($('h3', x).firstChild.textContent).includes(key) || key.includes(norm($('h3', x).firstChild.textContent)));
  Nav.go('glossar');
  if (c) { c.scrollIntoView({ block: 'center' }); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1800); }
}

/* ================= Navigation ================= */
const Nav = (() => {
  function go(partId, secId) {
    const p = PARTS.find(x => x.id === partId) || PARTS[0];
    if (p.secs) secId = p.secs.includes(secId) ? secId : save.get('sec-' + p.id, p.secs[0]);
    $$('.unit').forEach(u => u.setAttribute('aria-pressed', u.dataset.part === p.id));
    const tabs = $('#tabs');
    tabs.hidden = !p.secs || p.secs.length < 2;
    if (p.secs) tabs.innerHTML = p.secs.map(s => `<button type="button" class="tab" role="tab" data-sec="${s}" aria-selected="${s === secId}" aria-controls="${s}"><span class="tab-num">${SEC[s].n}</span><span class="tab-name">${esc(SEC[s].name)}</span></button>`).join('');
    $$('.tab', tabs).forEach(t => t.addEventListener('click', () => go(p.id, t.dataset.sec)));
    markTabs();
    $$('main > section').forEach(s => { s.hidden = !(s.id === secId || (!p.secs && s.id === p.id)); });
    if (secId) {
      save.set('sec-' + p.id, secId);
      const pl = players[secId];
      if (pl && !pl.started) { pl.started = true; pl.show(0); }
      history.replaceState(null, '', '#' + secId);
    } else history.replaceState(null, '', '#' + p.id);
    const a = $('.tab[aria-selected="true"]', tabs); if (a) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    window.scrollTo({ top: 0 });
  }
  return { go };
})();

/* ================= Start ================= */
fetch('fragen.json').then(r => { if (!r.ok) throw new Error('fragen.json'); return r.json(); }).then(data => {
  DATA = data;
  data.abschnitte.forEach(a => BANK[a.id] = a);
  $('#units').innerHTML = PARTS.map(p => `<button type="button" class="unit${p.end ? ' end' : ''}" aria-pressed="false" data-part="${p.id}"><b>${esc(p.name)}</b>${p.sub && p.secs && p.secs.length > 1 ? `<span>${esc(p.sub)}</span>` : ''}</button>`).join('');
  $$('.unit').forEach(u => u.addEventListener('click', () => Nav.go(u.dataset.part)));
  const main = $('main');
  main.innerHTML = Object.keys(SEC).map(sectionHTML).join('') + '<section class="module" id="probe" hidden></section><section class="module" id="spiele" hidden></section><section class="module" id="glossar" hidden></section>';
  Object.keys(SEC).forEach(id => { initPlayer(id); initCheck(id); });
  initProbe(); initSpiele(); initGlossar();
  document.addEventListener('click', e => { const t = e.target.closest('.term'); if (t) jumpTerm(t.dataset.term); });
  const h = location.hash.slice(1);
  if (SEC[h]) Nav.go(partOf(h).id, h);
  else if (PARTS.find(p => p.id === h)) Nav.go(h);
  else Nav.go(save.get('part', 'p1'));
  $$('.unit').forEach(u => u.addEventListener('click', () => save.set('part', u.dataset.part)));
}).catch(err => {
  console.warn(err);
  $('main').innerHTML = '<div class="tip"><p><b>Die Aufgaben konnten nicht geladen werden.</b> Öffne die Seite über einen Webserver, zum Beispiel mit <code>python3 -m http.server</code>.</p></div>';
});
