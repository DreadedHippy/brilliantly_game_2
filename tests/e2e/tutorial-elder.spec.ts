import { expect, test } from '@playwright/test';

test('tutorial elder idle has transparent animated frames and a usable reduced-motion preview', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/assets/sprites/tutorial-elder/preview.html');
  await expect(
    page.getByRole('heading', { name: 'Tutorial mentor' }),
  ).toBeVisible();
  await expect(page.locator('#stats')).toContainText(
    'Idle · 10 frames · 5.00 fps · 2.00s loop',
  );
  const canvas = page.locator('#detail');
  await expect(canvas).toHaveAttribute('data-frame', /^\d+$/);
  const pixels = await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const alpha = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let visible = 0;
    for (let index = 3; index < alpha.length; index += 4) {
      if (alpha[index] === 0) transparent++;
      if (alpha[index]! > 127) visible++;
    }
    return { transparent, visible };
  });
  expect(pixels.transparent).toBeGreaterThan(1000);
  expect(pixels.visible).toBeGreaterThan(1000);
  const first = await canvas.getAttribute('data-frame');
  await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe(first);
  await page.getByRole('button', { name: 'Background: dark' }).click();
  await expect(page.locator('.stage').first()).toHaveClass(/light/);
  await page.screenshot({
    path: test.info().outputPath('tutorial-elder-idle.png'),
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
