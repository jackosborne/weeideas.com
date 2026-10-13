---
title: Systematic Surface Design
permalink: /systematic-surface-design/
preview: preview.svg
bg: >-
  background: var(--bg);
  background-color: #fff;
  background-repeat: no-repeat;
  background-size: 48% auto;
  background-position: center;
teaser: Explore how simple geometric forms create near-infinite visual variety.
date: 2025-11-10
description: "Inspired by mid-century modular studies and the logic of design systems, this piece nods to a 1980 design aid by Tobias Christoph, which used a structured grid and simple shapes to help designers find optimal surface patterns. Each tile in the 4×4 grid can hold a square, triangle, circle, or remain blank. With just four options per tile, over four billion combinations emerge."
tags: ["generative", "study"]
artworkSize: medium
artworkRatio: square
css:
  - custom.css
js:
  - custom.js
links:
  - https://designreviewed.com/systematic-surface-design-by-tobias-christoph-1980/#designer-tobias-christoph
---

<div class="artwork-stack" id="art" aria-label="Systematic Surface Playground">
  <div class="stage artwork-frame">
    <svg id="board" viewBox="0 0 100 100" role="group" aria-label="4 by 4 composition grid">
      <!-- Cells first (background rect + shape per cell) -->
      <g id="cells"></g>
      <!-- Hairlines on top; ignore pointer events -->
      <g id="hairlines" pointer-events="none">
        <!-- verticals -->
        <line x1="25" y1="0"  x2="25" y2="100"/>
        <line x1="50" y1="0"  x2="50" y2="100"/>
        <line x1="75" y1="0"  x2="75" y2="100"/>
        <!-- horizontals -->
        <line x1="0"  y1="25" x2="100" y2="25"/>
        <line x1="0"  y1="50" x2="100" y2="50"/>
        <line x1="0"  y1="75" x2="100" y2="75"/>
      </g>
    </svg>
  </div>

  <div class="panel">
    <div class="legend" id="legend" role="toolbar" aria-label="Shape picker">
      <button type="button" data-shape="blank" aria-pressed="false" aria-label="Empty tile"></button>
      <button type="button" data-shape="square" aria-pressed="true" aria-label="Square">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>
      </button>
      <button type="button" data-shape="circle" aria-pressed="false" aria-label="Circle">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>
      </button>
      <button type="button" data-shape="triangle" aria-pressed="false" aria-label="Triangle">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100"><polygon points="0,100 100,100 0,0"/></svg>
      </button>
    </div>
    <div class="controls">
      <button id="randomise" type="button" class="action-button action-button--primary">Randomise</button>
      <button id="reset" type="button" class="action-button">Reset</button>
    </div>
  </div>
  <p id="surface-status" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>
  <p class="artwork-note">
      <strong>Select</strong> a shape from the legend, <strong>click once</strong> on the grid to place it and <strong>again</strong> to lock it in place. Use the <strong>empty tile</strong> to remove shapes, or the <strong>Randomise</strong> and <strong>Reset</strong> buttons to fill or clear the grid.
  </p>
</div>
