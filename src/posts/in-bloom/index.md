---
title: In Bloom
permalink: /in-bloom/
bg: >-
  background-color:#E6E1F2;
  background-image:
    linear-gradient(#B8C8F6,#B8C8F6),
    linear-gradient(#4292F6,#4292F6);
  background-repeat:no-repeat;
  background-size:44% 44%, 18% 18%;
  background-position:center, center;
teaser: A slow generative bloom exploring colour, rhythm, and gentle motion.
date: 2026-03-05
description: This piece explores how subtle shifts in colour, opacity, and timing can create a calming visual rhythm. Tiles gradually appear from the centre and bloom outward before dissolving again, forming a continuous cycle intended to be watched rather than analysed.
tags: ["generative", "motion"]
css:
  - custom.css
  - /_/css/panel.css
js:
  - custom.js
links:
  - https://www.pinterest.com/pin/230598443423752281/
---

<div class="shell">
  <aside class="panel" aria-label="Animation controls">
    <section class="panel__section">
      <div class="field field--select">
        <div class="field__head">
          <label class="field__label" for="preset">Preset</label>
        </div>
        <select id="preset" class="field__control">
          <option value="twilight">Twilight</option>
          <option value="aurora">Aurora</option>
          <option value="heatwave">Heatwave</option>
          <option value="deep-sea">Deep Sea</option>
          <option value="mono-bloom">Mono Bloom</option>
        </select>
      </div>
    </section>
    <section class="panel__section">
      <div class="panel__sectionHead">
        <h2 class="panel__sectionTitle">Bloom</h2>
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="speed">Speed</label>
          <span class="field__meta" id="speed-value">6.0s</span>
        </div>
        <input id="speed" class="range" type="range" min="3" max="12" step="0.1" value="6" />
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="spread">Spread</label>
          <span class="field__meta" id="spread-value">0.70</span>
        </div>
        <input id="spread" class="range" type="range" min="0.2" max="1" step="0.01" value="0.7" />
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="softness">Softness</label>
          <span class="field__meta" id="softness-value">0.18</span>
        </div>
        <input id="softness" class="range" type="range" min="0.02" max="0.4" step="0.01" value="0.18" />
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="pulse">Pulse</label>
          <span class="field__meta" id="pulse-value">0.04</span>
        </div>
        <input id="pulse" class="range" type="range" min="0" max="0.12" step="0.01" value="0.04" />
      </div>
    </section>
    <section class="panel__section">
      <div class="panel__sectionHead">
        <h2 class="panel__sectionTitle">Grid</h2>
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="gridSize">Grid size</label>
          <span class="field__meta" id="gridSize-value">9</span>
        </div>
        <input id="gridSize" class="range" type="range" min="3" max="20" step="1" value="9" />
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="overlap">Tile overlap</label>
          <span class="field__meta" id="overlap-value">0.50</span>
        </div>
        <input id="overlap" class="range" type="range" min="0" max="2" step="0.05" value="0.5" />
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label" for="roundness">Roundness</label>
          <span class="field__meta" id="roundness-value">0</span>
        </div>
        <input id="roundness" class="range" type="range" min="0" max="24" step="1" value="0" />
      </div>
    </section>
    <footer class="panel__footer">
      <div class="grid2">
        <button id="reset" class="btn" type="button">Reset</button>
        <button id="randomise" class="btn" type="button">Randomise</button>
      </div>
      <button id="export" class="btn btn--primary" type="button">Export PNG</button>
    </footer>
  </aside>

  <div class="frame">
    <canvas id="art"></canvas>
  </div>
</div>
