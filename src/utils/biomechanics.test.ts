import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSymmetry, detectCameraPerspective } from './biomechanics';
import { PoseLandmarks } from '../types';

function createMockPose(shoulderSpread = 0.2, hipSpread = 0.15, zDelta = 0): PoseLandmarks {
  const lms: PoseLandmarks = Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
  // Left and right shoulders
  lms[11] = { x: 0.5 - shoulderSpread / 2, y: 0.3, z: -zDelta / 2, visibility: 0.95 };
  lms[12] = { x: 0.5 + shoulderSpread / 2, y: 0.3, z: zDelta / 2, visibility: 0.95 };
  // Left and right hips
  lms[23] = { x: 0.5 - hipSpread / 2, y: 0.6, z: 0, visibility: 0.95 };
  lms[24] = { x: 0.5 + hipSpread / 2, y: 0.6, z: 0, visibility: 0.95 };
  return lms;
}

test('detectCameraPerspective detects front view when shoulder span is wide', () => {
  const frontPose = createMockPose(0.25, 0.18, 0);
  assert.equal(detectCameraPerspective(frontPose), 'front');
});

test('detectCameraPerspective detects side profile when shoulder span collapses', () => {
  const sidePose = createMockPose(0.04, 0.03, 0.25);
  const perspective = detectCameraPerspective(sidePose);
  assert.ok(perspective === 'side_left' || perspective === 'side_right');
});

test('calculateSymmetry reports balanced 50/50 for equal angles', () => {
  const pose = createMockPose(0.2, 0.15);
  // Knees equal
  pose[25] = { x: 0.4, y: 0.7, z: 0 };
  pose[26] = { x: 0.6, y: 0.7, z: 0 };
  pose[27] = { x: 0.4, y: 0.9, z: 0 };
  pose[28] = { x: 0.6, y: 0.9, z: 0 };

  const sym = calculateSymmetry('squat', pose);
  assert.equal(sym.isImbalanced, false);
});
