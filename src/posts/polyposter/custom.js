import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';
import { createProjectControls } from '/_/js/lib/controls.js';
import { downloadCanvas } from '/_/js/lib/artwork.js';
(() => {
  const lifecycle = createArtworkLifecycle();

  const canvas = document.getElementById('cnv');
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;

  const status = document.getElementById('project-status');
  let values = { shape: 'polygon', sides: 12, output: { width: 800, height: 1100, lock: true } };
  let exportPending = false;

  let dpr = Math.max(1, window.devicePixelRatio || 1);

  // Canvas aspect: 11:8 ≈ 1.375 (portrait)
  const ASPECT = 1.375;

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
    if (mode === 'circle') {
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
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth || 0;
    const h = wrap.clientHeight || 0;

    const cssW = Math.min(w, h / ASPECT);
    const cssH = cssW * ASPECT;

    if (cssW <= 0 || cssH <= 0) return;

    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
  }

  function renderTo(targetCanvas, targetCtx, cssW, cssH, pixelRatio) {
    const W = Math.floor(cssW * pixelRatio);
    const H = Math.floor(cssH * pixelRatio);

    targetCanvas.width = Math.max(1, W);
    targetCanvas.height = Math.max(1, H);

    targetCtx.setTransform(1, 0, 0, 1, 0, 0);
    targetCtx.fillStyle = '#fff';
    targetCtx.fillRect(0, 0, W, H);

    targetCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    targetCtx.fillStyle = '#1A1A1A';

    const sides = values.sides;
    const mode = values.shape;

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

  async function savePNG() {
    if (exportPending) return;
    exportPending = true;
    kit.setActionBusy('download', true);
    status.textContent = 'Preparing PNG…';
    const outW = clampInt(values.output.width);
    const outH = clampInt(values.output.height);
    try {
      const out = document.createElement('canvas');
      renderTo(out, out.getContext('2d'), outW, outH, 1);
      await downloadCanvas(out, `polyposter_${outW}x${outH}.png`);
      status.textContent = 'PNG download started.';
    } catch (error) {
      status.textContent = `Could not export PNG: ${error.message}`;
    } finally {
      exportPending = false;
      kit.setActionBusy('download', false);
    }
  }

  // ---- Single debounced resize pipeline ----
  let rafPending = false;
  function resizeThenRender() {
    if (rafPending) return;
    rafPending = true;
    lifecycle.frame(() => {
      rafPending = false;
      resize();
      render();
    });
  }

  lifecycle.listen(window, 'resize', resizeThenRender, { passive: true });
  lifecycle.observeResize(wrap, resizeThenRender);

  const kit = createProjectControls(
    'Polyposter',
    {
      shape: {
        type: 'select',
        options: [
          { value: 'polygon', label: 'Polygon' },
          { value: 'circle', label: 'Circle' },
        ],
        default: 'polygon',
      },
      sides: [12, 3, 64, 1],
      output: { width: [800, 64, 8192, 1], height: [1100, 64, 8192, 1], lock: true },
      download: { type: 'action', label: 'Download PNG' },
    },
    {
      primaryAction: 'download',
      valueText: {
        sides: (value) => `${value} sides`,
        'output.width': (value) => `${value} pixels`,
        'output.height': (value) => `${value} pixels`,
      },
      onAction: (action) => {
        if (action === 'download') void savePNG();
      },
    },
  );

  const unsubscribe = kit.subscribe((next) => {
    let width = clampInt(next.output.width);
    let height = clampInt(next.output.height);
    if (next.output.lock) {
      if (height !== values.output.height && width === values.output.width) {
        height = Math.max(88, height);
        width = Math.round(height / ASPECT);
      } else {
        width = Math.min(width, Math.floor(8192 / ASPECT));
        height = Math.round(width * ASPECT);
      }
    }
    values = { ...next, output: { ...next.output, width, height } };
    if (width !== next.output.width || height !== next.output.height)
      kit.setValues({ output: { width, height } });
    render();
  });
  lifecycle.cleanup(unsubscribe);
  resizeThenRender();
})();
