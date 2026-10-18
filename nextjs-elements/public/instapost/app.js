(() => {
  "use strict";

  // Output sizes, keyed by height:width. Instagram's working width is 1080px.
  const SIZES = {
    "1:1": [1080, 1080],
    "5:4": [1080, 1350],
    "16:9": [1080, 1920]
  };

  const STORAGE_KEY = "kno-instapost-v1";

  const DEFAULTS = {
    ratio: "5:4",
    layout: "side",
    layoutTouched: false,
    rounded: false,
    labelStyle: "none",
    labelBefore: "Before",
    labelAfter: "After",
    labelSize: 34,
    labelFont: "modern",
    labelColor: "",
    caption: "",
    placement: "between",
    captionFont: "serif",
    captionSize: 72,
    captionColor: "",
    handle: "",
    handleFont: "modern",
    handleSize: 30,
    handleColor: "",
    showHandle: true,
    style: "eggshell",
    customBg: "#e6d9c6",
    customTexture: "paper"
  };

  // Everything a preset remembers. The handle is saved separately and stays put.
  const PRESET_KEYS = Object.keys(DEFAULTS).filter((k) => k !== "handle" && k !== "layoutTouched");

  // Starting label size for each label style, applied when the style changes.
  const LABEL_SIZES = { vertical: 34, overlay: 64, corner: 30, below: 34, badge: 26 };

  const EMOJIS = ["✨", "🤍", "💕", "🌸", "💫", "🔥", "😍", "👏", "🖤", "🌿", "👇", "➡️"];

  const state = { ...DEFAULTS, ...loadPrefs() };
  const photos = [null, null];
  let textureImage = null;
  let textureVersion = 0;
  let step = 0;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d");
  const exportImg = $("#export-img");
  let cells = [];

  // ---------- Persistence ----------

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const prefs = {};
      for (const key of Object.keys(DEFAULTS)) {
        if (key in saved && typeof saved[key] === typeof DEFAULTS[key]) prefs[key] = saved[key];
      }
      if (!SIZES[prefs.ratio]) delete prefs.ratio;
      return prefs;
    } catch {
      return {};
    }
  }

  let saveTimer = 0;
  function savePrefs() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Private browsing or storage disabled: settings just won't persist.
      }
    }, 300);
  }

  // ---------- Texture painters ----------

  function mulberry32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fill(c, w, h, color) {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
  }

  function gradient(c, w, h, top, bottom) {
    const g = c.createLinearGradient(0, 0, w * 0.35, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  function glow(c, x, y, r, rgb, alpha) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function mottle(c, w, h, rng, rgb, alpha, count) {
    const m = Math.max(w, h);
    for (let i = 0; i < count; i++) {
      glow(c, rng() * w, rng() * h, m * (0.12 + rng() * 0.3), rgb, alpha * (0.5 + rng()));
    }
  }

  function vignette(c, w, h, alpha) {
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${alpha})`);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  function fibers(c, w, h, rng, rgbDark, rgbLight, density) {
    const s = w / 1080;
    const count = Math.round(density * (w * h) / (1080 * 1350));
    c.lineCap = "round";
    for (let i = 0; i < count; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const len = (4 + rng() * 16) * s;
      const a = rng() * Math.PI * 2;
      const dark = rng() < 0.6;
      c.strokeStyle = `rgba(${dark ? rgbDark : rgbLight},${0.05 + rng() * 0.08})`;
      c.lineWidth = (0.5 + rng() * 0.8) * s;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      c.stroke();
    }
  }

  function linen(c, w, h, rng, rgb, alpha) {
    const s = Math.max(1, w / 1080);
    for (let y = 0; y < h; y += 2 * s) {
      c.fillStyle = `rgba(${rgb},${alpha * rng()})`;
      c.fillRect(0, y, w, s);
    }
    for (let x = 0; x < w; x += 2 * s) {
      c.fillStyle = `rgba(${rgb},${alpha * rng()})`;
      c.fillRect(x, 0, s, h);
    }
  }

  function speckle(c, w, h, rng, rgb, alpha, density, maxR) {
    const s = w / 1080;
    const count = Math.round(density * (w * h) / (1080 * 1350));
    for (let i = 0; i < count; i++) {
      c.fillStyle = `rgba(${rgb},${alpha * (0.3 + rng() * 0.7)})`;
      c.beginPath();
      c.arc(rng() * w, rng() * h, (0.4 + rng() * maxR) * s, 0, Math.PI * 2);
      c.fill();
    }
  }

  function noise(c, w, h, rng, amount) {
    const data = c.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const n = (rng() - 0.5) * amount;
      px[i] += n;
      px[i + 1] += n;
      px[i + 2] += n;
    }
    c.putImageData(data, 0, 0);
  }

  function hexToRgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function isLight(hex) {
    const [r, g, b] = hexToRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
  }

  function mixHex(hex, toward, amount) {
    const a = hexToRgb(hex);
    const b = hexToRgb(toward);
    const m = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
    return `rgb(${m.join(",")})`;
  }

  function drawCoverImage(c, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  const STYLES = {
    eggshell: {
      name: "Eggshell",
      text: "#3d352d",
      sub: "#6f655b",
      pill: "rgba(244,239,229,0.94)",
      placeholder: "rgba(120,100,80,0.08)",
      light: true,
      paint(c, w, h, rng) {
        fill(c, w, h, "#f2ece0");
        mottle(c, w, h, rng, "165,140,105", 0.035, 26);
        fibers(c, w, h, rng, "120,100,75", "255,255,250", 1400);
        noise(c, w, h, rng, 10);
      }
    },
    moody: {
      name: "Dark & moody",
      text: "#efe5d8",
      sub: "#b3a698",
      pill: "rgba(28,25,28,0.88)",
      placeholder: "rgba(255,255,255,0.06)",
      light: false,
      paint(c, w, h, rng) {
        gradient(c, w, h, "#2b262a", "#121013");
        glow(c, w * 0.15, h * 0.08, Math.max(w, h) * 0.6, "190,145,110", 0.13);
        mottle(c, w, h, rng, "0,0,0", 0.12, 14);
        vignette(c, w, h, 0.55);
        noise(c, w, h, rng, 18);
      }
    },
    spring: {
      name: "Spring",
      text: "#6b3644",
      sub: "#97697a",
      pill: "rgba(248,232,230,0.94)",
      placeholder: "rgba(160,80,100,0.08)",
      light: true,
      paint(c, w, h, rng) {
        gradient(c, w, h, "#f8e8e4", "#efd9e2");
        const m = Math.max(w, h);
        const tints = ["243,190,203", "232,214,240", "250,214,196", "214,232,214"];
        for (let i = 0; i < 12; i++) {
          const edge = rng() < 0.5 ? rng() * 0.18 : 0.82 + rng() * 0.18;
          const x = (i % 2 ? edge : rng()) * w;
          const y = (i % 2 ? rng() : edge) * h;
          glow(c, x, y, m * (0.08 + rng() * 0.14), tints[i % tints.length], 0.55);
        }
        noise(c, w, h, rng, 8);
      }
    },
    summer: {
      name: "Summer",
      text: "#7a3d1e",
      sub: "#a56a48",
      pill: "rgba(251,232,207,0.94)",
      placeholder: "rgba(170,100,50,0.08)",
      light: true,
      paint(c, w, h, rng) {
        gradient(c, w, h, "#fcebd0", "#f4c6a3");
        glow(c, w * 0.88, h * 0.06, Math.max(w, h) * 0.55, "255,247,220", 0.75);
        mottle(c, w, h, rng, "230,150,100", 0.05, 12);
        speckle(c, w, h, rng, "190,130,80", 0.12, 900, 1.2);
        noise(c, w, h, rng, 9);
      }
    },
    autumn: {
      name: "Autumn",
      text: "#f6e2c4",
      sub: "#ddb68f",
      pill: "rgba(84,40,24,0.9)",
      placeholder: "rgba(255,220,180,0.08)",
      light: false,
      paint(c, w, h, rng) {
        gradient(c, w, h, "#8d4b2c", "#4a2416");
        glow(c, w * 0.1, h * 0.05, Math.max(w, h) * 0.6, "235,160,85", 0.25);
        mottle(c, w, h, rng, "60,20,10", 0.12, 14);
        speckle(c, w, h, rng, "240,190,120", 0.18, 1200, 1.4);
        vignette(c, w, h, 0.35);
        noise(c, w, h, rng, 16);
      }
    },
    winter: {
      name: "Winter",
      text: "#2e3c4c",
      sub: "#617385",
      pill: "rgba(236,241,245,0.94)",
      placeholder: "rgba(60,90,120,0.08)",
      light: true,
      paint(c, w, h, rng) {
        gradient(c, w, h, "#eef2f5", "#cfdae4");
        mottle(c, w, h, rng, "255,255,255", 0.25, 16);
        speckle(c, w, h, rng, "255,255,255", 0.9, 1400, 2.4);
        speckle(c, w, h, rng, "120,145,170", 0.08, 800, 1);
        noise(c, w, h, rng, 7);
      }
    },
    custom: {
      name: "Your own",
      get text() { return isLight(state.customBg) ? "#2f2924" : "#f4ede3"; },
      get sub() { return isLight(state.customBg) ? "#5e554c" : "#cfc5b8"; },
      get pill() { return mixHex(state.customBg, isLight(state.customBg) ? "#ffffff" : "#000000", 0.15); },
      get placeholder() { return isLight(state.customBg) ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"; },
      get light() { return isLight(state.customBg); },
      paint(c, w, h, rng) {
        const bg = state.customBg;
        fill(c, w, h, bg);
        const dark = isLight(bg) ? "0,0,0" : "255,255,255";
        switch (state.customTexture) {
          case "paper":
            mottle(c, w, h, rng, dark, 0.03, 24);
            fibers(c, w, h, rng, dark, "255,255,255", 1400);
            noise(c, w, h, rng, 10);
            break;
          case "linen":
            linen(c, w, h, rng, dark, 0.07);
            noise(c, w, h, rng, 6);
            break;
          case "grain":
            noise(c, w, h, rng, 22);
            break;
          case "speckle":
            speckle(c, w, h, rng, dark, 0.22, 2600, 1.6);
            noise(c, w, h, rng, 6);
            break;
          case "image":
            if (textureImage) drawCoverImage(c, textureImage, 0, 0, w, h);
            break;
        }
      }
    }
  };

  const bgCache = new Map();
  function background(w, h) {
    const key = state.style === "custom"
      ? `custom|${w}x${h}|${state.customBg}|${state.customTexture}|${textureVersion}`
      : `${state.style}|${w}x${h}`;
    let bg = bgCache.get(key);
    if (!bg) {
      if (bgCache.size > 12) bgCache.clear();
      bg = document.createElement("canvas");
      bg.width = w;
      bg.height = h;
      STYLES[state.style].paint(bg.getContext("2d"), w, h, mulberry32(20261018));
      bgCache.set(key, bg);
    }
    return bg;
  }

  // ---------- Composition ----------

  const EMOJI_FONTS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';

  // One font list shared by the caption, the handle and the labels so they can match.
  // scale evens out how large each face looks at the same size.
  const FONTS = {
    serif: { name: "Elegant", family: '"Playfair Display"', weight: 500, scale: 1, fallback: "Georgia, serif" },
    classic: { name: "Classic", family: '"Cormorant Garamond"', weight: 600, scale: 1.14, fallback: "Georgia, serif" },
    sans: { name: "Clean", family: "Montserrat", weight: 600, scale: 0.94, fallback: "system-ui, sans-serif", spacing: 0.04 },
    modern: { name: "Modern", family: "Inter", weight: 500, scale: 1, fallback: "system-ui, sans-serif", spacing: 0.03 },
    bold: { name: "Bold", family: '"Bebas Neue"', weight: 400, scale: 1.22, fallback: "Impact, sans-serif", spacing: 0.05 },
    script: { name: "Script", family: '"Great Vibes"', weight: 400, scale: 1.3, fallback: "cursive", script: true },
    type: { name: "Typewriter", family: '"Courier Prime"', weight: 400, scale: 1, fallback: "ui-monospace, monospace" }
  };

  function fontOf(key) {
    return FONTS[key] || FONTS.serif;
  }

  function fontString(key, size, weight) {
    const f = fontOf(key);
    return `${weight || f.weight} ${Math.round(size * f.scale)}px ${f.family}, ${EMOJI_FONTS}, ${f.fallback}`;
  }

  function wrapLines(c, text, maxWidth) {
    const lines = [];
    for (const para of text.split(/\r?\n/)) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) continue;
      let line = words[0];
      for (const word of words.slice(1)) {
        const test = `${line} ${word}`;
        if (c.measureText(test).width <= maxWidth) line = test;
        else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  function setSpacing(c, value) {
    if ("letterSpacing" in c) c.letterSpacing = value;
  }

  function handleText() {
    const h = state.handle.trim().replace(/^@+/, "");
    return state.showHandle && h ? `@${h}` : "";
  }

  // The color actually used for a color setting, falling back to the style's own.
  function colorFor(key) {
    if (state[key]) return state[key];
    const st = STYLES[state.style];
    if (key === "captionColor") return st.text;
    if (key === "handleColor") return st.sub;
    if (key === "labelColor") {
      if (state.labelStyle === "overlay" || state.labelStyle === "corner") return "#ffffff";
      if (state.labelStyle === "badge") return "#2e2924";
      return st.text;
    }
    if (key === "customBg") return state.customBg;
    return st.text;
  }

  function labelText(index) {
    const text = (index ? state.labelAfter : state.labelBefore).trim();
    const caps = ["vertical", "corner", "badge"].includes(state.labelStyle) && !fontOf(state.labelFont).script;
    return caps ? text.toUpperCase() : text;
  }

  function labelSpacing() {
    if (fontOf(state.labelFont).script) return "0px";
    return ["vertical", "corner", "badge"].includes(state.labelStyle) ? "0.18em" : `${fontOf(state.labelFont).spacing || 0}em`;
  }

  // Photo offsets (ox, oy) run from -1 to 1 across the part of the photo that overflows its cell.
  function photoPlacement(photo, cell) {
    const img = photo.img;
    const scale = Math.max(cell.w / img.width, cell.h / img.height) * photo.zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const overX = dw - cell.w;
    const overY = dh - cell.h;
    return {
      x: cell.x - (overX / 2) * (1 + photo.ox),
      y: cell.y - (overY / 2) * (1 + photo.oy),
      dw,
      dh,
      overX,
      overY
    };
  }

  function render() {
    const [W, H] = SIZES[state.ratio];
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const st = STYLES[state.style];
    const c = ctx;
    c.save();
    c.drawImage(background(W, H), 0, 0);

    const P = Math.round(W * 0.055);
    const gap = Math.round(W * 0.022);
    const textGap = Math.round(W * 0.03);
    let top = P;
    let bottom = H - P;

    const handle = handleText();
    const hs = state.handleSize * fontOf(state.handleFont).scale;
    if (handle) bottom = H - P * 0.6 - hs * 2.2;

    const caption = state.caption.trim();
    const size = state.captionSize;
    c.font = fontString(state.captionFont, size);
    const lineH = size * (fontOf(state.captionFont).script ? 1.35 : 1.22);
    const sideBetween = state.layout === "side" && state.placement === "between";
    const lines = caption ? wrapLines(c, caption, (W - P * 2) * (sideBetween ? 0.7 : 1)) : [];
    const capH = lines.length * lineH;

    let capY = null;
    if (lines.length && state.placement === "above") {
      capY = top;
      top += capH + textGap;
    } else if (lines.length && state.placement === "below") {
      bottom -= capH + textGap;
      capY = bottom + textGap;
    }

    const area = { x: P, y: top, w: W - P * 2, h: bottom - top };
    cells = [];
    if (state.layout === "stack") {
      if (lines.length && state.placement === "between") {
        const cellH = (area.h - capH - textGap * 2) / 2;
        cells.push({ x: area.x, y: area.y, w: area.w, h: cellH });
        capY = area.y + cellH + textGap;
        cells.push({ x: area.x, y: capY + capH + textGap, w: area.w, h: cellH });
      } else {
        const cellH = (area.h - gap) / 2;
        cells.push({ x: area.x, y: area.y, w: area.w, h: cellH });
        cells.push({ x: area.x, y: area.y + cellH + gap, w: area.w, h: cellH });
      }
    } else {
      const cellW = (area.w - gap) / 2;
      cells.push({ x: area.x, y: area.y, w: cellW, h: area.h });
      cells.push({ x: area.x + cellW + gap, y: area.y, w: cellW, h: area.h });
    }

    // Labels that sit outside the photos take their room from the photo frames.
    const ls = state.labelSize * fontOf(state.labelFont).scale;
    if (state.labelStyle === "vertical") {
      const band = ls * 1.9;
      if (state.layout === "side") {
        cells[0].x += band;
        cells[0].w -= band;
        cells[1].w -= band;
      } else {
        cells.forEach((cell) => { cell.x += band; cell.w -= band * 2; });
      }
    } else if (state.labelStyle === "below") {
      cells.forEach((cell) => { cell.h -= ls * 1.9; });
    }

    const radius = state.rounded ? W * 0.028 : 0;
    cells.forEach((cell, i) => drawCell(c, cell, photos[i], i, st, radius, W));
    if (state.labelStyle === "vertical" || state.labelStyle === "below") {
      cells.forEach((cell, i) => drawOuterLabel(c, cell, i, ls));
    }

    if (lines.length) {
      c.font = fontString(state.captionFont, size);
      c.textAlign = "center";
      c.textBaseline = "middle";
      setSpacing(c, `${fontOf(state.captionFont).spacing || 0}em`);
      if (sideBetween) {
        const widest = Math.max(...lines.map((l) => c.measureText(l).width));
        const pw = Math.min(area.w * 0.9, widest + size * 1.3);
        const ph = capH + size * 0.55;
        const midY = cells[0].y + cells[0].h / 2;
        capY = midY - capH / 2;
        c.save();
        c.shadowColor = "rgba(0,0,0,0.18)";
        c.shadowBlur = W * 0.02;
        c.shadowOffsetY = W * 0.004;
        c.fillStyle = st.pill;
        roundRect(c, W / 2 - pw / 2, midY - ph / 2, pw, ph, Math.min(ph / 2, W * 0.05));
        c.fill();
        c.restore();
      }
      c.fillStyle = colorFor("captionColor");
      lines.forEach((line, i) => c.fillText(line, W / 2, capY + lineH * (i + 0.5)));
    }

    if (handle) {
      c.font = fontString(state.handleFont, state.handleSize);
      c.textAlign = "center";
      c.textBaseline = "middle";
      setSpacing(c, fontOf(state.handleFont).script ? "0px" : "0.06em");
      c.fillStyle = colorFor("handleColor");
      c.fillText(handle, W / 2, H - P * 0.6 - hs * 0.8);
    }
    setSpacing(c, "0px");
    c.restore();
  }

  function drawCell(c, cell, photo, index, st, radius, W) {
    c.save();
    if (photo && st.light) {
      c.save();
      c.shadowColor = "rgba(60,45,30,0.22)";
      c.shadowBlur = W * 0.022;
      c.shadowOffsetY = W * 0.006;
      c.fillStyle = "#fff";
      roundRect(c, cell.x, cell.y, cell.w, cell.h, radius);
      c.fill();
      c.restore();
    }
    roundRect(c, cell.x, cell.y, cell.w, cell.h, radius);
    c.clip();
    if (photo) {
      const p = photoPlacement(photo, cell);
      c.drawImage(photo.img, p.x, p.y, p.dw, p.dh);
    } else {
      c.fillStyle = st.placeholder;
      c.fillRect(cell.x, cell.y, cell.w, cell.h);
      if (!["overlay", "corner", "badge"].includes(state.labelStyle) || !labelText(index)) {
        c.fillStyle = st.sub;
        c.globalAlpha = 0.6;
        c.font = `500 ${Math.round(W * 0.032)}px Inter, system-ui, sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(index ? "After photo" : "Before photo", cell.x + cell.w / 2, cell.y + cell.h / 2);
        c.globalAlpha = 1;
      }
    }
    drawInnerLabel(c, cell, index, radius);
    c.restore();
  }

  // Labels drawn on top of the photo: overlay, corner and badge.
  function drawInnerLabel(c, cell, index, radius) {
    const text = labelText(index);
    if (!text || !["overlay", "corner", "badge"].includes(state.labelStyle)) return;
    const ls = state.labelSize * fontOf(state.labelFont).scale;
    c.save();
    c.font = fontString(state.labelFont, state.labelSize);
    setSpacing(c, labelSpacing());
    c.textBaseline = "middle";
    const color = colorFor("labelColor");

    if (state.labelStyle === "overlay") {
      const scrimH = Math.min(cell.h * 0.45, ls * 4);
      const g = c.createLinearGradient(0, cell.y + cell.h - scrimH, 0, cell.y + cell.h);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.5)");
      c.fillStyle = g;
      c.fillRect(cell.x, cell.y + cell.h - scrimH, cell.w, scrimH);
      c.textAlign = "center";
      c.shadowColor = "rgba(0,0,0,0.35)";
      c.shadowBlur = ls * 0.3;
      c.fillStyle = color;
      c.fillText(text, cell.x + cell.w / 2, cell.y + cell.h - ls * 0.95, cell.w * 0.92);
    } else if (state.labelStyle === "corner") {
      const inset = Math.max(ls * 0.9, radius * 0.6);
      c.textAlign = "left";
      c.shadowColor = "rgba(0,0,0,0.45)";
      c.shadowBlur = ls * 0.35;
      c.fillStyle = color;
      c.fillText(text, cell.x + inset, cell.y + inset + ls * 0.4);
    } else {
      const tw = c.measureText(text).width;
      const pad = ls * 0.8;
      const lw = tw + pad * 2;
      const lh = ls * 2;
      const inset = Math.max(radius * 0.4, ls * 0.8);
      const lx = cell.x + inset;
      const ly = cell.y + cell.h - lh - inset;
      c.fillStyle = "rgba(255,255,255,0.88)";
      roundRect(c, lx, ly, lw, lh, lh / 2);
      c.fill();
      c.fillStyle = color;
      c.textAlign = "left";
      c.fillText(text, lx + pad, ly + lh / 2 + ls * 0.05);
    }
    c.restore();
  }

  // Labels drawn beside the photos: vertical (outer edge) and underneath.
  function drawOuterLabel(c, cell, index, ls) {
    const text = labelText(index);
    if (!text) return;
    c.save();
    c.font = fontString(state.labelFont, state.labelSize);
    setSpacing(c, labelSpacing());
    c.fillStyle = colorFor("labelColor");
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (state.labelStyle === "vertical") {
      const band = ls * 1.9;
      // Before reads up the left edge, After reads down the right edge.
      const onLeft = index === 0;
      const x = onLeft ? cell.x - band / 2 : cell.x + cell.w + band / 2;
      c.translate(x, cell.y + cell.h / 2);
      c.rotate(onLeft ? -Math.PI / 2 : Math.PI / 2);
      c.fillText(text, 0, 0, cell.h * 0.95);
    } else {
      c.fillText(text, cell.x + cell.w / 2, cell.y + cell.h + ls * 1.0, cell.w);
    }
    c.restore();
  }

  let frame = 0;
  function update() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
      canvas.classList.toggle("draggable", photos.some(Boolean));
      if (step === 4) scheduleExport();
    });
  }

  // ---------- Photos ----------

  async function loadImageFile(file, maxSide) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const out = document.createElement("canvas");
      out.width = Math.round(img.naturalWidth * scale);
      out.height = Math.round(img.naturalHeight * scale);
      out.getContext("2d").drawImage(img, 0, 0, out.width, out.height);
      return out;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function thumbnail(img) {
    const t = document.createElement("canvas");
    const scale = 320 / Math.max(img.width, img.height);
    t.width = Math.round(img.width * scale);
    t.height = Math.round(img.height * scale);
    t.getContext("2d").drawImage(img, 0, 0, t.width, t.height);
    return t.toDataURL("image/jpeg", 0.8);
  }

  function syncPhotoPickers() {
    photos.forEach((photo, i) => {
      const thumb = $(`[data-thumb="${i}"]`);
      thumb.style.backgroundImage = photo ? `url(${photo.thumb})` : "";
      thumb.closest(".drop").classList.toggle("has-photo", Boolean(photo));
      const zoom = $(`[data-zoom="${i}"]`);
      zoom.disabled = !photo;
      zoom.value = photo ? photo.zoom : 1;
    });
  }

  $$("[data-file]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      const i = Number(input.dataset.file);
      try {
        const img = await loadImageFile(file, 2400);
        photos[i] = { img, thumb: thumbnail(img), zoom: 1, ox: 0, oy: 0 };
        syncPhotoPickers();
        update();
      } catch {
        toast("Couldn't open that photo. Try a JPEG or PNG.");
      }
    });
  });

  $$("[data-zoom]").forEach((input) => {
    input.addEventListener("input", () => {
      const photo = photos[Number(input.dataset.zoom)];
      if (!photo) return;
      photo.zoom = Number(input.value);
      update();
    });
  });

  $("#swap").addEventListener("click", () => {
    photos.reverse();
    syncPhotoPickers();
    update();
  });

  // Drag a photo inside its frame to reposition it.
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (picking) {
      e.preventDefault();
      pickColorAt(canvasPoint(e));
      return;
    }
    const pt = canvasPoint(e);
    const index = cells.findIndex((c) => pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h);
    if (index < 0 || !photos[index]) return;
    drag = { index, x: pt.x, y: pt.y };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const pt = canvasPoint(e);
    const photo = photos[drag.index];
    const p = photoPlacement(photo, cells[drag.index]);
    if (p.overX > 0.5) photo.ox = clamp(photo.ox - (pt.x - drag.x) / (p.overX / 2), -1, 1);
    if (p.overY > 0.5) photo.oy = clamp(photo.oy - (pt.y - drag.y) / (p.overY / 2), -1, 1);
    drag.x = pt.x;
    drag.y = pt.y;
    update();
  });

  const endDrag = () => { drag = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  // ---------- Controls ----------

  // Font buttons, each shown in its own face.
  $$("[data-fonts]").forEach((seg) => {
    Object.entries(FONTS).forEach(([key, f]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.value = key;
      b.textContent = f.name;
      b.style.fontFamily = `${f.family}, ${f.fallback}`;
      b.style.fontWeight = f.weight;
      if (f.script) b.style.fontSize = "19px";
      seg.appendChild(b);
    });
  });

  function setState(key, value) {
    state[key] = value;
    if (key === "labelStyle" && LABEL_SIZES[value]) state.labelSize = LABEL_SIZES[value];
    if (key === "customBg" || key === "customTexture") paintSwatches();
    if (key === "ratio" && !state.layoutTouched) state.layout = value === "16:9" ? "stack" : "side";
    if (key === "layout") state.layoutTouched = true;
    savePrefs();
    syncControls();
    update();
  }

  function syncControls() {
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      if (el.classList.contains("seg")) {
        $$("button", el).forEach((b) => b.classList.toggle("on", b.dataset.value === state[key]));
      } else if (el.type === "checkbox") {
        el.checked = state[key];
      } else if (document.activeElement !== el) {
        el.value = state[key];
      }
    });
    $$(".swatch").forEach((s) => s.classList.toggle("on", s.dataset.style === state.style));
    $("#custom-panel").hidden = state.style !== "custom";
    $("#texture-upload").hidden = state.customTexture !== "image";
    $("#label-options").hidden = state.labelStyle === "none";
    $$("[data-color]").forEach((b) => {
      const key = b.dataset.color;
      $("i", b).style.background = colorFor(key);
      $("em", b).textContent = state[key] ? state[key].toUpperCase() : "Auto";
    });
  }

  $$("[data-bind]").forEach((el) => {
    const key = el.dataset.bind;
    if (el.classList.contains("seg")) {
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) setState(key, b.dataset.value);
      });
    } else if (el.type === "checkbox") {
      el.addEventListener("change", () => setState(key, el.checked));
    } else if (el.type === "range") {
      el.addEventListener("input", () => setState(key, Number(el.value)));
    } else {
      el.addEventListener("input", () => setState(key, el.value));
    }
  });

  const captionInput = $("#caption");
  captionInput.value = state.caption;
  captionInput.addEventListener("input", () => setState("caption", captionInput.value));

  const emojiBar = $("#emoji-bar");
  EMOJIS.forEach((emoji) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = emoji;
    b.setAttribute("aria-label", `Add ${emoji}`);
    b.addEventListener("click", () => {
      const start = captionInput.selectionStart ?? captionInput.value.length;
      const end = captionInput.selectionEnd ?? start;
      const v = captionInput.value;
      captionInput.value = v.slice(0, start) + emoji + v.slice(end);
      captionInput.setSelectionRange(start + emoji.length, start + emoji.length);
      setState("caption", captionInput.value);
    });
    emojiBar.appendChild(b);
  });

  const handleInput = $("#handle");
  handleInput.value = state.handle;
  handleInput.addEventListener("input", () => {
    const clean = handleInput.value.replace(/^@+/, "").replace(/\s+/g, "");
    if (clean !== handleInput.value) handleInput.value = clean;
    setState("handle", clean);
  });

  // Style swatches
  const stylesEl = $("#styles");
  function paintSwatch(key, cv) {
    const prev = state.style;
    state.style = key;
    const c = cv.getContext("2d");
    STYLES[key].paint(c, cv.width, cv.height, mulberry32(7));
    c.fillStyle = STYLES[key].text;
    c.font = `500 ${cv.width * 0.3}px "Playfair Display", Georgia, serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(key === "custom" ? "+" : "Aa", cv.width / 2, cv.height / 2);
    state.style = prev;
  }

  Object.entries(STYLES).forEach(([key, style]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.style = key;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 160;
    b.append(cv, style.name);
    b.addEventListener("click", () => setState("style", key));
    stylesEl.appendChild(b);
  });

  function paintSwatches() {
    $$(".swatch").forEach((b) => paintSwatch(b.dataset.style, $("canvas", b)));
  }

  $("#texture-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      textureImage = await loadImageFile(file, 2000);
      textureVersion++;
      $("#texture-label").textContent = "Texture added. Tap to change it";
      update();
    } catch {
      toast("Couldn't open that texture photo.");
    }
  });

  $("#match-font").addEventListener("click", () => setState("handleFont", state.captionFont));

  // ---------- Color picker ----------

  const SUGGESTED_TEXT = ["#2e2924", "#5e554c", "#ffffff", "#f4ede3", "#c9a36a", "#b76e79", "#d8a7b1", "#8c4a2f", "#7d8b6a", "#2f3d4d", "#6b3644", "#000000"];
  const SUGGESTED_BG = ["#f2ece0", "#e6d9c6", "#f3dcd8", "#efe3ea", "#dfe5d5", "#dde6ee", "#c9b29b", "#6f5646", "#4a2c2a", "#2a2629", "#243241", "#1f2b22"];
  const COLOR_TITLES = { captionColor: "Text color", handleColor: "Handle color", labelColor: "Label color", customBg: "Background color" };
  const RECENT_KEY = "kno-instapost-recent-colors";

  const sheet = $("#color-sheet");
  const sv = $("#sv");
  const svCanvas = $("#sv-canvas");
  const svDot = $("#sv-dot");
  const hueInput = $("#hue");
  const hexInput = $("#hex");
  let pickerKey = null;
  let hsv = { h: 0, s: 0, v: 0 };
  let picking = false;

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  }

  function hsvToHex({ h, s, v }) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255);
  }

  function hexToHsv(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }

  function toHex(color) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    const m = String(color).match(/\d+/g);
    return m ? rgbToHex(+m[0], +m[1], +m[2]) : "#000000";
  }

  function loadRecent() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(list) ? list.filter((c) => /^#[0-9a-f]{6}$/i.test(c)) : [];
    } catch {
      return [];
    }
  }

  function rememberColor(hex) {
    const list = [hex, ...loadRecent().filter((c) => c !== hex)].slice(0, 12);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
      // Storage unavailable: recent colors just won't persist.
    }
  }

  function drawSv() {
    const c = svCanvas.getContext("2d");
    const { width: w, height: h } = svCanvas;
    c.fillStyle = hsvToHex({ h: hsv.h, s: 1, v: 1 });
    c.fillRect(0, 0, w, h);
    const white = c.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, "#fff");
    white.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = white;
    c.fillRect(0, 0, w, h);
    const black = c.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, "rgba(0,0,0,0)");
    black.addColorStop(1, "#000");
    c.fillStyle = black;
    c.fillRect(0, 0, w, h);
  }

  function syncPicker() {
    const hex = hsvToHex(hsv);
    drawSv();
    svDot.style.left = `${hsv.s * 100}%`;
    svDot.style.top = `${(1 - hsv.v) * 100}%`;
    svDot.style.background = hex;
    hueInput.value = Math.round(hsv.h);
    if (document.activeElement !== hexInput) hexInput.value = hex.toUpperCase();
    $("#color-now").style.background = hex;
    $$("#suggested button, #recent button").forEach((b) => b.classList.toggle("on", b.dataset.hex === hex));
  }

  function swatchButtons(container, colors) {
    container.innerHTML = "";
    colors.forEach((hex) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.hex = hex;
      b.style.background = hex;
      b.setAttribute("aria-label", hex);
      b.addEventListener("click", () => applyPicked(hex));
      container.appendChild(b);
    });
  }

  function applyPicked(hex, keepHsv) {
    if (!keepHsv) hsv = hexToHsv(hex);
    setState(pickerKey, hex);
    syncPicker();
  }

  function openPicker(key) {
    pickerKey = key;
    hsv = hexToHsv(toHex(colorFor(key)));
    $("#color-title").textContent = COLOR_TITLES[key];
    const st = STYLES[state.style];
    const styleColors = key === "customBg" ? [] : [toHex(st.text), toHex(st.sub)];
    const base = key === "customBg" ? SUGGESTED_BG : SUGGESTED_TEXT;
    swatchButtons($("#suggested"), [...new Set([...styleColors, ...base])]);
    const recent = loadRecent();
    $("#recent-block").hidden = !recent.length;
    swatchButtons($("#recent"), recent);
    $("#color-auto").hidden = key === "customBg";
    sheet.hidden = false;
    syncPicker();
  }

  function closePicker() {
    if (pickerKey && state[pickerKey]) rememberColor(state[pickerKey]);
    sheet.hidden = true;
    stopPicking();
    pickerKey = null;
  }

  $$("[data-color]").forEach((b) => b.addEventListener("click", () => openPicker(b.dataset.color)));
  $("#color-done").addEventListener("click", closePicker);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closePicker(); });
  $("#color-auto").addEventListener("click", () => {
    setState(pickerKey, "");
    pickerKey = null;
    sheet.hidden = true;
  });

  hueInput.addEventListener("input", () => {
    hsv.h = Number(hueInput.value);
    applyPicked(hsvToHex(hsv), true);
  });

  hexInput.addEventListener("input", () => {
    let v = hexInput.value.trim();
    if (!v.startsWith("#")) v = `#${v}`;
    if (/^#[0-9a-f]{6}$/i.test(v)) applyPicked(v.toLowerCase());
  });

  let svDrag = false;
  function svMove(e) {
    const r = svCanvas.getBoundingClientRect();
    hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
    hsv.v = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
    applyPicked(hsvToHex(hsv), true);
  }
  sv.addEventListener("pointerdown", (e) => {
    svDrag = true;
    sv.setPointerCapture(e.pointerId);
    svMove(e);
  });
  sv.addEventListener("pointermove", (e) => { if (svDrag) svMove(e); });
  sv.addEventListener("pointerup", () => { svDrag = false; });
  sv.addEventListener("pointercancel", () => { svDrag = false; });

  // Pick from image: hide the sheet, take the next tap on the preview as a color sample.
  $("#pick-from-image").addEventListener("click", () => {
    picking = true;
    sheet.classList.add("picking");
    canvas.classList.add("picking");
    canvas.hidden = false;
    exportImg.hidden = true;
    toast("Tap anywhere on the preview to pick that color.");
  });

  function stopPicking() {
    if (!picking) return;
    picking = false;
    sheet.classList.remove("picking");
    canvas.classList.remove("picking");
    if (step === 4) scheduleExport(0);
  }

  function pickColorAt(pt) {
    const x = clamp(Math.round(pt.x) - 2, 0, canvas.width - 5);
    const y = clamp(Math.round(pt.y) - 2, 0, canvas.height - 5);
    const px = ctx.getImageData(x, y, 5, 5).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) {
      r += px[i];
      g += px[i + 1];
      b += px[i + 2];
    }
    const n = px.length / 4;
    stopPicking();
    applyPicked(rgbToHex(r / n, g / n, b / n));
  }

  // ---------- Presets ----------

  const PRESETS_KEY = "kno-instapost-presets-v1";
  const STYLE_DOTS = { eggshell: "#f2ece0", moody: "#1e1b1e", spring: "#f5e1e1", summer: "#f8d6b6", autumn: "#7a3f25", winter: "#dfe6ec" };

  function loadPresets() {
    try {
      const list = JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
      return Array.isArray(list) ? list.filter((p) => p && typeof p.name === "string" && p.settings) : [];
    } catch {
      return [];
    }
  }

  function storePresets(list) {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
      return true;
    } catch {
      toast("This browser won't let the page save presets.");
      return false;
    }
  }

  function renderPresets() {
    const list = loadPresets();
    $$("[data-presets-block]").forEach((block) => { block.hidden = !list.length; });
    $$("[data-presets]").forEach((container) => {
      container.innerHTML = "";
      list.forEach((preset) => {
        const chip = document.createElement("span");
        chip.className = "preset";
        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "apply";
        const dot = document.createElement("i");
        dot.style.background = preset.settings.style === "custom" ? preset.settings.customBg : STYLE_DOTS[preset.settings.style] || "#ddd";
        apply.append(dot, preset.name);
        apply.addEventListener("click", () => applyPreset(preset));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Delete preset ${preset.name}`);
        remove.addEventListener("click", () => {
          if (!confirm(`Delete the "${preset.name}" preset?`)) return;
          storePresets(loadPresets().filter((p) => p.name !== preset.name));
          renderPresets();
        });
        chip.append(apply, remove);
        container.appendChild(chip);
      });
    });
  }

  function applyPreset(preset) {
    for (const key of PRESET_KEYS) {
      if (key in preset.settings && typeof preset.settings[key] === typeof DEFAULTS[key]) state[key] = preset.settings[key];
    }
    state.layoutTouched = true;
    captionInput.value = state.caption;
    savePrefs();
    syncControls();
    paintSwatches();
    update();
    toast(`Applied "${preset.name}".`);
  }

  $$("[data-preset-save]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $("[data-preset-name]", button.parentElement);
      const name = input.value.trim();
      if (!name) {
        toast("Give your preset a name first.");
        input.focus();
        return;
      }
      const settings = {};
      PRESET_KEYS.forEach((key) => { settings[key] = state[key]; });
      const list = loadPresets().filter((p) => p.name !== name);
      list.unshift({ name, settings });
      if (!storePresets(list)) return;
      input.value = "";
      renderPresets();
      toast(state.customTexture === "image" && state.style === "custom"
        ? `Saved "${name}". Texture photos aren't saved with presets.`
        : `Saved "${name}". Find it in steps 1 and 4.`);
    });
  });

  // ---------- Steps ----------

  const backBtn = $("#back");
  const nextBtn = $("#next");

  function showStep(i) {
    step = clamp(i, 0, 4);
    $$("[data-panel]").forEach((p) => { p.hidden = Number(p.dataset.panel) !== step; });
    $$(".steps button").forEach((b) => {
      const n = Number(b.dataset.step);
      b.classList.toggle("active", n === step);
      b.classList.toggle("done", n < step);
    });
    backBtn.disabled = step === 0;
    nextBtn.textContent = step === 3 ? "Finish" : step === 4 ? "Start a new post" : "Next";
    $("#stage-hint").textContent = step === 4
      ? ""
      : photos.some(Boolean) ? "Drag a photo in the preview to reposition it." : "";
    if (step === 4) {
      scheduleExport(0);
    } else {
      exportImg.hidden = true;
      canvas.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$(".steps button").forEach((b) => b.addEventListener("click", () => showStep(Number(b.dataset.step))));
  backBtn.addEventListener("click", () => showStep(step - 1));
  nextBtn.addEventListener("click", () => {
    if (step === 0 && !photos.every(Boolean)) {
      toast("Add both a Before and an After photo first.");
      return;
    }
    if (step === 4) {
      photos[0] = photos[1] = null;
      syncPhotoPickers();
      update();
      showStep(0);
      return;
    }
    showStep(step + 1);
  });

  // ---------- Export ----------

  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let exportBlob = null;
  let exportUrl = "";
  let exportTimer = 0;

  function toBlob(type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), type, quality);
    });
  }

  function fileName() {
    const [w, h] = SIZES[state.ratio];
    return `before-after-${w}x${h}.jpg`;
  }

  // Build the JPEG ahead of time so Save and Share can run straight from the tap,
  // which iOS requires for the share sheet.
  function scheduleExport(delay = 250) {
    exportBlob = null;
    clearTimeout(exportTimer);
    exportTimer = setTimeout(prepareExport, delay);
  }

  async function prepareExport() {
    if (frame) return; // a render is pending; it reschedules us
    render();
    const blob = await toBlob("image/jpeg", 0.95);
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    exportUrl = URL.createObjectURL(blob);
    exportBlob = blob;
    if (step === 4) {
      exportImg.src = exportUrl;
      exportImg.hidden = false;
      canvas.hidden = true;
    }
  }

  function exportFile(blob) {
    return new File([blob], fileName(), { type: "image/jpeg" });
  }

  function canShareFiles(file) {
    try {
      return Boolean(navigator.canShare && navigator.canShare({ files: [file] }));
    } catch {
      return false;
    }
  }

  function download(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function share(file) {
    try {
      await navigator.share({ files: [file], title: "Before & After" });
      return true;
    } catch (err) {
      return err && err.name === "AbortError";
    }
  }

  $("#save-btn").addEventListener("click", async () => {
    const blob = exportBlob || await toBlob("image/jpeg", 0.95);
    const file = exportFile(blob);
    // iOS saves to Photos through the share sheet; everywhere else a download works.
    if (isIOS && canShareFiles(file)) {
      if (await share(file)) return;
    }
    download(blob);
    toast(isIOS ? "Saved to your Files. Press and hold the image to save it to Photos." : "Image saved.");
  });

  $("#copy-btn").addEventListener("click", async () => {
    if (!navigator.clipboard || !window.ClipboardItem) {
      toast("This browser can't copy images. Use Save instead.");
      return;
    }
    try {
      render();
      // Passing a promise keeps the copy inside the tap, which Safari requires.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toBlob("image/png") })]);
      toast("Copied. Paste it into Instagram or a message.");
    } catch {
      toast("Couldn't copy here. Use Save instead.");
    }
  });

  const shareBtn = $("#share-btn");
  shareBtn.hidden = !canShareFiles(new File([new Blob(["x"], { type: "image/jpeg" })], "test.jpg", { type: "image/jpeg" }));
  shareBtn.addEventListener("click", async () => {
    const blob = exportBlob || await toBlob("image/jpeg", 0.95);
    if (!(await share(exportFile(blob)))) toast("Sharing didn't work here. Use Save instead.");
  });

  // ---------- Toast ----------

  let toastTimer = 0;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // ---------- Start ----------

  syncControls();
  syncPhotoPickers();
  paintSwatches();
  renderPresets();
  showStep(0);
  update();

  if (document.fonts) {
    const faces = Object.values(FONTS).map((f) => `${f.weight} 40px ${f.family}`).concat("600 40px Inter");
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => {
      paintSwatches();
      update();
    });
  }
})();
