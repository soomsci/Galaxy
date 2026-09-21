export const AU = 149_597_870_700;
export const LY = 9.4607304725808e15;
export const PC = 3.085677581491367e16;
export const MIN_ZOOM = 7.4;
export const MAX_ZOOM = 27.45;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const visibility = (zoom, start, end, feather = 0.6) =>
  smoothstep(start - feather, start, zoom) * (1 - smoothstep(end, end + feather, zoom));
export const projectMeters = (meters, zoom, width) => meters / 10 ** zoom * width;
export const damp = (current, target, dt) => current + (target - current) * (1 - Math.exp(-dt * 7));
export const number = (value, digits = 1) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: digits }).format(value);

export function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  const units = [[1e9 * PC, 'Gpc'], [1e6 * PC, 'Mpc'], [LY, '광년'], [AU, 'AU'], [1000, 'km'], [1, 'm']];
  const [unit, label] = units.find(([unit]) => meters >= unit) || units.at(-1);
  return `${number(meters / unit, meters / unit < 10 ? 2 : 1)} ${label}`;
}

export function scaleBar(zoom, width, maxPixels = 140) {
  const maxMeters = 10 ** zoom * maxPixels / width;
  const base = 10 ** Math.floor(Math.log10(maxMeters));
  const step = [5, 2, 1].find(value => value * base <= maxMeters) || 1;
  const meters = step * base;
  return { meters, pixels: projectMeters(meters, zoom, width) };
}

export function stageAt(zoom, stages) {
  return stages.findLast(stage => zoom >= stage.start) || stages[0];
}

export function fitZoom(diameter, width, height, fill = 0.64) {
  return clamp(Math.log10(diameter * Math.max(1, width / height) / fill), MIN_ZOOM, MAX_ZOOM);
}
