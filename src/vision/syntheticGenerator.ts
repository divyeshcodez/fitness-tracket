import { ExerciseId, PoseLandmarks } from '../types';

/**
 * Generates synthetic realistic human pose landmarks oscillating through exercises.
 * Perfect for browser automated testing, demo mode, and offline environments.
 */
export function generateSyntheticPose(
  exerciseId: ExerciseId,
  timestampMs: number
): { landmarks: PoseLandmarks; isOutOfFrame: boolean } {
  // Landmarks template (33 points)
  const lms: PoseLandmarks = Array(33)
    .fill(null)
    .map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));

  // Global time oscillation (0 to 1 cycle)
  const period = exerciseId === 'jumping_jack' ? 1600 : 3200;
  const t = (timestampMs % period) / period;
  // Sinusoidal easing for natural human rep curve: 0 (start) -> 1 (inflection) -> 0 (end)
  const cycle = (1 - Math.cos(t * 2 * Math.PI)) / 2;

  if (exerciseId === 'squat' || exerciseId === 'lunge' || exerciseId === 'deadlift') {
    // Standing squat motion
    // Head & shoulders descend during squat
    const headY = 0.16 + cycle * 0.18;
    const shoulderY = 0.28 + cycle * 0.18;
    const hipY = 0.5 + cycle * 0.17;
    // Knees bend outwards slightly and drop slightly
    const kneeY = 0.68 + cycle * 0.04;
    const kneeSpread = 0.08 + cycle * 0.04;
    const ankleY = 0.88;

    // Head
    lms[0] = { x: 0.5, y: headY, z: 0, visibility: 0.98 };
    // Shoulders
    lms[11] = { x: 0.42, y: shoulderY, z: 0, visibility: 0.98 };
    lms[12] = { x: 0.58, y: shoulderY, z: 0, visibility: 0.98 };
    // Elbows & hands held in front for balance
    lms[13] = { x: 0.4, y: shoulderY + 0.12, z: -0.1, visibility: 0.95 };
    lms[14] = { x: 0.6, y: shoulderY + 0.12, z: -0.1, visibility: 0.95 };
    lms[15] = { x: 0.46, y: shoulderY + 0.1, z: -0.15, visibility: 0.95 };
    lms[16] = { x: 0.54, y: shoulderY + 0.1, z: -0.15, visibility: 0.95 };
    // Hips
    lms[23] = { x: 0.45, y: hipY, z: 0, visibility: 0.98 };
    lms[24] = { x: 0.55, y: hipY, z: 0, visibility: 0.98 };
    // Knees
    lms[25] = { x: 0.5 - kneeSpread, y: kneeY, z: -0.05, visibility: 0.98 };
    lms[26] = { x: 0.5 + kneeSpread, y: kneeY, z: -0.05, visibility: 0.98 };
    // Ankles
    lms[27] = { x: 0.42, y: ankleY, z: 0, visibility: 0.98 };
    lms[28] = { x: 0.58, y: ankleY, z: 0, visibility: 0.98 };
    // Feet
    lms[31] = { x: 0.41, y: ankleY + 0.03, z: -0.05, visibility: 0.95 };
    lms[32] = { x: 0.59, y: ankleY + 0.03, z: -0.05, visibility: 0.95 };
  } else if (exerciseId === 'bicep_curl') {
    // Standing upright with curling forearms
    const headY = 0.18;
    const shoulderY = 0.28;
    const elbowY = 0.48;
    // Wrist moves from extended (~0.66) up to chest level (~0.32)
    const wristY = 0.66 - cycle * 0.35;
    const wristZ = -cycle * 0.15;

    lms[0] = { x: 0.5, y: headY, z: 0, visibility: 0.98 };
    lms[11] = { x: 0.42, y: shoulderY, z: 0, visibility: 0.98 };
    lms[12] = { x: 0.58, y: shoulderY, z: 0, visibility: 0.98 };
    lms[13] = { x: 0.38, y: elbowY, z: 0, visibility: 0.98 };
    lms[14] = { x: 0.62, y: elbowY, z: 0, visibility: 0.98 };
    lms[15] = { x: 0.4, y: wristY, z: wristZ, visibility: 0.98 };
    lms[16] = { x: 0.6, y: wristY, z: wristZ, visibility: 0.98 };

    // Hips, knees, ankles standing still
    lms[23] = { x: 0.45, y: 0.54, z: 0, visibility: 0.98 };
    lms[24] = { x: 0.55, y: 0.54, z: 0, visibility: 0.98 };
    lms[25] = { x: 0.46, y: 0.72, z: 0, visibility: 0.98 };
    lms[26] = { x: 0.54, y: 0.72, z: 0, visibility: 0.98 };
    lms[27] = { x: 0.46, y: 0.9, z: 0, visibility: 0.98 };
    lms[28] = { x: 0.54, y: 0.9, z: 0, visibility: 0.98 };
  } else if (exerciseId === 'push_up' || exerciseId === 'plank') {
    // Prone horizontal plank view (side or diagonal angle)
    // Head at left, feet at right, hands on floor
    const chestDrop = cycle * 0.12;
    const bodyY = 0.55 + chestDrop;

    lms[0] = { x: 0.22, y: bodyY - 0.05, z: 0, visibility: 0.98 };
    lms[11] = { x: 0.3, y: bodyY, z: 0, visibility: 0.98 };
    lms[12] = { x: 0.32, y: bodyY + 0.02, z: 0.05, visibility: 0.98 };
    // Wrists pinned to floor at y = 0.72
    lms[15] = { x: 0.3, y: 0.72, z: 0, visibility: 0.98 };
    lms[16] = { x: 0.33, y: 0.72, z: 0.05, visibility: 0.98 };
    // Elbows bend backward/outward
    lms[13] = { x: 0.28 - cycle * 0.05, y: bodyY + 0.08, z: 0, visibility: 0.98 };
    lms[14] = { x: 0.31 - cycle * 0.05, y: bodyY + 0.1, z: 0.05, visibility: 0.98 };

    // Hips drop with body line
    lms[23] = { x: 0.55, y: bodyY + 0.02, z: 0, visibility: 0.98 };
    lms[24] = { x: 0.56, y: bodyY + 0.03, z: 0.05, visibility: 0.98 };
    // Knees
    lms[25] = { x: 0.7, y: 0.62 + chestDrop * 0.5, z: 0, visibility: 0.98 };
    lms[26] = { x: 0.71, y: 0.63 + chestDrop * 0.5, z: 0.05, visibility: 0.98 };
    // Feet on floor
    lms[27] = { x: 0.85, y: 0.7, z: 0, visibility: 0.98 };
    lms[28] = { x: 0.86, y: 0.7, z: 0.05, visibility: 0.98 };
  } else {
    // Jumping jacks or generic standing
    const armSpread = cycle * 0.35;
    const legSpread = cycle * 0.15;

    lms[0] = { x: 0.5, y: 0.18, z: 0, visibility: 0.98 };
    lms[11] = { x: 0.44, y: 0.3, z: 0, visibility: 0.98 };
    lms[12] = { x: 0.56, y: 0.3, z: 0, visibility: 0.98 };
    lms[13] = { x: 0.38 - armSpread * 0.5, y: 0.3 - armSpread * 0.4, z: 0, visibility: 0.98 };
    lms[14] = { x: 0.62 + armSpread * 0.5, y: 0.3 - armSpread * 0.4, z: 0, visibility: 0.98 };
    lms[15] = { x: 0.32 - armSpread, y: 0.45 - armSpread * 0.7, z: 0, visibility: 0.98 };
    lms[16] = { x: 0.68 + armSpread, y: 0.45 - armSpread * 0.7, z: 0, visibility: 0.98 };

    lms[23] = { x: 0.45, y: 0.54, z: 0, visibility: 0.98 };
    lms[24] = { x: 0.55, y: 0.54, z: 0, visibility: 0.98 };
    lms[25] = { x: 0.45 - legSpread * 0.5, y: 0.72, z: 0, visibility: 0.98 };
    lms[26] = { x: 0.55 + legSpread * 0.5, y: 0.72, z: 0, visibility: 0.98 };
    lms[27] = { x: 0.44 - legSpread, y: 0.9, z: 0, visibility: 0.98 };
    lms[28] = { x: 0.56 + legSpread, y: 0.9, z: 0, visibility: 0.98 };
  }

  return { landmarks: lms, isOutOfFrame: false };
}
