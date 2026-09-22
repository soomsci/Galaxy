import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
  await mkdir('artifacts',{recursive:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:5173/');
  await page.locator('#galaxy-tab').click();
  await page.waitForFunction(()=>window.galaxyViewDiagnostics?.().points>0);
  const images=[];
  for(const view of ['oblique','top','side','bottom']) {
    await page.locator(`[data-galaxy-view="${view}"]`).click();
    await page.screenshot({path:`artifacts/galaxy-${view}.png`,fullPage:true});
    images.push(await page.locator('#galaxy-viewport canvas').screenshot());
  }
  for(let i=1;i<images.length;i++) assert.notDeepEqual(images[i],images[0]);
  const before=await page.evaluate(()=>window.galaxyViewDiagnostics().camera);
  const canvas=page.locator('#galaxy-viewport canvas'); await canvas.focus();await page.keyboard.press('ArrowRight');
  assert.notDeepEqual(await page.evaluate(()=>window.galaxyViewDiagnostics().camera),before);
  await page.locator('#galaxy-zoom').fill('80');
  assert.ok(Math.abs(await page.evaluate(()=>Math.hypot(...window.galaxyViewDiagnostics().camera))-9.6)<.01);
  await page.locator('#galaxy-reset').click();
  const box=await canvas.boundingBox(); const start=await page.evaluate(()=>window.galaxyViewDiagnostics().camera);
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:8});await page.mouse.up();
  assert.notDeepEqual(await page.evaluate(()=>window.galaxyViewDiagnostics().camera),start);
  await page.locator('#sky-tab').click();await page.waitForFunction(()=>window.skyDiagnostics().active);
  await page.locator('#scale-tab').click();await page.locator('[data-stage="4"]').click();await page.waitForFunction(()=>window.galaxyDiagnostics().stage==='galaxy');
  await page.setViewportSize({width:390,height:844});await page.locator('#galaxy-tab').click();await page.locator('#galaxy-reset').click();
  await page.screenshot({path:'artifacts/galaxy-mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.reload();await page.waitForFunction(()=>window.galaxyViewDiagnostics?.().points>0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#galaxy-auto').check();
  const initial=await page.evaluate(()=>window.galaxyViewDiagnostics().camera);
  await page.waitForFunction(old=>window.galaxyViewDiagnostics().camera.some((v,i)=>Math.abs(v-old[i])>.02),initial);
  await page.locator('#scale-tab').click();
  await page.waitForFunction(()=>!window.galaxyViewDiagnostics().active);
  assert.equal(await page.evaluate(()=>window.galaxyViewDiagnostics().auto),false);
  assert.deepEqual(errors,[]);console.log('Galaxy 3D passed: four views, drag, keyboard, zoom, reset, tab return, mobile, deep link, auto rotation.');
}finally{await browser.close();}
