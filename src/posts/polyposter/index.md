---
title: Polyposter
permalink: /polyposter/
bg: "background:#fff;--dot:8px;--fade-mid:60%;--edge-alpha:0.9;background-image:radial-gradient(circle,#000 0 50.5%,transparent 50.5%);background-size:var(--dot) var(--dot);background-position:center;-webkit-mask-image:radial-gradient(circle at 50% 50%,rgba(0,0,0,1) 0,rgba(0,0,0,1) var(--fade-mid),rgba(0,0,0,var(--edge-alpha)) 100%);mask-image:radial-gradient(circle at 50% 50%,rgba(0,0,0,1) 0,rgba(0,0,0,1) var(--fade-mid),rgba(0,0,0,var(--edge-alpha)) 100%);"
teaser: Moving a slider and seeing things change will never stop being fun.
date: 2025-10-08
description: I came across a PNG of this image on a subreddit where someone was asking how to recreate it in Figma. I wanted to push the idea further by rebuilding it in HTML, CSS, and JS, and allowing it to be exported as a PNG. After several iterations and a couple of prompt rewrites, I eventually arrived at this solution.
tags: ["generative"]
controls: true
artworkSize: large
artworkRatio: portrait
css:
  - custom.css
js:
  - custom.js
links:
  - https://www.reddit.com/r/AdobeIllustrator/comments/1nxwece/how_can_i_recreate_this/
---

<div class="shell">
  {% include "components/controls.html" %}
  <section class="stage">
    <div class="artwork-frame">
      <canvas role="img" aria-label="Generative polygon poster. Use the controls to change the shape and export size." id="cnv" class="shadow"></canvas>
    </div>
  </section>
</div>
