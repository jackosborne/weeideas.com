---
title: In Bloom
permalink: /in-bloom/
preview: preview.svg
bg: "background-color: #fff; background-size: contain; background-repeat: no-repeat; background-position: center;"
teaser: A meditative generative bloom exploring colour, rhythm, and repetition.
date: 2026-03-05
description: 'Jessica Poundstone’s <a href="https://www.jessicapoundstone.com/color-space-collection/color-space-twilight" title="Color Space Twilight" rel="nofollow">Color Space series</a> has always felt incredibly calm to look at. I wanted to see what that idea might look like if the grid could breathe, letting colour slowly bloom outward from the centre before dissolving and repeating.'
tags: ["generative", "motion"]
controls: true
artworkSize: medium
artworkRatio: square
css:
  - custom.css
js:
  - custom.js
links:
  - https://www.pinterest.com/pin/230598443423752281/
---

<div class="shell">
  {% include "components/controls.html" %}
  <div class="artwork-stack"><div class="artwork-frame">
    <canvas role="img" aria-label="Animated colour grid blooming from the centre. Adjust the labelled controls to change its appearance." id="art"></canvas>
  </div><p class="artwork-note" data-motion-note hidden role="status" aria-live="polite" aria-atomic="true">Reduced motion is on. The bloom is still; adjustments and export still work.</p></div>
</div>
