import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAngle, distance2D, midpoint, verticalAngle } from './geometry';

test('calculateAngle computes exact right angle (90 degrees)', () => {
  const a = { x: 0, y: 1, z: 0 };
  const b = { x: 0, y: 0, z: 0 };
  const c = { x: 1, y: 0, z: 0 };
  const angle = calculateAngle(a, b, c);
  assert.equal(angle, 90);
});

test('calculateAngle computes straight line (180 degrees)', () => {
  const a = { x: 0, y: 1, z: 0 };
  const b = { x: 0, y: 0, z: 0 };
  const c = { x: 0, y: -1, z: 0 };
  const angle = calculateAngle(a, b, c);
  assert.equal(angle, 180);
});

test('distance2D returns Euclidean hypotenuse', () => {
  const a = { x: 0, y: 0, z: 0 };
  const b = { x: 3, y: 4, z: 0 };
  assert.equal(distance2D(a, b), 5);
});

test('midpoint calculates center coordinate', () => {
  const a = { x: 0, y: 0, z: 0 };
  const b = { x: 10, y: 20, z: 0 };
  const mid = midpoint(a, b);
  assert.equal(mid.x, 5);
  assert.equal(mid.y, 10);
});

test('verticalAngle computes angle relative to vertical y-axis', () => {
  const a = { x: 0, y: 0, z: 0 };
  const b = { x: 0, y: 10, z: 0 };
  assert.equal(verticalAngle(a, b), 0);
});
