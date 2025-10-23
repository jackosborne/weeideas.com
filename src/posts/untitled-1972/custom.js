// --- Config ---
const CFG = {
  color: '#111',
  stroke: 2,
  lineCap: 'butt',
  squareFrac: 0.92, // portion of wrapper used for the square field (since wrapper already clips)
  ease: 0.18,
  cols: 15,
  rows: 15,
  dashFrac: 0.56,

  // optional inner plate (off by default)
  showPlate: false,
  plateColor: '#e0e0e0',
  plateWidth: 1,

  // pointer influence
  interactive: true,
  innerRadius: 16,    // px @ 1x (converted by DPR)
  outerRadius: 480,   // px @ 1x
  falloffShape: 1.8,  // >1 = steeper falloff
  curlStrength: 1.0,
  bandEnabled: false,
  bandWidth: 95,      // px @ 1x
  bandStrength: 0.9,
  bandRightOnly: false
};

// Base field: perfectly vertical everywhere
const BASE_ANGLE = -Math.PI / 2;

(function(){
  const wrap = document.getElementById('wrap');
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha:false });

  const state = {
    dpr: 1, w: 0, h: 0,
    field: { x:0, y:0, size:0 },
    items: [],
    px: 0, py: 0, hasPointer: false
  };

  function sizeToWrapper() {
    // Size the canvas to the wrapper, not the window
    state.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const rect = wrap.getBoundingClientRect();
    canvas.width  = Math.floor(rect.width  * state.dpr);
    canvas.height = Math.floor(rect.height * state.dpr);
    state.w = canvas.width;
    state.h = canvas.height;

    // Compute square field within the wrapper
    const minSide = Math.min(state.w, state.h);
    const size = Math.floor(minSide * CFG.squareFrac);
    state.field.size = size;
    state.field.x = Math.floor((state.w - size) / 2);
    state.field.y = Math.floor((state.h - size) / 2);

    // Build grid
    const cols = CFG.cols, rows = CFG.rows;
    const gx = cols - 1, gy = rows - 1;
    const left = state.field.x, top = state.field.y;
    const cellW = size / gx, cellH = size / gy;
    const dashLen = Math.min(cellW, cellH) * CFG.dashFrac;

    state.items = [];
    for (let j=0; j<rows; j++) {
      for (let i=0; i<cols; i++) {
        const x = left + i * cellW;
        const y = top  + j * cellH;
        const u = i / gx;
        const v = j / gy;
        state.items.push({ x, y, u, v, segLen: dashLen, angle: BASE_ANGLE });
      }
    }
  }

  // Pointer
  function setPointer(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    state.px = (clientX - r.left) * state.dpr;
    state.py = (clientY - r.top) * state.dpr;
    state.hasPointer = true;
  }

  window.addEventListener('mousemove', e => setPointer(e.clientX, e.clientY), { passive:true });
  window.addEventListener('touchmove', e => { if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive:true });
  window.addEventListener('mouseleave', () => state.hasPointer = false);
  window.addEventListener('touchend', () => state.hasPointer = false);
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'i') CFG.interactive = !CFG.interactive;
    if (k === 'b') CFG.bandEnabled = !CFG.bandEnabled;
  });

  // Resize handling: respond to wrapper size changes
  const ro = 'ResizeObserver' in window ? new ResizeObserver(sizeToWrapper) : null;
  if (ro) ro.observe(wrap);
  else window.addEventListener('resize', sizeToWrapper);

  // Helpers
  const clamp01 = t => Math.min(1, Math.max(0, t));
  const shortestArc = (a, b) => ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const mixAngle = (a, b, t) => a + shortestArc(a, b) * t;

  function radialWeight(distPx) {
    const ir = CFG.innerRadius * state.dpr, or = CFG.outerRadius * state.dpr;
    if (distPx <= ir) return 1;
    if (distPx >= or) return 0;
    const t = 1 - (distPx - ir) / (or - ir);
    return Math.pow(t, CFG.falloffShape);
  }

  function frame() {
    // Clear
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, state.w, state.h);

    // Optional inner plate (border)
    if (CFG.showPlate) {
      ctx.strokeStyle = CFG.plateColor;
      ctx.lineWidth   = CFG.plateWidth * state.dpr;
      ctx.strokeRect(state.field.x, state.field.y, state.field.size, state.field.size);
    }

    // Draw dashes
    ctx.strokeStyle = CFG.color;
    ctx.lineWidth   = CFG.stroke * state.dpr;
    ctx.lineCap     = CFG.lineCap;

    for (const p of state.items) {
      let target = BASE_ANGLE;

      if (CFG.interactive && state.hasPointer) {
        const dx = p.x - state.px, dy = p.y - state.py;
        const d  = Math.hypot(dx, dy);

        // Curl (tangent around pointer)
        const tangent = Math.atan2(dy, dx) + Math.PI/2;
        const wCurl   = radialWeight(d) * CFG.curlStrength;
        target = mixAngle(target, tangent, clamp01(wCurl));

        // Horizontal band near pointer Y
        if (CFG.bandEnabled) {
          const sigma = CFG.bandWidth * state.dpr;
          const gy = Math.exp(-0.5 * (dy*dy) / (sigma*sigma));  // 0..1 by vertical distance
          const rightRamp = CFG.bandRightOnly ? clamp01( (p.x - state.px) / (state.field.size * 0.6) ) : 1.0;
          const wBand = gy * rightRamp * CFG.bandStrength * radialWeight(d*0.85);
          target = mixAngle(target, 0 /* horizontal */, clamp01(wBand));
        }
      }

      // Ease & draw
      p.angle = mixAngle(p.angle ?? BASE_ANGLE, target, CFG.ease);
      const half = p.segLen / 2;
      const c = Math.cos(p.angle), s = Math.sin(p.angle);
      ctx.beginPath();
      ctx.moveTo(p.x - c*half, p.y - s*half);
      ctx.lineTo(p.x + c*half, p.y + s*half);
      ctx.stroke();
    }

    requestAnimationFrame(frame);
  }

  sizeToWrapper();
  requestAnimationFrame(frame);
})();