import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectDirectories } from '../../scripts/lib/projects.mjs';

test('project discovery finds standalone and nested pieces without treating asset folders as projects', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'weeideas-projects-'));
  try {
    for (const directory of ['standalone', 'collection/winamp', 'collection/ipod']) {
      const folder = path.join(root, directory);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'index.md'), '---\ntitle: Piece\n---\n');
    }
    fs.mkdirSync(path.join(root, 'collection/ipod/assets'));
    assert.deepEqual(
      projectDirectories(root)
        .map((directory) => path.relative(root, directory))
        .sort(),
      ['collection/ipod', 'collection/winamp', 'standalone'],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
