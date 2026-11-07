import { CameraPerspective, ExerciseId, PoseLandmarks, SymmetryData } from '../types';
import { calculateAngle, POSE_LANDMARKS } from './geometry';

/**
 * Detects whether user is facing the camera frontally, side-profile, or diagonally.
 */
export function detectCameraPerspective(landmarks: PoseLandmarks): CameraPerspective {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 'front';
  }

  const shoulderSpan = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipSpan = Math.abs(leftHip.x - rightHip.x);
  const torsoHeight = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2);

  if (torsoHeight <= 0.05) return 'front';

  const widthToHeightRatio = shoulderSpan / torsoHeight;
  const zDelta = (leftShoulder.z || 0) - (rightShoulder.z || 0);

  // In pure side profile, shoulder span shrinks dramatically (< 0.35 of torso height)
  if (widthToHeightRatio < 0.35 || hipSpan < 0.05) {
    return zDelta < 0 ? 'side_left' : 'side_right';
  } else if (widthToHeightRatio < 0.65 || Math.abs(zDelta) > 0.15) {
    return 'diagonal';
  }

  return 'front';
}

/**
 * Calculates bilateral left vs right symmetry for joints in bilateral exercises
 */
export function calculateSymmetry(
  exerciseId: ExerciseId,
  landmarks: PoseLandmarks
): SymmetryData {
  let leftAngle = 170;
  let rightAngle = 170;

  if (exerciseId === 'squat' || exerciseId === 'deadlift' || exerciseId === 'jumping_jack') {
    leftAngle = calculateAngle(
      landmarks[POSE_LANDMARKS.LEFT_HIP],
      landmarks[POSE_LANDMARKS.LEFT_KNEE],
      landmarks[POSE_LANDMARKS.LEFT_ANKLE]
    );
    rightAngle = calculateAngle(
      landmarks[POSE_LANDMARKS.RIGHT_HIP],
      landmarks[POSE_LANDMARKS.RIGHT_KNEE],
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    );
  } else if (
    exerciseId === 'push_up' ||
    exerciseId === 'bicep_curl' ||
    exerciseId === 'shoulder_press' ||
    exerciseId === 'lateral_raise'
  ) {
    leftAngle = calculateAngle(
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      landmarks[POSE_LANDMARKS.LEFT_ELBOW],
      landmarks[POSE_LANDMARKS.LEFT_WRIST]
    );
    rightAngle = calculateAngle(
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
      landmarks[POSE_LANDMARKS.RIGHT_WRIST]
    );
  }

  // Fallback defaults
  if (leftAngle <= 0) leftAngle = rightAngle || 170;
  if (rightAngle <= 0) rightAngle = leftAngle || 170;

  const total = leftAngle + rightAngle;
  let leftPercent = 50;
  let rightPercent = 50;

  if (total > 0) {
    // Inverse angle weight: deeper flexion = higher load
    const leftFlex = 180 - leftAngle;
    const rightFlex = 180 - rightAngle;
    const flexSum = leftFlex + rightFlex;

    if (flexSum > 20) {
      leftPercent = Math.round((leftFlex / flexSum) * 100);
      rightPercent = 100 - leftPercent;
    }
  }

  const diff = Math.abs(leftPercent - rightPercent);
  const isImbalanced = diff >= 12;

  let message: string | undefined;
  if (isImbalanced) {
    if (leftPercent > rightPercent) {
      message = 'Left side driving harder — balance weight';
    } else {
      message = 'Right side driving harder — balance weight';
    }
  }

  return {
    leftAngle: Math.round(leftAngle),
    rightAngle: Math.round(rightAngle),
    leftPercent,
    rightPercent,
    isImbalanced,
    message,
  };
}
