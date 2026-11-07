import {
  ExerciseDefinition,
  FormFeedback,
  MuscleIntensityMap,
  PoseLandmarks,
  RepEvent,
  RepPhase,
} from '../types';

export interface TrackerUpdateResult {
  currentAngle: number;
  phase: RepPhase;
  repProgress: number; // 0 to 1
  totalReps: number;
  goodReps: number;
  badReps: number;
  lastRepEvent: RepEvent | null;
  formFeedback: FormFeedback;
  formScore: number; // 0 to 100
  tempoSeconds: number; // avg seconds per rep
  activeExerciseSeconds: number;
  muscleIntensities: MuscleIntensityMap;
  cumulativeMuscleLoad: MuscleIntensityMap;
  targetAngleName: string;
}

export class ExerciseTracker {
  private definition: ExerciseDefinition;
  private phase: RepPhase = 'idle';
  private totalReps: number = 0;
  private goodReps: number = 0;
  private badReps: number = 0;
  private repStartTime: number = 0;
  private activeTimeSeconds: number = 0;
  private lastTimestampMs: number = 0;
  private recentRepDurations: number[] = [];
  private lastRepEvent: RepEvent | null = null;
  private minAngleSeenInRep: number = 999;
  private maxAngleSeenInRep: number = 0;
  private currentFormScore: number = 95;
  private cumulativeMuscles: MuscleIntensityMap;

  constructor(definition: ExerciseDefinition) {
    this.definition = definition;
    this.cumulativeMuscles = this.createEmptyMuscles();
  }

  private createEmptyMuscles(): MuscleIntensityMap {
    return {
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
  }

  setExercise(definition: ExerciseDefinition): void {
    if (this.definition.id !== definition.id) {
      this.definition = definition;
      this.phase = 'idle';
      this.minAngleSeenInRep = 999;
      this.maxAngleSeenInRep = 0;
    }
  }

  reset(): void {
    this.phase = 'idle';
    this.totalReps = 0;
    this.goodReps = 0;
    this.badReps = 0;
    this.repStartTime = 0;
    this.activeTimeSeconds = 0;
    this.lastTimestampMs = 0;
    this.recentRepDurations = [];
    this.lastRepEvent = null;
    this.currentFormScore = 95;
    this.cumulativeMuscles = this.createEmptyMuscles();
  }

  update(landmarks: PoseLandmarks, timestampMs: number): TrackerUpdateResult {
    const { startAngle, inflectionAngle, isMinInflection, hysteresis } =
      this.definition.repConfig;

    const angle = this.definition.getJointAngle(landmarks);

    // Track active movement time
    if (this.lastTimestampMs > 0) {
      const dtSec = Math.min((timestampMs - this.lastTimestampMs) / 1000, 0.2);
      if (this.phase !== 'idle') {
        this.activeTimeSeconds += dtSec;
      }
    }
    this.lastTimestampMs = timestampMs;

    this.minAngleSeenInRep = Math.min(this.minAngleSeenInRep, angle);
    this.maxAngleSeenInRep = Math.max(this.maxAngleSeenInRep, angle);

    let justFinishedRep: RepEvent | null = null;

    // Calculate progression towards inflection (0 to 1)
    let repProgress = 0;
    if (isMinInflection) {
      const totalRange = startAngle - inflectionAngle;
      if (totalRange > 0) {
        repProgress = Math.max(0, Math.min(1, (startAngle - angle) / totalRange));
      }
    } else {
      const totalRange = inflectionAngle - startAngle;
      if (totalRange > 0) {
        repProgress = Math.max(0, Math.min(1, (angle - startAngle) / totalRange));
      }
    }

    // State machine transitions
    if (isMinInflection) {
      // e.g. Squat, Bicep Curl, Push-up
      if (this.phase === 'idle') {
        if (angle < startAngle - hysteresis) {
          this.phase = 'eccentric';
          this.repStartTime = timestampMs;
          this.minAngleSeenInRep = angle;
        }
      } else if (this.phase === 'eccentric') {
        if (angle <= inflectionAngle) {
          this.phase = 'inflection';
        } else if (angle > startAngle + 5) {
          // aborted or returned without hitting depth
          this.phase = 'idle';
        }
      } else if (this.phase === 'inflection') {
        if (angle > inflectionAngle + hysteresis) {
          this.phase = 'concentric';
        }
      } else if (this.phase === 'concentric') {
        if (angle >= startAngle - hysteresis / 2) {
          // Rep completed!
          this.totalReps++;
          const duration = Math.max(0.6, (timestampMs - this.repStartTime) / 1000);
          this.recentRepDurations.push(duration);
          if (this.recentRepDurations.length > 5) this.recentRepDurations.shift();

          const formCheck = this.definition.evaluateForm(landmarks, this.minAngleSeenInRep, 'concentric');
          const isGood = formCheck.severity !== 'error';

          if (isGood) {
            this.goodReps++;
            this.currentFormScore = Math.min(100, Math.round(this.currentFormScore * 0.8 + 98 * 0.2));
          } else {
            this.badReps++;
            this.currentFormScore = Math.max(40, Math.round(this.currentFormScore * 0.8 + 60 * 0.2));
          }

          justFinishedRep = {
            repNumber: this.totalReps,
            isGood,
            score: isGood ? 96 : 65,
            durationSeconds: Math.round(duration * 10) / 10,
            formCues: [formCheck.message],
            timestamp: timestampMs,
          };
          this.lastRepEvent = justFinishedRep;

          this.phase = 'idle';
          this.minAngleSeenInRep = 999;
          this.maxAngleSeenInRep = 0;
        }
      }
    } else {
      // e.g. Shoulder Press, Lateral Raise, Jumping Jack (extension inflection)
      if (this.phase === 'idle') {
        if (angle > startAngle + hysteresis) {
          this.phase = 'concentric';
          this.repStartTime = timestampMs;
        }
      } else if (this.phase === 'concentric') {
        if (angle >= inflectionAngle) {
          this.phase = 'inflection';
        }
      } else if (this.phase === 'inflection') {
        if (angle < inflectionAngle - hysteresis) {
          this.phase = 'eccentric';
        }
      } else if (this.phase === 'eccentric') {
        if (angle <= startAngle + hysteresis / 2) {
          this.totalReps++;
          const duration = Math.max(0.6, (timestampMs - this.repStartTime) / 1000);
          this.recentRepDurations.push(duration);
          if (this.recentRepDurations.length > 5) this.recentRepDurations.shift();

          this.goodReps++;
          justFinishedRep = {
            repNumber: this.totalReps,
            isGood: true,
            score: 95,
            durationSeconds: Math.round(duration * 10) / 10,
            formCues: ['Good lockout'],
            timestamp: timestampMs,
          };
          this.lastRepEvent = justFinishedRep;

          this.phase = 'idle';
        }
      }
    }

    const formFeedback = this.definition.evaluateForm(landmarks, angle, this.phase);

    // Compute instantaneous muscle load
    const muscleIntensities = this.definition.calculateMuscleLoad(angle, this.phase, landmarks);

    // Accumulate total muscle engagement over the session
    for (const [key, val] of Object.entries(muscleIntensities)) {
      const muscleKey = key as keyof MuscleIntensityMap;
      this.cumulativeMuscles[muscleKey] = Math.max(
        this.cumulativeMuscles[muscleKey],
        val * 0.95 + 0.05
      );
    }

    // Average tempo
    const avgTempo =
      this.recentRepDurations.length > 0
        ? Math.round(
            (this.recentRepDurations.reduce((a, b) => a + b, 0) /
              this.recentRepDurations.length) *
              10
          ) / 10
        : 2.5;

    return {
      currentAngle: Math.round(angle),
      phase: this.phase,
      repProgress,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      badReps: this.badReps,
      lastRepEvent: justFinishedRep,
      formFeedback,
      formScore: this.currentFormScore,
      tempoSeconds: avgTempo,
      activeExerciseSeconds: Math.round(this.activeTimeSeconds * 10) / 10,
      muscleIntensities,
      cumulativeMuscleLoad: { ...this.cumulativeMuscles },
      targetAngleName: this.definition.targetAngleName,
    };
  }
}
