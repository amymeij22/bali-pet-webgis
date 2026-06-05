import { test, expect } from '@playwright/test';

test.describe('WebGIS E2E Test Suite', () => {
  
  test('Skenario 1: Dasbor & Peta Leaflet Berhasil Dimuat', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('Skenario 2: Pergantian Bahasa (Indonesian & English)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const destHeader = page.locator('h2:has-text("Destinasi Wisata")');
    await expect(destHeader).toBeVisible();

    const langSelect = page.locator('button[role="combobox"]').last();
    await langSelect.click();

    const englishOption = page.locator('role=option[name="English"]');
    await englishOption.click();

    const destHeaderEn = page.locator('h2:has-text("Tourist destinations")');
    await expect(destHeaderEn).toBeVisible();

    await langSelect.click();
    const idOption = page.locator('role=option[name="Indonesian"]');
    await idOption.click();

    await expect(destHeader).toBeVisible();
  });

  test('Skenario 3: Klik Sidebar Destinasi & Membuka Pop-up Cuaca', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstDest = page.locator('.destination-item').first();
    await expect(firstDest).toBeVisible();
    
    const destName = await firstDest.locator('span').first().textContent();
    expect(destName).toBeTruthy();

    await firstDest.click();

    const popup = page.locator('.weather-popup');
    await expect(popup).toBeVisible();

    const popupTitle = popup.locator('h3').first();
    await expect(popupTitle).toBeVisible();
  });

  test('Skenario 4: Interaksi Grafik Tren PET & Sinkronisasi Waktu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstDest = page.locator('.destination-item').first();
    await firstDest.click();

    const popup = page.locator('.weather-popup');
    await expect(popup).toBeVisible();

    const trendTab = popup.locator('button:has-text("Tren Kenyamanan")');
    await expect(trendTab).toBeVisible();
    await trendTab.click();

    const chart = popup.locator('.recharts-responsive-container');
    await expect(chart).toBeVisible();

    const activeTimeLabel = popup.locator('span.font-mono').first();
    const timeBefore = await activeTimeLabel.textContent();

    const svgSurface = chart.locator('.recharts-surface');
    await expect(svgSurface).toBeVisible();
    
    const box = await svgSurface.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.5);
    }

    await page.waitForTimeout(500);
    const timeAfter = await activeTimeLabel.textContent();
    expect(timeBefore).not.toBe(timeAfter);
  });
});
