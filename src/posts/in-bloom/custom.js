import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';
import { createProjectControls } from '/_/js/lib/controls.js';
import { animate, downloadCanvas } from '/_/js/lib/artwork.js';
const lifecycle = createArtworkLifecycle();
const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');

const settings = {
  grid: 9,
  padding: 0,
  cornerRadius: 0,
  overlap: 0.5,

  // timing
  cycleDuration: 7000,

  // structure
  falloff: 1.6,
  misregister: 0.18,

  // bloom behaviour
  ringSoftness: 0.12,
  holdRatio: 0.16,
  fadeRatio: 0.22,

  // colour
  centerHue: 220,
  edgeHue: 290,
  thirdHueOffset: -18,
  secondHueOffset: 16,

  // saturation / lightness
  satCenter: 84,
  satEdge: 42,
  lightCenter: 56,
  lightEdge: 66,

  // alpha
  alphaCenter: 0.52,
  alphaEdge: 0.08,

  // subtle breathing
  pulseAmount: 0.04,
  driftAmount: 0.03,

  // gentle tile swell
  swell: 0.35,

  // very subtle underglow
  glowStrength: 0.08,
  glowRadius: 0.28,
};

const presets = {
  twilight: {
    cycleDuration: 7000,
    ringSoftness: 0.12,
    pulseAmount: 0.04,
    grid: 9,
    overlap: 0.5,
    cornerRadius: 0,
    centerHue: 220,
    edgeHue: 290,
    satCenter: 84,
    satEdge: 42,
    lightCenter: 56,
    lightEdge: 66,
    glowStrength: 0.08,
    driftAmount: 0.03,
    misregister: 0.18,
  },

  // cantaloupe: {
  //   cycleDuration: 6800,
  //   ringSoftness: 0.12,
  //   pulseAmount: 0.045,
  //   grid: 9,
  //   overlap: 0.5,
  //   cornerRadius: 0,
  //   centerHue: 28,
  //   edgeHue: 36,
  //   satCenter: 88,
  //   satEdge: 50,
  //   lightCenter: 58,
  //   lightEdge: 72,
  //   glowStrength: 0.09,
  //   driftAmount: 0.025,
  //   misregister: 0.16,
  // },

  peony: {
    cycleDuration: 6900,
    ringSoftness: 0.12,
    pulseAmount: 0.045,
    grid: 9,
    overlap: 0.5,
    cornerRadius: 0,
    centerHue: 8,
    edgeHue: 336,
    satCenter: 82,
    satEdge: 42,
    lightCenter: 56,
    lightEdge: 76,
    glowStrength: 0.08,
    driftAmount: 0.025,
    misregister: 0.16,
  },

  sun: {
    cycleDuration: 6500,
    ringSoftness: 0.11,
    pulseAmount: 0.05,
    grid: 9,
    overlap: 0.5,
    cornerRadius: 0,
    centerHue: 38,
    edgeHue: 54,
    satCenter: 92,
    satEdge: 60,
    lightCenter: 58,
    lightEdge: 76,
    glowStrength: 0.1,
    driftAmount: 0.02,
    misregister: 0.15,
  },

  sky: {
    cycleDuration: 7600,
    ringSoftness: 0.14,
    pulseAmount: 0.03,
    grid: 9,
    overlap: 0.45,
    cornerRadius: 0,
    centerHue: 200,
    edgeHue: 210,
    satCenter: 82,
    satEdge: 48,
    lightCenter: 56,
    lightEdge: 70,
    glowStrength: 0.07,
    driftAmount: 0.02,
    misregister: 0.15,
  },

  lilac: {
    cycleDuration: 7200,
    ringSoftness: 0.13,
    pulseAmount: 0.035,
    grid: 9,
    overlap: 0.5,
    cornerRadius: 0,
    centerHue: 275,
    edgeHue: 295,
    satCenter: 70,
    satEdge: 40,
    lightCenter: 60,
    lightEdge: 74,
    glowStrength: 0.07,
    driftAmount: 0.02,
    misregister: 0.14,
  },

  grass: {
    cycleDuration: 7200,
    ringSoftness: 0.13,
    pulseAmount: 0.03,
    grid: 9,
    overlap: 0.5,
    cornerRadius: 0,
    centerHue: 110,
    edgeHue: 88,
    satCenter: 82,
    satEdge: 46,
    lightCenter: 48,
    lightEdge: 76,
    glowStrength: 0.06,
    driftAmount: 0.02,
    misregister: 0.14,
  },
};

const defaults = structuredClone(settings);

let activePreset = 'twilight';

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpHue(a, b, t) {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function getCycleState(time) {
  const raw = (time % settings.cycleDuration) / settings.cycleDuration;

  let expand;
  let fade;

  if (raw < 1 - settings.fadeRatio) {
    expand = raw / (1 - settings.fadeRatio);
    fade = 1;
  } else {
    expand = 1;
    fade = 1 - (raw - (1 - settings.fadeRatio)) / settings.fadeRatio;
  }

  expand = smoothstep(0, 1, expand);
  fade = smoothstep(0, 1, fade);

  const bloom = expand * fade;
  const radius = expand * clamp(settings.spread ?? 0.7, 0.2, 1);

  return {
    raw,
    expand,
    fade,
    bloom,
    radius,
  };
}

function drawGlow(width, height, cycle) {
  const cx = width * 0.5;
  const cy = height * 0.5;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * settings.glowRadius);

  const glowAlpha = settings.glowStrength * cycle.bloom;

  gradient.addColorStop(0, `hsla(${settings.centerHue} 95% 60% / ${glowAlpha})`);
  gradient.addColorStop(0.4, `hsla(${settings.centerHue} 95% 60% / ${glowAlpha * 0.28})`);
  gradient.addColorStop(1, `hsla(${settings.centerHue} 95% 60% / 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawLayer(cycle, hueOffset, xOffset, yOffset, alphaScale, xBias, yBias) {
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;

  const size = Math.min(width, height);
  const inner = size - settings.padding * 2;
  const cell = inner / settings.grid;
  const half = (settings.grid - 1) / 2;

  // Small optical bias inspired by the prints
  const maxDist = Math.hypot(half * 1.1, half * 0.9);

  const startX = (width - inner) * 0.5;
  const startY = (height - inner) * 0.5;

  const cx = half + Math.sin(cycle.raw * Math.PI * 2 * 0.5) * settings.driftAmount + xBias;

  const cy = half + Math.cos(cycle.raw * Math.PI * 2 * 0.45) * settings.driftAmount + yBias;

  ctx.save();
  ctx.translate(xOffset, yOffset);

  for (let row = 0; row < settings.grid; row++) {
    for (let col = 0; col < settings.grid; col++) {
      const dx = (col - cx) * 1.1;
      const dy = (row - cy) * 0.9;
      const dist = Math.hypot(dx, dy) / maxDist;

      const radial = Math.pow(1 - clamp(dist, 0, 1), settings.falloff);

      const activationFront = cycle.radius;
      const activation =
        1 -
        smoothstep(
          activationFront - settings.ringSoftness,
          activationFront + settings.ringSoftness,
          dist,
        );

      const life = activation * cycle.fade;

      if (life <= 0.001) continue;

      const hue = lerpHue(settings.centerHue, settings.edgeHue, dist) + hueOffset;

      const hueDrift = Math.sin(col * 0.45 - row * 0.3 + cycle.raw * Math.PI * 2) * 3.5;

      const sat = lerp(settings.satCenter, settings.satEdge, dist);
      const light = lerp(settings.lightCenter, settings.lightEdge, dist);

      const alpha =
        lerp(settings.alphaCenter, settings.alphaEdge, dist) * radial * life * alphaScale;

      if (alpha <= 0.002) continue;

      const pulse = 1 + Math.sin(cycle.raw * Math.PI * 2 - dist * 6) * settings.pulseAmount;

      const swell = radial * cycle.bloom * settings.swell;

      const x = startX + settings.padding + col * cell - swell * 0.5;
      const y = startY + settings.padding + row * cell - swell * 0.5;
      const w = cell + settings.overlap + swell;
      const h = cell + settings.overlap + swell;

      ctx.fillStyle = `hsla(${hue + hueDrift} ${sat}% ${light * pulse}% / ${alpha})`;
      roundedRect(x, y, w, h, settings.cornerRadius);
      ctx.fill();
    }
  }

  ctx.restore();
}

function draw(time = 0) {
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;

  const cycle = getCycleState(time);

  ctx.clearRect(0, 0, width, height);

  drawGlow(width, height, cycle);

  drawLayer(cycle, 0, 0, 0, 1, 0, 0);

  drawLayer(
    cycle,
    settings.secondHueOffset,
    settings.misregister,
    -settings.misregister * 0.45,
    0.72,
    0.03,
    -0.02,
  );

  drawLayer(
    cycle,
    settings.thirdHueOffset,
    -settings.misregister * 0.38,
    settings.misregister * 0.28,
    0.54,
    -0.025,
    0.025,
  );
}

// Dialkit is an inline visitor-facing panel, scoped to this experiment.
const artboard = canvas.closest('.artboard');
const status = document.getElementById('project-status');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let exportPending = false;
let lastFrame = 0;

function renderCurrentFrame() {
  // A meaningful still composition for reduced motion, even at page load.
  draw(motionPreference.matches ? settings.cycleDuration * 0.55 : lastFrame);
}

function panelValues() {
  return {
    preset: activePreset,
    bloom: {
      speed: settings.cycleDuration / 1000,
      spread: settings.spread ?? 0.7,
      softness: settings.ringSoftness,
      pulse: settings.pulseAmount,
    },
    grid: {
      size: settings.grid,
      overlap: settings.overlap,
      roundness: settings.cornerRadius,
    },
  };
}

function applyPreset(name) {
  if (!presets[name]) return;
  activePreset = name;
  Object.assign(settings, defaults, presets[name], { spread: 0.7 });
  kit.setValues(panelValues());
}

function randomBetween(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomiseSettings() {
  settings.cycleDuration = randomBetween(4.5, 9.5, 1) * 1000;
  settings.spread = randomBetween(0.45, 1);
  settings.ringSoftness = randomBetween(0.06, 0.22);
  settings.pulseAmount = randomBetween(0.01, 0.08);
  settings.grid = Math.floor(Math.random() * 8) + 5;
  settings.overlap = randomBetween(0, 1.2);
  settings.cornerRadius = Math.floor(Math.random() * 17);
  kit.setValues(panelValues());
}

async function exportPNG() {
  if (exportPending) return;
  exportPending = true;
  kit.setActionBusy('export', true);
  status.textContent = 'Preparing PNG…';
  try {
    renderCurrentFrame();
    await downloadCanvas(canvas, 'in-bloom.png');
    status.textContent = 'PNG download started.';
  } catch (error) {
    status.textContent = `Could not export PNG: ${error.message}`;
  } finally {
    exportPending = false;
    kit.setActionBusy('export', false);
  }
}

const kit = createProjectControls(
  'In Bloom',
  {
    preset: {
      type: 'select',
      options: ['twilight', 'sky', 'lilac', 'peony', 'sun', 'grass'].map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
      default: 'twilight',
    },
    bloom: {
      speed: [7, 3, 12, 0.1],
      spread: [0.7, 0.2, 1, 0.01],
      softness: [0.12, 0.02, 0.4, 0.01],
      pulse: [0.04, 0, 0.12, 0.01],
    },
    grid: {
      size: [9, 3, 20, 1],
      overlap: [0.5, 0, 2, 0.05],
      roundness: [0, 0, 24, 1],
    },
    reset: { type: 'action', label: 'Reset' },
    randomise: { type: 'action', label: 'Randomise' },
    export: { type: 'action', label: 'Export PNG' },
  },
  {
    primaryAction: 'export',
    valueText: {
      'bloom.speed': (value) => `${value.toFixed(1)} seconds per cycle`,
      'bloom.spread': (value) => `${Math.round(value * 100)} percent`,
      'grid.size': (value) => `${value} by ${value} tiles`,
      'grid.overlap': (value) => `${value.toFixed(2)} pixels`,
      'grid.roundness': (value) => `${value} pixels`,
    },
    onAction(action) {
      if (action === 'reset') applyPreset(activePreset);
      if (action === 'randomise') randomiseSettings();
      if (action === 'export') void exportPNG();
    },
  },
);

resize();
const unsubscribe = kit.subscribe((values) => {
  if (values.preset !== activePreset) {
    applyPreset(values.preset);
    return;
  }
  Object.assign(settings, {
    cycleDuration: values.bloom.speed * 1000,
    spread: values.bloom.spread,
    ringSoftness: values.bloom.softness,
    pulseAmount: values.bloom.pulse,
    grid: values.grid.size,
    overlap: values.grid.overlap,
    cornerRadius: values.grid.roundness,
  });
  renderCurrentFrame();
});

function resizeArtwork() {
  resize();
  renderCurrentFrame();
}
lifecycle.listen(window, 'resize', resizeArtwork);
lifecycle.observeResize(canvas.closest('.artwork-frame'), resizeArtwork);
animate(
  (time) => {
    lastFrame = time;
    renderCurrentFrame();
  },
  artboard,
  { signal: lifecycle.signal },
);
lifecycle.cleanup(unsubscribe);
