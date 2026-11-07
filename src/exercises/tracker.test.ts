import test from 'node:test';
import assert from 'node:assert/strict';
import { ExerciseTracker } from './tracker';
import { EXERCISES } from './definitions';
import { PoseLandmarks } from '../types';

function createMockSquatPose(kneeAngleDegrees: number): PoseLandmarks {
  // Landmarks array of 33 items
  const lms: PoseLandmarks = Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));

  // Hip at (0.5, 0.4), Knee at (0.5, 0.6)
  // Ankle positioned to make angle at knee
  lms[23] = { x: 0.45, y: 0.35, z: 0, visibility: 0.95 }; // left hip
  lms[24] = { x: 0.55, y: 0.35, z: 0, visibility: 0.95 }; // right hip

  lms[25] = { x: 0.45, y: 0.6, z: 0, visibility: 0.95 }; // left knee
  lms[26] = { x: 0.55, y: 0.6, z: 0, visibility: 0.95 }; // right knee

  // Rotate ankle around knee based on angle
  const rad = (kneeAngleDegrees * Math.PI) / 180;
  // If kneeAngle is 180, ankle is at (0.45, 0.85) (straight down from knee)
  lms[27] = {
    x: 0.45 + 0.25 * Math.sin(Math.PI - rad),
    y: 0.6 + 0.25 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };
  lms[28] = {
    x: 0.55 + 0.25 * Math.sin(Math.PI - rad),
    y: 0.6 + 0.25 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };

  return lms;
}

test('ExerciseTracker starts at 0 reps in idle phase', () => {
  const tracker = new ExerciseTracker(EXERCISES.squat);
  const pose = createMockSquatPose(170);
  const result = tracker.update(pose, 1000);
  assert.equal(result.totalReps, 0);
  assert.equal(result.phase, 'idle');
});

test('ExerciseTracker transitions through eccentric, inflection, and counts completed rep', () => {
  const tracker = new ExerciseTracker(EXERCISES.squat);

  // 1. Standing upright (170°)
  tracker.update(createMockSquatPose(170), 1000);

  // 2. Descending (130°) -> enters eccentric
  const res2 = tracker.update(createMockSquatPose(130), 1500);
  assert.equal(res2.phase, 'eccentric');

  // 3. Deep squat inflection (90°) -> enters inflection
  const res3 = tracker.update(createMockSquatPose(88), 2000);
  assert.equal(res3.phase, 'inflection');

  // 4. Ascending (120°) -> enters concentric
  const res4 = tracker.update(createMockSquatPose(120), 2500);
  assert.equal(res4.phase, 'concentric');

  // 5. Standing back up (165°) -> rep completed!
  const res5 = tracker.update(createMockSquatPose(165), 3000);
  assert.equal(res5.totalReps, 1);
  assert.equal(res5.goodReps, 1);
  assert.equal(res5.phase, 'idle');
  assert.ok(res5.lastRepEvent !== null);
  assert.equal(res5.lastRepEvent?.repNumber, 1);
});
