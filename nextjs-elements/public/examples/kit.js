/* Shared pieces for the working examples (/examples/*): the made-up records every demo reads, a UPC-A encoder, and
   small helpers. Every company, product, person, order and address here is invented. Nothing is sent anywhere. */
(function () {
  'use strict';

  // ---- Made-up records ---------------------------------------------------------------------------------------------
  const BRANDS = [
    { name: 'Trailhead Pet Co', code: 'TH' }, { name: 'Northfield Pet Foods', code: 'NF' }, { name: 'Sunny Paws Kitchen', code: 'SP' },
    { name: 'Bramble & Bone', code: 'BB' }, { name: 'Copper Creek Provisions', code: 'CC' }, { name: 'Little Harbor Treats', code: 'LH' },
    { name: 'Meadowlark Mills', code: 'MM' }, { name: 'Oak & Ember Foods', code: 'OE' }, { name: 'Tidewater Snacks', code: 'TW' },
    { name: 'Pine Ridge Grains', code: 'PR' },
  ];
  // Sizes are width, height, gusset in inches and the fill weight printed on the bag.
  const SHAPES = [
    { format: 'Quad Seal Bag', style: 'Flat Bottom', gusset: 'Terminated Gusset', sizes: [[7, 11.5, 3.5, '12 oz'], [8.5, 14, 4, '2 lb'], [10, 16, 4.5, '4 lb']] },
    { format: 'Quad Seal Bag', style: 'Pinched Bottom', gusset: 'Non-Terminated Gusset', sizes: [[11.5, 18.25, 4.125, '10 lb'], [13, 22, 5, '15 lb'], [15.75, 26.5, 4.5, '25 lb']] },
    { format: 'Quad Seal Bag', style: 'Pinched Bottom', gusset: 'Terminated Gusset', sizes: [[8, 13, 4, '3.5 lb'], [9.5, 15, 4, '5 lb'], [12, 20, 4.5, '12 lb']] },
    { format: 'Stand-Up Pouch', style: 'Angle Plow', gusset: 'Bottom Gusset', sizes: [[5, 7.75, 2.5, '5 oz'], [6, 9, 3, '8 oz'], [7.25, 11, 3.5, '1 lb']] },
    { format: 'Stand-Up Pouch', style: 'K-Seal', gusset: 'Bottom Gusset', sizes: [[7, 10, 3.25, '10 oz'], [6, 8.5, 2.75, '6 oz'], [8, 12, 3.5, '1.5 lb']] },
  ];
  const RECIPES = ['Grain-Free Salmon Kibble', 'Turkey Training Bites', 'Pumpkin Berry Minis', 'Chicken Recipe Kibble', 'Freeze-Dried Beef Morsels',
    'Duck & Sweet Potato Bites', 'Lamb & Rice Dinner', 'Peanut Butter Crunch', 'Ancient Grain Granola', 'Sea Salt Veggie Crisps', 'Dark Roast Coffee', 'Honey Oat Clusters'];
  const LAYERS = ['MATTE / PET / FOIL / LLDPE', 'MATTE / PET / MET PET / LLDPE', 'GLOSS / PET / MET PET / LLDPE', 'SOFT TOUCH / PET / FOIL / LLDPE',
    'SOFT TOUCH / PET / MET PET / LLDPE', 'MATTE / PET / PET / LLDPE', 'GLOSS / PET / EVOH / LLDPE', 'MATTE / PE / EVOH / PE', 'GLOSS / KRAFT / MET PET / LLDPE',
    'SOFT TOUCH / PET / ALOX / LLDPE'];
  const SPOTS = ['PMS 186 C', 'PMS 2728 C', 'PMS 349 C', 'PMS 7406 C', 'PMS 485 C', 'PMS 2607 C', 'PMS 7421 C', 'PMS 7741 C'];
  const SPOT_HEX = { 'PMS 186 C': '#c8102e', 'PMS 2728 C': '#0047bb', 'PMS 349 C': '#046a38', 'PMS 7406 C': '#f1c400', 'PMS 485 C': '#da291c',
    'PMS 2607 C': '#500778', 'PMS 7421 C': '#651d32', 'PMS 7741 C': '#44883e', Cyan: '#00aeef', Magenta: '#ec008c', Yellow: '#fff200', Black: '#231f20', White: '#ffffff' };
  const PEOPLE = ['Alex Morgan', 'Jordan Lee', 'Priya Nair', 'Casey Tran', 'Riley Brooks'];
  const ZIPPERS = ['Small Zipper', 'No Zipper', 'Pocket Zipper', 'Small Zipper'];
  const PRINT = ['Roto', 'Flexo', 'Digital'];

  function checkDigit(eleven) {
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += Number(eleven[i]) * (i % 2 === 0 ? 3 : 1);
    return String((10 - sum % 10) % 10);
  }
  const weightLb = text => { const m = /([\d.]+)\s*(oz|lb)/.exec(text); return m ? (m[2] === 'oz' ? +m[1] / 16 : +m[1]) : 0; };
  const day = offset => new Date(Date.UTC(2026, 8, 20) - offset * 864e5).toISOString().slice(0, 10);

  const products = [];
  BRANDS.forEach((brand, b) => {
    for (let i = 0; i < 6; i++) {
      const shape = SHAPES[(b + i) % SHAPES.length], size = shape.sizes[(b + i * 2) % 3];
      const eleven = '0' + String(71020 + b * 37) + String(10100 + i * 113 + b * 7).padStart(5, '0');
      const upc = eleven + checkDigit(eleven);
      const n = b * 6 + i;
      const spots = [SPOTS[n % SPOTS.length], SPOTS[(n + 3) % SPOTS.length]].slice(0, 1 + (n % 2));
      products.push({
        id: 4100 + n, brand: brand.name, brandCode: brand.code, name: RECIPES[(b * 2 + i) % RECIPES.length], weight: size[3], weightLb: weightLb(size[3]),
        format: shape.format, style: shape.style, gusset: shape.gusset, w: size[0], h: size[1], g: size[2], layers: LAYERS[(b + i * 3) % LAYERS.length],
        upc, last5: upc.slice(6, 11), revision: 1 + (n % 4), filing: `${brand.code}-${String(310 + n * 7).padStart(4, '0')}`,
        print: PRINT[n % 3], zipper: ZIPPERS[n % ZIPPERS.length], designer: PEOPLE[n % PEOPLE.length],
        front: ['Cyan', 'Magenta', 'Yellow', 'Black', 'White', ...spots], back: ['Cyan', 'Magenta', 'Yellow', 'Black', 'White'].concat(n % 3 ? [spots[0]] : []),
        finish: /SOFT TOUCH/.test(LAYERS[(b + i * 3) % LAYERS.length]) ? 'Soft Touch Matte' : /MATTE/.test(LAYERS[(b + i * 3) % LAYERS.length]) ? 'Matte' : 'Gloss',
        madeTimes: (n * 7) % 5, lastMade: (n * 7) % 5 ? day((n * 23) % 420) : '',
      });
    }
  });

  // Orders: a customer PO with a few line items, each one a product with a press sheet to check in.
  const orders = [];
  for (let o = 0; o < 14; o++) {
    const po = `${144900 + o * 17} ${'ABCD'[o % 4]}`;
    const items = [0, 1, 2].slice(0, 1 + (o % 3)).map(k => products[(o * 5 + k * 11) % products.length]);
    orders.push({ po, date: day(o * 6), items: items.map((p, k) => ({
      product: p, qty: 25000 + ((o + k) * 7919) % 90000, color: k % 2 ? `Match ${p.front[5] || 'process'} to the signed drawdown from ${day(o * 6 + 40)}.` : `Approved press proof ${day(o * 6 + 21)}; hold ${p.front[5] || 'K'} density within ±0.05.`,
    })) });
  }

  // Known good fills: a real bag filled with test beads until it looked right, and how high the fill reached.
  const BEAD_DENSITY = 23.52; // lb per cubic foot, the test bead's own density
  const fills = products.filter((_, i) => i % 2 === 0).map((p, i) => {
    const basis = p.w * p.g * p.h / 1728;                        // ft³, width × gusset × height
    const factor = (p.format === 'Stand-Up Pouch' ? 0.52 : 0.63) + ((i * 37) % 9 - 4) * 0.012; // how much of that box a full bag holds
    const fillPct = 78 + (i * 13) % 15;
    const volume = basis * factor * fillPct / 100;
    return { product: p, beadLb: +(volume * BEAD_DENSITY).toFixed(2), fillPct, basis, factor, volume, density: p.weightLb / volume, by: PEOPLE[i % PEOPLE.length], date: day(i * 9 + 3) };
  });

  // ---- UPC-A ---------------------------------------------------------------------------------------------------------
  const LEFT = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  function encode(digits) {
    const right = p => p.replace(/[01]/g, bit => bit === '1' ? '0' : '1');
    let m = '101';
    for (let i = 0; i < 6; i++) m += LEFT[digits[i]];
    m += '01010';
    for (let i = 6; i < 12; i++) m += right(LEFT[digits[i]]);
    return m + '101';
  }
  // What was typed -> the 12 digits to encode, or the reason it can't be.
  function resolveUpc(text) {
    const typed = String(text).replace(/[\s\-.]/g, '');
    if (!typed) return { empty: true, error: '' };
    if (/\D/.test(typed)) return { error: 'Digits only, please.' };
    if (typed.length < 11) return { error: `${typed.length} digits so far. A UPC needs 11 (the check digit is added) or 12.` };
    if (typed.length > 12) return { error: `${typed.length} digits is too many. A UPC has 12.` };
    if (typed.length === 11) { const d = typed + checkDigit(typed); return { digits: d, note: `Added check digit ${d[11]}.` }; }
    const expected = checkDigit(typed.slice(0, 11));
    if (expected !== typed[11]) return { error: `The last digit should be ${expected}, not ${typed[11]}. A wrong check digit won't scan.` };
    return { digits: typed, note: 'Check digit is correct.' };
  }
  // The symbol as SVG elements, drawn at `x` (mm) per module, at (ox, oy). Units are whatever the caller's SVG uses.
  // Guard bars run 5 modules below the others; the human-readable digits sit under the short bars.
  function upcSvg(digits, { x = 0.33, height = 22.85, ox = 0, oy = 0, bwr = 0, digitsOn = true, color = '#000', font = 'Helvetica, Arial, sans-serif' } = {}) {
    const modules = encode(digits);
    const quiet = 9 * x, tall = i => i < 10 || (i >= 45 && i < 50) || i >= 85; // guards plus the first and last digit
    let out = '', i = 0;
    while (i < 95) {
      if (modules[i] !== '1') { i++; continue; }
      const start = i, long = tall(i);
      while (i < 95 && modules[i] === '1' && tall(i) === long) i++;
      const w = (i - start) * x - bwr;
      out += `<rect x="${(ox + quiet + start * x + bwr / 2).toFixed(4)}" y="${oy.toFixed(4)}" width="${w.toFixed(4)}" height="${(height + (long ? 5 * x : 0)).toFixed(4)}" fill="${color}"/>`;
    }
    if (digitsOn) {
      const size = 8 * x * 1.1, y = oy + height + 5 * x + size * 0.12, t = (cx, d, anchor = 'middle', s = size) =>
        `<text x="${cx.toFixed(3)}" y="${y.toFixed(3)}" font-family="${font}" font-size="${s.toFixed(3)}" text-anchor="${anchor}" fill="${color}">${d}</text>`;
      out += t(ox + quiet - x, digits[0], 'end', size * 0.8);
      out += t(ox + quiet + (3 + 21) * x, digits.slice(1, 6).split('').join(' '));
      out += t(ox + quiet + (50 + 21) * x, digits.slice(6, 11).split('').join(' '));
      out += t(ox + quiet + 96 * x, digits[11], 'start', size * 0.8);
    }
    return { svg: out, width: 113 * x, height: height + 5 * x + (digitsOn ? 8 * x * 0.3 : 0) };
  }

  // ---- Helpers -------------------------------------------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, d = 2) => Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
  const inches = n => `${+(+n).toFixed(3)}″`;
  function download(name, text, type = 'text/plain') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function setStatus(el, text, kind = '') { el.textContent = text; el.dataset.kind = kind; el.hidden = !text; }
  const findUpc = text => {
    const t = String(text).replace(/\D/g, '');
    return t.length >= 5 ? products.find(p => p.upc.endsWith(t) || p.last5 === t.slice(-5) && t.length === 5) : undefined;
  };

  // Segmented buttons: <div class="seg" data-name="unit"><button data-value="lb">…</button></div>
  function seg(el, onChange) {
    const buttons = $$('button', el);
    const set = value => { buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value))); el.dataset.value = value; };
    buttons.forEach(b => b.addEventListener('click', () => { set(b.dataset.value); onChange && onChange(b.dataset.value); }));
    set(el.dataset.value || buttons[0].dataset.value);
    return { get value() { return el.dataset.value; }, set };
  }


  // ---- Page chrome ---------------------------------------------------------------------------------------------------
  // <body data-name="Barcode maker" data-code="illustrator-barcode-panel"> gets the site's top bar and a footer.
  // CODE is the public repo with the original tools; leave it empty to hide the "See the original code" links.
  const CODE = 'https://github.com/questmullins/work-examples';
  function chrome() {
    const body = document.body, name = body.dataset.name;
    if (!name) return;
    const toggle = '<button class="scheme" type="button" data-scheme-toggle aria-label="Switch between light and dark mode" title="Light or dark"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor"/></svg></button>';
    const index = name === 'Working examples';
    body.insertAdjacentHTML('afterbegin', `<header class="bar"><a class="logo" href="/#experience--examples" title="Back to kno.plus">KNOPLUS</a>
      <span class="path">Experience / ${index ? 'Working examples' : '<a href="/examples/" style="text-decoration:none">Working examples</a> / ' + esc(name)}</span>
      <div class="bar-end"><span class="chip">Made-up data</span>${toggle}${index ? '' : '<a class="btn-2" href="/examples/">All examples</a>'}</div></header>`);
    const code = CODE && body.dataset.code ? ` · <a href="${CODE}/tree/HEAD/${body.dataset.code}">See the original code</a>` : CODE && index ? ` · <a href="${CODE}">See the original code</a>` : '';
    body.insertAdjacentHTML('beforeend', `<footer class="foot">Rebuilt from tools I made for a packaging manufacturer. Every company, product and order here is made up, and nothing you type leaves this page${code}. <a href="/#work-with-me">Want something like this?</a></footer>`);
    // /scheme.js listens for clicks on any [data-scheme-toggle], so the button needs nothing more.
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chrome); else chrome();

  window.Kit = { products, orders, fills, BEAD_DENSITY, SPOT_HEX, LAYERS, SHAPES, BRANDS, checkDigit, encode, resolveUpc, upcSvg,
    $, $$, esc, fmt, inches, download, setStatus, findUpc, seg, day };
})();
