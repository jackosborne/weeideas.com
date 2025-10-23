---
title: Shiny
permalink: /shiny/
bg: "background-image: linear-gradient(
		48deg,
		#e3c1f4, /* Light Pink */
		#d9d7ed, /* Very Light Blue */
		#dff7f1, /* Very Light Green */
		#acf0ff, /* Light Blue */
		#e3c1f4, /* Light Pink */
		#d9d7ed, /* Very Light Blue */
		#dff7f1, /* Very Light Green */
		#acf0ff, /* Light Blue */
		#e3c1f4 /* Light Pink */
	);"
teaser: Capturing that got, got, need feeling all over again.
date: 2025-10-12
description: When I got sick as a little boy my Mum and Dad would buy me a box of Panini football stickers—spoiled, I know—so that I could pass the time in my bed opening, sorting through and sticking the stickers to my book. Nothing more than paper and glue, yet somehow everything. I've tried to recreate the shiny sticker in html, css and js.
css:
  - custom.css
js:
  - custom.js
links:
  - https://codepen.io/frontendor/pen/QWbrKbx
  - https://codepen.io/simeydotme/pen/abYWJdX
---
<div>
  <div class="card final motion-pending" tabindex="0">
    <div class="foil foil--default" aria-hidden="true"></div>
    <div class="foil foil--active"  aria-hidden="true"></div>
    <img src="crest.png" alt="Crest" />
    <div class="card__glare" aria-hidden="true"></div>
  </div>
  <div class="motion-hint small" aria-live="polite" aria-atomic="true">
    Tap card to enable motion
  </div>
  <style class="hover"></style>
</div>