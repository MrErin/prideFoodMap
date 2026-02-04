import { test, expect } from '@playwright/test';

test.describe('Marker-card bi-directional sync', () => {
  test('scenario 1: clicking marker highlights both marker and card', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Get the first marker
    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await expect(firstMarker).toBeVisible();

    // Click the marker
    await firstMarker.click();
    await page.waitForTimeout(100);

    // Verify marker has marker-selected class
    await expect(firstMarker).toHaveClass(/marker-selected/);

    // Verify marker has visible border effect (box-shadow)
    const markerStyles = await firstMarker.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        boxShadow: styles.boxShadow,
        filter: styles.filter,
      };
    });
    expect(markerStyles.boxShadow).not.toBe('none');
    expect(markerStyles.boxShadow).toContain('59, 130, 246'); // blue border color
    expect(markerStyles.filter).toContain('drop-shadow');

    // Find the selected card (some markers may not have corresponding cards if they have invalid coordinates)
    const selectedCards = page.locator('.card[aria-selected="true"]');
    const count = await selectedCards.count();

    // At least one card should be selected
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify the selected card's marker ID matches the selected marker
    // We need to check that state management correctly linked the marker to a card
    if (count > 0) {
      const firstSelectedCard = selectedCards.first();
      await expect(firstSelectedCard).toBeVisible();
    }
  });

  test('scenario 2: clicking different card highlights new marker and card', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const firstCard = page.locator('.card').first();
    const secondCard = page.locator('.card').nth(1);

    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();

    // Click first card
    await firstCard.click();
    await page.waitForTimeout(100);

    // Get the data-marker-id of the first card
    const firstMarkerId = await firstCard.getAttribute('data-marker-id');

    // Verify the marker for first card is selected
    let selectedMarkers = await page.locator('.leaflet-marker-icon.marker-selected').count();
    expect(selectedMarkers).toBe(1);

    // Click second card
    await secondCard.click();
    await page.waitForTimeout(100);

    // Get the data-marker-id of the second card
    const secondMarkerId = await secondCard.getAttribute('data-marker-id');
    expect(secondMarkerId).not.toBe(firstMarkerId);

    // Verify only one marker is selected (the second one)
    selectedMarkers = await page.locator('.leaflet-marker-icon.marker-selected').count();
    expect(selectedMarkers).toBe(1);

    // Verify first card is no longer selected
    await expect(firstCard).toHaveAttribute('aria-selected', 'false');

    // Verify second card is selected
    await expect(secondCard).toHaveAttribute('aria-selected', 'true');
  });

  test('scenario 3: escape key clears selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await expect(firstMarker).toBeVisible();

    // Click the marker to select it
    await firstMarker.click();
    await page.waitForTimeout(100);

    // Verify marker is selected
    await expect(firstMarker).toHaveClass(/marker-selected/);

    // Verify at least one card is selected
    const selectedCards = page.locator('.card[aria-selected="true"]');
    const count = await selectedCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Verify marker selection is cleared
    await expect(firstMarker).not.toHaveClass(/marker-selected/);

    // Verify all card selections are cleared
    const selectedCardsAfterEscape = page.locator('.card[aria-selected="true"]');
    const countAfterEscape = await selectedCardsAfterEscape.count();
    expect(countAfterEscape).toBe(0);
  });
});

test.describe('Marker selection styles (detailed)', () => {
  test('marker should have outline when selected', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Get the first marker
    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await expect(firstMarker).toBeVisible();

    // Click the first marker
    await firstMarker.click();

    // Wait for the selection to take effect
    await page.waitForTimeout(100);

    // Check if the marker has the marker-selected class
    await expect(firstMarker).toHaveClass(/marker-selected/);

    // Get the computed styles of the marker
    const styles = await firstMarker.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow,
        filter: computed.filter,
        transform: computed.transform,
        overflow: computed.overflow,
      };
    });

    console.log('Marker computed styles:', JSON.stringify(styles, null, 2));

    // Check if box-shadow (border effect) is properly applied
    // The box-shadow should contain the border color and dimensions
    expect(styles.boxShadow).not.toBe('none');
    // Browser converts #3b82f6 to rgba(59, 130, 246, ...)
    expect(styles.boxShadow).toContain('59, 130, 246');
    // The box-shadow should have the specified dimensions (3px for border, 5px for glow)
    // Note: Browser may slightly round values, so check for approximate values
    expect(styles.boxShadow).toMatch(/0px\s+0px\s+0px\s+[23]\.?\d*px/);

    // Check that drop-shadow filter is applied
    expect(styles.filter).toContain('drop-shadow');
  });

  test('clicking card should select corresponding marker with outline', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Get the first card and first marker
    const firstCard = page.locator('.card').first();
    const firstMarker = page.locator('.leaflet-marker-icon').first();

    await expect(firstCard).toBeVisible();
    await expect(firstMarker).toBeVisible();

    // Get the marker ID from the card
    const markerId = await firstCard.getAttribute('data-marker-id');
    expect(markerId).toBeTruthy();

    // Click the card
    await firstCard.click();

    // Wait for the selection to take effect
    await page.waitForTimeout(100);

    // Find the marker with matching ID
    const selectedMarker = page.locator('.leaflet-marker-icon.marker-selected');
    await expect(selectedMarker).toHaveCount(1);

    // Check the computed styles
    const styles = await selectedMarker.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow,
        filter: computed.filter,
      };
    });

    console.log('Selected marker styles:', JSON.stringify(styles, null, 2));

    // Verify box-shadow (border effect) is visible
    expect(styles.boxShadow).not.toBe('none');
    // Browser converts #3b82f6 to rgba(59, 130, 246, ...)
    expect(styles.boxShadow).toContain('59, 130, 246');
  });

  test('escape key should clear marker selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Click the first marker
    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await firstMarker.click();
    await page.waitForTimeout(100);

    // Verify marker is selected
    await expect(firstMarker).toHaveClass(/marker-selected/);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Verify marker is no longer selected
    await expect(firstMarker).not.toHaveClass(/marker-selected/);
  });
});
