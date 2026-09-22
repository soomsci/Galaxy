import test from 'node:test';
import assert from 'node:assert/strict';
import { AU, LY, PC, LIGHT_SPEED, MIN_ZOOM, MAX_ZOOM, projectMeters, damp, formatDistance, formatLightTravelTime, scaleBar, stageAt, fitZoom, visibility } from '../src/core/scale.js';
import { galacticToWorld } from '../src/core/coordinates.js';
import { bodies, stages, sources, byId, planetPosition } from '../src/data/universe.js';

test('distance labels respect unit boundaries and invalid values', () => {
  assert.equal(formatDistance(999), '999 m');
  assert.equal(formatDistance(1000), '1 km');
  assert.equal(formatDistance(AU), '1 AU');
  assert.equal(formatDistance(LY), '1 광년');
  assert.equal(formatDistance(1e6 * PC), '1 Mpc');
  assert.equal(formatDistance(1e9 * PC), '1 Gpc');
  assert.equal(formatDistance(NaN), '—');
  assert.equal(formatDistance(-1), '—');
});
test('light travel time stays readable from seconds to millions of years', () => {
  assert.equal(formatLightTravelTime(LIGHT_SPEED * 8 * 60), '8분');
  assert.equal(formatLightTravelTime(LY), '1년');
  assert.equal(formatLightTravelTime(2.5e6 * LY), '250만 년');
  assert.equal(formatLightTravelTime(-1), '—');
});
test('each decade changes linear apparent size by a factor of ten', () => {
  for (let zoom = MIN_ZOOM; zoom < MAX_ZOOM; zoom++) {
    assert.ok(Math.abs(projectMeters(12756000, zoom, 1440) / projectMeters(12756000, zoom + 1, 1440) - 10) < 1e-10);
    assert.equal(projectMeters(0, zoom, 1440), 0);
  }
});
test('scale bar describes its rendered width across all scales', () => {
  for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += .1) {
    const bar = scaleBar(zoom, 390, 90);
    assert.ok(bar.pixels > 0 && bar.pixels <= 90 + 1e-9);
    assert.ok(Math.abs(bar.meters / 10 ** zoom * 390 - bar.pixels) < 1e-9);
  }
});
test('damping is independent of frame rate', () => {
  let at30 = 7.5, at120 = 7.5;
  for (let i = 0; i < 30; i++) at30 = damp(at30, 25, 1 / 30);
  for (let i = 0; i < 120; i++) at120 = damp(at120, 25, 1 / 120);
  assert.ok(Math.abs(at30 - at120) < 1e-10);
});
test('stages cover the full range and have valid targets, cards, and sources', () => {
  assert.equal(new Set(bodies.map(b => b.id)).size, bodies.length);
  for (let zoom = MIN_ZOOM; zoom < MAX_ZOOM; zoom += .02) assert.ok(stageAt(zoom, stages));
  for (const stage of stages) {
    assert.ok(byId[stage.focus]);
    assert.equal(stage.cards.length, 3);
    assert.equal(stageAt(stage.zoom, stages).id, stage.id);
    for (const id of stage.cards) assert.ok(byId[id]);
  }
  for (const body of bodies) {
    assert.ok(body.diameter > 0 && Number.isFinite(body.diameter));
    assert.ok(sources[body.source]?.url.startsWith('https://'));
  }
});
test('Earth stays at origin; projected planet coordinates remain finite', () => {
  assert.deepEqual(planetPosition(byId.earth), [0, 0, 0]);
  const moon = planetPosition(byId.moon);
  assert.ok(Math.abs(Math.hypot(...moon) - 384400000) < 1);
  for (const body of bodies.filter(b => b.kind === 'planet' || b.id === 'sun')) {
    for (const zoom of [MIN_ZOOM, MAX_ZOOM]) assert.ok(planetPosition(body).every(value => Number.isFinite(projectMeters(value, zoom, 10))));
  }
  assert.notDeepEqual(planetPosition(byId.mercury, .1), planetPosition(byId.mercury));
  const movement = id => Math.hypot(...planetPosition(byId[id], .1).map((value, index) => value - planetPosition(byId[id])[index]));
  assert.ok(movement('mercury') > movement('neptune'));
});
test('Galactic coordinates share one tilted disc and preserve distance', () => {
  const center = galacticToWorld(0, 0, 26000);
  assert.ok(center[0] < 0 && Math.abs(center[1]) < 1 && Math.abs(center[2]) < 1);
  for (const [l, b, distance] of [[5.6, -14.2, 65000], [280.47, -32.89, 162000], [121.17, -21.57, 2.5e6]]) {
    assert.ok(Math.abs(Math.hypot(...galacticToWorld(l, b, distance)) / LY - distance) < 1e-6);
  }
  assert.ok(galacticToWorld(5.6, -14.2, 65000)[0] < 0, 'Sagittarius dwarf lies beyond the Galactic center');
  assert.ok(galacticToWorld(280.47, -32.89, 162000)[2] < 0, 'LMC lies south of the Galactic disc');
});
test('object fit and transition opacity stay bounded', () => {
  const zoom = fitZoom(byId.earth.diameter, 1440, 480, .64);
  assert.ok(Math.abs(projectMeters(byId.earth.diameter, zoom, 1440) - 480 * .64) < 1e-6);
  for (let z = 7; z < 28; z += .1) assert.ok(visibility(z, 14.8, 17.2) >= 0 && visibility(z, 14.8, 17.2) <= 1);
});
