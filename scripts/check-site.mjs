import fs from 'node:fs';
import path from 'node:path';
import { OUTPUTS } from './lib/paths.mjs';
import { checkCSS, readHTML, localTarget } from './lib/site-checks.mjs';
const output = OUTPUTS.production;
const failures = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(file);
      continue;
    }
    try {
      if (!file.endsWith('.css') && !file.endsWith('.html')) continue;
      const source = fs.readFileSync(file, 'utf8');
      if (file.endsWith('.css')) {
        checkCSS(source, file);
        continue;
      }
      if (!file.endsWith('.html')) continue;
      const { nodes, errors } = readHTML(source);
      for (const error of errors) failures.push(`${file}:${error.startLine}: HTML ${error.code}`);
      for (const node of nodes) {
        const attrs = Object.fromEntries((node.attrs || []).map((attr) => [attr.name, attr.value]));
        // Empty paragraphs often signal Markdown splitting a composed HTML include.
        if (
          node.tagName === 'p' &&
          !(node.childNodes || []).length &&
          attrs.role !== 'status' &&
          !attrs['aria-live']
        )
          failures.push(`${file}: empty paragraph at line ${node.sourceCodeLocation?.startLine}`);
        for (const name of ['href', 'src']) {
          if (!attrs[name]) continue;
          const target = localTarget(attrs[name], file, output);
          if (target && !fs.existsSync(target)) failures.push(`${file}: missing ${attrs[name]}`);
        }
      }
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }
}
visit(output);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Parsed HTML/CSS and generated local links/assets pass checks.');
