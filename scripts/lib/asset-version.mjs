import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Give each local project stylesheet/script a URL tied to its actual contents. */
export function versionedProjectAsset(asset, pageUrl, inputPath) {
  if (/^https?:/.test(asset) || asset.startsWith('//')) return asset;
  const [pathname] = asset.split(/[?#]/);
  const source = pathname.startsWith('/')
    ? path.join(pathname.startsWith('/_/') ? 'src' : 'src/posts', pathname)
    : path.join(path.dirname(inputPath), pathname);
  const version = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 12);
  const resolved = asset.startsWith('/') ? asset : `${pageUrl}${asset}`;
  const url = new URL(resolved, 'https://local.invalid');
  url.searchParams.set('v', version);
  return `${url.pathname}${url.search}${url.hash}`;
}
