import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkCSS, readHTML, localTarget } from '../../scripts/lib/site-checks.mjs';
import { actionPaths } from '../../src/_/js/lib/controls-bridge.js';
import { outputDirectory } from '../../scripts/lib/paths.mjs';

test('preview builds cannot write into production output', () => {
  assert.equal(outputDirectory('serve'), '_dev');
  assert.equal(outputDirectory('watch'), '_dev');
  assert.equal(outputDirectory('build'), '_site');
});
test('CSS parser catches syntax errors while accepting braces in strings', () => {
  assert.doesNotThrow(() => checkCSS('.test::before { content: "}"; }', 'valid.css'));
  assert.throws(
    () => checkCSS('@media (max-width: 900px) { .test { color: red; }', 'broken.css'),
    /Unclosed block/,
  );
});
test('HTML parser exposes broken paragraph nesting and real attribute values', () => {
  const html =
    '<!doctype html><html><head></head><body><p><div>Artwork</div></p><a href="/a?x=1&amp;y=2">Link</a></body></html>';
  const { nodes, errors } = readHTML(html);
  assert.ok(nodes.some((node) => node.tagName === 'p' && node.childNodes.length === 0));
  assert.equal(nodes.find((node) => node.tagName === 'a').attrs[0].value, '/a?x=1&y=2');
});
test('relative assets resolve beneath their project and external links are excluded', () => {
  assert.equal(
    localTarget('custom.js?v=1', '_site/in-bloom/index.html', '_site'),
    path.resolve('_site/in-bloom/custom.js'),
  );
  assert.equal(localTarget('https://example.com/image.png', '_site/index.html', '_site'), null);
});
test('action identity survives duplicated or changed labels and nested folders', () => {
  assert.deepEqual(
    actionPaths([
      { type: 'action', path: 'reset', label: 'Same' },
      { type: 'folder', children: [{ type: 'action', path: 'output.save', label: 'Same' }] },
    ]),
    ['reset', 'output.save'],
  );
});
