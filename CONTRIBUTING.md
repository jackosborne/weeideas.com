# Working on Wee Ideas

Use Node 20.17 or newer. Run `npm ci`, then `npm start`. Read design-system.md before changing shared foundations.

## Outputs and commands

| Command                | Purpose                                                         | Output        |
| ---------------------- | --------------------------------------------------------------- | ------------- |
| `npm start`            | Development preview, including drafts                           | `_dev/`       |
| `npm run build`        | Validate content and clean production build                     | `_site/`      |
| `npm run check`        | Build, parse HTML/CSS, check local assets/links, run unit tests | `_site/`      |
| `npm run test:browser` | Isolated production build and browser regressions               | `_test-site/` |
| `npm run test`         | Unit and browser suites                                         | Test outputs  |
| `npm run format`       | Format supported source files                                   | Source        |
| `npm run format:check` | Verify formatting without edits                                 | None          |

Development, production and regression outputs are separate. A production build cannot delete the running preview's files. Test servers use port 8173 and fail rather than reuse an unrelated server. On Repeat collection tests run against the same production regression build.

## New experiments

Run `npm run new -- project-slug "Project title"`. The starter creates a working draft with a medium square frame, Dialkit panel and canvas. It refuses to overwrite an existing folder. Project assets are copied recursively, so newly created projects can be added while the preview is running.

Keep drawing code and palette local. Shared templates own page structure; the shared controls helper owns Dialkit integration. Relative custom.css/custom.js resolve beneath the project permalink. See design-system.md for sizing, notes, buttons and lifecycle conventions.

## Regression checks

Install the test browser once with `npx playwright install chromium firefox webkit`. Then run `npm run test`. If using an existing Chrome installation locally, run `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` instead. CI installs Chromium, Firefox and WebKit and runs formatting, production checks and browser regressions before deployment.

The browser suite runs in Chromium, Firefox and WebKit, with separate iPhone WebKit emulation. It covers gallery/history filtering, draft exclusion, desktop/mobile frame sizing, In Bloom presets/reset/export, Polyposter export resolution, Surface Design keyboard locking/focus, Shiny's foil, reduced motion, Untitled shortcuts, lifecycle teardown and Dialkit action identity. Axe checks serious/critical findings in the main control artboards. Reports and failure traces are generated under ignored playwright-report/ and test-results/.

HTML uses parse5 and CSS uses PostCSS, rather than regex syntax checks. Local HTML asset/link references are resolved from the built page. These checks do not establish every CSS property's validity, external link availability, sensor behaviour, visual fidelity, or full accessibility compliance. Review changed artwork in light/dark appearance and narrow/wide layouts, and inspect exported images as well as their dimensions.

## Formatting and generated files

Do not edit or commit `_site`, `_dev`, `_test-site`, node_modules, vendor copies or test reports. Liquid includes and project Markdown contain deliberate whitespace boundaries and are excluded from automatic formatting; edit them carefully and rely on rendered markup checks.

Keep incomplete projects as drafts. Do not publish placeholder dates, missing thumbnails or empty descriptions. Do not change existing project URLs without an explicit migration.

## Dependencies

The site uses Eleventy and its sitemap plugin; Dialkit provides controls and PIXI renders Raspberry Ripple. js-yaml is a direct content-validator dependency. parse5/PostCSS support generated-output checks, Playwright/Axe support regressions, and Prettier formats source. Browser libraries and licenses are copied locally before builds, with versions fixed by package-lock.json.

Compatible audit fixes were applied during this cleanup, including upgrading Eleventy within version 3 and patching Picomatch. The remaining audit advisories are in Eleventy's upstream development/build dependencies: braces through Chokidar and sprintf-js through gray-matter's YAML parser. npm's proposed forced fix downgrades Eleventy to 0.6.0 and is not an appropriate migration. Recheck with `npm audit` when updating Eleventy; do not suppress advisories or force incompatible dependency versions. The published output is static and does not ship those Node build dependencies.

## Release verification

Cross-browser tests include export comparisons on a white background, with alpha checked separately. In Bloom intentionally exports a transparent PNG; its white paper is a display background. Polyposter exports an opaque white poster. A one-channel-step tolerance handles browser PNG alpha rounding without allowing visible export changes.

iPhone emulation tests touch layouts and mocked motion permission/sensor events. These do not verify physical sensors or Safari's real permission UI. For a real-device follow-up, serve the updated site over HTTPS, open Shiny in Safari, tap to enable motion, grant permission, tilt the phone, tap to recalibrate, and repeat with permission denied and Reduce Motion enabled. Confirm the artwork remains usable in each state.
