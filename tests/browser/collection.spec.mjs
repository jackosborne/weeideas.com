import { test, expect } from '@playwright/test';

const selected = (page, name) => page.locator(`.piece-selector__step[aria-label="${name}"]`);

async function switchTo(page, name) {
  await selected(page, name).click();
  await expect(page).toHaveURL(new RegExp(`/on-repeat/${name.toLowerCase()}/$`));
  await expect(selected(page, name)).toHaveAttribute('aria-current', 'page');
}

test('collection entry and direct URLs load local assets and shared metadata', async ({
  page,
  request,
}) => {
  await page.goto('/on-repeat/');
  await expect(page).toHaveURL(/\/on-repeat\/winamp\/$/);
  for (const slug of ['winamp', 'ipod']) {
    await page.goto(`/on-repeat/${slug}/`);
    await expect(page.getByRole('heading', { name: 'On Repeat', exact: true })).toBeVisible();
    await expect(page.locator('time')).toHaveText('April, 2026');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Recreating the music tools/,
    );
    await expect(page.getByText('Work in progress', { exact: true })).toHaveCount(0);
    if (slug === 'ipod') {
      const cover = page.locator('.album-artwork img');
      await expect(cover).toHaveAttribute('src', '/on-repeat/ipod/assets/siren.jpg');
      await expect.poll(() => cover.evaluate((image) => image.naturalWidth)).toBe(320);
    }
    for (const file of ['custom.css', 'custom.js']) {
      const response = await request.get(`/on-repeat/${slug}/${file}`);
      expect(response.ok()).toBe(true);
    }
  }
});

test('switching preserves the document, scroll, player state and browser history', async ({
  page,
}) => {
  await page.goto('/on-repeat/winamp/');
  await page.locator('[data-playlist-toggle]').click();
  await page.locator('.piece-selector').scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => {
    window.collectionDocument = document;
    return window.scrollY;
  });
  await switchTo(page, 'iPod');
  expect(await page.evaluate(() => document === window.collectionDocument)).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
  await page.locator('#play-button').click();
  await expect(page.locator('#play-button')).toHaveAttribute('aria-pressed', 'false');
  await switchTo(page, 'Winamp');
  await expect(page.locator('[data-playlist-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await page.goBack();
  await expect(selected(page, 'iPod')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#play-button')).toHaveAttribute('aria-pressed', 'false');
  await page.goForward();
  await expect(selected(page, 'Winamp')).toHaveAttribute('aria-current', 'page');
});

test('arrows respect collection boundaries and keyboard activation switches pieces', async ({
  page,
}) => {
  await page.goto('/on-repeat/winamp/');
  await expect(page.getByRole('button', { name: 'Previous piece' })).toBeDisabled();
  await page.getByRole('link', { name: 'Next piece' }).focus();
  await page.keyboard.press('Enter');
  await expect(selected(page, 'iPod')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Next piece' })).toBeDisabled();
  await expect(selected(page, 'iPod')).toBeFocused();
  await page.getByRole('link', { name: 'Previous piece' }).click();
  await expect(selected(page, 'Winamp')).toHaveAttribute('aria-current', 'page');
});

test('stepper keeps its nodes and animates the outgoing and incoming widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/on-repeat/winamp/');
  await page.evaluate(() => {
    const pill = document.querySelector('.piece-selector__step span');
    window.originalPill = pill;
    window.pillTransitions = [];
    pill.addEventListener('transitionrun', (event) => {
      if (event.propertyName !== 'width') return;
      const transition = pill
        .getAnimations()
        .find((animation) => animation.transitionProperty === 'width');
      if (!transition) return;
      // Sample a known point in the real CSS transition, independent of runner speed.
      transition.pause();
      transition.currentTime = transition.effect.getTiming().duration / 2;
      window.pillTransitions.push(pill.getBoundingClientRect().width);
      transition.play();
    });
  });
  await switchTo(page, 'iPod');
  await expect.poll(() => page.evaluate(() => window.pillTransitions.length)).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => window.originalPill === document.querySelector('.piece-selector__step span'),
    ),
  ).toBe(true);
  const samples = await page.evaluate(() => window.pillTransitions);
  expect(samples.some((width) => width > 8 && width < 28)).toBe(true);
  await expect
    .poll(() =>
      selected(page, 'Winamp').evaluate(
        (element) => element.querySelector('span').getBoundingClientRect().width,
      ),
    )
    .toBe(8);
  await expect
    .poll(() =>
      selected(page, 'iPod').evaluate(
        (element) => element.querySelector('span').getBoundingClientRect().width,
      ),
    )
    .toBe(28);
});

test('reduced motion resolves immediately and pagination stays anchored without overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/on-repeat/winamp/');
  await page.locator('.piece-selector').scrollIntoViewIfNeeded();
  const before = await page.locator('.piece-selector').boundingBox();
  await switchTo(page, 'iPod');
  await expect
    .poll(() =>
      selected(page, 'iPod').evaluate(
        (element) => element.querySelector('span').getBoundingClientRect().width,
      ),
    )
    .toBe(28);
  expect(
    await selected(page, 'iPod').evaluate(
      (element) => getComputedStyle(element.querySelector('span')).transitionDuration,
    ),
  ).toBe('0s');
  const after = await page.locator('.piece-selector').boundingBox();
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('selector arrows offer 44px targets and their edges activate the destination', async ({
  page,
  isMobile,
}) => {
  await page.goto('/on-repeat/winamp/');
  for (const control of await page.locator('.piece-selector__arrow').all()) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const next = page.getByRole('link', { name: 'Next piece' });
  if (isMobile) await next.tap({ position: { x: 2, y: 22 } });
  else await next.click({ position: { x: 2, y: 22 } });
  await expect(selected(page, 'iPod')).toHaveAttribute('aria-current', 'page');
});

test('Winamp sliders have keyboard values and eject/reboot restores focus without a reload', async ({
  page,
}) => {
  await page.goto('/on-repeat/winamp/');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  const bitrate = page.getByRole('slider', { name: 'Bit rate', exact: true });
  await bitrate.focus();
  await page.keyboard.press('End');
  await expect(bitrate).toHaveAttribute('aria-valuenow', '320');
  await expect(bitrate).toHaveAttribute('aria-valuetext', '320 kilobits per second');
  await page.keyboard.press('Home');
  await expect(bitrate).toHaveAttribute('aria-valuenow', '96');
  const position = page.getByRole('slider', { name: 'Track position', exact: true });
  await position.focus();
  await page.keyboard.press('ArrowRight');
  await expect(position).toHaveAttribute('aria-valuenow', '5');
  await page.evaluate(() => {
    window.rebootDocument = document;
  });
  await page.getByRole('button', { name: 'Eject player', exact: true }).focus();
  await page.keyboard.press('Enter');
  const reboot = page.getByRole('button', { name: 'Reboot', exact: true });
  await expect(reboot).toBeFocused();
  await expect(page.locator('.player-stack')).toHaveAttribute('inert', '');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  await expect(page.locator('.player-stack')).not.toHaveAttribute('inert', '');
  expect(await page.evaluate(() => window.rebootDocument === document)).toBe(true);
});

test('iPod labels describe seeking and keyboard controls expose visible focus', async ({
  page,
  browserName,
}) => {
  await page.goto('/on-repeat/ipod/');
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  const beforeSeek = await page.locator('#elapsed-time').textContent();
  const [minutes, seconds] = beforeSeek.split(':').map(Number);
  const expectedSeconds = minutes * 60 + seconds + 5;
  const expectedTime = `${Math.floor(expectedSeconds / 60)}:${String(expectedSeconds % 60).padStart(2, '0')}`;
  const seek = page.getByRole('button', { name: 'Seek forward five seconds', exact: true });
  await page.getByRole('button', { name: 'Seek backward five seconds', exact: true }).focus();
  // WebKit uses Option-Tab to include controls when full keyboard access is off.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(seek).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#elapsed-time')).toHaveText(expectedTime);
  expect(await seek.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  await expect(
    page.getByRole('button', { name: 'Menu (unavailable)', exact: true }),
  ).toBeDisabled();
});

test('production homepage shows one collection tile with a working preview and no draft labels', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const tile = page
    .locator('.card')
    .filter({ has: page.getByRole('heading', { name: 'On Repeat', exact: true }) });
  await expect(tile).toHaveCount(1);
  await expect(tile).toContainText(
    'Recreating the music tools and rituals that shaped a childhood of listening.',
  );
  const image = await tile
    .locator('.item')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  const url = image.match(/url\(["']?(.*?)["']?\)/)[1];
  expect((await request.get(url)).ok()).toBe(true);
  await tile.getByRole('link', { name: 'On Repeat', exact: true }).click();
  await expect(page).toHaveURL(/\/on-repeat\/winamp\/$/);
  await expect(page.locator('.breadcrumb')).not.toContainText('(draft)');
  await expect(page).toHaveTitle(/On Repeat/);
  expect(await page.title()).not.toContain('(draft)');
});
