// eleventy.config.mjs
import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from '@11ty/eleventy';
import sitemap from '@quasibit/eleventy-plugin-sitemap';
import { outputDirectory } from './scripts/lib/paths.mjs';
import { versionedProjectAsset } from './scripts/lib/asset-version.mjs';

export default async function (eleventyConfig) {
  // Drafts
  eleventyConfig.addPreprocessor('drafts', '*', (data) => {
    if (data.draft) data.title = `${data.title} (draft)`;
    if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') return false;
  });

  // ──────────────────────────────────────────────────────────
  // Static passthroughs
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addFilter('dateISO', (value) => new Date(value).toISOString().slice(0, 10));
  eleventyConfig.addFilter('dateMonth', (value) =>
    new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(value))
      .replace(/ (\d{4})$/, ', $1'),
  );
  eleventyConfig.addFilter('projectAsset', (asset, url) =>
    asset.startsWith('/') || /^https?:/.test(asset) ? asset : `${url}${asset}`,
  );
  eleventyConfig.addFilter('versionedProjectAsset', versionedProjectAsset);
  eleventyConfig.addPassthroughCopy({ 'src/_': '_' });
  for (const file of ['robots.txt', 'CNAME', 'humans.txt']) {
    eleventyConfig.addPassthroughCopy({ [`src/${file}`]: file });
  }
  // Preserve project directories while excluding Markdown and data files.
  eleventyConfig.addPassthroughCopy(
    { 'src/posts': '.' },
    {
      filter: ['**/*.{css,js,svg,webp,png,jpg,jpeg,gif,avif,mp4,webm}'],
      dot: false,
    },
  );

  // ──────────────────────────────────────────────────────────
  // Watch targets
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addWatchTarget('src/**/*.{css,js,svg,webp,png,jpg,jpeg,gif,avif}');

  // ──────────────────────────────────────────────────────────
  // Plugins
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
  eleventyConfig.addPlugin(IdAttributePlugin);
  eleventyConfig.addPlugin(sitemap, {
    lastModifiedProperty: 'modified',
    sitemap: {
      hostname: 'https://weeideas.com',
    },
  });

  // ──────────────────────────────────────────────────────────
  // Shortcodes
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addShortcode('currentYear', () => String(new Date().getFullYear()));

  // ──────────────────────────────────────────────────────────
  // Return config
  // ──────────────────────────────────────────────────────────
  return {
    templateFormats: ['md', 'liquid', 'html', '11ty.js', 'njk'],
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'liquid',
    dir: { input: 'src', includes: '_includes', data: '_data', output: outputDirectory() },
  };
}
