import { ExerciseId, ExerciseSessionItem, MuscleIntensityMap } from '../types';
import { EXERCISES } from './definitions';

export class WorkoutSessionManager {
  private exerciseItems: Map<ExerciseId, ExerciseSessionItem> = new Map();
  private currentExerciseId: ExerciseId = 'squat';

  constructor(initialExercise: ExerciseId = 'squat') {
    this.currentExerciseId = initialExercise;
  }

  getCurrentExerciseId(): ExerciseId {
    return this.currentExerciseId;
  }

  /**
   * Called whenever an exercise finishes or switches to another exercise
   */
  recordExerciseProgress(
    exerciseId: ExerciseId,
    data: {
      reps: number;
      goodReps: number;
      badReps: number;
      caloriesBurned: number;
      activeSeconds: number;
      avgFormScore: number;
      symmetryScore: number;
      muscleEngagement: MuscleIntensityMap;
    }
  ): void {
    if (data.reps === 0 && data.activeSeconds < 2) return;

    const existing = this.exerciseItems.get(exerciseId);
    if (existing) {
      existing.reps = data.reps;
      existing.goodReps = data.goodReps;
      existing.badReps = data.badReps;
      existing.caloriesBurned = data.caloriesBurned;
      existing.activeSeconds = data.activeSeconds;
      existing.avgFormScore = data.avgFormScore;
      existing.symmetryScore = data.symmetryScore;
      existing.muscleEngagement = { ...data.muscleEngagement };
    } else {
      this.exerciseItems.set(exerciseId, {
        exerciseId,
        exerciseName: EXERCISES[exerciseId]?.name || exerciseId,
        reps: data.reps,
        goodReps: data.goodReps,
        badReps: data.badReps,
        caloriesBurned: data.caloriesBurned,
        activeSeconds: data.activeSeconds,
        avgFormScore: data.avgFormScore,
        symmetryScore: data.symmetryScore,
        muscleEngagement: { ...data.muscleEngagement },
      });
    }
  }

  setCurrentExercise(nextExerciseId: ExerciseId): void {
    this.currentExerciseId = nextExerciseId;
  }

  getAllExerciseItems(): ExerciseSessionItem[] {
    return Array.from(this.exerciseItems.values());
  }

  getTotalReps(): number {
    return Array.from(this.exerciseItems.values()).reduce((acc, item) => acc + item.reps, 0);
  }

  getTotalCalories(): number {
    const sum = Array.from(this.exerciseItems.values()).reduce(
      (acc, item) => acc + item.caloriesBurned,
      0
    );
    return Math.round(sum * 10) / 10;
  }

  getOverallFormScore(): number {
    const items = Array.from(this.exerciseItems.values());
    if (items.length === 0) return 95;
    const totalScore = items.reduce((acc, item) => acc + item.avgFormScore, 0);
    return Math.round(totalScore / items.length);
  }

  getOverallSymmetryScore(): number {
    const items = Array.from(this.exerciseItems.values());
    if (items.length === 0) return 98;
    const totalScore = items.reduce((acc, item) => acc + item.symmetryScore, 0);
    return Math.round(totalScore / items.length);
  }

  getCombinedMuscleEngagement(): MuscleIntensityMap {
    const empty: MuscleIntensityMap = {
      quadriceps: 0,
      glutes: 0,
      hamstrings: 0,
      calves: 0,
      biceps: 0,
      triceps: 0,
      shoulders: 0,
      chest: 0,
      core: 0,
      upper_back: 0,
      lower_back: 0,
      forearms: 0,
    };

    for (const item of this.exerciseItems.values()) {
      for (const [key, val] of Object.entries(item.muscleEngagement)) {
        const mKey = key as keyof MuscleIntensityMap;
        empty[mKey] = Math.max(empty[mKey], val);
      }
    }

    return empty;
  }

  reset(): void {
    this.exerciseItems.clear();
  }
}
