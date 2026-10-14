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
  <div class="card-stage">
  <div class="card final" tabindex="0" role="button" aria-pressed="false" aria-label="Reflective football sticker" aria-describedby="shiny-instructions">
    <div class="card-turn">
    <div class="card-front" aria-hidden="false">
    <div class="foil foil--default" aria-hidden="true"></div>
    <div class="foil foil--active"  aria-hidden="true"></div>
    <svg class="foil-facets" viewBox="0 0 512 512" preserveAspectRatio="none" aria-hidden="true" focusable="false"></svg>
    <img src="crest.png" alt="Scottish Football Association crest" />
    <div class="card__ink" aria-hidden="true"></div>
    <div class="card__glare" aria-hidden="true"></div>
    </div>
    <div class="card-back" aria-hidden="true">
      <img src="back.webp" alt="France 98 Panini sticker back, number 33, with multilingual album information" />
      <span class="card-number" aria-hidden="true">33</span>
    </div>
    </div>
  </div>
  </div>
</div>
  <p class="motion-hint artwork-note" aria-live="polite" aria-atomic="true">
    Tap card to enable motion
  </p>
  <p id="shiny-instructions" class="shiny-instructions artwork-note">
    <span class="pointer-instructions">Move to catch the light · Click to turn over · Arrow keys tilt · Escape resets.</span>
    <span class="touch-instructions">Tap to turn over · Drag sideways to catch the light · Swipe vertically to scroll.</span>
    <span class="still-instructions">Reduced motion is on. Use Enter or Space to turn over on desktop.</span>
  </p>
  <div class="motion-actions" hidden>
    <button class="action-button motion-toggle" type="button">Enable phone motion</button>
    <button class="action-button motion-recalibrate" type="button" hidden>Recalibrate motion</button>
  </div>
</div>