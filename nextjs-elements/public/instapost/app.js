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
    labels: false,
    rounded: false,
    caption: "",
    placement: "between",
    captionFont: "serif",
    captionSize: 72,
    handle: "",
    handleSize: 30,
    showHandle: true,
    style: "eggshell",
    customBg: "#e6d9c6",
    customText: "#3b322b",
    customTexture: "paper"
  };

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
      get text() { return state.customText; },
      get sub() { return state.customText; },
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

  function captionFont(size) {
    switch (state.captionFont) {
      case "sans":
        return `600 ${size}px Montserrat, ${EMOJI_FONTS}, system-ui, sans-serif`;
      case "script":
        return `${Math.round(size * 1.3)}px "Great Vibes", ${EMOJI_FONTS}, cursive`;
      default:
        return `500 ${size}px "Playfair Display", ${EMOJI_FONTS}, Georgia, serif`;
    }
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
    const hs = state.handleSize;
    if (handle) bottom = H - P * 0.6 - hs * 2.2;

    const caption = state.caption.trim();
    const size = state.captionSize;
    c.font = captionFont(size);
    const lineH = size * (state.captionFont === "script" ? 1.35 : 1.22);
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

    const radius = state.rounded ? W * 0.028 : 0;
    cells.forEach((cell, i) => drawCell(c, cell, photos[i], i, st, radius, W));

    if (lines.length) {
      c.font = captionFont(size);
      c.textAlign = "center";
      c.textBaseline = "middle";
      setSpacing(c, state.captionFont === "sans" ? "0.04em" : "0px");
      if (sideBetween) {
        const widest = Math.max(...lines.map((l) => c.measureText(l).width));
        const pw = Math.min(area.w * 0.9, widest + size * 1.3);
        const ph = capH + size * 0.55;
        const px = W / 2 - pw / 2;
        capY = area.y + area.h / 2 - capH / 2;
        c.save();
        c.shadowColor = "rgba(0,0,0,0.18)";
        c.shadowBlur = W * 0.02;
        c.shadowOffsetY = W * 0.004;
        c.fillStyle = st.pill;
        roundRect(c, px, area.y + area.h / 2 - ph / 2, pw, ph, Math.min(ph / 2, W * 0.05));
        c.fill();
        c.restore();
      }
      c.fillStyle = st.text;
      lines.forEach((line, i) => c.fillText(line, W / 2, capY + lineH * (i + 0.5)));
    }

    if (handle) {
      c.font = `500 ${hs}px Inter, ${EMOJI_FONTS}, system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      setSpacing(c, "0.06em");
      c.fillStyle = st.sub;
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
      c.fillStyle = st.sub;
      c.globalAlpha = 0.6;
      c.font = `500 ${Math.round(W * 0.032)}px Inter, system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(index ? "After" : "Before", cell.x + cell.w / 2, cell.y + cell.h / 2);
      c.globalAlpha = 1;
    }
    c.restore();

    if (state.labels && photo) {
      const fs = Math.round(W * 0.022);
      const label = index ? "AFTER" : "BEFORE";
      c.save();
      c.font = `600 ${fs}px Inter, system-ui, sans-serif`;
      setSpacing(c, "0.14em");
      const tw = c.measureText(label).width;
      const pad = fs * 0.8;
      const lw = tw + pad * 2;
      const lh = fs * 2;
      const lx = cell.x + Math.max(radius * 0.4, fs * 0.8);
      const ly = cell.y + cell.h - lh - Math.max(radius * 0.4, fs * 0.8);
      c.fillStyle = "rgba(255,255,255,0.88)";
      roundRect(c, lx, ly, lw, lh, lh / 2);
      c.fill();
      c.fillStyle = "#2e2924";
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(label, lx + pad, ly + lh / 2 + fs * 0.05);
      c.restore();
    }
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

  function setState(key, value) {
    state[key] = value;
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
  showStep(0);
  update();

  if (document.fonts) {
    const faces = ['500 40px "Playfair Display"', '600 40px Montserrat', '40px "Great Vibes"', '500 40px Inter', '600 40px Inter'];
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => {
      paintSwatches();
      update();
    });
  }
})();
