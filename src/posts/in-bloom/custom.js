const canvas = document.getElementById("art");
const ctx = canvas.getContext("2d");

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

const ui = {
  preset: document.getElementById("preset"),

  speed: document.getElementById("speed"),
  spread: document.getElementById("spread"),
  softness: document.getElementById("softness"),
  pulse: document.getElementById("pulse"),

  gridSize: document.getElementById("gridSize"),
  overlap: document.getElementById("overlap"),
  roundness: document.getElementById("roundness"),

  speedValue: document.getElementById("speed-value"),
  spreadValue: document.getElementById("spread-value"),
  softnessValue: document.getElementById("softness-value"),
  pulseValue: document.getElementById("pulse-value"),

  gridSizeValue: document.getElementById("gridSize-value"),
  overlapValue: document.getElementById("overlap-value"),
  roundnessValue: document.getElementById("roundness-value"),

  resetBtn: document.getElementById("reset"),
  randomBtn: document.getElementById("randomise"),
  exportBtn: document.getElementById("export"),
};

let activePreset = ui.preset?.value || "twilight";

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

  const gradient = ctx.createRadialGradient(
    cx,
    cy,
    0,
    cx,
    cy,
    width * settings.glowRadius,
  );

  const glowAlpha = settings.glowStrength * cycle.bloom;

  gradient.addColorStop(
    0,
    `hsla(${settings.centerHue} 95% 60% / ${glowAlpha})`,
  );
  gradient.addColorStop(
    0.4,
    `hsla(${settings.centerHue} 95% 60% / ${glowAlpha * 0.28})`,
  );
  gradient.addColorStop(1, `hsla(${settings.centerHue} 95% 60% / 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawLayer(
  cycle,
  hueOffset,
  xOffset,
  yOffset,
  alphaScale,
  xBias,
  yBias,
) {
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

  const cx =
    half +
    Math.sin(cycle.raw * Math.PI * 2 * 0.5) * settings.driftAmount +
    xBias;

  const cy =
    half +
    Math.cos(cycle.raw * Math.PI * 2 * 0.45) * settings.driftAmount +
    yBias;

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

      const hue =
        lerpHue(settings.centerHue, settings.edgeHue, dist) + hueOffset;

      const hueDrift =
        Math.sin(col * 0.45 - row * 0.3 + cycle.raw * Math.PI * 2) * 3.5;

      const sat = lerp(settings.satCenter, settings.satEdge, dist);
      const light = lerp(settings.lightCenter, settings.lightEdge, dist);

      const alpha =
        lerp(settings.alphaCenter, settings.alphaEdge, dist) *
        radial *
        life *
        alphaScale;

      if (alpha <= 0.002) continue;

      const pulse =
        1 + Math.sin(cycle.raw * Math.PI * 2 - dist * 6) * settings.pulseAmount;

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

  requestAnimationFrame(draw);
}

/* -------------------------
   UI helpers
------------------------- */

function formatValue(key, value) {
  switch (key) {
    case "speed":
      return `${Number(value).toFixed(1)}s`;
    case "spread":
    case "softness":
    case "pulse":
    case "overlap":
      return Number(value).toFixed(2);
    case "gridSize":
    case "roundness":
      return `${Math.round(Number(value))}`;
    default:
      return String(value);
  }
}

function updateValueLabels() {
  if (!ui.speedValue) return;

  ui.speedValue.textContent = formatValue("speed", ui.speed.value);
  ui.spreadValue.textContent = formatValue("spread", ui.spread.value);
  ui.softnessValue.textContent = formatValue("softness", ui.softness.value);
  ui.pulseValue.textContent = formatValue("pulse", ui.pulse.value);

  ui.gridSizeValue.textContent = formatValue("gridSize", ui.gridSize.value);
  ui.overlapValue.textContent = formatValue("overlap", ui.overlap.value);
  ui.roundnessValue.textContent = formatValue("roundness", ui.roundness.value);
}

function syncSettingsFromUI() {
  settings.cycleDuration = Number(ui.speed.value) * 1000;
  settings.spread = Number(ui.spread.value);
  settings.ringSoftness = Number(ui.softness.value);
  settings.pulseAmount = Number(ui.pulse.value);

  settings.grid = Number(ui.gridSize.value);
  settings.overlap = Number(ui.overlap.value);
  settings.cornerRadius = Number(ui.roundness.value);
}

function syncUIFromSettings() {
  ui.speed.value = (settings.cycleDuration / 1000).toFixed(1);
  ui.spread.value = settings.spread ?? 0.7;
  ui.softness.value = settings.ringSoftness;
  ui.pulse.value = settings.pulseAmount;

  ui.gridSize.value = settings.grid;
  ui.overlap.value = settings.overlap;
  ui.roundness.value = settings.cornerRadius;

  updateValueLabels();
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;

  activePreset = name;

  Object.assign(settings, defaults, preset);

  if (settings.spread === undefined) {
    settings.spread = 0.7;
  }

  syncUIFromSettings();
}

function randomBetween(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomiseSettings() {
  settings.cycleDuration = randomBetween(4.5, 9.5, 1) * 1000;
  settings.spread = randomBetween(0.45, 1, 2);
  settings.ringSoftness = randomBetween(0.06, 0.22, 2);
  settings.pulseAmount = randomBetween(0.01, 0.08, 2);

  settings.grid = randomInt(5, 12);
  settings.overlap = randomBetween(0, 1.2, 2);
  settings.cornerRadius = randomInt(0, 16);

  syncUIFromSettings();
}

function exportPNG() {
  const link = document.createElement("a");
  link.download = "in-bloom.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function bindUI() {
  if (!ui.preset) return;

  if (settings.spread === undefined) {
    settings.spread = 0.7;
  }

  ui.preset.addEventListener("change", (event) => {
    applyPreset(event.target.value);
  });

  [
    ui.speed,
    ui.spread,
    ui.softness,
    ui.pulse,
    ui.gridSize,
    ui.overlap,
    ui.roundness,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      syncSettingsFromUI();
      updateValueLabels();
    });
  });

  if (ui.resetBtn) {
    ui.resetBtn.addEventListener("click", () => {
      applyPreset(activePreset);
    });
  }

  if (ui.randomBtn) {
    ui.randomBtn.addEventListener("click", () => {
      randomiseSettings();
    });
  }

  if (ui.exportBtn) {
    ui.exportBtn.addEventListener("click", () => {
      exportPNG();
    });
  }

  applyPreset(activePreset);
}

window.addEventListener("resize", resize);

resize();
bindUI();
draw();
