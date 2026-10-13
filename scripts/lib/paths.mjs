export const OUTPUTS = Object.freeze({
  production: '_site',
  development: '_dev',
  test: '_test-site',
});
export function outputDirectory(mode = process.env.ELEVENTY_RUN_MODE) {
  return mode === 'serve' || mode === 'watch' ? OUTPUTS.development : OUTPUTS.production;
}
