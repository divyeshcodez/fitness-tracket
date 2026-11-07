import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCaloriesBurned, lbToKg, kgToLb } from './calories';

test('calculateCaloriesBurned returns 0 when weight or time is 0', () => {
  assert.equal(calculateCaloriesBurned({ metValue: 5.5, weightKg: 0, activeSeconds: 60 }), 0);
  assert.equal(calculateCaloriesBurned({ metValue: 5.5, weightKg: 70, activeSeconds: 0 }), 0);
});

test('calculateCaloriesBurned calculates standard MET formula', () => {
  // MET 6.0, 70kg, 1 hour (3600 sec) = 6 * 70 * 1 = 420 kcal
  const kcal = calculateCaloriesBurned({
    metValue: 6.0,
    weightKg: 70,
    activeSeconds: 3600,
    tempoMultiplier: 1.0,
    romMultiplier: 1.0,
  });
  assert.equal(kcal, 420);
});

test('calculateCaloriesBurned handles tempo and ROM adjustments', () => {
  // 6 * 70 * 0.5hr = 210 * 1.1 * 1.1 = 254.1 kcal
  const kcal = calculateCaloriesBurned({
    metValue: 6.0,
    weightKg: 70,
    activeSeconds: 1800,
    tempoMultiplier: 1.1,
    romMultiplier: 1.1,
  });
  assert.equal(kcal, 254.1);
});

test('unit conversion helpers work accurately', () => {
  assert.equal(lbToKg(154.32), 70);
  assert.equal(kgToLb(70), 154.3);
});
