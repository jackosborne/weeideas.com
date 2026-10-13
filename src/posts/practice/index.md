---
title: Practice
draft: false
permalink: /practice/
date: 2026-10-12
teaser: Find the word by bringing eight rows into alignment.
description: Practice makes perfect. I wanted to make a little brain teaser about finding your way through trial and error. Adjust each row to bring the word into focus. Some letters might lead you astray, but a little patience and a few more attempts should help everything fall into place.
preview: preview.svg
bg: "background: #fff; background-size: contain; background-repeat: no-repeat; background-position: center;"
tags: [generative, study]
artworkSize: medium
artworkRatio: square
controls: true
css:
  - custom.css
js:
  - custom.js
---
<div class="shell">
  {% include "components/controls.html" %}
  <div class="artwork-stack">
    <div class="artwork-frame"><canvas id="art" role="img" aria-label="An eight by eight letter grid containing a hidden PRACTICE. Adjust the eight row sliders to bring the word upright."></canvas></div>
  </div>
</div>
