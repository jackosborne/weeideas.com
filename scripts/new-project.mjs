import fs from 'node:fs';
const [slug, ...words] = process.argv.slice(2);
if (!slug || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug))
  throw Error('Usage: npm run new -- project-slug "Project title"');
const directory = `src/posts/${slug}`;
if (fs.existsSync(directory)) throw Error('Project already exists');
const title = words.join(' ') || slug;
fs.mkdirSync(directory);
fs.writeFileSync(
  `${directory}/index.md`,
  `---
title: ${JSON.stringify(title)}
draft: true
permalink: /${slug}/
date: ${new Date().toISOString().slice(0, 10)}
teaser: Describe the experiment in one sentence.
description: Explain the idea and how to interact with it.
bg: "background: #e6e1f2;"
tags: [generative]
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
  <div class="artwork-frame"><canvas id="art" role="img" aria-label="${title.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')}: a circle whose size you can adjust"></canvas></div>
</div>
`,
);
fs.writeFileSync(
  `${directory}/custom.css`,
  `[data-project="${slug}"] #art { width: 100%; aspect-ratio: 1; background: #fff; border-radius: 8px; }\n`,
);
fs.writeFileSync(
  `${directory}/custom.js`,
  `import { createProjectControls } from '/_/js/lib/controls.js';
const canvas = document.getElementById('art');
const context = canvas.getContext('2d');
function render(size) {
  canvas.width = canvas.height = 800;
  context.clearRect(0, 0, 800, 800);
  context.fillStyle = '#4292f6';
  context.beginPath();
  context.arc(400, 400, size * 3, 0, Math.PI * 2);
  context.fill();
}
const kit = createProjectControls(${JSON.stringify(title)}, {
  size: [50, 10, 100, 1],
  reset: { type: 'action', label: 'Reset' },
}, { onAction: action => { if (action === 'reset') kit.resetValues(); } });
kit.subscribe(values => render(values.size));\n`,
);
console.log(`Created ${directory}. Preview with npm start; set draft: false when ready.`);
