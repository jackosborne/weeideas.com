import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';

const lifecycle = createArtworkLifecycle();
const card = document.querySelector('[data-project="shiny"] .card');
const stage = card.closest('.card-stage');
const frontFace = card.querySelector('.card-front');
const backFace = card.querySelector('.card-back');
const artboard = card.closest('[data-project]');
const hint = document.querySelector('[data-project="shiny"] .motion-hint');
const motionActions = document.querySelector('[data-project="shiny"] .motion-actions');
const motionToggle = motionActions.querySelector('.motion-toggle');
const motionRecalibrate = motionActions.querySelector('.motion-recalibrate');
const mobileActivation = matchMedia('(hover: none) and (pointer: coarse)').matches;
let unlocked = !mobileActivation;
let flipped = false;
let flipAngle = 0,
  flipFrame = 0;
let touch = null,
  suppressTouchClick = false,
  permissionGranted = false,
  motionSession = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const MAX_TILT = 10.8;
const FLIP_MS = 520;
const TILT_RESPONSE_MS = 65;
const FACET_SIZE = 512 / 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
let targetX = 0,
  targetY = 0,
  x = 0,
  y = 0,
  frame = 0,
  lastTime = 0;
let pointerActive = false,
  keyboardActive = false;
let enabled = false,
  permissionPending = false,
  listening = false,
  gotValues = false;
let baseBeta = null,
  baseGamma = null;
const allowSensors =
  matchMedia('(hover: none)').matches ||
  ('DeviceOrientationEvent' in window && window.innerWidth < 1024);

// The source texture repeats a ten-by-ten grid of four triangular faces.
// Keep this light pass in the same coordinates so highlights follow the embossing.
const facets = [];
const facetSurface = card.querySelector('.foil-facets');
for (let direction = 0; direction < 4; direction++) {
  for (let variation = 0; variation < 3; variation++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let geometry = '';
    for (let row = 0; row < 10; row++) {
      for (let column = 0; column < 10; column++) {
        if ((row * 7 + column * 13) % 3 !== variation) continue;
        const left = column * FACET_SIZE,
          top = row * FACET_SIZE;
        const corners = [
          [left, top],
          [left + FACET_SIZE, top],
          [left + FACET_SIZE, top + FACET_SIZE],
          [left, top + FACET_SIZE],
        ];
        const a = corners[direction],
          b = corners[(direction + 1) % 4];
        geometry += `M${a.join(',')}L${b.join(',')}L${left + FACET_SIZE / 2},${top + FACET_SIZE / 2}Z`;
      }
    }
    path.setAttribute('d', geometry);
    path.setAttribute('fill', 'transparent');
    facetSurface.append(path);
    facets.push({
      path,
      angle: (direction * Math.PI) / 2 - Math.PI / 2,
      roughness: 0.18 + variation * 0.035,
    });
  }
}

function lightFacets() {
  const lightX = y / MAX_TILT,
    lightY = -x / MAX_TILT;
  const strength = Math.min(1, Math.hypot(lightX, lightY));
  for (const { path, angle, roughness } of facets) {
    const alignment = lightX * Math.cos(angle) + lightY * Math.sin(angle);
    // A narrow response produces a catch of light, rather than a looping sparkle.
    const reflection = Math.exp(-Math.pow((alignment - 0.58) / roughness, 2)) * strength;
    const shade = Math.max(0, -alignment) * 0.13;
    const value = reflection * 0.46 - shade;
    path.setAttribute(
      'fill',
      `rgb(${value >= 0 ? '255 255 255' : '0 0 0'} / ${Math.abs(value).toFixed(3)})`,
    );
  }
}

function paint() {
  lightFacets();
  // A broad colour catch peaks around the reflection angle, with a quieter tail.
  // Keep this separate from tilt strength so extreme tilts do not flood the foil.
  const incidence = Math.abs((y * 0.8 - x * 0.6) / MAX_TILT);
  const colour =
    (0.18 + 0.82 * Math.exp(-Math.pow((incidence - 0.58) / 0.26, 2))) *
    Math.min(1, Math.hypot(x, y) / (MAX_TILT * 0.5));
  card.style.setProperty('--foil-colour', colour.toFixed(3));
  artboard.style.setProperty('--shadow-x', `${((-y / MAX_TILT) * 8).toFixed(2)}px`);
  artboard.style.setProperty('--shadow-y', `${(22 + (x / MAX_TILT) * 6).toFixed(2)}px`);
  artboard.style.setProperty(
    '--shadow-blur',
    `${(40 + (Math.hypot(x, y) / MAX_TILT) * 8).toFixed(2)}px`,
  );
  const px = 50 + (y / MAX_TILT) * 45;
  const py = 50 - (x / MAX_TILT) * 45;
  card.style.setProperty('--rx', `${x.toFixed(2)}deg`);
  card.style.setProperty('--ry', `${y.toFixed(2)}deg`);
  card.style.setProperty('--px', `${px.toFixed(2)}%`);
  card.style.setProperty('--py', `${py.toFixed(2)}%`);
  card.style.setProperty('--sheen-x', `${(100 - px).toFixed(2)}%`);
  card.style.setProperty('--sheen-y', `${(100 - py).toFixed(2)}%`);
  card.style.setProperty('--foil-strength', Math.min(1, Math.hypot(x, y) / MAX_TILT).toFixed(3));
}

function draw(time) {
  frame = 0;
  if (document.hidden || reducedMotion.matches) return;
  const blend = 1 - Math.exp(-Math.min(lastTime ? time - lastTime : 16.67, 64) / TILT_RESPONSE_MS);
  lastTime = time;
  x += (targetX - x) * blend;
  y += (targetY - y) * blend;
  const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.01;
  if (settled) {
    x = targetX;
    y = targetY;
  }
  paint();
  if (!settled) frame = lifecycle.frame(draw);
  else lastTime = 0;
}

function aim(rx, ry) {
  if (document.hidden || reducedMotion.matches) return;
  targetX = clamp(rx, -MAX_TILT, MAX_TILT);
  targetY = clamp(ry, -MAX_TILT, MAX_TILT);
  if (!frame) frame = lifecycle.frame(draw);
}

function reset(immediate = false) {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  targetX = targetY = 0;
  card.classList.remove('active');
  if (immediate || reducedMotion.matches || document.hidden) {
    x = y = 0;
    paint();
  } else frame = lifecycle.frame(draw);
}

function pointer(event) {
  if (!unlocked || event.pointerType === 'touch' || reducedMotion.matches || document.hidden)
    return;
  pointerActive = true;
  keyboardActive = false;
  card.classList.add('active');
  const rect = stage.getBoundingClientRect();
  aim(
    -(clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5) * MAX_TILT * 2,
    (clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5) * MAX_TILT * 2,
  );
}
// Horizontal touch drags belong to the sticker; vertical gestures remain native scrolling.
lifecycle.listen(stage, 'pointerdown', (event) => {
  suppressTouchClick = false;
  if (event.pointerType !== 'touch' || !event.isPrimary || reducedMotion.matches) return;
  touch = { id: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false };
});
lifecycle.listen(
  stage,
  'pointermove',
  (event) => {
    if (!touch || touch.id !== event.pointerId || reducedMotion.matches) return;
    const dx = event.clientX - touch.startX,
      dy = event.clientY - touch.startY;
    if (!touch.dragging) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        touch = null;
        return;
      }
      touch.dragging = true;
      suppressTouchClick = true;
      stage.setPointerCapture(event.pointerId);
    }
    if (!unlocked) return;
    pointerActive = true;
    keyboardActive = false;
    card.classList.add('active');
    const rect = stage.getBoundingClientRect();
    aim((-dy / (rect.height * 0.5)) * MAX_TILT, (dx / (rect.width * 0.5)) * MAX_TILT);
  },
  { passive: true },
);
function endTouch(event) {
  if (!touch || touch.id !== event.pointerId) return;
  const dragging = touch.dragging;
  touch = null;
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  pointerActive = false;
  if (dragging) recalibrate();
  return dragging;
}
lifecycle.listen(window, 'pointerup', endTouch);
lifecycle.listen(stage, 'lostpointercapture', endTouch);
lifecycle.listen(stage, 'pointerenter', pointer, { passive: true });
lifecycle.listen(stage, 'pointermove', pointer, { passive: true });
lifecycle.listen(stage, 'pointerleave', (event) => {
  if (event.pointerType === 'touch') return;
  pointerActive = false;
  reset();
});
lifecycle.listen(window, 'pointercancel', (event) => {
  const resetByDrag = endTouch(event);
  pointerActive = false;
  if (!resetByDrag) reset();
});
lifecycle.listen(card, 'blur', () => {
  keyboardActive = false;
  pointerActive = false;
  reset();
});
lifecycle.listen(card, 'keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!event.repeat) turnOrActivate();
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    keyboardActive = true;
    reset();
    return;
  }
  const directions = {
    ArrowUp: [-2, 0],
    ArrowDown: [2, 0],
    ArrowLeft: [0, -2],
    ArrowRight: [0, 2],
  };
  if (!directions[event.key]) return;
  event.preventDefault();
  if (!unlocked || reducedMotion.matches) return;
  keyboardActive = true;
  card.classList.add('active');
  const [dx, dy] = directions[event.key];
  aim(targetX + dx, targetY + dy);
});
lifecycle.listen(card, 'click', (event) => {
  if (suppressTouchClick && event.detail > 0) {
    suppressTouchClick = false;
    event.preventDefault();
    return;
  }
  turnOrActivate();
});
lifecycle.listen(motionToggle, 'click', () => {
  if (permissionPending) return;
  if (enabled) stopMotion();
  else activate();
});
function renderFlip(angle) {
  flipAngle = angle;
  card.style.setProperty('--flip-angle', `${angle.toFixed(3)}deg`);
  card.classList.toggle('is-showing-back', angle >= 90);
}
function finishFlip() {
  if (flipFrame) cancelAnimationFrame(flipFrame);
  flipFrame = 0;
  renderFlip(flipped ? 180 : 0);
}
function animateFlip() {
  if (flipFrame) cancelAnimationFrame(flipFrame);
  if (reducedMotion.matches || document.hidden) {
    finishFlip();
    return;
  }
  const from = flipAngle,
    to = flipped ? 180 : 0;
  const duration = Math.max(1, (Math.abs(to - from) / 180) * FLIP_MS);
  let start;
  function step(time) {
    start ??= time;
    const progress = Math.min(1, (time - start) / duration);
    const eased = progress * progress * (3 - 2 * progress);
    renderFlip(from + (to - from) * eased);
    flipFrame = progress < 1 ? lifecycle.frame(step) : 0;
  }
  flipFrame = lifecycle.frame(step);
}
function setSide(back, immediate = false) {
  flipped = back;
  card.classList.toggle('is-flipped', back);
  card.setAttribute('aria-pressed', String(back));
  card.setAttribute(
    'aria-description',
    back
      ? 'Back showing: France 98 Panini sticker number 33. Activate to show the front.'
      : 'Front showing: Scottish Football Association crest on reflective foil. Activate to show the back.',
  );
  frontFace.setAttribute('aria-hidden', String(back));
  backFace.setAttribute('aria-hidden', String(!back));
  if (immediate) finishFlip();
  else animateFlip();
}
function turnOrActivate() {
  if (permissionPending) return;
  if (!unlocked) {
    activate();
    return;
  }
  setSide(!flipped);
}
lifecycle.listen(motionRecalibrate, 'click', () => {
  recalibrate();
  hint.textContent = 'Motion recalibrated — tap to turn over';
});
function syncMotionControl() {
  artboard.classList.toggle('motion-locked', !unlocked);
  motionRecalibrate.hidden = !enabled;
  hint.classList.toggle('is-available', allowSensors && !reducedMotion.matches);
  motionActions.hidden =
    !allowSensors || !('DeviceOrientationEvent' in window) || reducedMotion.matches;
  motionToggle.textContent = enabled ? 'Turn off phone motion' : 'Enable phone motion';
  motionToggle.setAttribute('aria-disabled', String(permissionPending));
}
function stopMotion() {
  enabled = false;
  motionSession++;
  card.classList.remove('motion-enabled');
  unlocked = !mobileActivation;
  if (!unlocked) setSide(false, true);
  hint.textContent = 'Phone motion off — tap to enable motion';
  recalibrate();
  syncMotionControl();
}

async function activate() {
  if (!allowSensors || permissionPending || reducedMotion.matches || lifecycle.signal.aborted)
    return;
  keyboardActive = false;
  if (!('DeviceOrientationEvent' in window)) {
    hint.textContent = 'Motion not supported on this device';
    return;
  }
  permissionPending = true;
  syncMotionControl();
  try {
    if (!permissionGranted && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const state = await DeviceOrientationEvent.requestPermission();
      if (lifecycle.signal.aborted) return;
      if (state !== 'granted') {
        hint.textContent = 'Permission needed — tap again, then Allow';
        return;
      }
    }
    if (lifecycle.signal.aborted || reducedMotion.matches) return;
    permissionGranted = true;
    enabled = true;
    unlocked = true;
    const session = ++motionSession;
    gotValues = false;
    baseBeta = baseGamma = null;
    if (!listening) {
      lifecycle.listen(window, 'deviceorientation', orient, { passive: true });
      listening = true;
    }
    card.classList.add('motion-enabled');
    hint.textContent = 'Motion on — tap to turn over';
    lifecycle.timeout(() => {
      if (enabled && session === motionSession && !gotValues && !reducedMotion.matches)
        hint.textContent =
          'No motion data received. Tap to turn over, or drag sideways to catch the light.';
    }, 3000);
  } catch {
    if (!lifecycle.signal.aborted) hint.textContent = 'Couldn’t enable motion — tap again to retry';
  } finally {
    permissionPending = false;
    syncMotionControl();
  }
}

function orient(event) {
  if (!enabled || pointerActive || keyboardActive || document.hidden || reducedMotion.matches)
    return;
  if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
  if (!gotValues) hint.textContent = 'Motion on — tap to turn over';
  gotValues = true;
  if (baseBeta === null) {
    baseBeta = event.beta;
    baseGamma = event.gamma;
  }
  const beta = ((event.beta - baseBeta + 540) % 360) - 180;
  const gamma = event.gamma - baseGamma;
  const angle = ((screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI) / 180;
  const horizontal = gamma * Math.cos(angle) + beta * Math.sin(angle);
  const vertical = beta * Math.cos(angle) - gamma * Math.sin(angle);
  card.classList.add('active');
  aim((-vertical / 15) * MAX_TILT, (horizontal / 15) * MAX_TILT);
}
function recalibrate() {
  baseBeta = baseGamma = null;
  reset(true);
}
lifecycle.listen(window, 'orientationchange', recalibrate);
if (screen.orientation) lifecycle.listen(screen.orientation, 'change', recalibrate);
lifecycle.listen(document, 'visibilitychange', () => {
  if (document.hidden) {
    finishFlip();
    touch = null;
    pointerActive = keyboardActive = false;
    recalibrate();
  }
});
lifecycle.listen(reducedMotion, 'change', () => {
  finishFlip();
  touch = null;
  pointerActive = keyboardActive = false;
  if (reducedMotion.matches) stopMotion();
  recalibrate();
  syncMotionControl();
});
syncMotionControl();
