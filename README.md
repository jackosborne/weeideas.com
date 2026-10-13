# weeideas.com

Interactive experiments in code, motion and form, built with Eleventy and deployed to GitHub Pages.

## Develop

Use Node 20.17 or newer:

```sh
npm ci
npm start
```

The development server builds into `_dev/` and includes drafts. Production builds go to `_site/`.

## Create an experiment

```sh
npm run new -- project-slug "Project title"
```

The starter includes a medium square artwork frame, Dialkit controls and a working canvas. See [design-system.md](design-system.md) for the reusable system and [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## Verify

```sh
npm run check
npx playwright install chromium firefox webkit
npm run test:browser
npm run format:check
```

Production checks validate content, parse HTML/CSS, verify local links/assets and run unit tests. Browser regressions use `_test-site/` independently of development and production output. GitHub Actions runs these checks before deploying.
