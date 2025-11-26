import { test, expect } from '@playwright/test';

test.describe('Map application', () => {
  test('should load the map', async ({ page }) => {
    await page.goto('/');
    const mapContainer = page.locator('#map');

    await expect(mapContainer).toBeVisible();
  });

  test('should hide loading indicator after map loads', async ({ page }) => {
    await page.goto('/');

    const loading = page.locator('#loading');
    await expect(loading).toBeAttached();
    await expect(loading).toHaveClass(/hidden/, { timeout: 5000 });
  });

  test('should load Leaflet map tiles', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const leafletContainer = page.locator('.leaflet-container');
    await expect(leafletContainer).toBeVisible();
  });

  test('should have layer controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const layerControls = page.locator('.leaflet-control-layers');
    await expect(layerControls).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip link', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#map');
  });

  test('skip link should be visible on focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skipLink = page.locator('.skip-link:focus');
    await expect(skipLink).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const map = page.locator('#map');
    await expect(map).toHaveAttribute('role', 'application');
    await expect(map).toHaveAttribute('aria-label', 'Interactive food resource map');
  });

  test('should have live region for announcements', async ({ page }) => {
    await page.goto('/');

    const announcer = page.locator('#announcements');
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Map functionality', () => {
  test('should display markers when data loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should open popup when marker is clicked', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Flaky on Firefox due to timing');
    await page.goto('/');
    await page.waitForTimeout(3000);

    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await firstMarker.click();
    const popup = page.locator('.leaflet-popup');
    await expect(popup).toBeVisible();
  });

  test('should toggle layers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const checkboxes = page.locator('.leaflet-control-layers input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      const firstCheckbox = checkboxes.first();
      const initialState = await firstCheckbox.isChecked();

      await firstCheckbox.click();

      const newState = await firstCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
