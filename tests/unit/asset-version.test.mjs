import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { versionedProjectAsset } from '../../scripts/lib/asset-version.mjs';

test('project asset versions are stable and change when file contents change', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'weeideas-assets-'));
  try {
    const input = path.join(directory, 'index.md');
    const css = path.join(directory, 'custom.css');
    writeFileSync(css, '.card { color: red; }');
    const first = versionedProjectAsset('custom.css?theme=dark#sheet', '/shiny/', input);
    assert.match(first, /^\/shiny\/custom\.css\?theme=dark&v=[a-f0-9]{12}#sheet$/);
    assert.equal(versionedProjectAsset('custom.css?theme=dark#sheet', '/shiny/', input), first);
    writeFileSync(css, '.card { color: blue; }');
    assert.notEqual(versionedProjectAsset('custom.css?theme=dark#sheet', '/shiny/', input), first);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('external asset URLs are preserved and shared local assets get versions', () => {
  assert.equal(
    versionedProjectAsset('https://example.com/app.js', '/shiny/', ''),
    'https://example.com/app.js',
  );
  assert.equal(
    versionedProjectAsset('//example.com/app.js', '/shiny/', ''),
    '//example.com/app.js',
  );
  assert.match(
    versionedProjectAsset('/_/css/style.css', '/shiny/', ''),
    /^\/_\/css\/style\.css\?v=[a-f0-9]{12}$/,
  );
});
