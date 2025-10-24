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
js:
  - custom.js
links:
  - https://www.reddit.com/r/AdobeIllustrator/comments/1nxwece/how_can_i_recreate_this/
---
<div class="shell">
  <aside class="sidebar">
    <div class="controls">
      <div class="row">
        <label for="sides"><strong>Polygon sides</strong></label>
        <input id="sides" type="range" min="3" max="64" value="12" />
        <span id="sidesLabel" class="sidesValue">12-gon</span>
      </div>
      <div class="row">
        <button id="save">Save PNG</button>
      </div>
      <!--
      <small>
        Processing math: start at 6 dots, add 3 per row, use row diameter for spacing &amp; height.
      </small>
      -->
    </div>
  </aside>

  <section class="stage">
    <div class="canvasWrap">
      <canvas id="cnv" class="shadow"></canvas>
    </div>
  </section>
</div>