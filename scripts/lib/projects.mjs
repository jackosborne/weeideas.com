import fs from 'node:fs';
import path from 'node:path';

/** Discover project entry points, including pieces nested inside collections. */
export function projectDirectories(root) {
  const directories = [];
  function visit(directory) {
    if (fs.existsSync(path.join(directory, 'index.md'))) directories.push(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) visit(path.join(directory, entry.name));
    }
  }
  visit(root);
  return directories;
}
