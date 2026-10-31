import { expect, test, type Page } from '@playwright/test';
import stageOne from '../../public/assets/maps/stage-1-1/layout.json' with { type: 'json' };
import { sampleTrail } from '../../src/game/systems/trail';

const stageOneTrail = sampleTrail(
  stageOne.road.controlPoints,
  stageOne.road.samplesPerSegment,
);

async function enter(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const game = Reflect.get(window, '__brilliantlyGame');
    const scene = game.scene.getScene('stage-1-1');
    const player = scene.children.getByName('stage-player');
    const mentor = scene.children.getByName('stage-mentor');
    const camera = scene.cameras.main;
    return {
      x: player.x as number,
      y: player.y as number,
      animation: player.anims.currentAnim?.key as string,
      texture: player.texture.key as string,
      playing: player.anims.isPlaying as boolean,
      frame: Number(player.frame.name),
      cue: scene.children.getByName('hero-visibility-cue')?.visible as boolean,
      mentor: mentor.texture.key as string,
      cameraX: camera.worldView.x as number,
      cameraY: camera.worldView.y as number,
      width: camera.worldView.width as number,
      height: camera.worldView.height as number,
      zoom: camera.zoom as number,
    };
  });
}

test('generated actors animate, camera follows, level zoom is fixed, and world edges contain the player', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enter(page);
  const start = await snapshot(page);
  expect(start.mentor).toBe('elder-atlas');
  expect(start.animation).toBe('hero-idle');
  await page.screenshot({
    path: test.info().outputPath('stage-one-start.png'),
    fullPage: true,
  });
  await page.keyboard.down('d');
  await expect
    .poll(async () => (await snapshot(page)).x)
    .toBeGreaterThan(start.x + 60);
  expect((await snapshot(page)).animation).toBe('hero-walk');
  await page.keyboard.down('Shift');
  await expect
    .poll(async () => (await snapshot(page)).animation)
    .toBe('hero-run');
  await expect
    .poll(async () => (await snapshot(page)).cameraX)
    .toBeGreaterThan(start.cameraX + 60);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await expect
    .poll(async () => (await snapshot(page)).animation)
    .toBe('hero-idle');
  const beforeZoom = await snapshot(page);
  await page.locator('#game canvas').hover();
  await page.mouse.wheel(0, 900);
  await page.keyboard.press('-');
  expect((await snapshot(page)).zoom).toBe(beforeZoom.zoom);
  await page.keyboard.down('w');
  await expect
    .poll(async () => (await snapshot(page)).animation)
    .toBe('hero-walk-up');
  await page.waitForTimeout(1300);
  await page.keyboard.up('w');
  const boundary = await snapshot(page);
  expect(boundary.texture).toBe('hero-up-atlas');
  const separation = Math.min(
    ...stageOneTrail.map((point) =>
      Math.hypot(point.x - boundary.x, point.y - boundary.y),
    ),
  );
  expect(separation).toBeGreaterThan(stageOne.road.width / 2);
  expect(boundary.x).toBeGreaterThanOrEqual(100);
  expect(boundary.cameraX).toBeGreaterThanOrEqual(-1);
  expect(boundary.cameraY).toBeGreaterThanOrEqual(-1);
  expect(boundary.cameraX + boundary.width).toBeLessThanOrEqual(3601);
  expect(boundary.cameraY + boundary.height).toBeLessThanOrEqual(1441);
  await page.screenshot({
    path: test.info().outputPath('stage-one-follow.png'),
    fullPage: true,
  });
  await page.keyboard.down('s');
  await expect
    .poll(async () => (await snapshot(page)).animation)
    .toBe('hero-walk-down');
  await page.keyboard.up('s');
  await expect.poll(async () => (await snapshot(page)).playing).toBe(false);
  expect((await snapshot(page)).frame).toBe(8);
  expect(errors).toEqual([]);
});

test('tap-to-move uses camera world coordinates and cancels when the game loses focus', async ({
  page,
}) => {
  await enter(page);
  const before = await snapshot(page);
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: box.width * 0.79, y: box.height * 0.58 },
  });
  await expect
    .poll(async () => (await snapshot(page)).x)
    .toBeGreaterThan(before.x + 90);
  await page.getByRole('button', { name: 'Return to map' }).focus();
  const stop = await snapshot(page);
  await page.waitForTimeout(250);
  expect((await snapshot(page)).x).toBeCloseTo(stop.x, 1);
});

test('mobile movement buttons release cleanly, including a cancelled touch', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  const before = await snapshot(page);
  const right = page.getByRole('button', { name: 'Move right', exact: true });
  const bounds = (await right.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await expect
    .poll(async () => (await snapshot(page)).x)
    .toBeGreaterThan(before.x + 35);
  await page.mouse.up();
  const stopped = await snapshot(page);
  await page.waitForTimeout(220);
  expect((await snapshot(page)).x).toBeCloseTo(stopped.x, 1);
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  await expect
    .poll(async () => (await snapshot(page)).animation)
    .toBe('hero-idle');
  const canvas = (await page.locator('#game canvas').boundingBox())!;
  const center = {
    x: canvas.x + canvas.width / 2,
    y: canvas.y + canvas.height / 2,
  };
  const beforePinch = await snapshot(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: center.x - 45, y: center.y },
      { x: center.x + 45, y: center.y },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: center.x - 10, y: center.y },
      { x: center.x + 10, y: center.y },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect((await snapshot(page)).zoom).toBe(beforePinch.zoom);
  expect((await snapshot(page)).x).toBeCloseTo(beforePinch.x, 1);
});

test('the full winding trail is playable to the closed Stage 1-2 exit without combat', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await enter(page);
  await page.keyboard.down('Shift');
  const canvas = page.locator('#game canvas');
  const points = stageOneTrail.filter(
    (point, index) => index > 0 && index % 5 === 0 && point.x < stageOne.exit.x,
  );
  for (const target of [...points, stageOne.exit]) {
    const state = await snapshot(page);
    const box = (await canvas.boundingBox())!;
    const x = (((target.x - state.cameraX) * state.zoom) / 960) * box.width;
    const y = (((target.y - state.cameraY) * state.zoom) / 540) * box.height;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(box.width);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(box.height);
    await canvas.click({ position: { x, y } });
    await expect
      .poll(
        async () => {
          const actor = await snapshot(page);
          return Math.hypot(actor.x - target.x, actor.y - target.y);
        },
        { timeout: 5000 },
      )
      .toBeLessThan(10);
  }
  await page.keyboard.up('Shift');
  await expect(page.locator('#trail-status')).toContainText(
    'The next trail is not open yet',
  );
  await expect(page.locator('#trail-percent')).toHaveText('100%');
  const final = await snapshot(page);
  expect(final.cameraX + final.width).toBeLessThanOrEqual(
    stageOne.world.width + 1,
  );
  await page.screenshot({
    path: test.info().outputPath('stage-one-exit.png'),
    fullPage: true,
  });
  await expect(page.locator('#start-battle')).toHaveCount(0);
});

test('the authored scene preview verifies all eight free-roam navigation targets', async ({
  page,
}) => {
  await page.goto('/art/maps/stage-1-1/preview-v2/preview.html');
  await page.waitForFunction(() => Reflect.get(window, '__scene')?.ready);
  const report = await page.evaluate(() =>
    Reflect.get(window, '__scene').traverseAll(),
  );
  expect(report.ok).toBe(true);
  expect(report.results.length).toBeGreaterThanOrEqual(8);
  await page.evaluate(() => Reflect.get(window, '__scene').setDebug(true));
  await page.screenshot({
    path: test.info().outputPath('stage-one-layout.png'),
    fullPage: true,
  });
  await test.info().attach('scene-routes.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  const scene = await page.evaluate(() =>
    Reflect.get(window, '__scene').snapshot(),
  );
  await test.info().attach('scene-snapshot.json', {
    body: JSON.stringify(scene, null, 2),
    contentType: 'application/json',
  });
});

test('a missing character image presents recovery and retry loads the real level', async ({
  page,
}) => {
  await page.route('**/assets/sprites/main-hero/main-hero.png', (route) =>
    route.abort(),
  );
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Level unavailable' }),
  ).toBeVisible();
  await page.unroute('**/assets/sprites/main-hero/main-hero.png');
  await page.getByRole('button', { name: 'Retry level' }).click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).mentor).toBe('elder-atlas');
});
