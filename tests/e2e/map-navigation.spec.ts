import { expect, test, type Page } from '@playwright/test';

async function expectMapCoversViewport(page: Page): Promise<void> {
  const viewport = (await page.locator('#game').boundingBox())!;
  const world = (await page.locator('.map-world').boundingBox())!;
  expect(world.x).toBeLessThanOrEqual(viewport.x + 1);
  expect(world.y).toBeLessThanOrEqual(viewport.y + 1);
  expect(world.x + world.width).toBeGreaterThanOrEqual(
    viewport.x + viewport.width - 1,
  );
  expect(world.y + world.height).toBeGreaterThanOrEqual(
    viewport.y + viewport.height - 1,
  );
}

test('wheel zoom anchors markers to the cursor and keeps compass fixed', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const compass = page.locator('.map-compass');
  const compassBefore = (await compass.boundingBox())!;
  const disc = page.locator(
    '.map-node[data-region-id="river-crossing"] .map-node-disc',
  );
  const before = (await disc.boundingBox())!;
  const x = before.x + before.width / 2;
  const y = before.y + before.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -300);
  await expect(page.getByLabel('Map zoom', { exact: true })).not.toHaveText(
    '100%',
  );
  const after = (await disc.boundingBox())!;
  expect(after.x + after.width / 2).toBeCloseTo(x, 0);
  expect(after.y + after.height / 2).toBeCloseTo(y, 0);
  expect(await compass.boundingBox()).toEqual(compassBefore);
  await expectMapCoversViewport(page);
  await page.getByRole('button', { name: 'Reset map view' }).click();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  await expect(
    page.getByRole('button', { name: 'Zoom out', exact: true }),
  ).toBeDisabled();
});

test('dragging across a level pans without entering it, clamps at edges, and survives resize', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const marker = page.locator(
    '.map-node[data-region-id="river-crossing"] .map-node-disc',
  );
  const point = (await marker.boundingBox())!;
  const before = (await page.locator('.map-world').boundingBox())!;
  await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    point.x + point.width / 2 + 80,
    point.y + point.height / 2 + 30,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(page.locator('.map-overlay')).toBeVisible();
  expect((await page.locator('.map-world').boundingBox())!.x).toBeGreaterThan(
    before.x,
  );
  const viewport = (await page.locator('#game').boundingBox())!;
  await page.mouse.move(
    viewport.x + viewport.width / 2,
    viewport.y + viewport.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(0, 0, { steps: 5 });
  await page.mouse.up();
  await expectMapCoversViewport(page);
  await page.setViewportSize({ width: 600, height: 900 });
  await expectMapCoversViewport(page);
  await page.screenshot({
    path: test.info().outputPath('panned-map.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Reset map view' }).click();
  await page.locator('.map-node[data-region-id="river-crossing"]').click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  await expect(page.locator('.map-navigation')).toHaveCount(1);
});

test('map keyboard shortcuts zoom, pan, and reset', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.map-world')).toBeVisible();
  await page.locator('#game').focus();
  await page.keyboard.press('+');
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('125%');
  const before = (await page.locator('.map-world').boundingBox())!;
  await page.keyboard.press('ArrowRight');
  expect((await page.locator('.map-world').boundingBox())!.x).toBeLessThan(
    before.x,
  );
  await page.keyboard.press('Home');
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  await expectMapCoversViewport(page);
});

test('two-finger pinch and touch pan preserve map bounds and subsequent taps', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.map-world')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).tap();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('125%');
  await page.getByRole('button', { name: 'Reset map view' }).tap();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  const viewport = (await page.locator('#game').boundingBox())!;
  const x = viewport.x + viewport.width / 2;
  const y = viewport.y + viewport.height / 2;
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: x - 30, y },
      { id: 2, x: x + 30, y },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 1, x: x - 65, y },
      { id: 2, x: x + 65, y },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(page.getByLabel('Map zoom', { exact: true })).not.toHaveText(
    '100%',
  );
  const before = (await page.locator('.map-world').boundingBox())!;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x, y }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 1, x: x - 35, y: y - 20 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect((await page.locator('.map-world').boundingBox())!.x).toBeLessThan(
    before.x,
  );
  await expectMapCoversViewport(page);
  await page.getByRole('button', { name: 'Reset map view' }).tap();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  await page.locator('.map-node[data-region-id="river-crossing"]').tap();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await context.close();
});
