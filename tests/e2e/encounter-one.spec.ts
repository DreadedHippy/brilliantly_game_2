import { expect, test, type Page } from '@playwright/test';
async function enter(page: Page) {
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(page.locator('#challenge-masquerade')).toBeDisabled();
  await page.evaluate(() =>
    Reflect.get(window, '__brilliantlyGame')
      .scene.getScene('stage-1-1')
      .children.getByName('stage-player')
      .setPosition(840, 610),
  );
  await expect(page.locator('#challenge-masquerade')).toBeEnabled();
  await page.locator('#challenge-masquerade').click();
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '100');
}
test('masquerade encounter uses four affinities, SP costs, the level-one blade and unshielded defense', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enter(page);
  await expect(page.locator('#player-health')).toHaveAttribute('value', '120');
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '40');
  await expect(page.locator('.practice-spotlight')).toHaveCount(0);
  await expect(page.locator('#panel')).toContainText('No shield');
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.locator('[data-action="spell:spark"]').click();
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '78');
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await page.locator('[data-action="guard"]').click();
  await expect(page.locator('#player-health')).toHaveAttribute('value', '99');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '78');
  await page.locator('[data-action="attack"]').click();
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '66');
  await page.getByText('Spell catalogue', { exact: false }).click();
  await expect(page.locator('.spell-list')).toContainText(
    'Inferno crown — Fire · 68 damage · 28 SP · Locked',
  );
  await page.screenshot({
    path: test.info().outputPath('masquerade-battle.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test('trivia rewards correct answers, rejects late answers and disables unaffordable spells', async ({
  page,
}) => {
  await page.clock.install();
  await enter(page);
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.locator('[data-action="spell:spark"]').click();
  await page.getByRole('button', { name: /Restore SP/ }).click();
  await page.getByRole('button', { name: 'Sunlight', exact: true }).click();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '40');
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.locator('[data-action="spell:spark"]').click();
  await page.getByRole('button', { name: /Restore SP/ }).click();
  await page.getByRole('button', { name: '48', exact: true }).click();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await page.getByRole('button', { name: /Restore SP/ }).click();
  await page.clock.fastForward(13000);
  await expect(page.locator('#trivia-time')).toHaveCount(0);
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    scene.battle.playerSp = 3;
    scene.render();
  });
  await page.getByRole('button', { name: /^Spells/ }).click();
  await expect(page.locator('[data-action^="spell:"]')).toHaveCount(4);
  for (const button of await page.locator('[data-action^="spell:"]').all())
    await expect(button).toBeDisabled();
  await page.getByRole('button', { name: /^Back/ }).click();
  await expect(page.locator('[data-action="attack"]')).toBeEnabled();
});
test('victory clears only encounter one, returns to the trail and does not unlock a whole stage', async ({
  page,
}) => {
  await enter(page);
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /^Spells/ }).click();
    await page.locator('[data-action="spell:spark"]').click();
  }
  await page.locator('[data-action="attack"]').click();
  await expect(
    page.getByRole('heading', { name: 'Masquerade defeated', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Return to the trail', exact: true })
    .click();
  await expect(page.locator('#challenge-masquerade')).toHaveText(
    'Encounter 1 cleared',
  );
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(
    page
      .locator('.destinations')
      .getByRole('button', { name: /Highland path/ }),
  ).toBeDisabled();
});

test('mobile combat keeps stats readable and defeat prevents further actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await expect(page.locator('#player-health')).toHaveAttribute('value', '120');
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.locator('[data-action="spell:stone"]').click();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '33');
  const framing = await page.evaluate(() => {
    const game = Reflect.get(window, '__brilliantlyGame');
    const scene = game.scene.getScene('battle');
    const enemy = scene.children.getByName('battle-masquerade');
    const canvas = document.querySelector('canvas')!.getBoundingClientRect();
    const heroStatus = document
      .querySelector('.combat-status-hero')!
      .getBoundingClientRect();
    return {
      enemyFoot: canvas.top + (enemy.y / 540) * canvas.height,
      heroCardTop: heroStatus.top,
    };
  });
  expect(framing.enemyFoot).toBeLessThan(framing.heroCardTop - 3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('masquerade-battle-mobile.png'),
    fullPage: true,
  });
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    scene.battle.playerHp = 1;
    scene.render();
  });
  await page.locator('[data-action="guard"]').click();
  await expect(
    page.getByRole('heading', { name: 'You have fallen', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#player-health')).toHaveAttribute('value', '0');
  await expect(page.locator('[data-action]')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Return to map', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The first route', exact: true }),
  ).toBeVisible();
});

test('command grid supports keyboard navigation and a free spell-menu back action', async ({
  page,
}) => {
  await enter(page);
  const fight = page.locator('[data-action="attack"]');
  await fight.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: /^Spells/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-action^="spell:"]')).toHaveCount(4);
  await expect(page.locator('[data-action="spell:ember"]')).toBeFocused();
  await expect(page.locator('.battle-actions')).toContainText(
    'Fire · 18 damage · 6 SP',
  );
  await page.screenshot({
    path: test.info().outputPath('battle-spell-menu.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Spells/ })).toBeFocused();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '40');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '100');
  await expect(page.locator('.battle-message .eyebrow')).toHaveText('Round 1');
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.getByRole('button', { name: /^Back/ }).click();
  await expect(page.locator('.battle-actions')).toHaveAttribute(
    'data-menu',
    'commands',
  );
  await page
    .getByRole('button', { name: 'Return to map', exact: true })
    .click();
  await expect(page.locator('.battle-hud')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const canvas = document
          .querySelector('#game canvas')!
          .getBoundingClientRect();
        const host = document.querySelector('#game')!.getBoundingClientRect();
        return Math.abs(canvas.width - host.width);
      }),
    )
    .toBeLessThan(2);
});

test('battle feedback moves both actors, eases resource bars and rejects overlapping turns', async ({
  page,
}) => {
  await enter(page);
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    const samples: { hero: number; enemy: number; hp: number; sp: number }[] =
      [];
    Reflect.set(window, '__battleFeedbackSamples', samples);
    Reflect.set(window, '__battleFeedbackSampling', true);
    const started = performance.now();
    const sample = () => {
      if (
        !scene.scene.isActive() ||
        !Reflect.get(window, '__battleFeedbackSampling') ||
        performance.now() - started > 20000
      )
        return;
      samples.push({
        hero: scene.children.getByName('battle-hero').x,
        enemy: scene.children.getByName('battle-masquerade').x,
        hp:
          document.querySelector<HTMLMeterElement>('#enemy-health')?.value ?? 0,
        sp: document.querySelector<HTMLMeterElement>('#player-sp')?.value ?? 0,
      });
      requestAnimationFrame(sample);
    };
    sample();
  });
  await page.locator('[data-action="attack"]').click();
  await expect(page.locator('.battle-console')).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await expect(page.locator('[data-action="guard"]')).toBeDisabled();
  await page.evaluate(() => {
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    scene.act('attack');
    scene.act('spell:ember');
  });
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '88');
  await expect(page.locator('#player-health')).toHaveAttribute('value', '106');
  await expect(page.locator('.battle-console')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await page.getByRole('button', { name: /^Spells/ }).click();
  await page.locator('[data-action="spell:spark"]').click();
  await expect(page.locator('#player-sp')).toHaveAttribute('value', '32');
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '66');
  const review = await page.evaluate(() => {
    Reflect.set(window, '__battleFeedbackSampling', false);
    const samples = Reflect.get(window, '__battleFeedbackSamples') as {
      hero: number;
      enemy: number;
      hp: number;
      sp: number;
    }[];
    const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
      'battle',
    );
    const hero = scene.children.getByName('battle-hero'),
      enemy = scene.children.getByName('battle-masquerade');
    return {
      heroMoved: samples.some((s) => s.hero > 237),
      enemyMoved: samples.some((s) => s.enemy < 718),
      hpEased: samples.some((s) => s.hp > 88 && s.hp < 100),
      spEased: samples.some((s) => s.sp > 32 && s.sp < 40),
      heroRest: [hero.x, hero.y, hero.angle, hero.alpha],
      enemyRest: [enemy.x, enemy.y, enemy.angle, enemy.alpha],
      round: scene.battle.round,
    };
  });
  expect(review).toEqual({
    heroMoved: true,
    enemyMoved: true,
    hpEased: true,
    spEased: true,
    heroRest: [235, 480, 0, 1],
    enemyRest: [720, 220, 0, 1],
    round: 3,
  });
});

test('reduced motion snaps bars and actions; leaving a moving turn cancels its callbacks', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await page.locator('[data-action="attack"]').click();
  await expect(page.locator('#enemy-health')).toHaveAttribute('value', '88');
  await expect(page.locator('#enemy-health')).toHaveAttribute(
    'data-animating',
    'false',
  );
  expect(
    await page.evaluate(() => {
      const scene = Reflect.get(window, '__brilliantlyGame').scene.getScene(
        'battle',
      );
      const hero = scene.children.getByName('battle-hero');
      return { x: hero.x, tweens: scene.tweens.getTweensOf(hero).length };
    }),
  ).toEqual({ x: 235, tweens: 0 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('[data-action="attack"]').click();
  await expect(page.locator('.battle-console')).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await page
    .getByRole('button', { name: 'Return to map', exact: true })
    .click();
  await expect(page.locator('.map-overlay')).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(page.locator('.battle-hud')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'The first route', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
