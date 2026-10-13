---
title: Shiny
permalink: /shiny/
preview: preview.svg
bg: "background: #fff; background-size: contain; background-repeat: no-repeat; background-position: center;"
teaser: Capturing that got, got, need feeling all over again.
date: 2025-10-12
description: When I got sick as a little boy my Mum and Dad would buy me a box of Panini football stickers—spoiled, I know—so that I could pass the time in my bed opening, sorting through and sticking the stickers to my book. Nothing more than paper and glue, yet somehow everything. I've tried to recreate the shiny sticker in html, css and js.
tags: ["childhood", "motion"]
artworkSize: medium
artworkRatio: square
css:
  - custom.css
js:
  - custom.js
links:
  - https://codepen.io/frontendor/pen/QWbrKbx
  - https://codepen.io/simeydotme/pen/abYWJdX
---
<div class="artwork-stack">
<div class="artwork-frame">
  <div class="card final motion-pending" tabindex="0">
    <div class="foil foil--default" aria-hidden="true"></div>
    <div class="foil foil--active"  aria-hidden="true"></div>
    <img src="crest.png" alt="Crest" />
    <div class="card__glare" aria-hidden="true"></div>
  </div>
</div>
  <p class="motion-hint artwork-note" aria-live="polite" aria-atomic="true">
    Tap card to enable motion
  </p>
  <style class="hover"></style>
</div>