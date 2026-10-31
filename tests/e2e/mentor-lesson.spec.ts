import { expect, test, type Page } from '@playwright/test';

async function approachMentor(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  const talk = page.getByRole('button', {
    name: 'Talk to Arojinle',
    exact: true,
  });
  await expect(talk).toBeDisabled();
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'stage-1-1',
    );
    scene.children.getByName('stage-player').setPosition(435, 505);
  });
  await expect(talk).toBeEnabled();
}

async function position(page: Page) {
  return page.evaluate(() => {
    const p = Reflect.get(window, '__brilliantlyGame')
      .scene.getScene('stage-1-1')
      .children.getByName('stage-player');
    return { x: p.x as number, y: p.y as number };
  });
}

test('Arojinle teaches every rule, pauses movement, supports replay and cleans up on leaving', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await approachMentor(page);
  await page.locator('#game').focus();
  await page.keyboard.press('e');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('When your HP reaches zero, you die');
  await expect(dialog).toContainText('companions each have HP and SP');
  await expect(
    dialog.getByRole('button', { name: 'Back', exact: true }),
  ).toBeDisabled();
  const paused = await position(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  expect(await position(page)).toEqual(paused);
  await page.keyboard.up('d');
  for (const text of [
    'You and the enemy take turns',
    'strike the enemy with your weapon',
    'Casting a skill costs SP',
    'Every spell has one elemental affinity',
    'timed trivia questions',
    'A wrong answer restores no SP',
  ]) {
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(dialog).toContainText(text);
  }
  await expect(dialog).toContainText('Each correct answer restores some SP');
  await dialog.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(dialog).toContainText('Lesson 6 of 7');
  await page.keyboard.press('End');
  await expect(dialog).toContainText('Lesson 7 of 7');
  await page.screenshot({
    path: test.info().outputPath('arojinle-lesson-desktop.png'),
    fullPage: true,
  });
  await dialog.getByRole('button', { name: 'Close lesson' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#game')).toBeFocused();
  await page.keyboard.down('a');
  await expect
    .poll(async () => (await position(page)).x)
    .toBeLessThan(paused.x - 5);
  await page.keyboard.up('a');
  await page
    .getByRole('button', { name: 'Talk to Arojinle', exact: true })
    .click();
  await expect(dialog).toContainText('Lesson 1 of 7');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Talk to Arojinle', exact: true }),
  ).toBeFocused();
  const tap = await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'stage-1-1',
    );
    const camera = scene.cameras.main;
    const rect = document.querySelector('canvas')!.getBoundingClientRect();
    return {
      x:
        rect.left +
        ((510 - camera.worldView.x) * camera.zoom * rect.width) / 960,
      y:
        rect.top +
        ((440 - camera.worldView.y) * camera.zoom * rect.height) / 540,
    };
  });
  await page.mouse.click(tap.x, tap.y);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Return to map', exact: true })
    .click();
  await expect(page.locator('.mentor-lesson')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mentor carousel fits mobile, supports direct navigation and keeps focus inside', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await approachMentor(page);
  await page
    .getByRole('button', { name: 'Talk to Arojinle', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: 'Lesson 4: Skills spend SP' })
    .click();
  await expect(dialog).toContainText('Lesson 4 of 7');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog).toContainText('Lesson 3 of 7');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: test.info().outputPath('arojinle-lesson-mobile.png'),
    fullPage: true,
  });
  await dialog.getByRole('button', { name: 'Close lesson' }).click();
  await expect(dialog).not.toBeVisible();
});

test('affinity lesson leads to guided Arojinle practice with ordered actions and retryable trivia', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await approachMentor(page);
  await page
    .getByRole('button', { name: 'Talk to Arojinle', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: 'Lesson 5: Know your spell affinities' })
    .click();
  for (const text of [
    'Ember shot is Fire',
    'Storm spark is Storm',
    'Cutting gust is Wind',
    'Stone shard is Earth',
    'without elemental bonuses or resistances',
  ])
    await expect(dialog).toContainText(text);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: test.info().outputPath('arojinle-affinities-mobile.png'),
    fullPage: true,
  });
  await page.keyboard.press('End');
  await dialog
    .getByRole('button', { name: 'Practice with Arojinle', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Try a melee attack', exact: true }),
  ).toBeVisible();
  const spotlight = page.locator('.practice-spotlight');
  await expect(spotlight).toBeVisible();
  await expect(spotlight).toHaveAttribute('data-guide-target', 'attack');
  await expect
    .poll(() =>
      spotlight
        .locator('img')
        .evaluate((img) => (img as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(
    await spotlight
      .locator('img')
      .evaluate((img) => getComputedStyle(img).animationName),
  ).toBe('none');
  const aligned = await page
    .locator('[data-action="attack"]')
    .evaluate((button) => {
      const target = button.getBoundingClientRect();
      const hole = document
        .querySelector('.practice-spotlight-hole')!
        .getBoundingClientRect();
      return (
        hole.left < target.left &&
        hole.right > target.right &&
        hole.top < target.top &&
        hole.bottom > target.bottom
      );
    });
  expect(aligned).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('practice-spotlight-melee.png'),
  });
  await expect(page.locator('.combat-status-enemy')).toContainText('Arojinle');
  expect(
    await page.evaluate(
      () =>
        Reflect.get(window, '__brilliantlyGame')
          .scene.getScene('battle')
          .children.getByName('battle-arojinle').texture.key,
    ),
  ).toBe('elder-atlas');
  await expect(page.locator('[data-action="guard"]')).toBeDisabled();
  await expect(page.getByRole('button', { name: /^Spells/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^Trivia/ })).toBeDisabled();
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    scene.act('guard');
    scene.act('spell:spark');
    scene.beginTrivia();
  });
  await expect(page.locator('#player-health')).toHaveAttribute('value', '120');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '100');
  await expect(page.locator('#trivia-time')).toHaveCount(0);
  await page.locator('[data-action="attack"]').click();
  await expect(
    page.getByRole('heading', { name: 'Brace for a hit', exact: true }),
  ).toBeVisible();
  await expect(spotlight).toHaveAttribute('data-guide-target', 'guard');
  await expect(page.locator('#player-health')).toHaveAttribute('value', '116');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '88');
  await expect(page.locator('[data-action="attack"]')).toBeDisabled();
  await page.locator('[data-action="guard"]').click();
  await expect(
    page.getByRole('heading', { name: 'Cast an elemental spell', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#player-health')).toHaveAttribute('value', '114');
  await expect(spotlight).toHaveAttribute('data-guide-target', 'spells');
  await page.screenshot({
    path: test.info().outputPath('arojinle-practice-spells-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /^Spells/ }).click();
  await expect(page.locator('[data-action^="spell:"]')).toHaveCount(4);
  await page.locator('[data-action="spell:spark"]').hover();
  await expect(spotlight).toHaveAttribute('data-guide-target', 'spell:spark');
  await page.locator('[data-action="spell:spark"]').click();
  await expect(
    page.getByRole('heading', { name: 'Restore your SP', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await expect(page.locator('#player-health')).toHaveAttribute('value', '110');
  await page.getByRole('button', { name: /^Trivia/ }).click();
  await expect(spotlight).toHaveAttribute('data-guide-target', 'trivia');
  const quizVisible = await page
    .locator('.battle-actions')
    .evaluate((actions) => {
      const quiz = actions.getBoundingClientRect(),
        hole = document
          .querySelector('.practice-spotlight-hole')!
          .getBoundingClientRect();
      return (
        hole.left <= quiz.left &&
        hole.right >= quiz.right &&
        hole.top <= quiz.top &&
        hole.bottom >= quiz.bottom
      );
    });
  expect(quizVisible).toBe(true);
  await page.getByRole('button', { name: 'Coal', exact: true }).click();
  await expect(page.locator('.battle-log')).toContainText('No SP this time');
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await expect(page.locator('#player-health')).toHaveAttribute('value', '110');
  await page.getByRole('button', { name: /^Trivia/ }).click();
  await page.clock.fastForward(13000);
  await expect(page.locator('#trivia-time')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Restore your SP', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Trivia/ }).click();
  await page.getByRole('button', { name: 'Heart', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Practice complete', exact: true }),
  ).toBeFocused();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '40');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '66');
  await expect(page.locator('[data-action]')).toHaveCount(0);
  await expect(spotlight).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath('arojinle-practice-complete.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Return to the trail', exact: true })
    .click();
  await expect(page.locator('#challenge-masquerade')).toHaveText(
    'Approach encounter 1',
  );
  await page
    .getByRole('button', { name: 'Return to map', exact: true })
    .click();
  await expect(
    page
      .locator('.destinations')
      .getByRole('button', { name: /Highland path/ }),
  ).toBeDisabled();
});

test('leaving mentor practice cancels feedback and allows a fresh replay', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await approachMentor(page);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt)
      await page.evaluate(() =>
        Reflect.get(window, '__brilliantlyGame')
          .scene.getScene('stage-1-1')
          .children.getByName('stage-player')
          .setPosition(435, 505),
      );
    await page
      .getByRole('button', { name: 'Talk to Arojinle', exact: true })
      .click();
    await page.keyboard.press('End');
    await page
      .getByRole('button', { name: 'Practice with Arojinle', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Try a melee attack', exact: true }),
    ).toBeVisible();
    await expect(page.locator('#player-sp')).toHaveAttribute('value', '40');
    await expect(page.locator('.practice-spotlight')).toHaveAttribute(
      'data-guide-target',
      'attack',
    );
    expect(
      await page
        .locator('.practice-finger img')
        .evaluate((img) => getComputedStyle(img).animationName),
    ).toBe('practice-point');
    await page.locator('[data-action="attack"]').click();
    await page
      .getByRole('button', { name: 'Leave practice', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'The first trail', exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(page.locator('.battle-hud')).toHaveCount(0);
    await expect(page.locator('.practice-spotlight')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
