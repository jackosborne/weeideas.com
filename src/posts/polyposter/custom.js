(() => {
  // Prevent double-init (hot reload / duplicate include)
  if (window.__POLYPOSTER_INITED) return;
  window.__POLYPOSTER_INITED = true;

  const canvas   = document.getElementById('cnv');
  const ctx      = canvas.getContext('2d');
  const wrap     = canvas.parentElement;      // .canvasWrap
  const stage    = document.querySelector('.stage');
  const shell    = document.querySelector('.shell');
  const saveBtn  = document.getElementById('save');
  const sidesEl  = document.getElementById('sides');
  const sidesLb  = document.getElementById('sidesLabel');
  const shapeEl  = document.getElementById('shapeMode'); // may be null
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Height/Width aspect: 11:8 ≈ 1.375 (same as your original)
  const ASPECT = 1.375;

  const labelForSides = n => (n===3 ? 'triangle' : n===4 ? 'square' : `${n}-gon`);

  function unitPolygonPath(sides){
    const s = Math.max(3, Math.min(512, sides|0));
    const p = new Path2D();
    const a0 = -Math.PI/2;
    for (let i=0;i<s;i++){
      const a = a0 + i*(2*Math.PI/s);
      const x = Math.cos(a), y = Math.sin(a);
      i ? p.lineTo(x,y) : p.moveTo(x,y);
    }
    p.closePath();
    return p;
  }

  function resize(){
    // Fit canvas inside wrap while keeping aspect (no observers; pure measure)
    const w = wrap.clientWidth || 0;
    const h = wrap.clientHeight || 0;

    // Same math as before
    const cssW = Math.min(w, h / ASPECT);
    const cssH = cssW * ASPECT;

    // If parent is temporarily 0 (e.g., layout mid-flow), skip this tick
    if (cssW <= 0 || cssH <= 0) return;

    canvas.width  = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
  }

  function drawShape(x, y, r, sides, mode, polyCache){
    if (mode === 'circle'){
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); return;
    }
    let poly = polyCache.get(sides);
    if (!poly){ poly = unitPolygonPath(sides); polyCache.set(sides, poly); }
    ctx.save(); ctx.translate(x, y); ctx.scale(r, r); ctx.fill(poly); ctx.restore();
  }

  function render(){
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return; // guard if resize skipped

    const cssW = W / dpr, cssH = H / dpr;

    // Clear in device pixels, then set DPR transform once
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,W,H);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = '#1A1A1A';

    const sides = +sidesEl.value || 12;
    const mode  = shapeEl ? shapeEl.value : 'polygon'; // default if dropdown removed

    sidesLb.textContent = (mode === 'circle') ? 'circle' : labelForSides(sides);
    sidesEl.disabled = shapeEl ? (mode === 'circle') : false;

    // Processing pattern
    let numberOfDots = 6;
    const padding = 20;
    let positionYOffset = 0;
    const w = cssW - padding * 2;

    const polyCache = new Map();

    for (let row = 0; row < 100; row++){
      const diameter  = w / numberOfDots;
      const stepX     = w / numberOfDots;
      const positionX = padding + stepX * 0.5;
      const positionY = cssH - diameter * 0.5 - positionYOffset - padding;

      const r = diameter * 0.5;
      for (let i = 0; i < numberOfDots; i++){
        const x = positionX + i * stepX;
        drawShape(x, positionY, r, sides, mode, polyCache);
      }
      positionYOffset += diameter;
      numberOfDots    += 3;
      if (positionY - diameter * 0.5 < padding) break;
    }
  }

  function savePNG(){
    const a = document.createElement('a');
    a.download = 'halftone.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  // ---- Single, debounced resize pipeline (no ResizeObserver loops) ----
  let rafPending = false;
  function resizeThenRender(){
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      resize();
      render();
    });
  }

  // Window resize & orientation change
  window.addEventListener('resize', resizeThenRender, { passive: true });
  window.addEventListener('orientationchange', resizeThenRender, { passive: true });

  // Optional: respond to breakpoint flips if you rely on CSS layout shifts
  const mq = window.matchMedia('(max-width: 900px)');
  if (mq.addEventListener) mq.addEventListener('change', resizeThenRender);

  // UI events (safe if dropdown is absent)
  const inputs = shapeEl ? [sidesEl, shapeEl] : [sidesEl];
  inputs.forEach(el => el.addEventListener('input', render));
  saveBtn.addEventListener('click', savePNG);

  // First paint
  resizeThenRender();
})();
