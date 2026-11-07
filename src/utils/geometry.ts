import { NormalizedLandmark } from '../types';

/**
 * Standard MediaPipe Pose Landmark Indices
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Calculates 2D angle (in degrees) formed at vertex B between vectors BA and BC.
 * Returns angle in degrees [0, 180].
 */
export function calculateAngle(
  a?: NormalizedLandmark,
  b?: NormalizedLandmark,
  c?: NormalizedLandmark
): number {
  if (!a || !b || !c) return 0;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle * 10) / 10;
}

/**
 * Calculates Euclidean distance between two 2D points
 */
export function distance2D(a?: NormalizedLandmark, b?: NormalizedLandmark): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates vertical inclination angle of a vector AB relative to true vertical (y-axis)
 * 0° means perfectly vertical, 90° means horizontal.
 */
export function verticalAngle(a?: NormalizedLandmark, b?: NormalizedLandmark): number {
  if (!a || !b) return 0;
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const rad = Math.atan2(dx, dy);
  return (rad * 180.0) / Math.PI;
}

/**
 * Calculates horizontal inclination angle of a vector AB relative to horizontal (x-axis)
 * 0° means perfectly horizontal, 90° means vertical.
 */
export function horizontalAngle(a?: NormalizedLandmark, b?: NormalizedLandmark): number {
  if (!a || !b) return 0;
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const rad = Math.atan2(dy, dx);
  return (rad * 180.0) / Math.PI;
}

/**
 * Calculates midpoint between two landmarks
 */
export function midpoint(a?: NormalizedLandmark, b?: NormalizedLandmark): NormalizedLandmark {
  if (!a && !b) return { x: 0.5, y: 0.5, z: 0 };
  if (!a) return { ...b! };
  if (!b) return { ...a };
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z || 0) + (b.z || 0)) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}
