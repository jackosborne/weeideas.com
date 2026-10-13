import fs from 'node:fs';
import path from 'node:path';
// Self-host pinned browser libraries and their licenses; never modify package files.
for (const [source, destination] of [
  ['node_modules/dialkit/dist/vanilla/index.js', 'src/_/vendor/dialkit/index.js'],
  ['node_modules/dialkit/dist/vanilla/styles.css', 'src/_/vendor/dialkit/styles.css'],
  ['node_modules/dialkit/LICENSE', 'src/_/vendor/dialkit/LICENSE'],
  ['node_modules/pixi.js/dist/pixi.min.mjs', 'src/_/vendor/pixi/index.js'],
  ['node_modules/pixi.js/LICENSE', 'src/_/vendor/pixi/LICENSE'],
]) {
  const content = fs.readFileSync(source, 'utf8').replace(/^\/\/# sourceMappingURL=.*$/gm, '');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== content)
    fs.writeFileSync(destination, content);
}
