import { expect, test } from '@playwright/test';

test('enter Stage 1-1 and return to the map without starting a battle', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page
      .locator('.destinations')
      .getByRole('button', { name: /Highland path/ }),
  ).toBeDisabled();
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#progress-label')).toHaveText('Stage 1-1');
  await expect(page.locator('.map-overlay')).toHaveCount(0);
  await expect(page.locator('#start-battle')).toHaveCount(0);
  await page.keyboard.press('e');
  await expect(
    page.getByRole('heading', { name: 'The first trail', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(
    page.getByRole('heading', { name: 'The first route' }),
  ).toBeFocused();
  await expect(page.locator('.map-overlay')).toBeVisible();
  await expect(
    page
      .locator('.destinations')
      .getByRole('button', { name: /Highland path/ }),
  ).toBeDisabled();
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(page.locator('#trail-percent')).toHaveText('0%');
  await page.getByRole('button', { name: 'Return to map' }).click();
  expect(errors).toEqual([]);
});

test('narrow screens retain movement and return controls with reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .locator('.destinations')
    .getByRole('button', { name: /River crossing/ })
    .click();
  await expect(
    page.getByRole('button', { name: 'Move right', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Return to map' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('stage-one-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(
    page.getByRole('heading', { name: 'The first route' }),
  ).toBeFocused();
});
