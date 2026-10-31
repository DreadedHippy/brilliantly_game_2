import { expect, test } from '@playwright/test';

test('hero preview loads genuine transparent frames and plays all three actions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/assets/sprites/main-hero/preview.html');
  await expect(page.locator('#stats')).toContainText('Idle · 6 frames');
  const canvas = page.locator('#detail');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-frame', /^\d+$/);
  const alpha = await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let visible = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent += 1;
      if (pixels[i]! > 127) visible += 1;
    }
    return { transparent, visible };
  });
  expect(alpha.transparent).toBeGreaterThan(1000);
  expect(alpha.visible).toBeGreaterThan(1000);
  for (const [label, start] of [
    ['Walk', 8],
    ['Run', 16],
  ] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('#stats')).toContainText(`${label} · 8 frames`);
    await expect
      .poll(async () => Number(await canvas.getAttribute('data-frame')))
      .toBeGreaterThanOrEqual(start);
    const first = await canvas.getAttribute('data-frame');
    await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe(first);
  }
  await page.getByRole('button', { name: 'Background: dark' }).click();
  await expect(page.locator('.stage').first()).toHaveClass(/light/);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('hero-animation-preview.png'),
    fullPage: true,
  });
  const atlas = await page.request.get(
    '/assets/sprites/main-hero/main-hero.png',
  );
  expect(atlas.ok()).toBe(true);
  expect(errors).toEqual([]);
});

test('hero preview honors reduced motion and fits a narrow display', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/assets/sprites/main-hero/preview.html');
  await expect(page.locator('#stats')).toContainText('Idle · 6 frames');
  await expect(page.locator('#detail')).toHaveAttribute('data-frame', /^\d+$/);
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const first = await page.locator('#detail').getAttribute('data-frame');
  await expect
    .poll(() => page.locator('#detail').getAttribute('data-frame'))
    .not.toBe(first);
});
