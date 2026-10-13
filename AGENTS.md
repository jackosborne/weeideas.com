# Repository guidance

This is an Eleventy 3 static site with Liquid templates and independent vanilla JavaScript artwork. Read design-system.md and CONTRIBUTING.md before changing its foundations.

- Keep homepage and project templates small; shared components live in src/_includes/components.
- Use shared tokens and panel classes. Scope experiment styles to their data-project artboard.
- Preserve artwork and published URLs unless explicitly asked to change them.
- Keep incomplete experiments as drafts; do not invent finished editorial copy.
- Use the project starter for new pieces. Do not overwrite existing experiment folders.
- Prefer small JavaScript helpers to frameworks. Respect reduced motion and hidden tabs for animation.
- Run npm run check and npm run format:check for source changes; run npm run test:browser for interaction/layout changes; visually inspect layout/control changes when browser tooling is available.
- Generated _site, _dev, _test-site and vendor files, node_modules and macOS metadata are not source changes.
- Report verification limits honestly. Build success alone does not establish keyboard, visual or external-renderer behaviour.
