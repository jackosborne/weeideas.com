---
title: Polyposter
permalink: /polyposter/
bg: "background:#fff;--dot:8px;--fade-mid:60%;--edge-alpha:0.9;background-image:radial-gradient(circle,#000 0 50.5%,transparent 50.5%);background-size:var(--dot) var(--dot);background-position:center;-webkit-mask-image:radial-gradient(circle at 50% 50%,rgba(0,0,0,1) 0,rgba(0,0,0,1) var(--fade-mid),rgba(0,0,0,var(--edge-alpha)) 100%);mask-image:radial-gradient(circle at 50% 50%,rgba(0,0,0,1) 0,rgba(0,0,0,1) var(--fade-mid),rgba(0,0,0,var(--edge-alpha)) 100%);"
teaser: Moving a slider and seeing things change will never stop being fun.
date: 2025-10-08
description: I came across a PNG of this image on a subreddit where someone was asking how to recreate it in Figma. I wanted to push the idea further by rebuilding it in HTML, CSS, and JS, and allowing it to be exported as a PNG. After several iterations and a couple of prompt rewrites, I eventually arrived at this solution.
tags: ["generative"]
css:
  - custom.css
  - /_/css/panel.css
js:
  - custom.js
links:
  - https://www.reddit.com/r/AdobeIllustrator/comments/1nxwece/how_can_i_recreate_this/
---

<div class="shell">
  <aside class="panel" aria-label="Editor">
    <section class="panel__section">
      <div class="field field--select">
        <label class="field__label" for="shapeMode">Shape</label>
        <select id="shapeMode" class="field__control">
          <option value="polygon" selected>Polygon</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div class="field field--range">
        <div class="field__head">
          <label class="field__label" for="sides">Polygon sides</label>
          <output id="sidesLabel" class="field__meta">12-gon</output>
        </div>
        <input id="sides" class="range" type="range" min="3" max="64" value="12" />
      </div>
    </section>
    <section class="panel__section">
      <div class="panel__sectionHead">
        <h3 class="panel__sectionTitle">Export</h3>
        <label class="toggle" title="Lock aspect ratio (8:11)">
          <input id="lockAspect" type="checkbox" checked />
          <span>Lock</span>
        </label>
      </div>
      <div class="grid2">
        <div class="field">
          <label class="field__label" for="exportW">W</label>
          <input id="exportW" class="field__control" type="number" inputmode="numeric" min="64" step="1" value="800" />
        </div>
        <div class="field">
          <label class="field__label" for="exportH">H</label>
          <input id="exportH" class="field__control" type="number" inputmode="numeric" min="64" step="1" value="1100" />
        </div>
      </div>
      <p class="hint">Download uses your chosen size and keeps the poster ratio.</p>
    </section>
    <footer class="panel__footer">
      <button id="save" class="btn btn--primary" type="button">
        Download PNG
      </button>
    </footer>
  </aside>

  <section class="stage">
    <div class="canvasWrap">
      <canvas id="cnv" class="shadow"></canvas>
    </div>
  </section>
</div>
