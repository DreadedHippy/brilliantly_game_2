import { expect, test, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.panel-copy')).toContainText('Arojinle');
}

async function actor(page: Page) {
  return page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'stage-1-1',
    );
    const player = scene.children.getByName('stage-player');
    return {
      x: player.x as number,
      y: player.y as number,
      cameraX: scene.cameras.main.worldView.x as number,
      cameraY: scene.cameras.main.worldView.y as number,
      zoom: scene.cameras.main.zoom as number,
      cue: scene.children.getByName('hero-visibility-cue').visible as boolean,
    };
  });
}

async function tapWorld(page: Page, x: number, y: number) {
  const state = await actor(page),
    canvas = page.locator('#game canvas'),
    box = (await canvas.boundingBox())!;
  await canvas.click({
    position: {
      x: (((x - state.cameraX) * state.zoom) / 960) * box.width,
      y: (((y - state.cameraY) * state.zoom) / 540) * box.height,
    },
  });
}

test('off-road taps detour around Arojinle and keep the corrected name in the interface', async ({
  page,
}) => {
  await enter(page);
  await tapWorld(page, 510, 600);
  await expect
    .poll(async () => {
      const p = await actor(page);
      return Math.hypot(p.x - 510, p.y - 600);
    })
    .toBeLessThan(9);
  await tapWorld(page, 510, 400);
  let closest = Infinity;
  await expect
    .poll(async () => {
      const p = await actor(page);
      closest = Math.min(closest, Math.hypot(p.x - 510, p.y - 475));
      return Math.hypot(p.x - 510, p.y - 400);
    })
    .toBeLessThan(9);
  expect(closest).toBeGreaterThanOrEqual(42.9);
  await page.screenshot({
    path: test.info().outputPath('off-road-arojinle.png'),
    fullPage: true,
  });
});

test('walking behind a tree keeps an actor-shaped cue visible without fading the tree', async ({
  page,
}) => {
  await enter(page);
  await page.keyboard.down('w');
  await expect
    .poll(async () => (await actor(page)).cue, { timeout: 5000 })
    .toBe(true);
  await page.keyboard.up('w');
  const alpha = await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'stage-1-1',
    );
    return scene.children.list
      .filter(
        (child: { texture?: { key: string } }) =>
          child.texture?.key === 'stage-baobab',
      )
      .map((child: { alpha: number }) => child.alpha);
  });
  expect(alpha.every((value: number) => value === 1)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('hero-behind-canopy.png'),
    fullPage: true,
  });
});

test('both directional sprite loops and their neutral poses load in the asset preview', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/assets/sprites/main-hero/directions/preview.html');
  await expect(page.locator('#stats')).toContainText('Walk-down');
  const canvas = page.locator('#detail');
  await expect(canvas).toHaveAttribute('data-frame', /^\d+$/);
  const first = await canvas.getAttribute('data-frame');
  await expect.poll(() => canvas.getAttribute('data-frame')).not.toBe(first);
  await page.getByRole('button', { name: 'Walk up', exact: true }).click();
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-frame')))
    .toBeGreaterThanOrEqual(9);
  await page.getByRole('button', { name: 'Face up', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-frame', '17');
  await page.getByRole('button', { name: 'Face down', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-frame', '8');
  await page.getByRole('button', { name: 'Background: dark' }).click();
  await page.screenshot({
    path: test.info().outputPath('directional-hero.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
