/* Lern-Werkstatt shared helpers. Plain JavaScript, no build step, no dependencies.
   Load with <script src="../kit/kit.js"></script> before the app's own script, then:
     const { $, $$, S, tween, wait, makeStepper, makeSeg, mountCheck, store } = Kit;
   Docs: docs/DESIGN.md (section "kit.js"). Gallery with live examples: kit/galerie.html */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- DOM ---------- */
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  /** Create an SVG element with attributes, optionally appended to parent. */
  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  /** Pointer event position in the SVG's own coordinates (for dragging). */
  function svgPoint(svg, e) {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  /** Escape text for safe use inside innerHTML. */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Numbers ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /** German number format: deNum(0.75) → "0,75" */
  const deNum = (x, digits = 3) => Number(x).toLocaleString('de-DE', { maximumFractionDigits: digits });

  /* ---------- Motion (always honours "reduce motion") ---------- */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const lin = t => t;
  /** Animate: fn(p) is called with p going 0 → 1 over ms. Resolves when done. */
  function tween(ms, fn, e = ease) {
    return new Promise(res => {
      if (RM.matches || ms <= 0) { fn(1); res(); return; }
      const t0 = performance.now();
      const step = now => { const t = clamp((now - t0) / ms); /* rAF time can be slightly before t0 */ fn(e(t)); if (t < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, RM.matches ? 0 : ms));

  /* ---------- Storage (never throws; works in private windows) ---------- */
  /** store('bw') gives get/set for keys prefixed "bw-". Values are JSON. */
  function store(prefix) {
    const k = key => prefix + '-' + key;
    return {
      get(key, fallback = null) { try { const v = localStorage.getItem(k(key)); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
      set(key, value) { try { localStorage.setItem(k(key), JSON.stringify(value)); } catch (e) { /* ignore */ } },
      remove(key) { try { localStorage.removeItem(k(key)); } catch (e) { /* ignore */ } }
    };
  }

  /* ---------- Controls ---------- */
  /** Number stepper (− value +). host: an empty element. Returns {get, set, setValues}. */
  function makeStepper(host, { label, values, value, onChange }) {
    host.classList.add('ctl');
    host.innerHTML = `<span class="ctl-label">${label}</span><div class="stepper"><button type="button" class="step" data-d="-1" aria-label="Weniger: ${label}">−</button><output aria-live="polite"></output><button type="button" class="step" data-d="1" aria-label="Mehr: ${label}">+</button></div>`;
    const out = host.querySelector('output');
    const [dec, inc] = host.querySelectorAll('button');
    let vals = values, i = Math.max(0, vals.indexOf(value));
    const sync = () => { out.textContent = vals[i]; dec.disabled = i === 0; inc.disabled = i === vals.length - 1; };
    [dec, inc].forEach(b => b.addEventListener('click', () => {
      const j = i + Number(b.dataset.d);
      if (j < 0 || j >= vals.length) return;
      i = j; sync(); onChange(vals[i]);
    }));
    sync();
    return {
      get: () => vals[i],
      set(v) { const j = vals.indexOf(v); if (j >= 0) { i = j; sync(); } },
      setValues(vs, v) {
        vals = vs;
        let j = vs.indexOf(v);
        if (j < 0) j = vs.reduce((best, x, k) => Math.abs(x - v) < Math.abs(vs[best] - v) ? k : best, 0);
        i = j; sync();
      }
    };
  }
  /** Segmented choice. options: [{v, t}]. Returns {get, set}. */
  function makeSeg(host, { label, options, value, onChange }) {
    host.classList.add('ctl');
    host.innerHTML = `<span class="ctl-label">${label}</span><div class="seg" role="radiogroup" aria-label="${label}">${options.map(o => `<button type="button" role="radio" aria-checked="${o.v === value}">${o.t}</button>`).join('')}</div>`;
    const bs = [...host.querySelectorAll('button')];
    let cur = value;
    const mark = k => bs.forEach((x, j) => x.setAttribute('aria-checked', j === k));
    bs.forEach((b, k) => b.addEventListener('click', () => { mark(k); cur = options[k].v; onChange(cur); }));
    return { get: () => cur, set(v) { const k = options.findIndex(o => o.v === v); if (k >= 0) { mark(k); cur = v; } } };
  }

  /* ---------- Check yourself (quiz card) ----------
     items: {type:'mcq', prompt, visual?, options:[{text, pic?, correct?, why?}], explain, after?}
          | {type:'task', prompt, visual?, mount(bodyEl) → () => ({ok, msg})}
     opts:  {title?, tag?(item) → string, onDone?(firstTry[], items), next?: {label, go()}}
     Every wrong option needs a "why" that explains the specific mistake kindly. */
  function mountCheck(host, items, opts = {}) {
    const title = opts.title || 'Teste dich selbst';
    host.classList.add('check');
    let i = 0, first = [], tried = false, solved = false;
    const dots = cls => `<div class="dots" aria-hidden="true">${items.map((_, k) => `<span class="dot ${cls(k)}"></span>`).join('')}</div>`;
    function render() {
      const it = items[i]; tried = false; solved = false;
      host.innerHTML = `<div class="check-head"><h3>${title}</h3>${dots(k => k < i ? (first[k] ? 'good' : 'done') : k === i ? 'cur' : '')}</div>
        <p class="q-count">Frage ${i + 1} von ${items.length}${opts.tag ? ` · ${opts.tag(it)}` : ''}</p>
        <p class="prompt">${it.prompt}</p>
        <div class="q-visual">${it.visual || ''}</div>
        <div class="q-body"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="q-actions"></div>`;
      const body = $('.q-body', host), fb = $('.feedback', host), act = $('.q-actions', host);
      const finish = (ok, msg) => {
        if (!tried) { first[i] = ok; tried = true; }
        fb.className = 'feedback ' + (ok ? 'good' : 'bad');
        fb.innerHTML = (ok ? '<b>Richtig!</b> ' : '<b>Noch nicht ganz.</b> ') + msg + (ok && it.after ? `<span class="extra">${it.after}</span>` : '');
        if (ok && !solved) {
          solved = true;
          const nb = document.createElement('button');
          nb.type = 'button'; nb.className = 'btn';
          nb.textContent = i < items.length - 1 ? 'Nächste Frage' : 'Ergebnis ansehen';
          nb.addEventListener('click', () => { i++; i < items.length ? render() : summary(); });
          act.innerHTML = ''; act.appendChild(nb); nb.focus({ preventScroll: true });
        }
      };
      if (it.type === 'mcq') {
        body.innerHTML = `<div class="opts">${it.options.map((o, k) => `<button type="button" class="opt" data-k="${k}">${o.pic || ''}<span>${o.text}</span></button>`).join('')}</div>`;
        $$('.opt', body).forEach(b => b.addEventListener('click', () => {
          if (solved) return;
          const o = it.options[Number(b.dataset.k)];
          if (o.correct) { b.classList.add('right'); $$('.opt', body).forEach(x => x.disabled = true); finish(true, it.explain); }
          else { b.classList.add('wrong'); b.disabled = true; finish(false, o.why + ' Versuch eine andere Antwort.'); }
        }));
      } else {
        const check = it.mount(body);
        const cb = document.createElement('button');
        cb.type = 'button'; cb.className = 'btn go'; cb.textContent = 'Prüfen';
        cb.addEventListener('click', () => { if (solved) return; const r = check(); finish(r.ok, r.msg); if (r.ok) cb.remove(); });
        act.appendChild(cb);
      }
    }
    function summary() {
      const right = first.filter(Boolean).length;
      if (opts.onDone) opts.onDone(first, items);
      host.innerHTML = `<div class="check-head"><h3>${title}</h3>${dots(k => first[k] ? 'good' : 'done')}</div>
        <p class="summary">Du hattest <b>${right} von ${items.length}</b> Fragen beim ersten Versuch richtig.${right === items.length ? ' Super gemacht!' : ' Jede falsche Antwort hat dir etwas gezeigt. Das zählt auch.'}</p>
        <div class="q-actions"><button type="button" class="btn ghost" data-again>Noch einmal üben</button>${opts.next ? `<button type="button" class="btn go" data-next>${opts.next.label}</button>` : ''}</div>`;
      $('[data-again]', host).addEventListener('click', () => { i = 0; first = []; render(); });
      if (opts.next) $('[data-next]', host).addEventListener('click', opts.next.go);
    }
    render();
    return { restart() { i = 0; first = []; render(); } };
  }

  window.Kit = { $, $$, S, svgPoint, esc, lerp, clamp, range, shuffle, deNum, ease, easeOut, lin, tween, wait, reducedMotion: RM, store, makeStepper, makeSeg, mountCheck };
})();
