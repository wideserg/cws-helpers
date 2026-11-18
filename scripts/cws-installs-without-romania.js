/**
 * CWS DevConsole — Installs chart without Romania
 *
 * Paste into DevTools Console on:
 *   chrome.google.com/webstore/devconsole/.../analytics/installs
 *
 * Blue = without Romania, red = original total.
 * Toggle ON/OFF switches overlay vs native chart.
 *
 * Note: page uses Trusted Types — no innerHTML.
 */
(() => {
  const COUNTRY = 'Romania';
  const ROOT_ID = 'no-ro-installs-overlay';
  const STYLE_ID = 'no-ro-installs-style';
  const TOGGLE_ID = 'no-ro-toggle';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BLUE = '#1a73e8';
  const RED = '#d93025';

  function getAf(key) {
    for (const s of document.scripts) {
      const t = s.textContent || '';
      if (!t.includes(`key: '${key}'`)) continue;
      const m = t.match(/data:\s*(\[[\s\S]*\])\s*,\s*sideChannel/);
      if (!m) continue;
      return JSON.parse(m[1]);
    }
    return null;
  }

  function parseSeries() {
    const ds5 = getAf('ds:5');
    const ds4 = getAf('ds:4');
    if (!ds5?.[1] || !ds4?.[2]) {
      throw new Error('ds:5 / ds:4 not found — open Installs & uninstalls page');
    }

    const roByDate = Object.create(null);
    for (const [date, rows] of ds4[2]) {
      const hit = (rows || []).find((r) => r[0] === 'COUNTRY' && r[2] === COUNTRY);
      roByDate[date] = hit ? hit[1] || 0 : 0;
    }

    return ds5[1]
      .map((row) => {
        const date = row[0];
        const total = row[1]?.[0]?.[1]?.[0]?.[1] ?? 0;
        const romania = roByDate[date] || 0;
        return { date, total, romania, value: Math.max(0, total - romania) };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function fmtK(n) {
    if (n >= 1000) {
      const k = n / 1000;
      const s = k >= 10 ? k.toFixed(1) : k.toFixed(2).replace(/0$/, '');
      return `${s.replace(/\.0$/, '')}K`;
    }
    return String(n);
  }

  function fmtDay(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'className') node.className = v;
      else node.setAttribute(k, v);
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function svg(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (text != null) node.textContent = text;
    return node;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = el('style', { id: STYLE_ID });
    style.textContent = `
      #${ROOT_ID} {
        position: absolute;
        inset: 0;
        z-index: 5;
        background: #fff;
        font-family: "Google Sans", Roboto, Arial, sans-serif;
      }
      #${ROOT_ID} svg { width: 100%; height: 100%; display: block; }
      #${ROOT_ID} .no-ro-tip {
        position: absolute;
        pointer-events: none;
        background: #202124;
        color: #fff;
        font-size: 12px;
        line-height: 1.4;
        padding: 8px 10px;
        border-radius: 6px;
        transform: translate(-50%, -120%);
        white-space: nowrap;
        opacity: 0;
        transition: opacity .12s;
        z-index: 6;
      }
      #${ROOT_ID} .no-ro-tip.on { opacity: 1; }
      #${ROOT_ID} .no-ro-legend {
        position: absolute;
        top: 4px;
        left: 52px;
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: #5f6368;
        z-index: 6;
        pointer-events: none;
      }
      #${ROOT_ID} .no-ro-legend span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      #${ROOT_ID} .no-ro-legend i {
        display: inline-block;
        width: 14px;
        height: 3px;
        border-radius: 1px;
      }
      #${TOGGLE_ID} {
        margin-left: 10px;
        vertical-align: middle;
        font: 12px/1.2 "Google Sans", Roboto, Arial, sans-serif;
        padding: 4px 10px;
        border-radius: 14px;
        border: 1px solid #dadce0;
        background: #fff;
        color: #3c4043;
        cursor: pointer;
      }
      #${TOGGLE_ID}[data-on="1"] {
        background: #e8f0fe;
        border-color: #1a73e8;
        color: #174ea6;
      }
      #${TOGGLE_ID}[data-on="0"] {
        background: #f1f3f4;
        color: #5f6368;
      }
    `;
    document.head.appendChild(style);
  }

  function getTotalEl(section) {
    return (
      section.querySelector('.FhBhHd p') ||
      [...section.querySelectorAll('p')].find((p) => /K|\d/.test(p.textContent || ''))
    );
  }

  function setOverlayVisible(host, root, on) {
    root.style.display = on ? '' : 'none';
    for (const child of [...host.children]) {
      if (child === root) continue;
      child.style.visibility = on ? 'hidden' : '';
    }
  }

  function drawOverlay(host, points) {
    ensureStyle();
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const prev = document.getElementById(ROOT_ID);
    if (prev) prev.remove();

    const root = el('div', { id: ROOT_ID });
    host.appendChild(root);

    const legend = el('div', { className: 'no-ro-legend' });
    const legBlue = el('span');
    legBlue.append(el('i', { style: { background: BLUE } }), document.createTextNode(`without ${COUNTRY}`));
    const legRed = el('span');
    legRed.append(el('i', { style: { background: RED } }), document.createTextNode('original'));
    legend.append(legBlue, legRed);

    const tip = el('div', { className: 'no-ro-tip' });
    root.append(legend, tip);

    const W = host.clientWidth || 1195;
    const H = host.clientHeight || 267;
    const pad = { t: 28, r: 16, b: 36, l: 44 };
    const iw = Math.max(10, W - pad.l - pad.r);
    const ih = Math.max(10, H - pad.t - pad.b);

    const maxY = Math.max(1, ...points.map((p) => Math.max(p.value, p.total)));
    const niceMax = Math.ceil(maxY / 25) * 25 || 25;
    const xAt = (i) =>
      pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
    const yAt = (v) => pad.t + ih - (v / niceMax) * ih;

    const pathFor = (key) =>
      points
        .map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(p[key]).toFixed(1)}`)
        .join(' ');

    const blueLine = pathFor('value');
    const redLine = pathFor('total');
    const areaD =
      `${blueLine} L${xAt(points.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)}` +
      ` L${xAt(0).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;

    const svgRoot = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
    const defs = svg('defs');
    const grad = svg('linearGradient', { id: 'noRoFill', x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.append(
      svg('stop', { offset: '0%', 'stop-color': BLUE, 'stop-opacity': '0.22' }),
      svg('stop', { offset: '100%', 'stop-color': BLUE, 'stop-opacity': '0.02' })
    );
    defs.appendChild(grad);
    svgRoot.appendChild(defs);

    for (const v of [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t))) {
      const y = yAt(v);
      svgRoot.appendChild(
        svg('line', {
          x1: pad.l,
          y1: y,
          x2: W - pad.r,
          y2: y,
          stroke: '#dadce0',
          'stroke-width': 1,
        })
      );
      svgRoot.appendChild(
        svg(
          'text',
          {
            x: pad.l - 8,
            y: y + 4,
            'text-anchor': 'end',
            fill: '#5f6368',
            'font-size': 11,
          },
          String(v)
        )
      );
    }

    svgRoot.appendChild(svg('path', { d: areaD, fill: 'url(#noRoFill)' }));
    svgRoot.appendChild(
      svg('path', {
        d: redLine,
        fill: 'none',
        stroke: RED,
        'stroke-width': 2,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
        opacity: 0.9,
      })
    );
    svgRoot.appendChild(
      svg('path', {
        d: blueLine,
        fill: 'none',
        stroke: BLUE,
        'stroke-width': 2.5,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      })
    );

    const blueDots = [];
    const redDots = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const b = svg('circle', {
        cx: xAt(i),
        cy: yAt(p.value),
        r: 3.5,
        fill: BLUE,
        opacity: 0,
      });
      const r = svg('circle', {
        cx: xAt(i),
        cy: yAt(p.total),
        r: 3.5,
        fill: RED,
        opacity: 0,
      });
      svgRoot.append(r, b);
      redDots.push(r);
      blueDots.push(b);
    }

    const step = Math.max(1, Math.ceil(points.length / 8));
    const xLabelIdx = [];
    for (let i = 0; i < points.length; i += step) xLabelIdx.push(i);
    if (xLabelIdx[xLabelIdx.length - 1] !== points.length - 1) {
      xLabelIdx.push(points.length - 1);
    }
    for (const i of xLabelIdx) {
      svgRoot.appendChild(
        svg(
          'text',
          {
            x: xAt(i),
            y: H - 10,
            'text-anchor': 'middle',
            fill: '#5f6368',
            'font-size': 11,
          },
          fmtDay(points[i].date)
        )
      );
    }

    const hit = svg('rect', {
      class: 'hit',
      x: pad.l,
      y: pad.t,
      width: iw,
      height: ih,
      fill: 'transparent',
    });
    svgRoot.appendChild(hit);
    root.appendChild(svgRoot);

    function showAt(i, clientX) {
      const p = points[i];
      blueDots.forEach((c, idx) => {
        c.setAttribute('opacity', idx === i ? '1' : '0');
        c.setAttribute('r', idx === i ? '5' : '3.5');
      });
      redDots.forEach((c, idx) => {
        c.setAttribute('opacity', idx === i ? '1' : '0');
        c.setAttribute('r', idx === i ? '5' : '3.5');
      });
      tip.classList.add('on');
      tip.textContent = '';
      tip.append(
        el('b', {}, fmtDay(p.date)),
        document.createElement('br'),
        document.createTextNode(`without ${COUNTRY}: ${p.value}`),
        document.createElement('br'),
        document.createTextNode(`original: ${p.total} (−${p.romania} RO)`)
      );
      const rect = root.getBoundingClientRect();
      const tipY = Math.min(yAt(p.value), yAt(p.total)) * (rect.height / H);
      tip.style.left = `${clientX - rect.left}px`;
      tip.style.top = `${tipY}px`;
    }

    hit.addEventListener('mousemove', (e) => {
      const rect = hit.getBoundingClientRect();
      const t = (e.clientX - rect.left) / rect.width;
      const i = Math.min(
        points.length - 1,
        Math.max(0, Math.round(t * (points.length - 1)))
      );
      showAt(i, e.clientX);
    });
    hit.addEventListener('mouseleave', () => {
      tip.classList.remove('on');
      blueDots.forEach((c) => c.setAttribute('opacity', '0'));
      redDots.forEach((c) => c.setAttribute('opacity', '0'));
    });

    return root;
  }

  function ensureToggle(section, state) {
    let btn = document.getElementById(TOGGLE_ID);
    if (btn) btn.remove();

    const heading =
      section.querySelector('h3.wW4Ecc') ||
      section.querySelector('h3') ||
      section.firstElementChild;
    btn = el('button', { id: TOGGLE_ID, type: 'button' });
    heading.appendChild(btn);

    function sync() {
      btn.dataset.on = state.on ? '1' : '0';
      btn.textContent = state.on ? 'Overlay ON' : 'Overlay OFF';
      btn.title = state.on
        ? 'Click to show native chart'
        : 'Click to show without-Romania overlay';
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.on = !state.on;
      state.apply();
      sync();
    });

    sync();
    return btn;
  }

  const points = parseSeries();
  const sumWithout = points.reduce((s, p) => s + p.value, 0);
  const sumTotal = points.reduce((s, p) => s + p.total, 0);
  const roSum = points.reduce((s, p) => s + p.romania, 0);

  const section = document.querySelector('section[aria-label="Installs"]');
  if (!section) throw new Error('Installs section not found');

  const host =
    section.querySelector('.ke9kZe-QLEXN-haAclf') ||
    section.querySelector('.oPp9F') ||
    section.querySelector('.jIETA');
  if (!host) throw new Error('Installs chart host not found');

  const totalEl = getTotalEl(section);
  const originalTotalText = totalEl?.textContent?.trim() || fmtK(sumTotal);

  const root = drawOverlay(host, points);

  const state = {
    on: true,
    apply() {
      setOverlayVisible(host, root, state.on);
      if (totalEl) {
        if (state.on) {
          totalEl.textContent = fmtK(sumWithout);
          totalEl.title = `${sumWithout} without ${COUNTRY} / ${sumTotal} original`;
        } else {
          totalEl.textContent = originalTotalText;
          totalEl.title = '';
        }
      }
    },
  };

  ensureToggle(section, state);
  state.apply();

  console.table(
    points.map((p) => ({
      date: p.date,
      total: p.total,
      romania: p.romania,
      withoutRo: p.value,
    }))
  );
  console.info(
    `[no-RO] without=${sumWithout} original=${sumTotal} removed=${roSum} ${COUNTRY}`
  );

  return { points, sumWithout, sumTotal, roSum };
})();
