import { expect, test } from '@playwright/test';

for (const [slug, title] of [
  ['earth-tortoise', 'Earth tortoise'],
  ['ember-lion', 'Ember lion'],
  ['wind-owl', 'Wind owl'],
]) {
  test(`${slug} renders transparent idle frames and responsive playback`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/assets/sprites/${slug}/preview.html`);
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator('#stats')).toContainText('2.00s loop');
    const canvas = page.locator('#detail');
    await expect(canvas).toHaveAttribute('data-frame', /^\d+$/);
    const alpha = await canvas.evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const pixels = canvas
        .getContext('2d')!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0,
        solid = 0,
        soft = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) clear++;
        if (pixels[i]! > 127) solid++;
        if (pixels[i]! > 4 && pixels[i]! < 250) soft++;
      }
      return { clear, solid, soft };
    });
    expect(alpha.clear).toBeGreaterThan(1000);
    expect(alpha.solid).toBeGreaterThan(1000);
    expect(alpha.soft).toBeGreaterThan(100);
    const frame = await canvas.getAttribute('data-frame');
    await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe(frame);
    await page.getByRole('button', { name: 'Background: dark' }).click();
    await expect(page.locator('.stage').first()).toHaveClass(/light/);
    await page.screenshot({
      path: test.info().outputPath(`${slug}-idle.png`),
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
}
