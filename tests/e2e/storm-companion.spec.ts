import { expect, test } from '@playwright/test';

test('storm companion idle loads transparent frames, loops, and respects reduced motion', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/assets/sprites/storm-companion/preview.html');
  await expect(
    page.getByRole('heading', { name: 'Storm companion', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#stats')).toContainText(
    'Idle · 10 frames · 5.00 fps · 2.00s loop',
  );
  const canvas = page.locator('#detail');
  await expect(canvas).toHaveAttribute('data-frame', /^\d+$/);
  const alpha = await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0,
      visible = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
      if (pixels[i]! > 127) visible++;
    }
    return { transparent, visible, width: canvas.width, height: canvas.height };
  });
  expect(alpha).toMatchObject({ width: 512, height: 384 });
  expect(alpha.transparent).toBeGreaterThan(1000);
  expect(alpha.visible).toBeGreaterThan(1000);
  const first = await canvas.getAttribute('data-frame');
  await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe(first);
  await page.getByRole('button', { name: 'Background: dark' }).click();
  await expect(page.locator('.stage').first()).toHaveClass(/light/);
  await page.screenshot({
    path: test.info().outputPath('storm-companion-idle.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await expect(canvas).toHaveAttribute('data-frame', '0');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe('0');
  expect(errors).toEqual([]);
});
