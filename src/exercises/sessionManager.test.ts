import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkoutSessionManager } from './sessionManager';
import { EXERCISES } from './definitions';

test('WorkoutSessionManager tracks multiple exercises separately and aggregates totals', () => {
  const manager = new WorkoutSessionManager('squat');

  // Exercise 1: Squat (20 reps)
  manager.recordExerciseProgress('squat', {
    reps: 20,
    goodReps: 18,
    badReps: 2,
    caloriesBurned: 24.5,
    activeSeconds: 50,
    avgFormScore: 94,
    symmetryScore: 96,
    muscleEngagement: EXERCISES.squat.calculateMuscleLoad(90, 'inflection', []),
  });

  // Switch to Exercise 2: Push-Up (15 reps)
  manager.setCurrentExercise('push_up');
  manager.recordExerciseProgress('push_up', {
    reps: 15,
    goodReps: 14,
    badReps: 1,
    caloriesBurned: 18.0,
    activeSeconds: 38,
    avgFormScore: 92,
    symmetryScore: 94,
    muscleEngagement: EXERCISES.push_up.calculateMuscleLoad(90, 'inflection', []),
  });

  // Switch to Exercise 3: Bicep Curl (12 reps)
  manager.setCurrentExercise('bicep_curl');
  manager.recordExerciseProgress('bicep_curl', {
    reps: 12,
    goodReps: 12,
    badReps: 0,
    caloriesBurned: 9.5,
    activeSeconds: 28,
    avgFormScore: 98,
    symmetryScore: 98,
    muscleEngagement: EXERCISES.bicep_curl.calculateMuscleLoad(60, 'inflection', []),
  });

  const allItems = manager.getAllExerciseItems();
  assert.equal(allItems.length, 3);

  // Check specific exercises
  const squatItem = allItems.find((i) => i.exerciseId === 'squat');
  assert.equal(squatItem?.reps, 20);

  const pushupItem = allItems.find((i) => i.exerciseId === 'push_up');
  assert.equal(pushupItem?.reps, 15);

  const curlItem = allItems.find((i) => i.exerciseId === 'bicep_curl');
  assert.equal(curlItem?.reps, 12);

  // Total reps across all 3 exercises = 20 + 15 + 12 = 47
  assert.equal(manager.getTotalReps(), 47);

  // Total calories = 24.5 + 18.0 + 9.5 = 52.0
  assert.equal(manager.getTotalCalories(), 52.0);

  // Muscle engagement contains both lower body (quadriceps/glutes) and upper body (chest/biceps)
  const combinedMuscles = manager.getCombinedMuscleEngagement();
  assert.ok(combinedMuscles.quadriceps > 0.5);
  assert.ok(combinedMuscles.biceps > 0.5);
  assert.ok(combinedMuscles.chest > 0.5);
});
