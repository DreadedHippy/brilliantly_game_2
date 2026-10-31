import { expect, test } from '@playwright/test';

test('painted map has a compass, floating glowing nodes, and keyboard entry', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.map-overlay')).toHaveAttribute(
    'data-artwork',
    'ready',
  );
  const map = page.locator('#game');
  const compass = page.getByRole('img', { name: 'Compass, north points up' });
  const mapBounds = (await map.boundingBox())!;
  const compassBounds = (await compass.boundingBox())!;
  expect(compassBounds.x).toBeGreaterThan(mapBounds.x + mapBounds.width * 0.75);
  expect(compassBounds.y).toBeGreaterThan(mapBounds.y + mapBounds.height * 0.7);
  const marker = page.locator('.map-node[data-region-id="river-crossing"]');
  const lift = marker.locator('.map-node-lift');
  const initialY = (await lift.boundingBox())!.y;
  const initialShadow = await marker
    .locator('.map-node-disc')
    .evaluate((element) => getComputedStyle(element).boxShadow);
  await marker.hover();
  await expect
    .poll(async () => (await lift.boundingBox())!.y)
    .toBeLessThan(initialY - 4);
  await expect
    .poll(() =>
      marker
        .locator('.map-node-disc')
        .evaluate((element) => getComputedStyle(element).boxShadow),
    )
    .not.toBe(initialShadow);
  await page.screenshot({
    path: test.info().outputPath('map-hover-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('heading', { name: 'The first route' }).hover();
  await page.locator('.destination[data-region-id="river-crossing"]').focus();
  await expect(marker).toHaveClass(/is-highlighted/);
  await marker.focus();
  await expect(marker).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.map-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(page.locator('.map-overlay')).toHaveCount(1);
  await expect(
    page.locator('.map-node[data-region-id="highland-path"]'),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test('touch map preserves framing and reduced motion retains static glow', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('/');
  const marker = page.locator('.map-node[data-region-id="river-crossing"]');
  await expect(marker).toBeVisible();
  await marker.focus();
  await expect(marker.locator('.map-node-lift')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(marker.locator('.map-node-lift')).toHaveCSS('transform', 'none');
  const bounds = (await page.locator('#game').boundingBox())!;
  expect(bounds.width / bounds.height).toBeCloseTo(16 / 9, 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('map-mobile.png'),
    fullPage: true,
  });
  await marker.tap();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await context.close();
});

test('artwork failure preserves usable destinations and explains the missing art', async ({
  page,
}) => {
  await page.route('**/assets/maps/world-map-v1.webp', (route) =>
    route.abort(),
  );
  await page.goto('/');
  await expect(page.locator('.map-overlay')).toHaveAttribute(
    'data-artwork',
    'unavailable',
  );
  await expect(
    page.getByText('Map artwork is unavailable. Reload to try again.'),
  ).toBeVisible();
  await page.locator('.map-node[data-region-id="river-crossing"]').click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
});
