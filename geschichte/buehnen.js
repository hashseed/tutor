/* Geschichts-Werkstatt: animated stages. One entry per section: {scenes:[{text, hint?, draw(svg, ctx)}]}.
   Every scene draws its whole picture; ctx.tween animates the new part. viewBox 640 × 360. */
'use strict';
(function () {
  const { S, tween, lerp, clamp, svgPoint } = Kit;
  const YEAR = new Date().getFullYear();

  /* ---------- drawing helpers ---------- */
  function txt(p, x, y, s, cls = 'gs-txt-svg', anchor = 'middle') {
    const t = S('text', { x, y, class: cls, 'text-anchor': anchor }, p);
    String(s).split('\n').forEach((line, i) => { const ts = S('tspan', { x, dy: i ? '1.2em' : 0 }, t); ts.textContent = line; });
    return t;
  }
  function card(p, x, y, w, h, label, cls = 'gs-card-svg', tcls = 'gs-txt-sm') {
    const g = S('g', { transform: `translate(${x},${y})` }, p);
    S('rect', { x: 0, y: 0, width: w, height: h, rx: 10, class: cls }, g);
    const lines = String(label).split('\n');
    txt(g, w / 2, h / 2 - (lines.length - 1) * 8 + 5, label, tcls);
    g._x = x; g._y = y;
    return g;
  }
  const place = (g, x, y, s = 1) => { g.setAttribute('transform', `translate(${x},${y}) scale(${s})`); g._x = x; g._y = y; };
  const fade = (el, v) => el.setAttribute('opacity', v);
  function popIn(ctx, el, ms = 350, delay = 0) {
    fade(el, 0);
    return ctx.wait(delay).then(() => ctx.tween(ms, p => fade(el, p)));
  }
  function slide(ctx, g, x0, y0, x1, y1, ms = 600) {
    place(g, x0, y0);
    return ctx.tween(ms, p => place(g, lerp(x0, x1, p), lerp(y0, y1, p)));
  }
  function arrowHead(p, x, y, dir = 1, cls = 'gs-line') {
    return S('path', { d: `M${x - 12 * dir},${y - 8} L${x},${y} L${x - 12 * dir},${y + 8}`, class: cls }, p);
  }
  function person(p, x, y, s = 1, cls = 'gs-line') {
    const g = S('g', { transform: `translate(${x},${y}) scale(${s})` }, p);
    S('circle', { cx: 0, cy: -38, r: 8, class: cls }, g);
    S('path', { d: 'M0,-30 L0,-10 M0,-10 L-8,8 M0,-10 L8,8 M0,-24 L-10,-14 M0,-24 L10,-14', class: cls }, g);
    return g;
  }
  function animal(p, x, y, s = 1) { // reindeer-like
    const g = S('g', { transform: `translate(${x},${y}) scale(${s})` }, p);
    S('path', { d: 'M-22,-6 L-24,14 M-12,-4 L-12,14 M12,-4 L12,14 M22,-6 L24,14', class: 'gs-line' }, g);
    S('ellipse', { cx: 0, cy: -12, rx: 28, ry: 13, class: 'gs-earth' }, g);
    S('path', { d: 'M24,-18 L34,-32', class: 'gs-line' }, g);
    S('ellipse', { cx: 38, cy: -34, rx: 9, ry: 6, class: 'gs-earth' }, g);
    S('path', { d: 'M36,-40 L32,-54 M33,-48 L26,-52 M40,-40 L46,-53 M44,-48 L51,-50', class: 'gs-line' }, g);
    return g;
  }
  function tent(p, x, y, s = 1) {
    const g = S('g', { transform: `translate(${x},${y}) scale(${s})` }, p);
    S('path', { d: 'M-60,0 L0,-90 L60,0 Z', class: 'gs-earth' }, g);
    S('path', { d: 'M-8,-102 L0,-90 L8,-102 M-14,0 L0,-40 L14,0', class: 'gs-line' }, g);
    S('path', { d: 'M-40,-30 L-20,-60 M20,-60 L40,-30', class: 'gs-line-mu' }, g);
    return g;
  }
  function flame(p, x, y, s = 1) {
    const g = S('g', { transform: `translate(${x},${y}) scale(${s})` }, p);
    S('path', { d: 'M-28,0 L28,0 M-22,6 L22,-6 M-22,-6 L22,6', class: 'gs-line', style: 'stroke:var(--gs-earth);stroke-width:7' }, g);
    S('path', { d: 'M-18,0 C-26,-20 -8,-30 -6,-52 C4,-38 6,-44 8,-60 C20,-40 26,-22 18,0 Z', class: 'gs-fire gs-flick' }, g);
    S('path', { d: 'M-8,0 C-12,-12 -2,-18 0,-32 C6,-22 12,-14 8,0 Z', class: 'gs-flame gs-flick' }, g);
    return g;
  }
  function stars(p, n = 26) {
    for (let k = 0; k < n; k++) S('circle', { cx: (k * 137) % 640, cy: 14 + (k * 53) % 150, r: k % 3 ? 1.3 : 2, class: 'gs-flame', opacity: .7 }, p);
  }

  /* Zeitstrahl wie im Heft: bubbles in equal steps */
  const HEFT = [['ca. 2,6 Mio.\nv. Chr.', 'Erste Stein-\nwerkzeuge'], ['ca. 10.000\nv. Chr.', 'Ackerbau,\nSiedlungen'], ['ca. 2.600\nv. Chr.', 'Ägypter bauen\nPyramiden'], ['753\nv. Chr.', 'Rom wird\ngegründet'], ['800', 'Karl der Große\nwird Kaiser'], ['1825', 'Die erste\nEisenbahn'], ['1969', 'Mensch auf\ndem Mond'], ['heute', 'KI im\nAlltag']];
  const hx = k => 48 + k * 78;
  function strahl(p, y = 190) {
    S('line', { x1: 14, y1: y, x2: 620, y2: y, class: 'axis' }, p);
    arrowHead(p, 626, y, 1, 'axis');
  }
  function bubble(p, k, y = 190, cls = 'gs-sun-soft') {
    const g = S('g', {}, p);
    S('ellipse', { cx: hx(k), cy: y - 62, rx: 38, ry: 28, class: cls }, g);
    txt(g, hx(k), y - 66, HEFT[k][0], 'gs-txt-xs');
    S('line', { x1: hx(k), y1: y - 34, x2: hx(k), y2: y - 6, class: 'gs-line' }, g);
    S('circle', { cx: hx(k), cy: y, r: 6, class: 'bead' }, g);
    txt(g, hx(k), y + 30 + (k % 2) * 40, HEFT[k][1], 'gs-txt-sm');
    return g;
  }

  /* ================= a1 Vergangenheit und Geschichte ================= */
  const PAST = [['Dein Frühstück\nheute', 40, 40], ['Omas\nHochzeit', 200, 30], ['Gestern hat\nes geregnet', 360, 44], ['Die erste\nEisenbahn', 500, 30], ['Rom wird\ngegründet', 70, 130, 1], ['Die\nAltsteinzeit', 210, 150, 1], ['Die Ägypter\nbauen Pyramiden', 120, 230, 1], ['Dein erster\nSchultag', 400, 140], ['Ein Fußball-\nspiel 2010', 500, 210], ['Mensch auf\ndem Mond', 330, 240]];
  function pastCards(svg) { return PAST.map(([l, x, y]) => card(svg, x, y, 118, 52, l)); }
  const a1 = {
    scenes: [
      { text: '<p>Die [[Vergangenheit]] ist <b>alles, was früher passiert ist</b>: die Pyramiden, Omas Hochzeit und auch dein Frühstück heute Morgen.</p>',
        draw(svg, ctx) {
          S('rect', { x: 20, y: 14, width: 600, height: 300, rx: 40, class: 'gs-line-mu' }, svg);
          txt(svg, 320, 342, 'Vergangenheit: alles, was früher passiert ist', 'gs-txt-svg');
          pastCards(svg).forEach((c, k) => popIn(ctx, c, 300, k * 120));
        } },
      { text: '<p>[[Geschichte]] beschäftigt sich mit einem <b>Ausschnitt</b> der Vergangenheit. Geschichtsforscher wollen ihn <b>verstehen und erforschen</b>.</p><p>Was du heute gefrühstückt hast, erforscht niemand. Wie die Pyramiden gebaut wurden, schon.</p>',
        draw(svg, ctx) {
          S('rect', { x: 20, y: 14, width: 600, height: 300, rx: 40, class: 'gs-line-mu' }, svg);
          const cs = pastCards(svg);
          const lens = S('g', {}, svg);
          S('circle', { cx: 0, cy: 0, r: 120, class: 'gs-line', style: 'stroke-width:6' }, lens);
          S('path', { d: 'M85,-85 L130,-130', class: 'gs-line', style: 'stroke-width:12' }, lens);
          txt(svg, 320, 342, 'Geschichte: ein Ausschnitt, den Forscher erforschen', 'gs-txt-svg');
          ctx.tween(900, p => lens.setAttribute('transform', `translate(${lerp(520, 190, p)},${lerp(260, 195, p)})`)).then(() => {
            cs.forEach((c, k) => { if (PAST[k][3]) c.querySelector('rect').setAttribute('class', 'gs-acc-soft'); else ctx.tween(400, p => fade(c, 1 - .65 * p)); });
          });
        } },
      { text: '<p class="gs-merk">Vergangenheit ist nicht gleich Geschichte.</p><p>Die Vergangenheit ist alles, was früher passiert ist. Geschichte beschäftigt sich mit einem Ausschnitt der Vergangenheit und versucht, ihn zu verstehen und zu erforschen.</p>',
        draw(svg, ctx) {
          const big = S('g', {}, svg);
          S('rect', { x: 30, y: 20, width: 580, height: 310, rx: 34, class: 'gs-sun-soft' }, big);
          txt(big, 60, 58, 'Vergangenheit', 'gs-big-svg', 'start');
          txt(big, 60, 84, 'alles, was früher passiert ist', 'gs-txt-mu', 'start');
          const small = S('g', {}, svg);
          S('rect', { x: 250, y: 120, width: 320, height: 170, rx: 26, class: 'gs-acc-soft' }, small);
          txt(small, 410, 196, 'Geschichte', 'gs-big-svg');
          txt(small, 410, 224, 'ein erforschter Ausschnitt', 'gs-txt-mu');
          popIn(ctx, big, 400); popIn(ctx, small, 500, 450);
        } }
    ]
  };

  /* ================= a2 Der Zeitstrahl ================= */
  function cgMark(svg, y = 190) {
    const g = S('g', {}, svg);
    S('line', { x1: 320, y1: y - 22, x2: 320, y2: y + 22, class: 'gs-line', style: 'stroke-width:4' }, g);
    txt(g, 320, y + 46, 'Christi Geburt', 'gs-txt-svg');
    return g;
  }
  const a2 = {
    scenes: [
      { text: '<p>Auf dem [[Zeitstrahl]] steht <b>Christi Geburt</b> in der Mitte. Was davor war, liegt links: <b>v. Chr.</b> heißt <b>vor Christus</b>. Was danach kam, liegt rechts: <b>n. Chr.</b> heißt <b>nach Christus</b>.</p><p>Der Pfeil zeigt: Nach rechts wird es später.</p>',
        draw(svg, ctx) {
          strahl(svg); const c = cgMark(svg);
          const l = txt(svg, 160, 130, '← v. Chr. (vor Christus)', 'gs-txt-svg'), r = txt(svg, 480, 130, 'n. Chr. (nach Christus) →', 'gs-txt-svg');
          popIn(ctx, c, 400); popIn(ctx, l, 400, 400); popIn(ctx, r, 400, 800);
        } },
      { text: '<p>Vor Christus zählt man <b>rückwärts</b>: 100 v. Chr., 200 v. Chr., 300 v. Chr. … Je <b>größer</b> die Zahl, desto <b>weiter links</b> und desto <b>früher</b>.</p><p>500 v. Chr. war also früher als 200 v. Chr.</p>',
        draw(svg, ctx) {
          strahl(svg); cgMark(svg);
          const vals = [100, 200, 300, 400, 500];
          vals.forEach((v, k) => {
            const x = 320 - (k + 1) * 56, g = S('g', {}, svg);
            S('line', { x1: x, y1: 180, x2: x, y2: 200, class: 'tick' }, g);
            txt(g, x, 168, String(v), 'gs-txt-svg'); txt(g, x, 228, 'v. Chr.', 'gs-txt-mu');
            popIn(ctx, g, 250, 250 + k * 280);
          });
          const ptr = S('path', { d: 'M0,0 L-10,-18 L10,-18 Z', class: 'gs-sun' }, svg);
          ctx.tween(1700, p => ptr.setAttribute('transform', `translate(${320 - p * 280},150)`));
          txt(svg, 180, 290, 'größere Zahl = früher', 'gs-txt-svg');
        } },
      { text: '<p>Nach Christus zählt man <b>vorwärts</b>, so wie heute: 100, 200, 300 … bis zu unserem Jahr ' + YEAR + '.</p><p>Bei Jahren nach Christus lässt man „n. Chr.“ meistens weg.</p>',
        draw(svg, ctx) {
          strahl(svg); cgMark(svg);
          [100, 200, 300, 400, 500].forEach((v, k) => {
            const x = 320 + (k + 1) * 56, g = S('g', {}, svg);
            S('line', { x1: x, y1: 180, x2: x, y2: 200, class: 'tick' }, g);
            txt(g, x, 168, String(v), 'gs-txt-svg');
            popIn(ctx, g, 250, 250 + k * 280);
          });
          const ptr = S('path', { d: 'M0,0 L-10,-18 L10,-18 Z', class: 'gs-sun' }, svg);
          ctx.tween(1700, p => ptr.setAttribute('transform', `translate(${320 + p * 280},150)`));
          txt(svg, 460, 290, 'größere Zahl = später', 'gs-txt-svg');
        } },
      { text: '<p>So sieht der Zeitstrahl aus deinem Heft aus. Mit Jahreszahlen und dem Zeitstrahl können wir Ereignisse <b>zeitlich ordnen</b>.</p><p>Christi Geburt liegt zwischen 753 v. Chr. (Rom wird gegründet) und 800 (Karl der Große wird Kaiser).</p>',
        hint: 'Die Ereignisse stehen wie im Heft in gleichen Abständen.',
        draw(svg, ctx) {
          strahl(svg, 200);
          const cg = S('g', {}, svg);
          S('line', { x1: (hx(3) + hx(4)) / 2, y1: 186, x2: (hx(3) + hx(4)) / 2, y2: 214, class: 'gs-line', style: 'stroke-width:4' }, cg);
          txt(cg, (hx(3) + hx(4)) / 2, 350, 'Christi Geburt', 'gs-txt-mu');
          S('line', { x1: (hx(3) + hx(4)) / 2, y1: 214, x2: (hx(3) + hx(4)) / 2, y2: 334, class: 'gs-line-mu' }, cg);
          HEFT.forEach((_, k) => popIn(ctx, bubble(svg, k, 200), 300, k * 260));
          popIn(ctx, cg, 400, 2200);
        } }
    ]
  };

  /* ================= a3 Wie lange ist das her? ================= */
  function counter(svg, ctx, x, y, to, ms, prefix = '') {
    const t = txt(svg, x, y, prefix + '0', 'gs-big-svg');
    return ctx.tween(ms, p => { t.firstChild.textContent = prefix + Math.round(to * p).toLocaleString('de-DE'); }).then(() => t);
  }
  const a3 = {
    scenes: [
      { text: `<p>Wie lange ist die Mondlandung her? Nach Christus rechnest du: <b>heute minus Jahreszahl</b>.</p><p>${YEAR} − 1969 = <b>${YEAR - 1969} Jahre</b>.</p>`,
        draw(svg, ctx) {
          strahl(svg, 200);
          const xa = 180, xb = 560;
          [[xa, '1969', 'Mondlandung'], [xb, String(YEAR), 'heute']].forEach(([x, y, l]) => { S('circle', { cx: x, cy: 200, r: 7, class: 'bead' }, svg); txt(svg, x, 240, y, 'gs-txt-svg'); txt(svg, x, 262, l, 'gs-txt-mu'); });
          const bar = S('rect', { x: xa, y: 150, width: 0, height: 22, rx: 11, class: 'gs-acc' }, svg);
          ctx.tween(1400, p => bar.setAttribute('width', (xb - xa) * p));
          counter(svg, ctx, 370, 120, YEAR - 1969, 1400).then(t => t.appendChild(document.createTextNode(' Jahre')));
        } },
      { text: `<p>Wie lange ist die Gründung Roms her? Sie war <b>753 v. Chr.</b></p><p>Von 753 v. Chr. bis Christi Geburt sind es <b>753 Jahre</b>. Von Christi Geburt bis heute sind es <b>${YEAR} Jahre</b>. Vor Christus zählst du also <b>zusammen</b>: 753 + ${YEAR} = <b>${(753 + YEAR).toLocaleString('de-DE')}</b>. So viele Jahre ist es ungefähr her.</p>`,
        draw(svg, ctx) {
          strahl(svg, 200);
          const xa = 70, x0 = 260, xb = 580;
          [[xa, '753 v. Chr.', 'Rom'], [xb, String(YEAR), 'heute']].forEach(([x, y, l]) => { S('circle', { cx: x, cy: 200, r: 7, class: 'bead' }, svg); txt(svg, x, 240, y, 'gs-txt-svg'); txt(svg, x, 262, l, 'gs-txt-mu'); });
          S('line', { x1: x0, y1: 180, x2: x0, y2: 220, class: 'gs-line', style: 'stroke-width:4' }, svg); txt(svg, x0, 248, 'Christi Geburt', 'gs-txt-mu');
          const b1 = S('rect', { x: xa, y: 150, width: 0, height: 22, rx: 11, class: 'gs-orange' }, svg);
          const b2 = S('rect', { x: x0, y: 150, width: 0, height: 22, rx: 11, class: 'gs-acc' }, svg);
          const t1 = txt(svg, (xa + x0) / 2, 132, '753', 'gs-big-svg'), t2 = txt(svg, (x0 + xb) / 2, 132, String(YEAR), 'gs-big-svg');
          fade(t1, 0); fade(t2, 0);
          ctx.tween(900, p => b1.setAttribute('width', (x0 - xa) * p)).then(() => { fade(t1, 1); return ctx.tween(1100, p => b2.setAttribute('width', (xb - x0) * p)); }).then(() => {
            fade(t2, 1);
            const s = txt(svg, 320, 310, `753 + ${YEAR} = ${(753 + YEAR).toLocaleString('de-DE')} Jahre`, 'gs-big-svg'); popIn(ctx, s, 400);
          });
        } },
      { text: '<p>Liegen <b>beide</b> Ereignisse vor Christus, ziehst du ab: Die Pyramiden wurden um 2.600 v. Chr. gebaut, Rom wurde 753 v. Chr. gegründet.</p><p>2.600 − 753 = <b>1.847 Jahre</b> liegen dazwischen.</p>',
        draw(svg, ctx) {
          strahl(svg, 200);
          const xa = 80, xb = 420;
          [[xa, '2.600 v. Chr.', 'Pyramiden'], [xb, '753 v. Chr.', 'Rom']].forEach(([x, y, l]) => { S('circle', { cx: x, cy: 200, r: 7, class: 'bead' }, svg); txt(svg, x, 240, y, 'gs-txt-svg'); txt(svg, x, 262, l, 'gs-txt-mu'); });
          S('line', { x1: 560, y1: 180, x2: 560, y2: 220, class: 'gs-line', style: 'stroke-width:4' }, svg); txt(svg, 560, 248, 'Christi Geburt', 'gs-txt-mu');
          const bar = S('rect', { x: xa, y: 150, width: 0, height: 22, rx: 11, class: 'gs-orange' }, svg);
          ctx.tween(1300, p => bar.setAttribute('width', (xb - xa) * p));
          counter(svg, ctx, 250, 120, 1847, 1300).then(t => t.appendChild(document.createTextNode(' Jahre')));
          txt(svg, 320, 310, '2.600 − 753 = 1.847', 'gs-big-svg');
        } }
    ]
  };

  /* ================= a4 Wie Forscher arbeiten ================= */
  const STEPS = [
    ['Fragen an die Vergangenheit', 'z. B. Wie kleideten sich die Menschen früher?', 'gs-orange'],
    ['Quellen sammeln', 'z. B. Briefe, Tagebücher, Fotos, alte Kleidung', 'gs-acc-soft'],
    ['Quellen auswerten', 'Fundort? Urheber? Zweck? Nutzer?', 'gs-pink'],
    ['Erkenntnisse formulieren', 'z. B. „Mädchen trugen früher oft lange Röcke.“', 'gs-green']
  ];
  function stepBox(svg, k, hi) {
    const y = 14 + k * 84, g = S('g', {}, svg);
    S('rect', { x: 20, y, width: 600, height: 70, rx: 14, class: hi ? STEPS[k][2] : 'gs-card-svg' }, g);
    S('circle', { cx: 58, cy: y + 35, r: 22, class: 'gs-card-svg' }, g);
    txt(g, 58, y + 43, String(k + 1), 'gs-big-svg');
    txt(g, 96, y + 30, STEPS[k][0], 'gs-txt-svg', 'start');
    txt(g, 96, y + 54, STEPS[k][1], 'gs-txt-sm', 'start');
    if (k < 3) S('path', { d: `M590,${y + 66} L590,${y + 88}`, class: 'gs-line' }, g);
    return g;
  }
  const STEP_TEXT = [
    '<p><b>Schritt 1: Fragen an die Vergangenheit.</b> Am Anfang steht eine Frage, zum Beispiel: Wie sah der Alltag unserer Vorfahren aus? Wie wohnten sie? Wie kleideten sie sich?</p>',
    '<p><b>Schritt 2: Quellen sammeln.</b> Wie ein Kommissar Spuren sammelt, sammeln Forscher [[Quellen|Quelle]]: Briefe, Tagebücher, Fotos oder alte Kleidungsstücke.</p>',
    '<p><b>Schritt 3: Quellen auswerten.</b> Forscher stellen jeder Quelle Fragen:</p><ul><li>Wo wurde sie gefunden? (<b>Fundort</b>)</li><li>Wer hat sie gemacht? (<b>Urheber</b>)</li><li>Wofür war sie da? (<b>Zweck</b>)</li><li>Wer hat sie benutzt? (<b>Nutzer</b>)</li></ul>',
    '<p><b>Schritt 4: Erkenntnisse formulieren.</b> Zum Schluss schreiben die Forscher auf, was sie herausgefunden haben. Neue Quellen können das Ergebnis später noch ändern.</p><p class="gs-merk">Auswerten gehört zu den Quellen (Schritt 3). Die Erkenntnisse werden formuliert (Schritt 4).</p>'
  ];
  const a4 = {
    scenes: [
      { text: '<p>Die Arbeit von Geschichtsforschern gleicht der Arbeit von <b>Kriminalkommissaren</b>: Sie sammeln möglichst viele Informationen und ziehen daraus Schlüsse auf die Vergangenheit.</p><p>Dabei gehen sie in <b>vier Schritten</b> vor.</p>',
        draw(svg, ctx) {
          const g = S('g', {}, svg);
          S('circle', { cx: 300, cy: 150, r: 80, class: 'gs-acc-soft' }, g);
          S('circle', { cx: 300, cy: 150, r: 80, class: 'gs-line', style: 'stroke-width:8' }, g);
          S('path', { d: 'M358,208 L440,290', class: 'gs-line', style: 'stroke-width:18' }, g);
          txt(g, 300, 145, 'Spuren', 'gs-big-svg'); txt(g, 300, 172, 'sammeln', 'gs-txt-svg');
          ['Brief', 'Foto', 'Kleid', 'Tagebuch'].forEach((l, k) => popIn(ctx, card(svg, [60, 470, 60, 480][k], [40, 50, 230, 220][k], 100, 44, l), 300, 300 + k * 250));
          ctx.tween(800, p => g.setAttribute('transform', `rotate(${lerp(-10, 0, p)} 300 150)`));
        } },
      ...STEPS.map((_, n) => ({
        text: STEP_TEXT[n],
        draw(svg, ctx) {
          STEPS.forEach((__, k) => { const b = stepBox(svg, k, k === n); if (k > n) fade(b, .25); if (k === n) popIn(ctx, b, 450); });
        }
      }))
    ]
  };

  /* ================= a5 Vier Quellenarten (Truhe) ================= */
  const KISTEN = [['Schriftliche', 'Quellen'], ['Bildliche', 'Quellen'], ['Mündliche', 'Quellen'], ['Gegenständliche', 'Quellen']];
  const TRUHE = [['Urkunde vom\nFußballturnier', 0], ['Grundschul-\nzeugnisse', 0], ['Kassette mit\nLiedern', 2], ['Zeitungsberichte\nMauerfall', 0], ['Briefe aus\nden USA', 0], ['Halstücher', 3], ['Fotoalbum', 1], ['Säckchen mit\nMünzen', 3]];
  const kx = k => 8 + k * 158;
  function kisten(svg) {
    KISTEN.forEach((n, k) => {
      S('rect', { x: kx(k), y: 8, width: 150, height: 214, rx: 12, class: ['gs-sun-soft', 'gs-acc-soft', 'gs-good', 'gs-earth-soft'][k] }, svg);
      if (k === 3) S('rect', { x: kx(k), y: 8, width: 150, height: 214, rx: 12, class: 'gs-line' }, svg);
      txt(svg, kx(k) + 75, 30, n[0], 'gs-txt-svg'); txt(svg, kx(k) + 75, 48, n[1], 'gs-txt-mu');
    });
  }
  function truhe(svg, open) {
    const g = S('g', {}, svg);
    S('rect', { x: 230, y: 270, width: 180, height: 80, rx: 8, class: 'gs-earth' }, g);
    S('path', { d: 'M230,295 L410,295 M300,270 L300,350 M340,270 L340,350', class: 'gs-line' }, g);
    const lid = S('path', { d: 'M230,270 C230,236 410,236 410,270 Z', class: 'gs-earth' }, g);
    if (open) lid.setAttribute('transform', 'rotate(-35 230 270)');
    return { g, lid };
  }
  const a5 = {
    scenes: [
      { text: '<p>Claras Großonkel Walther ist über 80 Jahre alt und zieht aus. Beim Packen finden Claras Eltern im Keller eine <b>alte Truhe</b>. Was darin liegt, erzählt viel über Walthers Leben.</p><p>Jedes Ding in der Truhe ist eine [[Quelle]].</p>',
        draw(svg, ctx) {
          kisten(svg); const t = truhe(svg, false);
          ctx.tween(600, p => t.g.setAttribute('transform', `translate(0,${lerp(40, 0, p)})`));
        } },
      { text: '<p>Historiker unterscheiden <b>vier Quellenarten</b>:</p><ul><li><b>schriftlich</b>: etwas Geschriebenes</li><li><b>bildlich</b>: ein Bild oder Foto</li><li><b>mündlich</b>: etwas zum Hören</li><li><b>gegenständlich</b>: ein Ding</li></ul>',
        hint: 'Schau zu, wie die Dinge aus der Truhe in die richtige Kiste fliegen.',
        draw(svg, ctx) {
          kisten(svg); const t = truhe(svg, false);
          const fill = [0, 0, 0, 0];
          ctx.tween(500, p => t.lid.setAttribute('transform', `rotate(${-35 * p} 230 270)`)).then(async () => {
            for (const [label, k] of TRUHE) {
              if (!ctx.alive()) return;
              const c = card(svg, 260, 270, 136, 36, label, 'gs-card-svg', 'gs-txt-sm');
              c.querySelector('text').setAttribute('style', 'font-size:11.5px');
              const tx = kx(k) + 7, ty = 60 + fill[k]++ * 40;
              await slide(ctx, c, 252, 262, tx, ty, 650);
            }
          });
        } },
      { text: '<p><b>Kassette mit Liedern:</b> Eine Kassette ist zwar ein Ding. Für Forscher zählt aber, was darauf ist: Lieder, die man <b>hört</b>. Darum ist sie eine <b>mündliche Quelle</b>.</p><p>Genauso ist ein Interview mit einer [[Zeitzeugin|Zeitzeuge]] eine mündliche Quelle.</p>',
        draw(svg, ctx) {
          const g = S('g', {}, svg);
          S('rect', { x: 170, y: 90, width: 300, height: 180, rx: 16, class: 'gs-card-svg' }, g);
          S('rect', { x: 200, y: 115, width: 240, height: 70, rx: 8, class: 'gs-good' }, g);
          S('circle', { cx: 260, cy: 150, r: 20, class: 'gs-card-svg' }, g); S('circle', { cx: 380, cy: 150, r: 20, class: 'gs-card-svg' }, g);
          txt(g, 320, 230, 'Lieder aus den 1980er-Jahren', 'gs-txt-svg');
          const notes = S('g', {}, svg);
          [[500, 120], [540, 80], [520, 180]].forEach(([x, y]) => { S('circle', { cx: x, cy: y, r: 8, class: 'gs-acc' }, notes); S('path', { d: `M${x + 7},${y} L${x + 7},${y - 30} L${x + 20},${y - 24}`, class: 'gs-line' }, notes); });
          txt(svg, 320, 320, 'mündliche Quelle: man hört sie', 'gs-big-svg');
          popIn(ctx, g, 400); ctx.tween(1200, p => notes.setAttribute('transform', `translate(${-20 * (1 - p)},${-10 * Math.sin(p * 6)})`));
        } },
      { text: '<p><b>Der Ordner</b> ist nur die Hülle. Die Quelle sind die <b>Zeitungsberichte</b> über den Mauerfall, die darin abgeheftet sind. Sie sind eine <b>schriftliche Quelle</b>.</p><p>Frag dich immer: Was erzählt mir etwas über die Vergangenheit?</p>',
        draw(svg, ctx) {
          const o = S('g', {}, svg);
          S('rect', { x: 120, y: 60, width: 150, height: 220, rx: 8, class: 'gs-acc-soft' }, o);
          S('circle', { cx: 150, cy: 240, r: 12, class: 'gs-card-svg' }, o); txt(o, 195, 175, 'Ordner', 'gs-txt-svg');
          const pages = [0, 1, 2].map(k => card(svg, 330 + k * 18, 60 + k * 22, 170, 200, k === 2 ? 'Zeitung\n\nDie Mauer\nist offen!' : '', 'gs-card-svg', 'gs-txt-svg'));
          pages.forEach((p, k) => popIn(ctx, p, 300, 400 + k * 250));
          txt(svg, 195, 320, 'nur die Hülle', 'gs-txt-mu');
          const q = txt(svg, 440, 320, 'die Quelle', 'gs-big-svg'); popIn(ctx, q, 300, 1300);
        } }
    ]
  };

  /* ================= a6 Überrest oder Tradition ================= */
  function venn(svg) {
    S('circle', { cx: 225, cy: 180, r: 132, class: 'gs-acc-soft', opacity: .85 }, svg);
    S('circle', { cx: 415, cy: 180, r: 132, class: 'gs-sun-soft', opacity: .85 }, svg);
    S('circle', { cx: 225, cy: 180, r: 132, class: 'gs-line' }, svg);
    S('circle', { cx: 415, cy: 180, r: 132, class: 'gs-line' }, svg);
    txt(svg, 100, 26, 'Überrest', 'gs-big-svg', 'start'); txt(svg, 100, 44, 'zufällig erhalten', 'gs-txt-mu', 'start');
    txt(svg, 540, 26, 'Tradition', 'gs-big-svg', 'end'); txt(svg, 540, 44, 'absichtlich überliefert', 'gs-txt-mu', 'end');
    txt(svg, 320, 342, 'Wurde es gemacht, damit Menschen später davon erfahren?', 'gs-txt-svg');
  }
  const U = [['Waffen', 120, 108], ['Vasen', 110, 168], ['Einkaufs-\nzettel', 120, 228]];
  const T = [['Reden', 430, 108], ['Chronik einer\nStadt', 440, 168], ['Lebens-\nerinnerungen', 430, 228]];
  const X = [['Gemälde', 278, 108], ['Gebäude', 278, 168], ['Statuen', 278, 228]];
  const chips = (svg, arr, w = 96) => arr.map(([l, x, y]) => card(svg, x, y, w, 46, l, 'gs-card-svg', 'gs-txt-sm'));
  const a6 = {
    scenes: [
      { text: '<p>Quellen können auf zwei Arten zu uns kommen. Die Leitfrage hilft dir:</p><p class="gs-merk">Wurde es gemacht, damit Menschen später davon erfahren?</p><p>Nein: Es ist zufällig erhalten geblieben, ein [[Überrest]]. Ja: Es wurde absichtlich überliefert, eine [[Tradition]].</p>',
        draw(svg, ctx) { const g = S('g', {}, svg); venn(g); popIn(ctx, g, 500); } },
      { text: '<p><b>Überreste</b> wurden für ihre eigene Zeit gemacht, nicht für uns. Waffen, Vasen oder ein Einkaufszettel sind nur zufällig erhalten geblieben.</p><p>Wer einen Einkaufszettel schreibt, denkt nicht an Forscher in 500 Jahren.</p>',
        draw(svg, ctx) { venn(svg); chips(svg, U).forEach((c, k) => slide(ctx, c, -120, c._y, c._x, c._y, 700 + k * 200)); } },
      { text: '<p><b>Traditionen</b> wurden absichtlich gemacht, damit Menschen später davon erfahren: Reden, eine Chronik oder Lebenserinnerungen.</p><p>Wer eine Chronik schreibt, will, dass sich die Menschen später erinnern.</p>',
        draw(svg, ctx) { venn(svg); chips(svg, U); chips(svg, T).forEach((c, k) => slide(ctx, c, 700, c._y, c._x, c._y, 700 + k * 200)); } },
      { text: '<p>Manche Quellen sind <b>beides</b>, das sind die <b>Überschneidungen</b>: Gemälde, Gebäude und Statuen.</p><p>Ein Schloss wurde zum Wohnen gebaut (Überrest). Es sollte aber auch zeigen, wie mächtig der König war, und daran erinnern (Tradition).</p>',
        draw(svg, ctx) { venn(svg); chips(svg, U); chips(svg, T); chips(svg, X, 84).forEach((c, k) => slide(ctx, c, c._x, -60, c._x, c._y, 700 + k * 200)); } }
    ]
  };

  /* ================= a7 Historiker und Archäologen ================= */
  function kessel(p, x, y, s = 1, cls = 'gs-orange') {
    const g = S('g', { transform: `translate(${x},${y}) scale(${s})` }, p);
    S('path', { d: 'M-110,-40 C-120,60 -60,100 0,100 C60,100 120,60 110,-40 Z', class: cls }, g);
    S('ellipse', { cx: 0, cy: -40, rx: 112, ry: 22, class: cls }, g);
    S('ellipse', { cx: 0, cy: -40, rx: 92, ry: 14, class: 'gs-line' }, g);
    [-80, 0, 80].forEach(dx => S('circle', { cx: dx, cy: -18, r: 9, class: 'gs-card-svg' }, g));
    return g;
  }
  const a7 = {
    scenes: [
      { text: '<p>1979 entdeckten Archäologen in <b>Hochdorf bei Stuttgart</b> ein 2.500 Jahre altes Fürstengrab. Darin lag ein großer Kessel.</p><p><b>Mach selbst mit:</b> Wisch mit dem Finger oder der Maus über die Erde, wie mit einem Pinsel.</p>',
        hint: 'Wisch über die Erde, um den Fund freizulegen. Oder tippe auf „Alles freilegen“.',
        draw(svg, ctx) {
          kessel(svg, 320, 170);
          const id = svg.id + '-mask';
          const defs = S('defs', {}, svg), mask = S('mask', { id }, defs);
          S('rect', { x: 0, y: 0, width: 640, height: 360, fill: 'white' }, mask);
          const soil = S('g', { mask: `url(#${id})` }, svg);
          S('rect', { x: 0, y: 0, width: 640, height: 360, class: 'gs-earth', style: 'stroke:none' }, soil);
          for (let k = 0; k < 40; k++) S('circle', { cx: (k * 97) % 640, cy: (k * 61) % 360, r: 3 + (k % 4), class: 'gs-earth-soft' }, soil);
          let holes = 0, done = false, down = false;
          const brush = e => {
            if (done) return;
            const pt = svgPoint(svg, e);
            S('circle', { cx: pt.x, cy: pt.y, r: 30, fill: 'black' }, mask);
            if (++holes === 70) found();
          };
          function found() {
            done = true;
            ctx.tween(600, p => fade(soil, 1 - p));
            ctx.say('<p><b>Du hast einen Kessel gefunden!</b> Er hat einen Durchmesser von 104 Zentimetern und fasst 500 Liter.</p><p>Archäologen legen Funde ganz vorsichtig frei, mit Pinsel, Kelle und feinen Werkzeugen wie vom Zahnarzt.</p>');
          }
          const pd = e => { down = true; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); brush(e); };
          const pm = e => { if (down || e.pointerType === 'mouse' && e.buttons) brush(e); };
          const pu = () => { down = false; };
          svg.addEventListener('pointerdown', pd); svg.addEventListener('pointermove', pm); svg.addEventListener('pointerup', pu);
          svg.style.touchAction = 'none';
          ctx.onLeave(() => { svg.removeEventListener('pointerdown', pd); svg.removeEventListener('pointermove', pm); svg.removeEventListener('pointerup', pu); svg.style.touchAction = ''; });
          ctx.action('Alles freilegen', () => { if (!done) found(); }, 'btn ghost');
        } },
      { text: '<p>Bevor etwas aus dem Boden kommt, wird der Fund genau festgehalten: <b>vermessen</b>, <b>fotografieren</b>, <b>zeichnen</b> und beschreiben.</p><p>Dafür brauchen Archäologen Maßstab, Bandmaß, Senkblei, Fotoapparat und Zeichenbrett.</p>',
        draw(svg, ctx) {
          kessel(svg, 300, 170, .85);
          const m = S('g', {}, svg);
          for (let k = 0; k < 10; k++) S('rect', { x: 200 + k * 20, y: 300, width: 20, height: 14, class: k % 2 ? 'gs-card-svg' : 'gs-orange' }, m);
          S('path', { d: 'M205,276 L395,276 M205,268 L205,284 M395,268 L395,284', class: 'gs-line' }, m); txt(m, 300, 266, '104 cm', 'gs-txt-svg');
          popIn(ctx, m, 400, 200);
          const cam = S('g', {}, svg);
          S('rect', { x: 500, y: 60, width: 90, height: 60, rx: 10, class: 'gs-card-svg' }, cam); S('circle', { cx: 545, cy: 90, r: 18, class: 'gs-acc-soft' }, cam);
          const flash = S('circle', { cx: 545, cy: 90, r: 30, class: 'gs-flame', opacity: 0 }, svg);
          popIn(ctx, cam, 300, 900).then(() => ctx.tween(500, p => { flash.setAttribute('r', 30 + 90 * p); fade(flash, .7 * (1 - p)); }));
          const pad = card(svg, 40, 50, 110, 130, 'Zeichnung', 'gs-card-svg', 'gs-txt-mu');
          popIn(ctx, pad, 300, 1500);
        } },
      { text: '<p>Fundstücke werden <b>restauriert</b>, also ausgebessert und wiederhergestellt. Die schönsten kommen ins <b>Museum</b>.</p><p>Der Kessel aus Hochdorf steht heute im Keltenmuseum Hochdorf.</p>',
        draw(svg, ctx) {
          const k = kessel(svg, 320, 170, .9, 'gs-earth');
          const shine = kessel(svg, 320, 170, .9, 'gs-orange'); fade(shine, 0);
          ctx.tween(1200, p => fade(shine, p)).then(() => {
            const vit = S('rect', { x: 180, y: 50, width: 280, height: 260, rx: 6, class: 'gs-line', style: 'stroke-dasharray:0' }, svg);
            const lab = txt(svg, 320, 340, 'Keltenmuseum Hochdorf', 'gs-big-svg');
            popIn(ctx, vit, 400); popIn(ctx, lab, 400, 200);
          });
          void k;
        } },
      { text: '<p><b>Historiker</b> werten vor allem schriftliche Quellen wie Urkunden aus, aber auch Bilder, Gebäude und Aussagen von Zeitzeugen.</p><p><b>Archäologen</b> erforschen die Zeit, aus der es kaum oder keine Schrift gibt. Sie graben Überreste aus: Knochen, Werkzeuge, Grabbeigaben.</p><p>Je weiter wir zurückgehen, desto weniger Quellen gibt es.</p>',
        draw(svg, ctx) {
          const l = S('g', {}, svg), r = S('g', {}, svg);
          S('rect', { x: 20, y: 20, width: 290, height: 320, rx: 16, class: 'gs-acc-soft' }, l); txt(l, 165, 56, 'Historiker', 'gs-big-svg');
          ['Urkunden', 'Briefe', 'Fotos', 'Zeitzeugen', 'Gebäude'].forEach((w, k) => card(l, 50, 76 + k * 50, 230, 40, w, 'gs-card-svg', 'gs-txt-svg'));
          S('rect', { x: 330, y: 20, width: 290, height: 320, rx: 16, class: 'gs-earth-soft' }, r); S('rect', { x: 330, y: 20, width: 290, height: 320, rx: 16, class: 'gs-line' }, r); txt(r, 475, 56, 'Archäologen', 'gs-big-svg');
          ['Knochen', 'Werkzeuge aus Stein', 'Grabbeigaben', 'Ausgrabung', 'Bruchstücke'].forEach((w, k) => card(r, 360, 76 + k * 50, 230, 40, w, 'gs-card-svg', 'gs-txt-svg'));
          popIn(ctx, l, 400); popIn(ctx, r, 400, 400);
        } }
    ]
  };

  /* ================= a8 Wann war die Altsteinzeit? ================= */
  const a8 = {
    scenes: [
      { text: '<p>Auf dem Zeitstrahl aus deinem Heft steht ganz links: <b>ca. 2,6 Millionen Jahre v. Chr.</b> stellen Menschen die ersten Steinwerkzeuge her.</p><p>Damit beginnt die [[Altsteinzeit]].</p>',
        draw(svg, ctx) { strahl(svg, 200); HEFT.forEach((_, k) => { const b = bubble(svg, k, 200, k === 0 ? 'gs-orange' : 'gs-sun-soft'); if (k) fade(b, .35); else popIn(ctx, b, 500); }); } },
      { text: '<p>Die Altsteinzeit dauert bis etwa <b>10.000 v. Chr.</b> Das sind <b>mehr als zwei Millionen Jahre</b>. Sie ist die längste Zeit in der Geschichte der Menschen.</p><p>Im Lückentext steht: vor ca. 2 Millionen Jahren bis vor etwa 10.000 Jahren. Das „ca.“ zeigt: Genau weiß man es nicht.</p>',
        draw(svg, ctx) {
          strahl(svg, 200);
          const band = S('rect', { x: hx(0), y: 186, width: 0, height: 28, rx: 14, class: 'gs-orange', opacity: .8 }, svg);
          HEFT.forEach((_, k) => { const b = bubble(svg, k, 200); if (k > 1) fade(b, .35); });
          const l = txt(svg, (hx(0) + hx(1)) / 2, 330, 'Altsteinzeit', 'gs-big-svg'); fade(l, 0);
          ctx.tween(1400, p => band.setAttribute('width', (hx(1) - hx(0)) * p)).then(() => popIn(ctx, l, 400));
        } },
      { text: '<p>Die Altsteinzeit endet, als die Menschen anfangen, <b>Ackerbau und Viehzucht</b> zu betreiben und in <b>Siedlungen</b> zu leben.</p><p>Vorher zogen sie als <b>[[Jäger und Sammler]]</b> umher.</p>',
        draw(svg, ctx) {
          strahl(svg, 200);
          S('rect', { x: hx(0), y: 186, width: hx(1) - hx(0), height: 28, rx: 14, class: 'gs-orange', opacity: .8 }, svg);
          HEFT.forEach((_, k) => { const b = bubble(svg, k, 200, k === 1 ? 'gs-green' : 'gs-sun-soft'); if (k > 1) fade(b, .35); if (k === 1) popIn(ctx, b, 500); });
        } },
      { text: '<p>Aus der Altsteinzeit gibt es <b>keine Schrift</b>. Was wir wissen, stammt von <b>Archäologen</b>: Sie finden Werkzeuge aus Stein, Knochen, Reste von Feuerstellen und Höhlenmalereien.</p><p>Das sind alles [[Überreste|Überrest]].</p>',
        draw(svg, ctx) {
          S('rect', { x: 0, y: 220, width: 640, height: 140, class: 'gs-earth', style: 'stroke:none' }, svg);
          ['Faustkeil', 'Knochen', 'Feuerstelle', 'Höhlenbild'].forEach((w, k) => popIn(ctx, card(svg, 30 + k * 150, 250 + (k % 2) * 40, 130, 44, w, 'gs-card-svg', 'gs-txt-svg'), 350, k * 300));
          txt(svg, 320, 120, 'Funde statt Schrift', 'gs-big-svg');
        } }
    ]
  };

  /* ================= a9 Jäger und Sammler ================= */
  function land(svg, season) {
    S('path', { d: 'M0,250 C120,200 220,240 320,215 C420,190 520,230 640,205 L640,360 L0,360 Z', class: 'gs-grass' }, svg);
    txt(svg, 620, 34, season, 'gs-big-svg', 'end');
  }
  const a9 = {
    scenes: [
      { text: '<p>Die Menschen der Altsteinzeit lebten in kleinen Gruppen. Sie <b>jagten Tiere</b> wie Rentiere und Mammuts. Darum heißen sie <b>Jäger</b>.</p>',
        draw(svg, ctx) {
          land(svg, 'Sommer'); tent(svg, 150, 270);
          person(svg, 240, 290); person(svg, 265, 296, .8);
          [[430, 250], [500, 262], [560, 245]].forEach(([x, y], k) => { const a = animal(svg, x, y, .9); popIn(ctx, a, 400, k * 200); });
        } },
      { text: '<p>Je nach Jahreszeit zogen die Tiere dorthin, wo sie am meisten Futter fanden. Die Menschen <b>folgten den Tieren</b> über viele Kilometer. So senkten sie das Risiko zu verhungern.</p>',
        draw(svg, ctx) {
          land(svg, 'Herbst'); tent(svg, 150, 270); person(svg, 240, 290); person(svg, 265, 296, .8);
          [[430, 250], [500, 262], [560, 245]].forEach(([x, y]) => { const a = animal(svg, x, y, .9); ctx.tween(2200, p => a.setAttribute('transform', `translate(${x + p * 260},${y}) scale(.9)`)); });
        } },
      { text: '<p>Weil sie oft weiterzogen, wohnten sie in <b>Zelten</b>, die man leicht auf- und abbauen konnte. Die Zelte bestanden aus Holzstangen und Tierfellen.</p>',
        draw(svg, ctx) {
          land(svg, 'Herbst');
          const t = tent(svg, 150, 270), p1 = person(svg, 240, 290), p2 = person(svg, 265, 296, .8);
          ctx.tween(900, p => t.setAttribute('transform', `translate(150,270) scale(${1 - .7 * p},${1 - .85 * p})`)).then(() =>
            ctx.tween(1600, p => { t.setAttribute('transform', `translate(${150 + 400 * p},270) scale(.3,.15)`); p1.setAttribute('transform', `translate(${240 + 300 * p},290)`); p2.setAttribute('transform', `translate(${265 + 300 * p},296) scale(.8)`); }));
        } },
      { text: '<p>Am neuen Ort sammelten sie <b>essbare Pflanzen</b> wie Beeren und Wurzeln. Darum heißen sie auch <b>Sammler</b>.</p><p class="gs-merk">Unsere Vorfahren waren Jäger und Sammler.</p>',
        draw(svg, ctx) {
          land(svg, 'Winterlager'); const t = tent(svg, 470, 260); popIn(ctx, t, 500);
          [[120, 250], [220, 262]].forEach(([x, y]) => { S('circle', { cx: x, cy: y - 20, r: 34, class: 'gs-green' }, svg); for (let k = 0; k < 6; k++) S('circle', { cx: x - 18 + (k % 3) * 18, cy: y - 34 + Math.floor(k / 3) * 22, r: 5, class: 'gs-pink' }, svg); });
          const pp = person(svg, 300, 300);
          const berry = S('circle', { cx: 130, cy: 220, r: 6, class: 'gs-pink' }, svg);
          ctx.wait(600).then(() => ctx.tween(1000, p => { berry.setAttribute('cx', lerp(130, 300, p)); berry.setAttribute('cy', lerp(220, 270, p) - 40 * Math.sin(p * Math.PI)); }));
          void pp;
        } },
      { text: '<p>So ein Zelt zeigt das Bild aus deinem Arbeitsblatt (M1). Es ist ein <b>[[Nachbau]]</b> im Archäopark Vogelherd. Forscher haben es nach Funden gebaut, so wie es wohl ausgesehen hat.</p><p>Das Bild zeigt: Die Menschen wohnten in Zelten aus Holz und Fellen, die sie schnell abbauen konnten.</p>',
        draw(svg, ctx) {
          S('rect', { x: 0, y: 280, width: 640, height: 80, class: 'gs-grass' }, svg);
          const t = tent(svg, 320, 300, 2.4); popIn(ctx, t, 600);
          const tag = card(svg, 470, 40, 150, 52, 'Nachbau\nnach Funden', 'gs-sun-soft', 'gs-txt-svg'); popIn(ctx, tag, 400, 700);
        } }
    ]
  };

  /* ================= a10 Werkzeuge und Waffen ================= */
  function stoneShape(t) { // t 0 = round pebble, 1 = Faustkeil
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2;
      const rx = 72 * Math.cos(a), ry = 58 * Math.sin(a);
      let fx = 54 * Math.sin(a), fy = -88 * Math.cos(a) + 10;
      if (Math.cos(a) > 0) fx *= 1 - .7 * Math.cos(a);
      const j = t > 0 && t < 1 ? (k % 2 ? 4 : -4) : (t === 1 ? (k % 2 ? 2 : -2) : 0);
      pts.push(`${(320 + lerp(ry, fx, t) + j).toFixed(1)},${(180 + lerp(-rx * .2 + rx * 0, fy, t) + lerp(ry * 0, 0, t) + j * .5).toFixed(1)}`);
    }
    return pts;
  }
  function pebble(t) { // nicer round pebble blend
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2;
      const px = 320 + 76 * Math.sin(a), py = 186 - 56 * Math.cos(a);
      let fx = 54 * Math.sin(a); const fy = 186 - 96 * Math.cos(a);
      if (Math.cos(a) > 0) fx *= 1 - .72 * Math.cos(a);
      const j = t > 0 && t < 1 ? (k % 2 ? 5 : -3) : (t === 1 ? (k % 2 ? 2.5 : -2) : 0);
      pts.push(`${(lerp(px, 320 + fx, t) + j).toFixed(1)},${(lerp(py, fy, t) + j * .4).toFixed(1)}`);
    }
    return pts.join(' ');
  }
  void stoneShape;
  const USES = [['schneiden', 120, 70], ['schaben\n(Fell säubern)', 520, 70], ['Fleisch\nzerlegen', 110, 290], ['Holz\nbearbeiten', 530, 290]];
  const a10 = {
    scenes: [
      { text: '<p>Die Menschen nahmen einen gerundeten Stein, zum Beispiel einen Feuerstein. Mit einem anderen Stein schlugen sie so lange Stücke ab, bis er <b>messerscharfe Kanten</b> hatte und gut in einer Hand lag.</p><p><b>Mach selbst mit:</b> Tippe auf „Zuschlagen“.</p>',
        hint: 'Tippe fünfmal auf „Zuschlagen“.',
        draw(svg, ctx) {
          let n = 0;
          const st = S('polygon', { points: pebble(0), class: 'gs-stone' }, svg);
          const hammer = S('ellipse', { cx: 520, cy: 90, rx: 34, ry: 26, class: 'gs-earth' }, svg);
          const edge = S('polygon', { points: pebble(1), class: 'gs-line', style: 'stroke:var(--sun);stroke-width:6;fill:none', opacity: 0 }, svg);
          const btn = ctx.action('Zuschlagen', async () => {
            if (n >= 5) return;
            n++; btn.disabled = true;
            await ctx.tween(180, p => hammer.setAttribute('transform', `translate(${-150 * p},${60 * p})`));
            for (let k = 0; k < 4; k++) {
              const c = S('polygon', { points: '0,0 10,-4 8,8', class: 'gs-stone' }, svg);
              const dx = (k - 1.5) * 50, sx = 330 + (k % 2 ? 40 : -40), sy = 120 + k * 22;
              ctx.tween(500, p => { c.setAttribute('transform', `translate(${sx + dx * p},${sy - 60 * p + 120 * p * p}) rotate(${p * 300})`); fade(c, 1 - p); });
            }
            st.setAttribute('points', pebble(n / 5));
            await ctx.tween(220, p => hammer.setAttribute('transform', `translate(${-150 * (1 - p)},${60 * (1 - p)})`));
            btn.disabled = n >= 5;
            if (n === 5) { ctx.tween(500, p => fade(edge, p)); ctx.say('<p><b>Fertig: ein [[Faustkeil]]!</b> Die leuchtende Kante ist messerscharf. Faustkeile wie auf deinem Arbeitsblatt (M3) sind etwa 500.000 bis 300.000 Jahre alt.</p>'); }
            else ctx.say(`<p>Schlag ${n} von 5. Mit jedem Schlag springt ein Stück ab und der Stein wird spitzer.</p>`);
          }, 'btn go');
        } },
      { text: '<p>Der Faustkeil <b>ist selbst das Werkzeug</b>. Er war wie ein Taschenmesser der Steinzeit: Damit konnte man schneiden, schaben, Fell abziehen, Fleisch zerlegen, Knochen aufschlagen und Holz bearbeiten.</p>',
        draw(svg, ctx) {
          S('polygon', { points: pebble(1), class: 'gs-stone' }, svg);
          USES.forEach(([l, x, y], k) => {
            const g = S('g', {}, svg);
            S('line', { x1: 320, y1: 180, x2: x, y2: y, class: 'gs-line-mu' }, g);
            card(g, x - 70, y - 26, 140, 52, l, 'gs-sun-soft', 'gs-txt-svg');
            popIn(ctx, g, 350, 300 + k * 350);
          });
        } },
      { text: '<p>Zur <b>Jagd</b> und zur <b>Verteidigung</b> brauchten die Menschen <b>Waffen</b>. Die wichtigste Jagdwaffe war der <b>[[Speer]]</b>: ein langer Holzstab, später mit einer Spitze aus Stein.</p><p class="gs-merk">Pfeil und Bogen gab es erst ganz am Ende der Altsteinzeit.</p>',
        draw(svg, ctx) {
          const sp = S('g', {}, svg);
          S('line', { x1: 60, y1: 250, x2: 520, y2: 120, class: 'gs-line', style: 'stroke:var(--gs-earth);stroke-width:12' }, sp);
          S('polygon', { points: '510,112 580,100 528,140', class: 'gs-stone' }, sp);
          txt(svg, 320, 300, 'Speer: Holz und Stein', 'gs-big-svg');
          ctx.tween(900, p => sp.setAttribute('transform', `translate(${-200 * (1 - p)},${60 * (1 - p)})`));
        } },
      { text: '<p>Alle Hilfsmittel stellten die Menschen aus <b>natürlichen Materialien ihrer Umgebung</b> her: Stein, Holz, Knochen und Tierfell.</p><p>Zusammen heißen sie <b>Waffen und Werkzeuge</b>: zur Jagd, zur Verteidigung und zum Verarbeiten der Tiere.</p>',
        draw(svg, ctx) {
          [['Stein', 'gs-stone'], ['Holz', 'gs-earth'], ['Knochen', 'gs-card-svg'], ['Fell', 'gs-orange']].forEach(([w, c], k) => popIn(ctx, card(svg, 24 + k * 154, 120, 136, 110, w, c, 'gs-big-svg'), 350, k * 250));
        } }
    ]
  };

  /* ================= a11 Feuer ================= */
  function night(svg) {
    S('rect', { x: 0, y: 0, width: 640, height: 360, class: 'gs-night' }, svg); stars(svg);
    S('rect', { x: 0, y: 280, width: 640, height: 80, class: 'gs-earth', style: 'stroke:none', opacity: .6 }, svg);
  }
  function eyes(svg, list) { return list.map(([x, y]) => { const g = S('g', {}, svg); S('circle', { cx: x - 6, cy: y, r: 3.5, class: 'gs-flame' }, g); S('circle', { cx: x + 6, cy: y, r: 3.5, class: 'gs-flame' }, g); g._x = x; return g; }); }
  const EYES = [[210, 250], [440, 240], [100, 270], [540, 262]];
  function glow(svg, r = 1) { const g = S('g', {}, svg); [150, 110, 70].forEach((rr, k) => S('circle', { cx: 320, cy: 280, r: rr * r, class: 'gs-flame', opacity: .1 + k * .06 }, g)); return g; }
  function people(svg, xs) { return xs.map(([x, s]) => person(svg, x, 300, s, 'gs-line')).map(p => { p.setAttribute('style', 'stroke:var(--gs-on-night)'); $$all(p).forEach(e => e.style.stroke = 'var(--gs-on-night)'); return p; }); }
  const $$all = el => [...el.querySelectorAll('*')];
  const a11 = {
    scenes: [
      { text: '<p>Die Nächte waren dunkel und kalt. Die <b>Dunkelheit brachte viele Gefahren</b>: Wilde Tiere schlichen umher.</p><p>Lange Zeit war das Feuer selbst vor allem <b>eine große Gefahr</b>, zum Beispiel bei einem Waldbrand nach einem Blitz.</p>',
        draw(svg, ctx) { night(svg); people(svg, [[290, 1], [330, .85]]); eyes(svg, EYES).forEach((e, k) => popIn(ctx, e, 400, 300 + k * 300)); } },
      { text: '<p>Im Lauf der Altsteinzeit lernten die Menschen, das Feuer zu <b>kontrollieren und zu nutzen</b>. Das Feuer spendete <b>Licht</b> und <b>Wärme</b>. So konnten sie sich im Winter wärmen.</p>',
        draw(svg, ctx) { night(svg); const g = glow(svg); const f = flame(svg, 320, 300, 1.3); people(svg, [[250, 1], [390, .85]]); eyes(svg, EYES); popIn(ctx, f, 400); ctx.tween(900, p => g.setAttribute('transform', `translate(320,280) scale(${p}) translate(-320,-280)`)); } },
      { text: '<p>Mit dem Feuer konnten die Menschen <b>wilde Tiere fernhalten</b>. Die meisten Tiere haben Angst vor Feuer.</p>',
        draw(svg, ctx) {
          night(svg); glow(svg); flame(svg, 320, 300, 1.3); people(svg, [[250, 1], [390, .85]]);
          eyes(svg, EYES).forEach(e => { const dir = e._x < 320 ? -1 : 1; ctx.tween(1500, p => { e.setAttribute('transform', `translate(${dir * 180 * p},${-10 * p})`); fade(e, 1 - p); }); });
        } },
      { text: '<p>Über dem Feuer konnten sie <b>Essen braten</b>. So wurde es <b>besser genießbar</b>. Geräuchertes Fleisch blieb außerdem länger <b>haltbar</b>.</p>',
        draw(svg, ctx) {
          night(svg); glow(svg); flame(svg, 320, 300, 1.3);
          S('path', { d: 'M240,220 L400,220 M250,220 L240,300 M390,220 L400,300', class: 'gs-line', style: 'stroke:var(--gs-earth);stroke-width:6' }, svg);
          const meat = S('ellipse', { cx: 320, cy: 220, rx: 30, ry: 16, class: 'gs-pink' }, svg);
          ctx.tween(2000, p => meat.setAttribute('transform', `rotate(${p * 360} 320 220)`));
        } },
      { text: '<p>Die <b>Feuerstelle</b> war oft der <b>Mittelpunkt des Lagerplatzes</b>. Hier saßen alle zusammen, aßen und erzählten. So förderte das Feuer die <b>Gemeinschaft</b>.</p>',
        draw(svg, ctx) {
          night(svg); glow(svg, 1.2); flame(svg, 320, 300, 1.3);
          const ps = people(svg, [[200, 1], [250, .8], [400, 1], [450, .85], [140, .9]]);
          const to = [[230, 1], [270, .8], [380, 1], [420, .85], [190, .9]];
          ps.forEach((pp, k) => ctx.tween(1400, p => pp.setAttribute('transform', `translate(${lerp([200, 250, 400, 450, 140][k], to[k][0], p)},300) scale(${to[k][1]})`)));
        } }
    ]
  };

  /* ================= a12 Höhlenmalerei ================= */
  const BISON = 'M0,30 C10,0 50,-12 82,0 C100,6 112,20 116,36 L113,58 L104,58 L102,44 C80,50 50,50 30,46 L26,64 L17,64 L15,45 C6,43 0,38 0,30 Z M0,30 C-9,28 -15,37 -11,46 C-7,50 0,48 4,43 M-3,24 C-10,15 -5,8 2,10';
  const BULL = 'M0,20 C20,6 70,4 110,14 C126,18 134,30 132,40 L128,60 L120,60 L118,44 C90,48 50,48 24,44 L20,62 L12,62 L10,42 C2,38 -4,30 0,20 Z M0,20 C-12,16 -20,26 -14,34 M-6,12 C-16,0 -8,-10 4,-6 M4,12 C2,0 12,-8 20,-4';
  function cave(svg) {
    S('rect', { x: 0, y: 0, width: 640, height: 360, class: 'gs-earth', style: 'stroke:none' }, svg);
    for (let k = 0; k < 30; k++) S('circle', { cx: (k * 113) % 640, cy: (k * 71) % 360, r: 4 + k % 6, class: 'gs-earth-soft', opacity: .5 }, svg);
    S('path', { d: BISON, class: 'gs-paint-dark', transform: 'translate(90,80) scale(1.3)' }, svg);
    S('path', { d: BULL, class: 'gs-paint', transform: 'translate(360,60) scale(1.4)' }, svg);
    S('path', { d: BISON, class: 'gs-paint', transform: 'translate(300,220) scale(1.1)' }, svg);
    S('path', { d: 'M120,260 L200,300 M200,300 L190,288 M200,300 L186,302', class: 'gs-paint-dark' }, svg);
  }
  const a12 = {
    scenes: [
      { text: '<p>In der <b>Höhle von Lascaux</b> in Südfrankreich haben Menschen vor langer Zeit Tiere an die Wände gemalt: Stiere, Pferde und Bisons. Auf einem Bild sieht man sogar eine <b>Jagd auf einen Bison</b>.</p><p><b>Mach selbst mit:</b> Bewege deine Lampe über die Höhlenwand.</p>',
        hint: 'Bewege den Finger oder die Maus über das Bild.',
        draw(svg, ctx) {
          cave(svg);
          const id = svg.id + '-lamp';
          const defs = S('defs', {}, svg), mask = S('mask', { id }, defs);
          S('rect', { x: 0, y: 0, width: 640, height: 360, fill: 'white' }, mask);
          const spot = S('circle', { cx: 120, cy: 120, r: 80, fill: 'black' }, mask);
          const dark = S('rect', { x: 0, y: 0, width: 640, height: 360, class: 'gs-night', mask: `url(#${id})`, opacity: .96 }, svg);
          let user = false;
          const mv = e => { user = true; const p = svgPoint(svg, e); spot.setAttribute('cx', p.x); spot.setAttribute('cy', p.y); };
          svg.addEventListener('pointermove', mv); svg.addEventListener('pointerdown', mv);
          ctx.onLeave(() => { svg.removeEventListener('pointermove', mv); svg.removeEventListener('pointerdown', mv); });
          ctx.tween(4000, p => { if (!user) { spot.setAttribute('cx', 120 + 420 * p); spot.setAttribute('cy', 150 + 80 * Math.sin(p * 6)); } }, Kit.lin);
          ctx.action('Ganze Wand beleuchten', () => ctx.tween(500, p => fade(dark, .96 * (1 - p))), 'btn ghost');
        } },
      { text: '<p><b>Was wissen wir sicher?</b> Menschen haben diese Tiere gemalt. Sie kannten die Tiere genau, also haben sie sie oft gesehen und wohl gejagt. Die Bilder sind sehr alt.</p><p>Das zeigt die Quelle selbst. Das ist sicher.</p>',
        draw(svg, ctx) { cave(svg); popIn(ctx, card(svg, 380, 280, 240, 56, 'sicher: Menschen\nhaben Tiere gemalt', 'gs-good', 'gs-txt-svg'), 400, 300); } },
      { text: '<p><b>Warum</b> haben die Menschen die Tiere gemalt? Das wissen wir nicht genau. Forscher haben nur <b>Vermutungen</b>:</p><ul><li>Sie wollten sich <b>Jagdglück</b> wünschen.</li><li>Sie wollten sich an eine Jagd <b>erinnern</b>.</li><li>Sie wollten <b>Geschichten erzählen</b>.</li><li>Sie wollten den Jüngeren <b>zeigen</b>, wie man jagt.</li></ul>',
        draw(svg, ctx) {
          cave(svg);
          [['Jagdglück?', 30, 20], ['Erinnerung?', 440, 20], ['Geschichten\nerzählen?', 30, 280], ['Den Kindern\nzeigen?', 450, 280]].forEach(([l, x, y], k) => popIn(ctx, card(svg, x, y, 160, 56, l, 'gs-sun-soft', 'gs-txt-svg'), 350, 200 + k * 350));
        } },
      { text: '<p><b>Warum gibt es über die Altsteinzeit kaum sichere Aussagen?</b></p><ul><li>Es gab noch <b>keine Schrift</b>. Niemand hat aufgeschrieben, was er dachte.</li><li>Es gibt nur <b>Überreste</b>, oft nur Bruchstücke wie Knochensplitter.</li><li>Darum müssen Forscher vieles <b>vermuten</b>. Neue Funde können ihre Meinung ändern.</li></ul>',
        draw(svg, ctx) {
          const a = S('g', {}, svg);
          S('rect', { x: 40, y: 60, width: 160, height: 200, rx: 10, class: 'gs-card-svg' }, a);
          [0, 1, 2, 3].forEach(k => S('line', { x1: 64, y1: 100 + k * 36, x2: 176, y2: 100 + k * 36, class: 'gs-line-mu' }, a));
          S('path', { d: 'M40,60 L200,260 M200,60 L40,260', class: 'gs-line', style: 'stroke:var(--bad);stroke-width:6' }, a);
          txt(a, 120, 300, 'keine Schrift', 'gs-txt-svg');
          const b = S('g', {}, svg);
          [[260, 160], [300, 190], [340, 150], [290, 120]].forEach(([x, y], k) => S('path', { d: `M${x},${y} l18,-6 l10,10 l-14,12 z`, class: k % 2 ? 'gs-card-svg' : 'gs-stone' }, b));
          txt(b, 310, 300, 'nur Bruchstücke', 'gs-txt-svg');
          const c = S('g', {}, svg);
          S('circle', { cx: 510, cy: 150, r: 60, class: 'gs-sun-soft' }, c); txt(c, 510, 168, '?', 'gs-big-svg');
          txt(c, 510, 300, 'Forscher vermuten', 'gs-txt-svg');
          popIn(ctx, a, 350); popIn(ctx, b, 350, 500); popIn(ctx, c, 350, 1000);
        } }
    ]
  };

  window.Buehnen = { a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12 };
  void clamp; void tween;
})();
