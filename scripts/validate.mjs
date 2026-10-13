import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
const failures = [];
const routes = new Set();
for (const entry of fs.readdirSync('src/posts', { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = path.join('src/posts', entry.name);
  try {
    const source = fs.readFileSync(path.join(directory, 'index.md'), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) throw Error('Missing front matter');
    const data = yaml.load(match[1]);
    if (typeof data.title !== 'string' || !data.title.trim()) throw Error('Title required');
    if (data.artworkSize && !['small', 'medium', 'large'].includes(data.artworkSize))
      throw Error('artworkSize must be small, medium or large');
    if (data.artworkRatio && !['square', 'portrait'].includes(data.artworkRatio))
      throw Error('artworkRatio must be square or portrait');
    for (const flag of ['draft', 'controls'])
      if (data[flag] !== undefined && typeof data[flag] !== 'boolean')
        throw Error(`${flag} must be true or false`);
    for (const key of ['css', 'js'])
      if (
        data[key] != null &&
        (!Array.isArray(data[key]) || data[key].some((value) => typeof value !== 'string'))
      )
        throw Error(`${key} must be a list of asset paths`);
    if (data.preview !== undefined) {
      if (typeof data.preview !== 'string' || !data.preview.trim())
        throw Error('preview must be a local image path');
      const previewPath = data.preview.startsWith('/')
        ? path.join('src', data.preview.slice(1))
        : path.join(directory, data.preview);
      if (!fs.existsSync(previewPath) || !fs.statSync(previewPath).isFile())
        throw Error(`Missing preview: ${data.preview}`);
    }
    if (data.draft) continue;
    for (const key of ['teaser', 'description', 'bg'])
      if (typeof data[key] !== 'string' || !data[key].trim())
        throw Error(`${key} required for published projects`);
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw Error('Valid YYYY-MM-DD date required');
    if (
      !Array.isArray(data.tags) ||
      data.tags.some(
        (tag) => !['generative', 'motion', 'childhood', 'study', 'interactive'].includes(tag),
      )
    )
      throw Error('Use supported facet tags');
    if (!data.permalink || routes.has(data.permalink)) throw Error('Unique permalink required');
    routes.add(data.permalink);
    for (const key of ['css', 'js'])
      for (const asset of data[key] || []) {
        const filename = asset.startsWith('/')
          ? path.join('src', asset.slice(1))
          : path.join(directory, asset);
        if (!fs.existsSync(filename)) throw Error(`Missing asset: ${asset}`);
      }
  } catch (error) {
    failures.push(`${entry.name}: ${error.message}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Validated ${routes.size} published projects.`);
