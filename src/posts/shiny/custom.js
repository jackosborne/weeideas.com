/* Shared thresholds for both pointer + sensor */
const MAX_TILT = 12, DAMPEN = 0.9, RESET_MS = 300;
  
/* Pointer logic: tilt + glare + moving sheen (unchanged) */
(function () {
  const cards = Array.from(document.querySelectorAll('.card'));
  const styleEl = document.querySelector('.hover');

  let raf = 0, pending = null;

  function setActive(card){
    cards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  }

  function update(payload){
    const { card, x, y } = payload;
    const r = card.getBoundingClientRect();
    const cx = Math.max(0, Math.min(x - r.left, r.width));
    const cy = Math.max(0, Math.min(y - r.top,  r.height));
    const px = cx / r.width, py = cy / r.height;

    const ry =  (px - .5) * (MAX_TILT * 2);
    const rx = -(py - .5) * (MAX_TILT * 2);

    card.style.setProperty('--ry', (ry * DAMPEN).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (rx * DAMPEN).toFixed(2) + 'deg');
    card.style.setProperty('--px', (px * 100).toFixed(2) + '%');
    card.style.setProperty('--py', (py * 100).toFixed(2) + '%');

    const lp = Math.abs(Math.floor((100 / r.width)  * cx) - 100);
    const tp = Math.abs(Math.floor((100 / r.height) * cy) - 100);
    styleEl.textContent = `.card.active::before{ background-position:${lp}% ${tp}%; }`;
  }

  function schedule(payload){
    pending = payload; if (raf) return;
    raf = requestAnimationFrame(() => { if (pending) update(pending); pending=null; raf=0; });
  }

  function reset(card){
    const prev = card.style.transition;
    card.style.transition = `transform ${RESET_MS}ms cubic-bezier(.2,.8,.2,1)`;
    card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
    card.style.setProperty('--px','50%');  card.style.setProperty('--py','50%');
    const styleEl = document.querySelector('.hover');
    styleEl.textContent = ''; card.classList.remove('active');
    setTimeout(() => { card.style.transition = prev; }, RESET_MS);
  }

  cards.forEach(card => {
    card.addEventListener('pointerenter', e => { setActive(card); schedule({card, x:e.clientX, y:e.clientY}); }, {passive:true});
    card.addEventListener('pointermove',  e => { if(!card.classList.contains('active')) setActive(card); schedule({card, x:e.clientX, y:e.clientY}); }, {passive:true});
    card.addEventListener('pointerleave', () => reset(card), {passive:true});
    card.addEventListener('blur', () => reset(card), {passive:true});
  });

  window.addEventListener('pointercancel', () => cards.forEach(reset), {passive:true});
})();

/* Motion-on-mobile: click enables sensor; later clicks recalibrate */
(() => {
  const card = document.querySelector('.card');
  const hint = document.querySelector('.motion-hint');
  const styleEl = document.querySelector('.hover');
  if (!card) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Allow tablets that misreport hover (iPad + trackpad)
  const isTouchish = matchMedia('(hover: none)').matches;
  const allowSensors = isTouchish || (('DeviceOrientationEvent' in window) && window.innerWidth < 1024);
  if (!allowSensors) {
    card.classList.remove('motion-pending');
    return;
  }

  const hasDO = 'DeviceOrientationEvent' in window;
  let enabled = false;
  let pointerActive = false;
  let baseBeta = null, baseGamma = null;
  let ryS = 0, rxS = 0;
  const SMOOTH = 0.15;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  card.addEventListener('pointerenter', () => { pointerActive = true; }, {passive:true});
  card.addEventListener('pointermove',  () => { pointerActive = true; }, {passive:true});
  card.addEventListener('pointerleave', () => { pointerActive = false; }, {passive:true});
  card.addEventListener('blur',         () => { pointerActive = false; }, {passive:true});
  window.addEventListener('pointercancel', () => { pointerActive = false; }, {passive:true});

  // Use CLICK for iOS user-gesture strictness
  card.addEventListener('click', onActivate);

  async function onActivate(){
    if (enabled) { baseBeta = null; baseGamma = null; return; }

    if (!hasDO) {
      card.classList.remove('motion-pending');
      if (hint) hint.textContent = 'Motion not supported on this device';
      return;
    }

    // iOS permission path
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state !== 'granted') {
          if (hint) hint.textContent = 'Permission needed — tap again, then Allow';
          return;
        }
      } catch (err) {
        if (hint) hint.textContent = `Couldn’t enable motion — tap again to retry (${err?.name || 'Error'})`;
        return;
      }
    }

    startSensor();
  }

  let gotValues = false;

  function startSensor(){
    try {
      baseBeta = null; baseGamma = null;
      window.addEventListener('deviceorientation', onOrient, { passive: true });

      enabled = true;
      card.classList.remove('motion-pending');
      card.classList.add('motion-enabled', 'active');
      if (hint) hint.textContent = 'Motion on — tap card to recalibrate';

      gotValues = false;
      setTimeout(() => {
        if (!gotValues && hint) {
          hint.textContent = 'No motion data. In Safari: aA → Website Settings → enable “Motion & Orientation Access”, then reload.';
        }
      }, 3000);
    } catch (err) {
      if (hint) hint.textContent = `Couldn’t start sensor (${err?.name || 'Error'}) — tap again to retry`;
    }
  }

  function onOrient(e){
    if (!enabled || pointerActive) return;
    if (e.beta == null || e.gamma == null) return;

    gotValues = true;

    let beta  = e.beta;
    let gamma = e.gamma;

    if (baseBeta === null || baseGamma === null){
      baseBeta = beta; baseGamma = gamma;
    }
    beta  -= baseBeta;
    gamma -= baseGamma;

    const targetRY = clamp( (gamma / 30) * (MAX_TILT * 2), -MAX_TILT, MAX_TILT ) * DAMPEN;
    const targetRX = clamp(-(beta  / 30) * (MAX_TILT * 2), -MAX_TILT, MAX_TILT ) * DAMPEN;

    ryS += (targetRY - ryS) * SMOOTH;
    rxS += (targetRX - rxS) * SMOOTH;

    card.style.setProperty('--ry', ryS.toFixed(2) + 'deg');
    card.style.setProperty('--rx', rxS.toFixed(2) + 'deg');

    const px = 50 + (ryS / MAX_TILT) * 25;
    const py = 50 + (rxS / MAX_TILT) * 25;
    card.style.setProperty('--px', px.toFixed(2) + '%');
    card.style.setProperty('--py', py.toFixed(2) + '%');

    styleEl.textContent =
      `.card.active::before{ background-position:${(100 - px).toFixed(2)}% ${(100 - py).toFixed(2)}%; }`;
  }
})();