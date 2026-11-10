// Apogee landing page: download detection, scroll reveals and the six feature demos.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 30) : ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const nav = $('#nav');
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-40px 0px 0px 0px' }).observe($('.eyebrow'));

  const revealer = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealer.observe(el));

  function clock() {
    const d = new Date();
    $('[data-clock]').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]\.?M\.?$/i, '');
    $('[data-date]').textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const h = d.getHours();
    $('[data-greet]').textContent = h < 5 ? 'Still up?' : h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
    setTimeout(clock, 60000 - d.getSeconds() * 1000 - d.getMilliseconds() + 30);
  }
  clock();

  async function detectMac() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'mobile';
    if (!/Macintosh|Mac OS X/.test(ua)) return 'other';
    try {
      const h = await navigator.userAgentData?.getHighEntropyValues?.(['architecture']);
      if (h?.architecture === 'arm') return 'arm64';
      if (h?.architecture === 'x86') return 'x86_64';
    } catch {}
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return 'mac';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const r = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      const astc = !!gl.getExtension('WEBGL_compressed_texture_astc');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (/Intel|AMD|Radeon|NVIDIA|GeForce/i.test(r)) return 'x86_64';
      if (astc || /Apple M\d/i.test(r)) return 'arm64';
      if (/Apple GPU/i.test(r)) return 'x86_64';
    } catch {}
    return 'mac';
  }
  detectMac().then(kind => {
    if (kind === 'arm64' || kind === 'x86_64') {
      $$(`.chip[data-arch="${kind}"]`).forEach(c => c.classList.add('pick'));
    } else if (kind === 'mobile' || kind === 'other') {
      $$('[data-dl-note]').forEach(n => { n.textContent = kind === 'mobile' ? 'Apogee is a Mac app. Open this page on your Mac to download it.' : 'Apogee runs on macOS 14 Sonoma or later.'; });
    }
  });

  const demos = new Map();
  const demoIO = new IntersectionObserver(es => es.forEach(e => {
    const d = demos.get(e.target);
    if (!d) return;
    if (e.isIntersecting) { if (!d.started) { d.started = true; d.start(); } d.visible?.(true); }
    else d.visible?.(false);
  }), { threshold: .35 });
  function demo(name, def) {
    const el = $(`[data-demo="${name}"]`);
    if (!el) return;
    const d = def(el);
    demos.set(el, d);
    demoIO.observe(el);
  }

  function setRange(input, v) {
    input.value = v;
    input.style.setProperty('--p', `${(v - input.min) / (input.max - input.min) * 100}%`);
  }
  function animateRange(input, to, ms, onStep, isLive) {
    const from = +input.value;
    const t0 = performance.now();
    const step = t => {
      if (!isLive()) return;
      const k = reduce ? 1 : clamp((t - t0) / ms, 0, 1);
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setRange(input, from + (to - from) * e);
      onStep();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  demo('canvas', el => {
    const typed = $('[data-typed]', el);
    const board = $('[data-board]', el);
    let token = 0;
    const kepler = (M, e) => { let E = M; for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; };
    const fmt = n => Math.round(n).toLocaleString('en-US');

    const boards = {
      apogee: {
        q: 'what is an apogee',
        html: `
          <p class="bh">The <em>farthest</em> point of an orbit.</p>
          <p class="bl" style="--d:.08s">Every orbit is an ellipse. Its farthest point from Earth is the <b>apogee</b> and its closest is the <b>perigee</b>. The Moon swings about <b>42,000 km</b> between the two every month.</p>
          <div class="bgrid">
            <div class="card facts" style="--d:.18s">
              <div class="fact"><span class="v">405,500 km</span><span class="l">Moon at apogee</span></div>
              <div class="fact"><span class="v">363,300 km</span><span class="l">Moon at perigee</span></div>
              <div class="fact"><span class="v">27.3 days</span><span class="l">One lap around Earth</span></div>
            </div>
            <div class="card inter" style="--d:.3s">
              <p class="clabel" style="--c:var(--blue)">Interactive · not to scale</p>
              <svg viewBox="0 0 360 200" role="img" aria-label="The Moon's orbit with apogee and perigee">
                <ellipse cx="180" cy="100" rx="150" ry="76" fill="none" stroke="#2c2c31" stroke-width="1.5" stroke-dasharray="3 5"/>
                <line data-o="line" x1="112.5" y1="100" x2="30" y2="100" stroke="rgba(255,255,255,.28)" stroke-width="1.2" stroke-dasharray="2 4"/>
                <circle cx="330" cy="100" r="3.5" fill="#ffb547"/><text x="330" y="86" fill="#ffb547" font-size="11.5" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Apogee</text>
                <circle cx="30" cy="100" r="3" fill="#8e8e93"/><text x="30" y="122" fill="#8e8e93" font-size="11.5" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Perigee</text>
                <circle cx="112.5" cy="100" r="13" fill="#10202e" stroke="#64d2ff" stroke-opacity=".55"/>
                <text x="112.5" y="132" fill="#8e8e93" font-size="11" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Earth</text>
                <circle data-o="moon" cx="30" cy="100" r="6.5" fill="#f5f5f7"/>
              </svg>
              <input type="range" min="0" max="1000" step="1" value="0" aria-label="Days into the orbit" data-o="range">
              <div class="read"><span>Day <b data-o="day">0.0</b></span><span>Distance <b data-o="dist">363,296</b> km</span><span>Speed <b data-o="v">1.08</b> km/s</span></div>
            </div>
          </div>
          <div class="srcs" style="--d:.42s"><span>Sources</span><a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html" target="_blank" rel="noopener"><b>N</b>NASA</a><a href="https://en.wikipedia.org/wiki/Apsis" target="_blank" rel="noopener"><b>W</b>Wikipedia</a></div>`,
        init(root, live) {
          const range = $('[data-o="range"]', root), moon = $('[data-o="moon"]', root), line = $('[data-o="line"]', root);
          const out = { day: $('[data-o="day"]', root), dist: $('[data-o="dist"]', root), v: $('[data-o="v"]', root) };
          const draw = () => {
            const t = range.value / 1000;
            const M = t * 2 * Math.PI;
            const Ev = kepler(M, .45), Er = kepler(M, .0549);
            const x = 180 - 150 * Math.cos(Ev), y = 100 + 76 * Math.sin(Ev);
            moon.setAttribute('cx', x.toFixed(1)); moon.setAttribute('cy', y.toFixed(1));
            line.setAttribute('x2', x.toFixed(1)); line.setAttribute('y2', y.toFixed(1));
            const r = 384400 * (1 - .0549 * Math.cos(Er));
            out.day.textContent = (t * 27.32).toFixed(1);
            out.dist.textContent = fmt(r);
            out.v.textContent = Math.sqrt(398600 * (2 / r - 1 / 384400)).toFixed(2);
            range.style.setProperty('--p', `${t * 100}%`);
          };
          range.addEventListener('input', draw);
          draw();
          wait(700).then(() => live() && animateRange(range, 500, 2400, draw, live));
        }
      },
      nozzle: {
        q: 'how does a rocket nozzle work',
        html: `
          <p class="bh">A nozzle turns heat into <em>speed</em>.</p>
          <p class="bl" style="--d:.08s">Hot gas squeezes through the narrow <b>throat</b> until it reaches the speed of sound, then keeps speeding up as the <b>bell</b> widens. What the flame looks like depends on the air outside.</p>
          <div class="bgrid">
            <div class="card inter" style="--d:.18s">
              <p class="clabel" style="--c:var(--blue)">Interactive · drag to climb</p>
              <svg viewBox="0 0 360 200" role="img" aria-label="Rocket nozzle and its exhaust plume">
                <defs><linearGradient id="plume" x1="164" x2="352" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6e5" stop-opacity=".95"/><stop offset=".28" stop-color="#ffb547" stop-opacity=".75"/><stop offset="1" stop-color="#ffb547" stop-opacity="0"/></linearGradient></defs>
                <path data-n="plume" fill="url(#plume)"/>
                <g data-n="diamonds" fill="#fff"></g>
                <path d="M14 66 L74 66 C88 66 94 88 104 88 C122 88 140 70 164 58 L164 142 C140 130 122 112 104 112 C94 112 88 134 74 134 L14 134 Z" fill="#0d0d10" stroke="#5a5a62" stroke-width="4" stroke-linejoin="round"/>
                <text x="104" y="160" fill="#8e8e93" font-size="11" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Throat</text>
                <text x="44" y="160" fill="#8e8e93" font-size="11" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Chamber</text>
                <text x="160" y="176" fill="#8e8e93" font-size="11" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">Bell</text>
              </svg>
              <input type="range" min="0" max="60" step=".5" value="0" aria-label="Altitude in kilometers" data-n="range">
              <div class="read"><span>Altitude <b data-n="alt">0</b> km</span><span>Air <b data-n="pa">101</b> kPa</span><span class="mode" data-n="mode">Over-expanded</span></div>
              <p class="cap" data-n="cap"></p>
            </div>
            <div class="card facts" style="--d:.3s">
              <div class="fact"><span class="v">Mach 1</span><span class="l">Gas speed at the throat</span></div>
              <div class="fact"><span class="v">2.5 to 4.5 km/s</span><span class="l">Exhaust speed of real engines</span></div>
              <div class="fact"><span class="v">1888</span><span class="l">Gustaf de Laval's steam turbine nozzle</span></div>
            </div>
          </div>
          <div class="srcs" style="--d:.42s"><span>Sources</span><a href="https://www.grc.nasa.gov/www/k-12/rocket/nozzle.html" target="_blank" rel="noopener"><b>N</b>NASA Glenn</a><a href="https://en.wikipedia.org/wiki/De_Laval_nozzle" target="_blank" rel="noopener"><b>W</b>Wikipedia</a></div>`,
        init(root, live) {
          const range = $('[data-n="range"]', root), plume = $('[data-n="plume"]', root), dia = $('[data-n="diamonds"]', root);
          const out = { alt: $('[data-n="alt"]', root), pa: $('[data-n="pa"]', root), mode: $('[data-n="mode"]', root), cap: $('[data-n="cap"]', root) };
          const draw = () => {
            const h = +range.value;
            const pa = 101.325 * Math.exp(-h / 8.5);
            const ratio = 30 / pa;
            const k = clamp(Math.pow(ratio, .4), .45, 2.3);
            const mid = clamp(100 - 42 * k * 1.15, 4, 96), end = 100 - 42 * (.55 + .45 * k);
            plume.setAttribute('d', `M164 58 Q 238 ${mid.toFixed(1)} 352 ${end.toFixed(1)} L352 ${(200 - end).toFixed(1)} Q 238 ${(200 - mid).toFixed(1)} 164 142 Z`);
            const op = clamp(Math.abs(Math.log(ratio)) / 1.4, 0, 1) * .85;
            const s = clamp(42 * k * .32, 7, 16);
            dia.innerHTML = [196, 238, 280].map((x, i) => `<path d="M${x - 12} 100 L${x} ${100 - s * (1 - i * .18)} L${x + 12} 100 L${x} ${100 + s * (1 - i * .18)} Z" opacity="${(op * (1 - i * .25)).toFixed(2)}"/>`).join('');
            out.alt.textContent = h % 1 ? h.toFixed(1) : h;
            out.pa.textContent = pa < 1 ? pa.toFixed(2) : Math.round(pa);
            const m = ratio < .8 ? ['Over-expanded', 'Thick air squeezes the plume into a narrow jet with shock diamonds.']
              : ratio <= 1.25 ? ['Matched', 'Outside pressure matches the exhaust, so the plume runs straight. The nozzle was built for this altitude.']
              : ['Under-expanded', 'Thin air lets the exhaust balloon outward and some of the push goes sideways.'];
            out.mode.textContent = m[0]; out.cap.textContent = m[1];
            range.style.setProperty('--p', `${h / 60 * 100}%`);
          };
          range.addEventListener('input', draw);
          draw();
          wait(700).then(() => live() && animateRange(range, 40, 2800, draw, live));
        }
      }
    };

    async function show(key) {
      const my = ++token;
      const live = () => my === token;
      const b = boards[key];
      $$('[data-q]', el).forEach(x => x.classList.toggle('on', x.dataset.q === key));
      board.innerHTML = '';
      typed.textContent = '';
      for (const ch of '?' + b.q) {
        if (!live()) return;
        typed.textContent += ch;
        await wait(34);
      }
      await wait(320);
      if (!live()) return;
      board.innerHTML = `<p class="bq"><i>?</i>${esc(b.q)}</p>` + b.html;
      b.init(board, live);
    }
    $$('[data-q]', el).forEach(btn => btn.addEventListener('click', () => show(btn.dataset.q)));
    return { start: () => show('apogee') };
  });

  demo('max', el => {
    const win = $('.win', el), msgs = $('[data-msgs]', el), inp = $('[data-inp]', el), cart = $('[data-cart]', el);
    const cursor = $('[data-cursor]', el), checkout = $('[data-checkout]', el);
    let run = 0, waiting = null;
    const hint = msgs.innerHTML;

    function reset() {
      run++;
      waiting?.('stop'); waiting = null;
      msgs.innerHTML = '';
      cart.textContent = '0'; cart.classList.remove('bump');
      checkout.classList.remove('show');
      cursor.classList.remove('on');
      $$('.prod', el).forEach(p => p.classList.remove('hl'));
      inp.textContent = 'Ask Max'; inp.parentElement.classList.remove('typing');
      return run;
    }
    const live = my => my === run;
    const scroll = () => { while (msgs.scrollHeight > msgs.clientHeight && msgs.children.length > 2) msgs.firstElementChild.remove(); };
    async function typeIn(text, my) {
      inp.parentElement.classList.add('typing');
      inp.textContent = '';
      for (const ch of text) { if (!live(my)) return; inp.textContent += ch; await wait(26); }
      await wait(260);
      inp.textContent = 'Ask Max'; inp.parentElement.classList.remove('typing');
      const u = document.createElement('p'); u.className = 'u'; u.textContent = text; msgs.append(u); scroll();
    }
    async function stream(parts, my) {
      const p = document.createElement('p'); p.className = 'm';
      const dots = document.createElement('div'); dots.className = 'dots'; dots.innerHTML = '<i></i><i></i><i></i>';
      msgs.append(dots); scroll();
      await wait(650);
      dots.remove();
      if (!live(my)) return;
      msgs.append(p);
      const total = parts.reduce((n, x) => n + (x.t || x.b).length, 0);
      for (let n = 0; n <= total; n += 3) {
        if (!live(my)) return;
        let left = n, html = '';
        for (const x of parts) {
          const s = (x.t || x.b).slice(0, Math.max(0, left)); left -= (x.t || x.b).length;
          html += x.b ? `<b>${esc(s)}</b>` : esc(s);
        }
        p.innerHTML = html; scroll();
        await wait(16);
      }
    }
    function point(target, my) {
      if (!live(my)) return;
      const w = win.getBoundingClientRect(), r = target.getBoundingClientRect();
      cursor.classList.add('on');
      cursor.style.transform = `translate(${r.left - w.left + r.width / 2}px, ${r.top - w.top + r.height / 2}px)`;
    }
    async function ask() {
      const my = reset();
      await typeIn('Which one is the best value?', my);
      await stream([{ t: 'The ' }, { b: 'Fast charge cable' }, { t: ' at $7.49. It is twice as long as the basic one for $2.50 more, at the same 60 W. If you need 100 W for a laptop, the ' }, { b: 'Braided cable' }, { t: ' is the one.' }], my);
    }
    async function act() {
      const my = reset();
      await typeIn('Buy the cheapest one', my);
      if (!live(my)) return;
      const card = document.createElement('div'); card.className = 'agent';
      card.innerHTML = '<p class="ah"><span class="halo on"></span>Agent</p><ol></ol>';
      msgs.append(card); scroll();
      const list = $('ol', card);
      const step = text => { const li = document.createElement('li'); li.textContent = text; list.append(li); scroll(); return li; };
      let s = step('Reading the page'); point($('.shop-t', el), my); await wait(800); s.classList.add('ok');
      if (!live(my)) return;
      const basic = $('[data-p="basic"]', el);
      s = step('Cheapest: Basic cable, $4.99'); point(basic, my); basic.classList.add('hl'); await wait(950); s.classList.add('ok');
      if (!live(my)) return;
      const buy = $('[data-buy]', el);
      s = step('Clicking Add to cart'); point(buy, my); await wait(650);
      if (!live(my)) return;
      cursor.classList.add('tap'); buy.classList.add('press');
      await wait(160); buy.classList.remove('press'); cursor.classList.remove('tap');
      cart.textContent = '1'; cart.classList.add('bump'); s.classList.add('ok');
      await wait(500);
      if (!live(my)) return;
      s = step('Opening checkout'); point($('.cart', el), my); await wait(600);
      checkout.classList.add('show'); point($('.pay', el), my); await wait(500); s.classList.add('ok');
      if (!live(my)) return;
      $('.halo', card).classList.remove('on');
      const ok = document.createElement('div'); ok.className = 'ask-ok';
      ok.innerHTML = '<p>Payment needs you<small>Pay $4.99 to Orbit Supply?</small></p><div><button type="button" data-r="stop">Stop</button><button type="button" class="go" data-r="go">Allow</button></div>';
      card.append(ok); scroll();
      const answer = await new Promise(res => {
        waiting = res;
        $$('button', ok).forEach(b => b.addEventListener('click', () => res(b.dataset.r)));
      });
      waiting = null;
      if (!live(my)) return;
      ok.remove();
      if (answer === 'go') {
        s = step('Paying $4.99'); point($('.pay', el), my); await wait(700); s.classList.add('ok');
        if (!live(my)) return;
        step('Done. Order placed.').classList.add('ok');
      } else {
        step('Stopped. Nothing was paid.').classList.add('ok');
      }
      cursor.classList.remove('on');
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && waiting) waiting('stop');
    });
    $('[data-a="ask"]', el).addEventListener('click', ask);
    $('[data-a="do"]', el).addEventListener('click', act);
    return { start: () => wait(400).then(ask) };
  });

  demo('ads', el => {
    const news = $('[data-news]', el), shield = $('[data-shield]', el), btn = $('[data-shield-btn]', el), log = $('.blocked', el);
    news.classList.add('noanim');
    function set(on) {
      news.classList.toggle('blocked', on);
      shield.classList.toggle('on', on);
      shield.setAttribute('aria-pressed', String(on));
      log.classList.toggle('off', !on);
      btn.textContent = on ? 'Turn blocking off for this site' : 'Turn blocking back on';
    }
    set(false);
    requestAnimationFrame(() => requestAnimationFrame(() => news.classList.remove('noanim')));
    const toggle = () => set(!news.classList.contains('blocked'));
    shield.addEventListener('click', toggle);
    btn.addEventListener('click', toggle);
    return { start: () => wait(900).then(() => set(true)) };
  });

  demo('yt', el => {
    const player = $('[data-player]', el), frame = $('[data-frame]', el), amb = $('[data-amb]', el), ambImg = $('img', amb);
    const prog = $('[data-prog]', el), time = $('[data-time]', el), toastEl = $('[data-toast]', el);
    const playBtn = $('[data-play-btn]', el), ambBtn = $('[data-amb-btn]', el);
    const DUR = 252, SEG = [.30, .43], LEN = 15;
    let p = 0, playing = false, last = 0, skipped = false, toastTimer = 0, shown = true;
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    function toast(text) {
      toastEl.textContent = text; toastEl.classList.add('show');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
    }
    function render() {
      prog.style.transform = `scaleX(${p.toFixed(4)})`;
      time.textContent = `${fmt(p * DUR)} / 4:12`;
      const z = `scale(${(1.02 + p * .07).toFixed(4)})`;
      frame.style.transform = z; ambImg.style.transform = z;
    }
    function tick(t) {
      if (!playing) return;
      p += Math.min(.1, (t - last) / 1000) / LEN; last = t;
      if (!skipped && p >= SEG[0]) { p = SEG[1]; skipped = true; toast('Skipped sponsor · SponsorBlock'); }
      if (p >= 1) { p = 1; setPlaying(false); playBtn.textContent = 'Replay'; }
      render();
      if (playing) requestAnimationFrame(tick);
    }
    function setPlaying(v) {
      if (v && p >= 1) { p = 0; skipped = false; }
      playing = v && shown;
      player.classList.toggle('playing', playing);
      playBtn.textContent = playing ? 'Pause' : 'Play';
      if (playing) { last = performance.now(); requestAnimationFrame(tick); }
    }
    const togglePlay = () => setPlaying(!playing);
    $('[data-play]', el).addEventListener('click', togglePlay);
    playBtn.addEventListener('click', togglePlay);
    ambBtn.addEventListener('click', () => {
      const off = amb.classList.toggle('off');
      ambBtn.classList.toggle('on', !off); ambBtn.setAttribute('aria-pressed', String(!off));
    });
    render();
    return {
      start: () => wait(600).then(() => toast('Ad blocked before it started')),
      visible: v => { shown = v; if (!v && playing) setPlaying(false); }
    };
  });

  demo('vault', el => {
    const email = $('[data-email]', el), pass = $('[data-pass]', el), pop = $('[data-pop]', el), gen = $('[data-gen]', el);
    const pw = $('[data-pw]', el), title = $('[data-lg-title]', el), btn = $('[data-lg-btn]', el);
    const save = $('[data-save]', el), saveT = $('[data-save-t]', el);
    let run = 0, pending = null;
    const ALPHA = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function generate() {
      const b = new Uint8Array(18); crypto.getRandomValues(b);
      const s = [...b].map(x => ALPHA[x % ALPHA.length]).join('');
      return `${s.slice(0, 6)}-${s.slice(6, 12)}-${s.slice(12)}`;
    }
    function reset(mode) {
      run++;
      pending?.(); pending = null;
      email.textContent = ''; pass.textContent = '';
      [email, pass].forEach(f => f.classList.remove('focus', 'filled'));
      pop.classList.remove('show'); gen.classList.remove('show');
      save.classList.remove('show', 'done');
      saveT.textContent = 'Save password for orbit-supply.example?';
      title.textContent = mode === 'new' ? 'Create an account' : 'Sign in';
      btn.textContent = mode === 'new' ? 'Create account' : 'Sign in';
      $$('[data-v]', el).forEach(b => b.classList.toggle('on', b.dataset.v === mode));
      return run;
    }
    const until = (target, ms) => new Promise(res => {
      let done = false;
      const fin = () => { if (!done) { done = true; target.removeEventListener('click', fin); res(); } };
      pending = fin;
      target.addEventListener('click', fin);
      setTimeout(fin, reduce ? 30 : ms);
    });
    async function press(my) { btn.classList.add('press'); await wait(150); btn.classList.remove('press'); return my === run; }
    async function fill() {
      const my = reset('fill');
      email.classList.add('focus'); await wait(300);
      if (my !== run) return;
      pop.classList.add('show');
      await until($('[data-fill]', el), 1800);
      if (my !== run) return;
      pop.classList.remove('show'); email.classList.remove('focus');
      email.textContent = 'alex@orbit.mail'; pass.textContent = '••••••••••••';
      email.classList.add('filled'); pass.classList.add('filled');
      await wait(700);
      if (my !== run || !(await press(my))) return;
      title.textContent = 'Welcome back, Alex';
    }
    async function create() {
      const my = reset('new');
      email.classList.add('focus');
      for (const ch of 'alex@orbit.mail') { if (my !== run) return; email.textContent += ch; await wait(30); }
      email.classList.remove('focus'); pass.classList.add('focus');
      pw.textContent = generate(); gen.classList.add('show');
      await until($('[data-use]', el), 2200);
      if (my !== run) return;
      gen.classList.remove('show'); pass.classList.remove('focus');
      pass.textContent = '•'.repeat(20); pass.classList.add('filled');
      await wait(600);
      if (my !== run || !(await press(my))) return;
      await wait(400);
      if (my !== run) return;
      save.classList.add('show');
      await until($('[data-save-btn]', el), 2000);
      if (my !== run) return;
      save.classList.add('done'); saveT.textContent = 'Saved to your Keychain';
      await wait(1800);
      if (my === run) save.classList.remove('show');
    }
    $('[data-regen]', el).addEventListener('click', () => { pw.textContent = generate(); });
    $('[data-v="fill"]', el).addEventListener('click', fill);
    $('[data-v="new"]', el).addEventListener('click', create);
    return { start: fill };
  });

  demo('voice', el => {
    const talk = $('[data-talk]', el), talkT = $('[data-talk-t]', el), wave = $('[data-wave]', el), tr = $('[data-tr]', el);
    const msgs = $('[data-vmsgs]', el), halo = $('[data-halo]', el), state = $('[data-vstate]', el), liveBtn = $('[data-live]', el);
    const bars = Array.from({ length: 28 }, () => { const i = document.createElement('i'); wave.append(i); return i; });
    const SENTENCE = 'Hey Max, what does apogee actually mean?'.split(' ');
    let waveTimer = 0, wordTimer = 0, words = 0, holding = false, run = 0;

    function waveOn(on) {
      clearInterval(waveTimer);
      wave.classList.toggle('on', on);
      if (on && !reduce) waveTimer = setInterval(() => bars.forEach((b, i) => { b.style.transform = `scaleY(${(.12 + Math.random() * .88 * Math.sin((i + 2) / 31 * Math.PI)).toFixed(2)})`; }), 95);
      else bars.forEach(b => { b.style.transform = 'scaleY(.08)'; });
    }
    function say(who, text, cls) {
      $('.hint', msgs)?.remove();
      const p = document.createElement('p'); p.className = cls;
      p.innerHTML = (who ? `<span class="who">${who}</span>` : '') + esc(text);
      msgs.append(p);
      while (msgs.children.length > 3) msgs.firstElementChild.remove();
    }
    function begin() {
      if (holding) return;
      run++; holding = true; words = 0;
      talk.classList.add('held'); talkT.textContent = 'Listening';
      halo.classList.add('on'); state.textContent = 'Listening';
      tr.classList.remove('dim'); tr.textContent = '';
      waveOn(true);
      wordTimer = setInterval(() => {
        if (words < SENTENCE.length) { words++; tr.textContent = SENTENCE.slice(0, words).join(' '); }
      }, reduce ? 20 : 230);
    }
    async function end() {
      if (!holding) return;
      holding = false;
      clearInterval(wordTimer); waveOn(false);
      talk.classList.remove('held'); talkT.textContent = 'Hold to talk';
      const my = run;
      if (words < 3) {
        halo.classList.remove('on'); state.textContent = 'Ready';
        tr.classList.add('dim'); tr.textContent = 'Hold a little longer, then let go.';
        return;
      }
      const heard = SENTENCE.slice(0, words).join(' ');
      tr.textContent = '';
      say('', heard, 'u');
      state.textContent = 'Thinking';
      await wait(700);
      if (my !== run) return;
      state.textContent = 'Speaking'; waveOn(true);
      say('', 'It is the farthest point of an orbit from Earth. For the Moon that is about 405,500 km, and it is also where it moves slowest.', 'm');
      await wait(2600);
      if (my !== run) return;
      waveOn(false); halo.classList.remove('on'); state.textContent = 'Ready';
    }
    async function liveTalk() {
      holding = false; clearInterval(wordTimer);
      const my = ++run;
      msgs.innerHTML = ''; tr.textContent = ''; tr.classList.remove('dim');
      halo.classList.add('on'); state.textContent = 'Live';
      liveBtn.textContent = 'Live now';
      const lines = [
        ['You', 'Can you find a video about rocket nozzles?', 'u'],
        ['Max', 'Sure, searching YouTube for rocket nozzles now.', 'm'],
        ['You', 'Actually, make it shock diamonds.', 'u'],
        ['Max', 'Got it. Shock diamonds it is, opening the best one.', 'm']
      ];
      for (const [who, text, cls] of lines) {
        waveOn(true); tr.textContent = text;
        await wait(cls === 'u' ? 1500 : 1700);
        if (my !== run) return;
        say(who, text, cls); tr.textContent = '';
        waveOn(false);
        await wait(250);
        if (my !== run) return;
      }
      halo.classList.remove('on'); state.textContent = 'Ready';
      liveBtn.textContent = 'Play it again';
    }
    talk.addEventListener('pointerdown', e => { e.preventDefault(); talk.setPointerCapture?.(e.pointerId); begin(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => talk.addEventListener(t, end));
    talk.addEventListener('contextmenu', e => e.preventDefault());
    talk.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } });
    talk.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end(); } });
    liveBtn.addEventListener('click', liveTalk);
    return {
      start: async () => {
        await wait(500);
        if (holding) return;
        begin();
        await wait(SENTENCE.length * 230 + 300);
        end();
      },
      visible: v => { if (!v && holding) end(); }
    };
  });
})();
