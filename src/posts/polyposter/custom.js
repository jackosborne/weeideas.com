(() => {
  if (window.__POLYPOSTER_INITED) return;
  window.__POLYPOSTER_INITED = true;

  const canvas = document.getElementById("cnv");
  const ctx = canvas.getContext("2d");
  const wrap = canvas.parentElement;

  const saveBtn = document.getElementById("save");
  const sidesEl = document.getElementById("sides");
  const sidesLb = document.getElementById("sidesLabel");

  const shapeEl = document.getElementById("shapeMode");

  const exportWEl = document.getElementById("exportW");
  const exportHEl = document.getElementById("exportH");
  const lockEl = document.getElementById("lockAspect");

  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Canvas aspect: 11:8 ≈ 1.375 (portrait)
  const ASPECT = 1.375;

  const labelForSides = (n) =>
    n === 3 ? "triangle" : n === 4 ? "square" : `${n}-gon`;

  function unitPolygonPath(sides) {
    const s = Math.max(3, Math.min(512, sides | 0));
    const p = new Path2D();
    const a0 = -Math.PI / 2;
    for (let i = 0; i < s; i++) {
      const a = a0 + i * ((2 * Math.PI) / s);
      const x = Math.cos(a),
        y = Math.sin(a);
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    return p;
  }

  function drawShape(targetCtx, x, y, r, sides, mode, polyCache) {
    if (mode === "circle") {
      targetCtx.beginPath();
      targetCtx.arc(x, y, r, 0, Math.PI * 2);
      targetCtx.fill();
      return;
    }
    let poly = polyCache.get(sides);
    if (!poly) {
      poly = unitPolygonPath(sides);
      polyCache.set(sides, poly);
    }
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.scale(r, r);
    targetCtx.fill(poly);
    targetCtx.restore();
  }

  function resize() {
    const w = wrap.clientWidth || 0;
    const h = wrap.clientHeight || 0;

    const cssW = Math.min(w, h / ASPECT);
    const cssH = cssW * ASPECT;

    if (cssW <= 0 || cssH <= 0) return;

    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
  }

  function renderTo(targetCanvas, targetCtx, cssW, cssH, pixelRatio) {
    const W = Math.floor(cssW * pixelRatio);
    const H = Math.floor(cssH * pixelRatio);

    targetCanvas.width = Math.max(1, W);
    targetCanvas.height = Math.max(1, H);

    targetCtx.setTransform(1, 0, 0, 1, 0, 0);
    targetCtx.fillStyle = "#fff";
    targetCtx.fillRect(0, 0, W, H);

    targetCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    targetCtx.fillStyle = "#1A1A1A";

    const sides = +sidesEl.value || 12;
    const mode = shapeEl ? shapeEl.value : "polygon";

    sidesLb.textContent = mode === "circle" ? "circle" : labelForSides(sides);
    sidesEl.disabled = mode === "circle";

    // Pattern
    let numberOfDots = 6;
    const padding = 20;
    let positionYOffset = 0;
    const w = cssW - padding * 2;

    const polyCache = new Map();

    for (let row = 0; row < 100; row++) {
      const diameter = w / numberOfDots;
      const stepX = w / numberOfDots;
      const positionX = padding + stepX * 0.5;
      const positionY = cssH - diameter * 0.5 - positionYOffset - padding;

      const r = diameter * 0.5;
      for (let i = 0; i < numberOfDots; i++) {
        const x = positionX + i * stepX;
        drawShape(targetCtx, x, positionY, r, sides, mode, polyCache);
      }
      positionYOffset += diameter;
      numberOfDots += 3;

      if (positionY - diameter * 0.5 < padding) break;
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    if (!W || !H) return;
    const cssW = W / dpr,
      cssH = H / dpr;
    renderTo(canvas, ctx, cssW, cssH, dpr);
  }

  // ---- Export sizing (lock aspect like the photogradient panel pattern) ----
  function clampInt(v, min = 64, max = 8192) {
    const n = Math.round(Number(v) || 0);
    return Math.max(min, Math.min(max, n));
  }

  function syncExportFromW() {
    const w = clampInt(exportWEl.value);
    exportWEl.value = w;
    if (lockEl.checked) {
      exportHEl.value = Math.round(w * ASPECT);
    }
  }

  function syncExportFromH() {
    const h = clampInt(exportHEl.value);
    exportHEl.value = h;
    if (lockEl.checked) {
      exportWEl.value = Math.round(h / ASPECT);
    }
  }

  function savePNG() {
    // Use chosen export size (CSS pixels)
    const outW = clampInt(exportWEl.value);
    const outH = clampInt(exportHEl.value);

    // Render at 1:1 pixels for predictable output.
    const out = document.createElement("canvas");
    const outCtx = out.getContext("2d");

    renderTo(out, outCtx, outW, outH, 1);

    const a = document.createElement("a");
    a.download = `polyposter_${outW}x${outH}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  }

  // ---- Single debounced resize pipeline ----
  let rafPending = false;
  function resizeThenRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      resize();
      render();
    });
  }

  window.addEventListener("resize", resizeThenRender, { passive: true });
  window.addEventListener("orientationchange", resizeThenRender, {
    passive: true,
  });

  const mq = window.matchMedia("(max-width: 900px)");
  if (mq.addEventListener) mq.addEventListener("change", resizeThenRender);

  // UI events
  [sidesEl, shapeEl, exportWEl, exportHEl, lockEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      if (el === exportWEl) syncExportFromW();
      if (el === exportHEl) syncExportFromH();
      render();
    });
  });

  saveBtn.addEventListener("click", savePNG);

  // Init export defaults to match aspect
  syncExportFromW();

  // First paint
  resizeThenRender();
})();
