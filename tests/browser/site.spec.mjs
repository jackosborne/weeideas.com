import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

const routes = [
  'in-bloom',
  'systematic-surface-design',
  'untitled-1972',
  'raspberry-ripple',
  'shiny',
  'polyposter',
  'practice',
];

test('gallery filtering survives history navigation and drafts stay out of production', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.card[data-tags]')).toHaveCount(7);
  await expect(page.getByRole('link', { name: 'Practice', exact: true })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Raspberry Ripple', exact: true })).toHaveCount(0);
  await expect(page.getByText('Cereal Milk', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Study', exact: true }).click();
  await expect(page.locator('.card[data-tags]:visible')).toHaveCount(4);
  await page.getByRole('button', { name: 'Childhood', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Study', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.card[data-tags]:visible')).toHaveCount(4);
});

test('Interactive filter shows the four interactive projects and survives reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Interactive', exact: true }).click();
  const cards = page.locator('.card[data-tags]:visible');
  await expect(cards).toHaveCount(4);
  for (const title of ['Practice', 'Systematic Surface Design', 'Polyposter', 'On Repeat']) {
    await expect(cards.getByRole('link', { name: title, exact: true })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByRole('button', { name: 'Interactive', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(cards).toHaveCount(4);
});

test('wrapped filters have breathing room and stay anchored when results change', async ({
  page,
}) => {
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/');
    const filters = page.locator('#filters');
    const before = await filters.boundingBox();
    await expect(filters).toHaveCSS('row-gap', '12px');
    for (const name of ['Childhood', 'Interactive', 'Motion', 'All']) {
      await page.getByRole('button', { name, exact: true }).click();
      const after = await filters.boundingBox();
      expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    }
  }
});

test('artwork frames keep their desktop dimensions and remain proportional on mobile', async ({
  page,
}) => {
  for (const route of routes) {
    await page.goto(`/${route}/`);
    const frame = await page.locator('.artwork-frame').boundingBox();
    expect(frame.width).toBeCloseTo(route === 'polyposter' ? 640 : 560, 2);
    expect(frame.height).toBeCloseTo(route === 'polyposter' ? 880 : 560, 2);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(`/${route}/`);
    const frame = await page.locator('.artwork-frame').boundingBox();
    expect(frame.width).toBeCloseTo(342, 0);
    expect(frame.height / frame.width).toBeCloseTo(route === 'polyposter' ? 11 / 8 : 1, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
});

test('In Bloom presets, keyboard adjustment, reset and export stay in sync', async ({ page }) => {
  await page.goto('/in-bloom/');
  await page.getByRole('button', { name: 'Preset Twilight' }).click();
  await page.getByRole('option', { name: 'Sky', exact: true }).click();
  const speed = page.getByRole('slider', { name: 'Speed', exact: true });
  await expect(speed).toHaveAttribute('aria-valuenow', '7.6');
  await speed.press('ArrowRight');
  await expect(speed).toHaveAttribute('aria-valuenow', '7.7');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(speed).toHaveAttribute('aria-valuenow', '7.6');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export PNG' }).click(),
  ]);
  const png = await fs.readFile(await download.path());
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(png.readUInt32BE(20));
  const positions = await page.evaluate(() => [
    document.querySelector('.artwork-frame').getBoundingClientRect().top,
    document.querySelector('.project-controls').getBoundingClientRect().top,
  ]);
  expect(positions[0]).toBe(positions[1]);
  await expect(page.getByRole('button', { name: 'Versions', exact: true })).toBeHidden();
  const resetBox = await page.getByRole('button', { name: 'Reset', exact: true }).boundingBox();
  const randomBox = await page
    .getByRole('button', { name: 'Randomise', exact: true })
    .boundingBox();
  const exportBox = await page
    .getByRole('button', { name: 'Export PNG', exact: true })
    .boundingBox();
  expect(resetBox.y).toBe(randomBox.y);
  expect(randomBox.x).toBeGreaterThan(resetBox.x + resetBox.width);
  expect(exportBox.y).toBeGreaterThan(resetBox.y + resetBox.height);
  expect(exportBox.width).toBeCloseTo(randomBox.x + randomBox.width - resetBox.x, 1);
});

test('Polyposter keeps linked dimensions and exports the chosen resolution', async ({ page }) => {
  await page.goto('/polyposter/');
  await page.getByRole('slider', { name: 'Width', exact: true }).press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Height', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '1101',
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PNG' }).click(),
  ]);
  const png = await fs.readFile(await download.path());
  expect(png.readUInt32BE(16)).toBe(801);
  expect(png.readUInt32BE(20)).toBe(1101);
});

test('Surface Design supports visible keyboard focus, locking and reset', async ({ page }) => {
  await page.goto('/systematic-surface-design/');
  await page
    .getByRole('button', { name: 'Row 1, Column 1, empty, tentative', exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Row 1, Column 1, square, tentative', exact: true })
    .press('Enter');
  const locked = page.getByRole('button', { name: 'Row 1, Column 1, square, locked', exact: true });
  await expect(locked).toHaveCSS('outline-style', 'none');
  await expect(locked.locator('.cell-focus')).toHaveCSS('display', 'block');
  await expect(locked.locator('.cell-focus')).toHaveCSS('stroke-width', '1.5px');
  await page.getByRole('button', { name: 'Randomise', exact: true }).click();
  await expect(locked).toHaveCount(1);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('button', { name: /empty, tentative/ })).toHaveCount(16);
  await page
    .getByRole('button', { name: 'Row 1, Column 1, empty, tentative', exact: true })
    .click();
  await expect(page.locator('#cells .cell-focus:visible')).toHaveCount(0);
});

test('Shiny retains its foil and reduced-motion artwork remains still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/shiny/');
  await expect(page.locator('.foil--default')).toHaveCSS('background-image', /off\.jpg/);
  await page.goto('/in-bloom/');
  await expect(page.getByRole('slider', { name: 'Speed' })).toBeVisible();
  const canvas = page.locator('#art');
  const before = await canvas.evaluate((canvas) => canvas.toDataURL());
  // Two sampled frames should be identical under reduced motion.
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((canvas) => canvas.toDataURL())).toBe(before);
});

test('primary actions are identified by paths even when labels repeat or change', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    document.body.innerHTML = '<div id="project-dials"></div>';
    const { createProjectControls } = await import('/_/js/lib/controls.js');
    window.testKit = createProjectControls(
      'Test',
      {
        reset: { type: 'action', label: 'Same' },
        output: { save: { type: 'action', label: 'Same' } },
      },
      { primaryAction: 'output.save' },
    );
  });
  await expect(page.locator('[data-primary-action]')).toHaveCount(1);
  await expect(page.locator('[data-primary-action]')).toHaveAttribute(
    'data-action-path',
    'output.save',
  );
  await page.evaluate(() =>
    window.testKit.updateConfig({
      reset: { type: 'action', label: 'Reset' },
      output: { save: { type: 'action', label: 'Renamed' } },
    }),
  );
  await expect(page.locator('[data-primary-action]')).toHaveText('Renamed');
});

test('main controls have no serious or critical automated accessibility violations', async ({
  page,
}) => {
  for (const route of ['in-bloom', 'polyposter', 'systematic-surface-design', 'practice']) {
    await page.goto(`/${route}/`);
    const result = await new AxeBuilder({ page }).include('.artboard').analyze();
    expect(
      result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact)),
      route,
    ).toEqual([]);
  }
});

test('Untitled keyboard shortcuts ignore typing and support keyboard artwork interaction', async ({
  page,
}) => {
  await page.goto('/untitled-1972/');
  const canvas = page.locator('#c');
  await canvas.press('i');
  await expect(canvas).toHaveAttribute('aria-description', 'Interaction off. Band off.');
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Test input');
    document.body.append(input);
  });
  await page.getByRole('textbox', { name: 'Test input' }).fill('ib');
  await page.getByRole('textbox', { name: 'Test input' }).press('b');
  await expect(canvas).toHaveAttribute('aria-description', 'Interaction off. Band off.');
  await canvas.press('i');
  await canvas.press('ArrowRight');
  await expect(canvas).toHaveAttribute('aria-description', 'Interaction on. Band off.');
});

test('lifecycle teardown cancels events and work but preserves back-forward cache pages', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createArtworkLifecycle } = await import('/_/js/lib/lifecycle.js');
    const lifecycle = createArtworkLifecycle();
    let events = 0;
    let cleanups = 0;
    lifecycle.listen(window, 'artwork-test', () => events++);
    lifecycle.cleanup(() => cleanups++);
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new Event('artwork-test'));
    const retained = !lifecycle.signal.aborted;
    lifecycle.dispose();
    lifecycle.dispose();
    window.dispatchEvent(new Event('artwork-test'));
    return { retained, events, cleanups, aborted: lifecycle.signal.aborted };
  });
  expect(result).toEqual({ retained: true, events: 1, cleanups: 1, aborted: true });
});

test('animation pauses in hidden pages and stops after lifecycle abort', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { animate } = await import('/_/js/lib/artwork.js');
    window.animationFrames = 0;
    window.animationController = new AbortController();
    animate(() => window.animationFrames++, document, {
      signal: window.animationController.signal,
    });
  });
  await expect.poll(() => page.evaluate(() => window.animationFrames)).toBeGreaterThan(1);
  const paused = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return window.animationFrames;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.animationFrames)).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.animationFrames)).toBeGreaterThan(paused);
  const stopped = await page.evaluate(() => {
    window.animationController.abort();
    return window.animationFrames;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.animationFrames)).toBe(stopped);
});

test('exports match the artwork pixels, with intentional transparency preserved', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [route, canvasId, action] of [
    ['in-bloom', 'art', 'Export PNG'],
    ['polyposter', 'cnv', 'Download PNG'],
  ]) {
    await page.goto(`/${route}/`);
    const canvas = page.locator(`#${canvasId}`);
    // Polyposter re-renders at export resolution; match its visible canvas for this comparison.
    if (route === 'polyposter') {
      const dimensions = await canvas.evaluate((el) => ({ width: el.width, height: el.height }));
      await page.getByRole('slider', { name: 'Width', exact: true }).press('Enter');
      const input = page.getByRole('textbox', { name: 'Width value', exact: true });
      await input.fill(String(dimensions.width));
      await input.press('Enter');
    }
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: action, exact: true }).click(),
    ]);
    const file = await fs.readFile(await download.path());
    const comparison = await canvas.evaluate(async (source, base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const copy = document.createElement('canvas');
      copy.width = image.naturalWidth;
      copy.height = image.naturalHeight;
      copy.getContext('2d').drawImage(image, 0, 0);
      const original = source.getContext('2d').getImageData(0, 0, source.width, source.height).data;
      const exported = copy.getContext('2d').getImageData(0, 0, copy.width, copy.height).data;
      let transparent = 0,
        alphaDifference = 0;
      for (let index = 3; index < exported.length; index += 4) {
        alphaDifference = Math.max(alphaDifference, Math.abs(original[index] - exported[index]));
        if (exported[index] < 255) transparent++;
      }
      // PNG decoding can round unpremultiplied translucent colours differently.
      // Compare the visible result on its white paper background, plus alpha itself.
      function onWhite(image) {
        const result = document.createElement('canvas');
        result.width = source.width;
        result.height = source.height;
        const context = result.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, result.width, result.height);
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, result.width, result.height).data;
      }
      const visibleSource = onWhite(source),
        visibleExport = onWhite(image);
      let maxVisualDifference = 0;
      for (let index = 0; index < visibleSource.length; index++) {
        maxVisualDifference = Math.max(
          maxVisualDifference,
          Math.abs(visibleSource[index] - visibleExport[index]),
        );
      }
      return {
        maxVisualDifference,
        alphaDifference,
        transparent,
        width: copy.width,
        height: copy.height,
        sourceWidth: source.width,
        sourceHeight: source.height,
      };
    }, file.toString('base64'));
    expect(comparison.width).toBe(comparison.sourceWidth);
    expect(comparison.height).toBe(comparison.sourceHeight);
    expect(comparison.maxVisualDifference).toBeLessThanOrEqual(1);
    expect(comparison.alphaDifference).toBe(0);
    if (route === 'in-bloom') expect(comparison.transparent).toBeGreaterThan(0);
    else expect(comparison.transparent).toBe(0);
    await test.info().attach(`${route}-export`, { body: file, contentType: 'image/png' });
  }
});

test('Surface Design gallery thumbnail loads its SVG and renders all three shapes', async ({
  page,
}) => {
  await page.goto('/');
  const thumbnail = page.locator('a[href="/systematic-surface-design/"] .item');
  await expect(thumbnail).toHaveCSS('background-image', /systematic-surface-design\/preview\.svg/);
  const pixels = await thumbnail.evaluate(async (element) => {
    const background = getComputedStyle(element).backgroundImage;
    if (!background.startsWith('url(')) throw new Error(`Missing thumbnail: ${background}`);
    const image = new Image();
    image.src = background.slice(4, -1).replace(/^["']|["']$/g, '');
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 200;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, 200, 200);
    return [
      [150, 50],
      [50, 150],
      [120, 150],
    ].map(([x, y]) => [...context.getImageData(x, y, 1, 1).data]);
  });
  expect(pixels).toEqual([
    [14, 14, 14, 255],
    [14, 14, 14, 255],
    [14, 14, 14, 255],
  ]);
});

test('responsive controls keep desktop visible and remember mobile disclosure state', async ({
  page,
}) => {
  await page.goto('/in-bloom/');
  const disclosure = page.locator('.controls-disclosure');
  await expect(disclosure).toHaveAttribute('open');
  await expect(page.getByText('Adjust artwork', { exact: true })).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(disclosure).not.toHaveAttribute('open');
  await page.getByText('Adjust artwork', { exact: true }).press('Enter');
  await expect(disclosure).toHaveAttribute('open');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect(disclosure).toHaveAttribute('open');
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(disclosure).toHaveAttribute('open');
});

test('Untitled gallery preview loads its contained dash study', async ({ page }) => {
  await page.goto('/');
  const thumbnail = page.locator('a[href="/untitled-1972/"] .item');
  await expect(thumbnail).toHaveCSS('background-image', /untitled-1972\/preview\.svg/);
  await expect(thumbnail).toHaveCSS('background-repeat', 'no-repeat');
  await expect(thumbnail).toHaveCSS('background-size', 'contain');
  const pixels = await thumbnail.evaluate(async (element) => {
    const image = new Image();
    image.src = getComputedStyle(element)
      .backgroundImage.slice(4, -1)
      .replace(/^["']|["']$/g, '');
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 640;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, 480, 640);
    return [
      [144, 224],
      [48, 320],
    ].map(([x, y]) => [...context.getImageData(x, y, 1, 1).data]);
  });
  expect(pixels).toEqual([
    [14, 14, 14, 255],
    [255, 255, 255, 255],
  ]);
});

test('desktop compositions centre the combined group with a consistent 48px gap', async ({
  page,
}) => {
  for (const route of ['in-bloom', 'polyposter']) {
    await page.goto(`/${route}/`);
    const layout = await page.evaluate(() => {
      const board = document.querySelector('.artboard').getBoundingClientRect();
      const controls = document.querySelector('.project-controls').getBoundingClientRect();
      const artwork = document.querySelector('.artwork-frame').getBoundingClientRect();
      return {
        gap: artwork.left - controls.right,
        groupCentre: (controls.left + artwork.right) / 2,
        boardCentre: (board.left + board.right) / 2,
        controlsTop: controls.top,
        artworkTop: artwork.top,
      };
    });
    expect(layout.gap).toBeCloseTo(48, 2);
    expect(layout.groupCentre).toBeCloseTo(layout.boardCentre, 2);
    expect(layout.controlsTop).toBeCloseTo(layout.artworkTop, 2);
  }
});

test('accessible slider values include units and export feedback retains focus', async ({
  page,
}) => {
  await page.goto('/in-bloom/');
  const speed = page.getByRole('slider', { name: 'Speed', exact: true });
  await expect(speed).toHaveAttribute('aria-valuetext', '7.0 seconds per cycle');
  await speed.press('ArrowRight');
  await expect(speed).toHaveAttribute('aria-valuetext', '7.1 seconds per cycle');
  await expect(page.getByRole('slider', { name: 'Size', exact: true })).toHaveAttribute(
    'aria-valuetext',
    '9 by 9 tiles',
  );
  const button = page.getByRole('button', { name: 'Export PNG', exact: true });
  await Promise.all([page.waitForEvent('download'), button.press('Enter')]);
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#project-status')).toHaveText('PNG download started.');
  await expect(page.locator('#project-status')).toHaveAttribute('aria-atomic', 'true');
  await page.goto('/polyposter/');
  await expect(page.getByRole('slider', { name: 'Width', exact: true })).toHaveAttribute(
    'aria-valuetext',
    '800 pixels',
  );
  await expect(page.getByRole('slider', { name: 'Height', exact: true })).toHaveAttribute(
    'aria-valuetext',
    '1100 pixels',
  );
});

test('Surface Design provides tile action descriptions and concise operation feedback', async ({
  page,
}) => {
  await page.goto('/systematic-surface-design/');
  const tile = page.getByRole('button', { name: 'Row 1, Column 1, empty, tentative', exact: true });
  await expect(tile).toHaveAttribute(
    'aria-description',
    'Activate to place a square in this tile.',
  );
  await tile.press('Enter');
  const placed = page.getByRole('button', {
    name: 'Row 1, Column 1, square, tentative',
    exact: true,
  });
  await expect(placed).toHaveAttribute('aria-description', 'Activate to lock this tile.');
  await expect(page.locator('#surface-status')).toHaveText('Row 1, Column 1, square, tentative');
  await placed.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Row 1, Column 1, square, locked', exact: true }),
  ).toHaveAttribute('aria-description', 'Activate to unlock this tile.');
  await page.getByRole('button', { name: 'Randomise', exact: true }).click();
  await expect(page.locator('#surface-status')).toHaveText(
    'Randomised 15 unlocked tiles. 1 locked tile preserved.',
  );
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#surface-status')).toHaveText(
    'Grid reset. All 16 tiles are empty and unlocked.',
  );
});

test('Practice supports keyboard solving, hints, reset and a fresh attempt', async ({ page }) => {
  // Fixed randomness gives a known diagonal puzzle without exposing production internals.
  await page.addInitScript(() => {
    window.puzzleRandom = 0.5;
    Math.random = () => window.puzzleRandom;
  });
  await page.goto('/practice/');
  const canvas = page.locator('#art');
  const again = page.getByRole('button', { name: 'Again', exact: true });
  const hint = page.locator('[data-action-path="hint"]');
  await expect(page.getByRole('slider')).toHaveCount(8);
  await expect(again).toHaveAttribute('aria-disabled', 'true');
  const initial = await canvas.evaluate((canvas) => canvas.toDataURL());
  await again.press('Enter');
  expect(await canvas.evaluate((canvas) => canvas.toDataURL())).toBe(initial);
  await hint.press('Enter');
  await expect(hint).toHaveText('↘ Down and right');
  const firstRow = page.getByRole('slider', { name: 'Row 1', exact: true });
  await firstRow.press('ArrowRight');
  await expect(firstRow).toHaveAttribute('aria-valuenow', '1');
  await expect.poll(() => canvas.evaluate((canvas) => canvas.toDataURL())).not.toBe(initial);
  await page.getByRole('button', { name: 'Reset', exact: true }).press('Enter');
  await expect(firstRow).toHaveAttribute('aria-valuenow', '0');
  await expect.poll(() => canvas.evaluate((canvas) => canvas.toDataURL())).toBe(initial);
  await expect(hint).toHaveText('↘ Down and right');
  for (let row = 1; row <= 8; row++) {
    await page.getByRole('slider', { name: `Row ${row}`, exact: true }).press('Enter');
    const input = page.getByRole('textbox', { name: `Row ${row} value`, exact: true });
    await input.fill('48');
    await input.press('Enter');
    await expect(page.getByRole('slider', { name: `Row ${row}`, exact: true })).toHaveAttribute(
      'aria-valuetext',
      new RegExp(`upright letters.*${'PRACTICE'[row - 1]} in column ${row}`),
    );
  }
  await expect(canvas).toHaveAttribute('aria-label', /Perfect. PRACTICE is complete/);
  await expect(again).toHaveAttribute('aria-disabled', 'false');
  await page.screenshot({ path: '/tmp/weeideas-practice-desktop.png', fullPage: true });
  await page.evaluate(() => {
    window.puzzleRandom = 0.9;
  });
  await again.press('Enter');
  await expect(again).toHaveAttribute('aria-disabled', 'true');
  await expect(hint).toHaveText('Hint');
  for (const slider of await page.getByRole('slider').all())
    await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await expect(canvas).not.toHaveAttribute('aria-label', /Perfect/);
  expect(await canvas.evaluate((canvas) => canvas.toDataURL())).not.toBe(initial);
  await hint.press('Enter');
  await expect(hint).toHaveText('↙ Down and left');
});

test('social preview metadata points to the available wide image', async ({ page }) => {
  for (const route of ['/', '/practice/']) {
    await page.goto(route);
    const image = page.locator('meta[property="og:image"]');
    await expect(image).toHaveAttribute('content', 'https://weeideas.com/_/icons/og-1200x630.jpg');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    const response = await page.request.get('/_/icons/og-1200x630.jpg');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/jpeg');
  }
});

test('Practice stays centred in its responsive artboard', async ({ page }) => {
  for (const width of [390, 768, 900]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/practice/');
    const shell = await page.locator('.artboard .shell').boundingBox();
    const frame = await page.locator('.artwork-frame').boundingBox();
    expect(Math.abs(frame.x + frame.width / 2 - (shell.x + shell.width / 2))).toBeLessThan(1);
  }
});
