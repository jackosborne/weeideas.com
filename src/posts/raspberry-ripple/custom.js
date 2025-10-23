import * as PIXI from "https://unpkg.com/pixi.js@7/dist/pixi.min.mjs";

/* ========= Gentle / Mesmerising Tunables ========= */
// Visual feel
const MAX_RIPPLES  = 5;       // fewer concurrent ripples
const AMPLITUDE    = 0.008;   // slightly lighter touches (0.007–0.009)
const WAVELENGTH   = 0.24;    // wider rings -> calmer, less busy
const SPEED        = 3.0;     // still reaches edges, a touch slower
const DECAY        = 0.52;    // slower fade so rings travel further

// Envelope shaping (seconds)
const ATTACK       = 0.18;    // soft fade-in so a drop “arrives” gently
const FADE_TAIL    = 1.20;    // longer release so nothing ends abruptly

// Keep the underlying image readable
const DISP_CLAMP   = 0.0045;  // soft cap on total displacement (lower = crisper)

// Autoplay: slow “breathing” cadence
const AUTOPLAY         = true;
const BASE_INTERVAL_MS = 1200; // average gap between drops
const MIN_INTERVAL_MS  = 500;  // never spawn faster than this (debounce)
const BREATH_RATE_HZ   = 0.06; // ~1 cycle every ~16–17s (very slow)
const BREATH_DEPTH     = 0.35; // 0..1 — how much the breathing modulates the interval

// Start with no seed for calm open (set to 1 if you want an initial ripple)
const SEED_RIPPLES     = 0;

const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const TAU = Math.PI * 2;
const K_GLOBAL = TAU / Math.max(WAVELENGTH, 1e-4);

/* ========= Boot per .ripple-box ========= */
document.querySelectorAll(".ripple-box").forEach(async (host) => {
  const app = new PIXI.Application({ resizeTo: host, backgroundAlpha: 0, antialias: true });
  host.appendChild(app.view);

  const tex = await PIXI.Assets.load(host.dataset.image);
  const sprite = new PIXI.Sprite(tex);
  sprite.anchor.set(0.5);
  app.stage.addChild(sprite);

  function fitCover() {
    const w = app.renderer.width, h = app.renderer.height;
    const s = Math.max(w / tex.width, h / tex.height);
    sprite.scale.set(s);
    sprite.position.set(w / 2, h / 2);
  }
  fitCover();
  app.renderer.on("resize", fitCover);

  if (reduceMotion) return;

  /* ========= Shader: attack+release envelope, falloff, clamp ========= */
  const frag = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    uniform float uTime, uAmp, uWave, uSpeed, uDecay, uDispClamp, uAttack, uFadeTail;
    uniform int   uCount;
    uniform vec2  uCenters[${MAX_RIPPLES}];
    uniform float uStarts[${MAX_RIPPLES}];
    uniform float uLifes[${MAX_RIPPLES}];

    void main() {
      vec2 uv = vTextureCoord;
      vec2 offset = vec2(0.0);
      float k = 6.2831853 / max(uWave, 1e-4);

      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        if (i >= uCount) break;

        vec2  c    = uCenters[i];
        float age  = max(uTime - uStarts[i], 0.0);
        float life = uLifes[i];

        vec2  d   = uv - c;
        float r   = length(d) + 1e-5;
        vec2  dir = d / r;

        float phase   = k * r - uSpeed * age;
        float spread  = inversesqrt(max(r, 0.002));
        float env     = exp(-uDecay * age);

        // Soft attack and long release to avoid hard stops/starts
        float attack  = smoothstep(0.0, uAttack, min(age, uAttack));
        float remain  = life - age;
        float release = smoothstep(0.0, uFadeTail, max(remain, 0.0));

        // Very subtle crest sharpening
        float wave = sin(phase) + 0.12 * sin(2.0 * phase);

        float disp = wave * env * attack * release * spread;
        offset += dir * disp * uAmp;
      }

      // Soft clamp to keep art legible
      float L = length(offset);
      if (L > uDispClamp) {
        offset *= (uDispClamp / max(L, 1e-6));
      }

      gl_FragColor = texture2D(uSampler, clamp(uv + offset, 0.0, 1.0));
    }
  `;

  const filter = new PIXI.Filter(undefined, frag, {
    uTime: 0,
    uAmp: AMPLITUDE,
    uWave: WAVELENGTH,
    uSpeed: SPEED,
    uDecay: DECAY,
    uDispClamp: DISP_CLAMP,
    uAttack: ATTACK,
    uFadeTail: FADE_TAIL,
    uCount: 0,
    uCenters: new Float32Array(MAX_RIPPLES * 2),
    uStarts:  new Float32Array(MAX_RIPPLES),
    uLifes:   new Float32Array(MAX_RIPPLES),
  });
  sprite.filters = [filter];

  /* ========= Ripple state ========= */
  const centers = [];
  const starts  = [];
  const lifetes = []; // lifetimes per ripple

  function commitUniforms() {
    filter.uniforms.uCount = starts.length;
    filter.uniforms.uCenters.set(new Float32Array(centers));
    filter.uniforms.uStarts.set(new Float32Array(starts));
    filter.uniforms.uLifes.set(new Float32Array(lifetes));
  }

  function farCornerDistance(nx, ny) {
    const corners = [[0,0],[1,0],[0,1],[1,1]];
    let rFar = 0;
    for (const [cx, cy] of corners) {
      const d = Math.hypot(nx - cx, ny - cy);
      if (d > rFar) rFar = d;
    }
    return rFar;
  }
  function rippleLifetimeSec(nx, ny) {
    const rFar = farCornerDistance(nx, ny);
    const crestToEdge = (K_GLOBAL * rFar) / SPEED;
    const tail = 0.9; // linger a touch before shader’s release tail
    return crestToEdge + tail;
  }

  function addRippleNorm(nx, ny, tSec) {
    centers.push(nx, ny);
    starts.push(tSec);
    lifetes.push(rippleLifetimeSec(nx, ny));
    if (starts.length > MAX_RIPPLES) {
      starts.shift();
      lifetes.shift();
      centers.shift(); centers.shift();
    }
    commitUniforms();
  }

  function randPoint(margin = 0.06) {
    return {
      nx: margin + Math.random() * (1 - 2 * margin),
      ny: margin + Math.random() * (1 - 2 * margin),
    };
  }

  (function seed() {
    if (!SEED_RIPPLES) return;
    const now = app.ticker.lastTime / 1000;
    const p = randPoint();
    addRippleNorm(p.nx, p.ny, now - 0.2);
  })();

  /* ========= Slow “breathing” spawn rhythm ========= */
  let spawnAccumulator = 0;
  let lastSpawnAt = -1e9;

  function currentIntervalMS(tSec) {
    // Slow sinusoidal breathing around BASE_INTERVAL_MS
    const s = Math.sin(TAU * BREATH_RATE_HZ * tSec);
    const factor = 1 + s * BREATH_DEPTH; // 0.65..1.35 when depth=0.35
    return Math.max(MIN_INTERVAL_MS, BASE_INTERVAL_MS * factor);
  }

  function trySpawn(t) {
    // Debounce: ensure a minimum spacing and avoid overcrowding
    if (t - lastSpawnAt < MIN_INTERVAL_MS / 1000) return;
    if (starts.length >= MAX_RIPPLES) return;
    const p = randPoint();
    addRippleNorm(p.nx, p.ny, t);
    lastSpawnAt = t;
  }

  // --- Instant first ripple; everything else unchanged ---
  app.ticker.addOnce(() => {
    if (!AUTOPLAY || reduceMotion) return;
    const now = app.ticker.lastTime / 1000;
    const p = randPoint();
    addRippleNorm(p.nx, p.ny, now + 0.001); // tiny epsilon avoids age=0 edge cases
    lastSpawnAt = now;                      // keeps MIN_INTERVAL_MS / cadence intact
  });

  /* ========= Ticker ========= */
  app.ticker.add(() => {
    const t = app.ticker.lastTime / 1000;
    filter.uniforms.uTime = t;

    if (AUTOPLAY) {
      const intervalNow = currentIntervalMS(t);
      spawnAccumulator += app.ticker.deltaMS;
      if (spawnAccumulator >= intervalNow) {
        spawnAccumulator -= intervalNow;
        trySpawn(t);
      }
    }

    // Prune after both natural life and long release have completed
    let changed = false;
    for (let i = starts.length - 1; i >= 0; i--) {
      const age = t - starts[i];
      if (age > lifetes[i] + FADE_TAIL) {
        starts.splice(i, 1);
        lifetes.splice(i, 1);
        centers.splice(i * 2, 2);
        changed = true;
      }
    }
    if (changed) commitUniforms();
  });
});
