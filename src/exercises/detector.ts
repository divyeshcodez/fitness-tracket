import { ExerciseId, PoseLandmarks } from '../types';
import { calculateAngle, horizontalAngle, POSE_LANDMARKS } from '../utils/geometry';

export interface DetectionResult {
  detectedExercise: ExerciseId;
  confidence: number; // 0 to 1
}

/**
 * Heuristic classifier to auto-detect current exercise from pose landmarks.
 */
export function detectExercise(landmarks: PoseLandmarks): DetectionResult {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return { detectedExercise: 'squat', confidence: 0.5 };
  }

  // Torso inclination relative to horizontal
  // If torso is horizontal (< 35 degrees relative to horizontal axis), user is planking/push-up/sit-up
  const torsoAngle = horizontalAngle(
    { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: 0 },
    { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, z: 0 }
  );

  const isHorizontalTorso = torsoAngle < 40;

  // Horizontal poses: Push-up vs Plank vs Sit-up
  if (isHorizontalTorso) {
    // Check if on back (situp) or prone (pushup/plank)
    // Check elbow bending
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbow = (leftElbowAngle + rightElbowAngle) / 2;

    if (avgElbow < 140) {
      return { detectedExercise: 'push_up', confidence: 0.88 };
    }
    return { detectedExercise: 'push_up', confidence: 0.75 };
  }

  // Vertical / Standing poses:
  // Check knee flexion
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;

  // Check elbow flexion
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const avgElbow = (leftElbowAngle + rightElbowAngle) / 2;

  // Check overhead arms (wrist above shoulder)
  const isOverhead =
    (leftWrist && leftWrist.y < leftShoulder.y) ||
    (rightWrist && rightWrist.y < rightShoulder.y);

  // Check lateral arms (wide arm span relative to shoulders)
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const handSpread = leftWrist && rightWrist ? Math.abs(leftWrist.x - rightWrist.x) : 0;
  const isArmLateral = handSpread > shoulderWidth * 2.5;

  if (isOverhead && avgElbow < 140) {
    return { detectedExercise: 'shoulder_press', confidence: 0.85 };
  }

  if (isArmLateral && avgElbow > 120 && avgKnee > 150) {
    return { detectedExercise: 'lateral_raise', confidence: 0.82 };
  }

  // If knees bending significantly, it's lower body (Squat vs Lunge)
  if (avgKnee < 135) {
    // Check stance asymmetry for lunge
    const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle);
    if (kneeDiff > 35) {
      return { detectedExercise: 'lunge', confidence: 0.84 };
    }
    return { detectedExercise: 'squat', confidence: 0.92 };
  }

  // If knees are relatively straight (> 145) but elbows are bending, it's bicep curl
  if (avgKnee > 145 && avgElbow < 135 && !isOverhead) {
    return { detectedExercise: 'bicep_curl', confidence: 0.91 };
  }

  // Default to squat as primary foundational lower exercise
  return { detectedExercise: 'squat', confidence: 0.7 };
}
