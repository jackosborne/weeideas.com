import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import postcss from 'postcss';

export function checkCSS(source, file) {
  return postcss.parse(source, { from: file });
}

export function readHTML(source) {
  const errors = [];
  const document = parse(source, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => errors.push(error),
  });
  const nodes = [];
  function walk(node) {
    nodes.push(node);
    for (const child of node.childNodes || []) walk(child);
    if (node.content) walk(node.content);
  }
  walk(document);
  return { nodes, errors };
}

export function localTarget(value, sourceFile, output) {
  const root = path.resolve(output);
  const base = new URL(
    `https://site.test/${path.relative(root, path.resolve(sourceFile)).split(path.sep).join('/')}`,
  );
  const url = new URL(value, base);
  if (url.origin !== base.origin) return null;
  const target = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`))
    throw new Error(`Link escapes output: ${value}`);
  return fs.existsSync(target) && fs.statSync(target).isDirectory()
    ? path.join(target, 'index.html')
    : target;
}
