import { expect, test } from '@playwright/test';

test('masked enemy idle has transparent animated frames and responsive playback', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/assets/sprites/bell-mask-enemy/preview.html');
  await expect(
    page.getByRole('heading', { name: 'Bell-mask enemy', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#stats')).toContainText('5.00 fps · 2.00s loop');
  const detail = page.locator('#detail');
  await expect(detail).toHaveAttribute('data-frame', /^\d+$/);
  const alpha = await detail.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const rgba = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0,
      solid = 0;
    for (let i = 3; i < rgba.length; i += 4) {
      if (rgba[i] === 0) clear++;
      if (rgba[i]! > 127) solid++;
    }
    return { clear, solid, width: canvas.width, height: canvas.height };
  });
  expect(alpha).toMatchObject({ width: 512, height: 384 });
  expect(alpha.clear).toBeGreaterThan(1000);
  expect(alpha.solid).toBeGreaterThan(1000);
  const frame = await detail.getAttribute('data-frame');
  await expect.poll(() => detail.getAttribute('data-frame')).not.toBe(frame);
  await page.getByRole('button', { name: 'Background: dark' }).click();
  await expect(page.locator('.stage').first()).toHaveClass(/light/);
  await page.screenshot({
    path: test.info().outputPath('bell-mask-enemy-idle.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await expect(detail).toHaveAttribute('data-frame', '0');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => detail.getAttribute('data-frame')).not.toBe('0');
  expect(errors).toEqual([]);
});
