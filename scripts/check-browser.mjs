import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
await mkdir('artifacts', { recursive: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});
try {
  await page.goto(baseURL);
  await page.waitForFunction(() => window.galaxyDiagnostics?.().renderer);
  await page.waitForFunction(() => document.querySelector('#space canvas')?.width > 0);
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#stage-title').textContent(), '지구');
  assert.ok((await page.locator('#size-cards').textContent()).includes('12,756'));
  assert.ok((await page.locator('#light-time').textContent()).startsWith('빛으로 '));
  await page.screenshot({ path: 'artifacts/earth-desktop.png' });
  for (let i = 0; i < 8; i++) {
    await page.locator(`[data-stage="${i}"]`).click();
    await page.waitForFunction(index => window.galaxyDiagnostics().zoom === window.galaxyDiagnostics().targetZoom && document.querySelector(`[data-stage="${index}"]`).getAttribute('aria-current') === 'step', i);
    assert.equal(await page.locator('.size-card').count(), 3);
    assert.ok((await page.locator('#size-cards').innerText()).trim().length > 20);
    if ([2, 4, 5, 6, 7].includes(i)) await page.screenshot({ path: `artifacts/stage-${i}-desktop.png` });
  }
  const memoryStart = await page.evaluate(() => window.galaxyDiagnostics().stats);
  // Stage endpoints alone miss gaps in the Laniakea → universe transition.
  for (const z of [25.2, 25.6, 26, 26.4]) {
    await page.locator('#zoom-range').fill(String(z));
    await page.waitForFunction(value => window.galaxyDiagnostics().zoom === value, z);
    await page.screenshot({ path: `artifacts/transition-${z}-desktop.png` });
  }
  for (let i = 0; i < 8; i++) {
    await page.locator(`[data-stage="${i}"]`).click();
    await page.waitForFunction(index => window.galaxyDiagnostics().zoom === window.galaxyDiagnostics().targetZoom && document.querySelector(`[data-stage="${index}"]`).getAttribute('aria-current') === 'step', i);
  }
  const memoryEnd = await page.evaluate(() => window.galaxyDiagnostics().stats);
  assert.equal(memoryStart.geometries, memoryEnd.geometries, 'repeated scene traversal should reuse geometry');
  assert.equal(memoryStart.textures, memoryEnd.textures, 'repeated scene traversal should reuse textures');
  await page.locator('#home-button').click();
  await page.waitForFunction(() => window.galaxyDiagnostics().stage === 'earth');
  await page.locator('.size-card').first().click();
  assert.equal(await page.locator('#body-dialog-title').textContent(), '지구');
  assert.ok((await page.locator('#body-source').getAttribute('href')).includes('nasa.gov'));
  await page.keyboard.press('Escape');
  await page.locator('#more-bodies').click();
  assert.ok(await page.locator('.catalog-row').count() >= 20);
  await page.locator('[data-body="saturn"]').click();
  assert.ok((await page.locator('#body-dialog-value').textContent()).includes('120,536'));
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.locator('#space').click({ position: { x: 800, y: 100 } });
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.galaxyDiagnostics().stage === 'moon');
  const beforeWheel = await page.evaluate(() => window.galaxyDiagnostics().targetZoom);
  await page.mouse.move(900, 400); await page.mouse.wheel(0, 400);
  await page.waitForFunction(previous => window.galaxyDiagnostics().targetZoom > previous, beforeWheel);
  await page.locator('#tour-button').click();
  assert.equal(await page.evaluate(() => window.galaxyDiagnostics().touring), true);
  await page.locator('#zoom-out').click();
  assert.equal(await page.evaluate(() => window.galaxyDiagnostics().touring), false);
  await page.locator('#info-button').click();
  await page.locator('#true-scale').check();
  assert.equal(await page.evaluate(() => window.galaxyDiagnostics().trueScale), true);
  await page.locator('#low-quality').check();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#home-button').click();
  await page.waitForFunction(() => window.galaxyDiagnostics().stage === 'earth');
  await page.screenshot({ path: 'artifacts/earth-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('#zoom-range').fill('25.6');
  await page.waitForFunction(() => window.galaxyDiagnostics().zoom === 25.6);
  await page.screenshot({ path: 'artifacts/transition-mobile.png', fullPage: true });
  for (const i of [3, 4, 7]) {
    await page.locator(`[data-stage="${i}"]`).click();
    await page.waitForFunction(index => document.querySelector(`[data-stage="${index}"]`).getAttribute('aria-current') === 'step', i);
    await page.screenshot({ path: `artifacts/stage-${i}-mobile.png`, fullPage: true });
    const overflows = await page.locator('.size-card').evaluateAll(cards => cards.filter(card => card.scrollWidth > card.clientWidth + 1).map(card => card.textContent));
    assert.deepEqual(overflows, [], 'cards should not clip their text');
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'passed', checks: '8 stages, size cards, catalog, sources, keyboard, wheel, tour, quality, mobile layout, stable geometry', memoryStart, memoryEnd }, null, 2));
} finally { await browser.close(); }
