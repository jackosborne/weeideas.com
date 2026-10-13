import { test, expect } from '@playwright/test';

async function mockMotion(page, permission) {
  await page.addInitScript((result) => {
    window.requestedMotionPermission = 0;
    class MockOrientation extends Event {
      static async requestPermission() {
        window.requestedMotionPermission++;
        return result;
      }
      constructor(beta, gamma) {
        super('deviceorientation');
        this.beta = beta;
        this.gamma = gamma;
      }
    }
    window.DeviceOrientationEvent = MockOrientation;
    window.emitMotion = (beta, gamma) => window.dispatchEvent(new MockOrientation(beta, gamma));
  }, permission);
}

test('iPhone touch layouts fit all artwork frames without horizontal overflow', async ({
  page,
}) => {
  for (const route of [
    'in-bloom',
    'polyposter',
    'shiny',
    'systematic-surface-design',
    'untitled-1972',
    'raspberry-ripple',
    'practice',
  ]) {
    await page.goto(`/${route}/`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(page.locator('.artwork-frame')).toBeVisible();
  }
});

test('Shiny requests permission after a tap, receives orientation and recalibrates', async ({
  page,
}) => {
  await mockMotion(page, 'granted');
  await page.goto('/shiny/');
  await page.locator('.card.final').tap();
  await expect(page.locator('.motion-hint')).toHaveText('Motion on — tap card to recalibrate');
  expect(await page.evaluate(() => window.requestedMotionPermission)).toBe(1);
  await page.evaluate(() => {
    window.emitMotion(0, 0);
    window.emitMotion(10, 10);
  });
  expect(
    await page.locator('.card.final').evaluate((el) => el.style.getPropertyValue('--ry')),
  ).not.toBe('0.00deg');
  await page.locator('.card.final').tap();
  await page.evaluate(() => window.emitMotion(25, 25));
  expect(await page.evaluate(() => window.requestedMotionPermission)).toBe(1);
});

test('Shiny reports denied permission and allows retry without pretending motion is active', async ({
  page,
}) => {
  await mockMotion(page, 'denied');
  await page.goto('/shiny/');
  await page.locator('.card.final').tap();
  await expect(page.locator('.motion-hint')).toHaveText(
    'Permission needed — tap again, then Allow',
  );
  await expect(page.locator('.card.final')).not.toHaveClass(/motion-enabled/);
  await page.locator('.card.final').tap();
  expect(await page.evaluate(() => window.requestedMotionPermission)).toBe(2);
});

test('reduced motion does not request device orientation permission', async ({ page }) => {
  await mockMotion(page, 'granted');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/shiny/');
  await page.locator('.card.final').tap();
  expect(await page.evaluate(() => window.requestedMotionPermission)).toBe(0);
});

test('shared mobile controls follow artwork, collapse initially and preserve settings', async ({
  page,
}) => {
  for (const [route, slider] of [
    ['in-bloom', 'Speed'],
    ['polyposter', 'Sides'],
    ['practice', 'Row 1'],
  ]) {
    await page.goto(`/${route}/`);
    const disclosure = page.locator('.controls-disclosure');
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(page.getByRole('slider', { name: slider, exact: true })).toBeHidden();
    const positions = await page.evaluate(() => ({
      artwork: document.querySelector('.artwork-frame').getBoundingClientRect().bottom,
      controls: document.querySelector('.project-controls').getBoundingClientRect().top,
      lastChildIsControls: document
        .querySelector('.shell')
        .lastElementChild.classList.contains('project-controls'),
    }));
    expect(positions.controls).toBeGreaterThan(positions.artwork);
    expect(positions.lastChildIsControls).toBe(true);
    await page.getByText('Adjust artwork', { exact: true }).tap();
    const control = page.getByRole('slider', { name: slider, exact: true });
    await control.press('ArrowRight');
    const value = await control.getAttribute('aria-valuenow');
    await page.getByText('Adjust artwork', { exact: true }).tap();
    await expect(control).toBeHidden();
    await page.getByText('Adjust artwork', { exact: true }).tap();
    await expect(control).toHaveAttribute('aria-valuenow', value);
  }
});

test('mobile editing keeps a live preview visible at lower sliders without changing export dimensions', async ({
  page,
}) => {
  for (const [route, slider] of [
    ['in-bloom', 'Roundness'],
    ['polyposter', 'Height'],
    ['practice', 'Row 8'],
  ]) {
    await page.goto(`/${route}/`);
    const original = await page
      .locator('.artwork-frame canvas')
      .evaluate((canvas) => [canvas.width, canvas.height]);
    await page.getByText('Adjust artwork', { exact: true }).tap();
    const control = page.getByRole('slider', { name: slider, exact: true });
    await control.scrollIntoViewIfNeeded();
    await control.press('ArrowRight');
    await expect(page.locator('.controls-preview__image')).toBeVisible();
    const geometry = await page.evaluate(() => {
      const preview = document.querySelector('.controls-preview').getBoundingClientRect();
      const controls = [...document.querySelectorAll('[role="slider"]')];
      const slider = controls[controls.length - 1].getBoundingClientRect();
      return {
        top: preview.top,
        bottom: preview.bottom,
        sliderTop: slider.top,
        viewport: innerHeight,
      };
    });
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThan(geometry.viewport / 2);
    const editing = await page
      .locator('.artwork-frame canvas')
      .evaluate((canvas) => [canvas.width, canvas.height]);
    expect(editing).toEqual(original);
    await page.getByRole('button', { name: 'Back to artwork', exact: true }).tap();
    await expect(page.locator('.controls-disclosure')).not.toHaveAttribute('open');
    await expect(page.locator('.artwork-frame')).toBeVisible();
  }
});

test('mobile live preview updates for keyboard adjustments under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/in-bloom/');
  await page.getByText('Adjust artwork', { exact: true }).tap();
  const preview = page.locator('.controls-preview__image');
  await expect.poll(() => preview.evaluate((canvas) => canvas.width)).toBeGreaterThan(100);
  const before = await preview.evaluate((canvas) => canvas.toDataURL());
  await page.getByRole('slider', { name: 'Size', exact: true }).press('ArrowRight');
  await expect.poll(() => preview.evaluate((canvas) => canvas.toDataURL())).not.toBe(before);
});

test('homepage filters offer 44px touch targets and preserve filtering', async ({ page }) => {
  await page.goto('/');
  const buttons = page.locator('#filters .pill');
  for (const button of await buttons.all()) {
    const bounds = await button.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('#filters')).toHaveCSS('row-gap', '12px');
  await page.getByRole('button', { name: 'Interactive', exact: true }).tap();
  await expect(page.locator('.card[data-tags]:visible')).toHaveCount(4);
});

test('Practice touch editing updates its preview and returns focus without losing settings', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice/');
  const summary = page.getByText('Adjust artwork', { exact: true });
  await summary.tap();
  const preview = page.locator('.controls-preview__image');
  await expect.poll(() => preview.evaluate((canvas) => canvas.width)).toBeGreaterThan(100);
  const before = await preview.evaluate((canvas) => canvas.toDataURL());
  const row = page.getByRole('slider', { name: 'Row 8', exact: true });
  await row.press('Enter');
  const input = page.getByRole('textbox', { name: 'Row 8 value', exact: true });
  await input.fill('48');
  await input.press('Enter');
  await expect.poll(() => preview.evaluate((canvas) => canvas.toDataURL())).not.toBe(before);
  await page.screenshot({ path: '/tmp/weeideas-practice-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Back to artwork', exact: true }).tap();
  await expect(summary).toBeFocused();
  await expect(page.locator('#art')).toBeVisible();
  await summary.tap();
  await expect(row).toHaveAttribute('aria-valuenow', '48');
});
