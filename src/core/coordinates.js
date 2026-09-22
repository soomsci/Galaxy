import { LY } from './scale.js';

// The Milky Way disc is tilted around the world x-axis so its structure is
// legible in the fixed camera. Every Galactic coordinate uses this same tilt.
export const GALACTIC_DISC_TILT = Math.atan2(.88, .48);

export function galacticToWorld(l, b, distanceLy = 1) {
  const longitude = l * Math.PI / 180;
  const latitude = b * Math.PI / 180;
  const cosLatitude = Math.cos(latitude);
  const x = -cosLatitude * Math.cos(longitude);
  const y = cosLatitude * Math.sin(longitude);
  const z = Math.sin(latitude);
  const cosTilt = Math.cos(GALACTIC_DISC_TILT);
  const sinTilt = Math.sin(GALACTIC_DISC_TILT);

  return [
    x * distanceLy * LY,
    (y * cosTilt - z * sinTilt) * distanceLy * LY,
    (y * sinTilt + z * cosTilt) * distanceLy * LY,
  ];
}
