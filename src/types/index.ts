/**
 * Type definitions for MotionLens biomechanical movement tracker
 */

export interface NormalizedLandmark {
  x: number; // 0 to 1
  y: number; // 0 to 1
  z: number; // relative depth
  visibility?: number;
}

export type PoseLandmarks = NormalizedLandmark[];

export type MuscleGroup =
  | 'quadriceps'
  | 'glutes'
  | 'hamstrings'
  | 'calves'
  | 'biceps'
  | 'triceps'
  | 'shoulders'
  | 'chest'
  | 'core'
  | 'upper_back'
  | 'lower_back'
  | 'forearms';

export type MuscleIntensityMap = Record<MuscleGroup, number>; // 0.0 to 1.0

export type ExerciseId =
  | 'squat'
  | 'bicep_curl'
  | 'push_up'
  | 'lunge'
  | 'shoulder_press'
  | 'lateral_raise'
  | 'plank'
  | 'deadlift'
  | 'jumping_jack'
  | 'sit_up';

export type RepPhase = 'idle' | 'eccentric' | 'inflection' | 'concentric';

export interface FormFeedback {
  severity: 'good' | 'warning' | 'error';
  message: string;
  problemJoints?: number[]; // landmark indices (e.g. knee, elbow)
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  category: 'lower' | 'upper' | 'core' | 'full';
  metValue: number; // Metabolic Equivalent of Task
  description: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  keyJoints: number[]; // landmark indices for skeleton emphasis
  targetAngleName: string; // e.g. "Knee Angle", "Elbow Angle"
  getJointAngle: (landmarks: PoseLandmarks) => number;
  evaluateForm: (landmarks: PoseLandmarks, currentAngle: number, phase: RepPhase) => FormFeedback;
  calculateMuscleLoad: (
    currentAngle: number,
    phase: RepPhase,
    landmarks: PoseLandmarks
  ) => MuscleIntensityMap;
  repConfig: {
    startAngle: number;
    inflectionAngle: number;
    isMinInflection: boolean; // true if inflection is at min angle (e.g. squat 90° vs 170°), false if max
    hysteresis: number;
  };
}

export interface RepEvent {
  repNumber: number;
  isGood: boolean;
  score: number; // 0 - 100
  durationSeconds: number;
  formCues: string[];
  timestamp: number;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  exerciseId: ExerciseId;
  exerciseName: string;
  userWeightKg: number;
  totalReps: number;
  goodReps: number;
  badReps: number;
  avgFormScore: number;
  durationSeconds: number;
  caloriesBurned: number;
  muscleEngagement: MuscleIntensityMap;
}

export type ModelQuality = 'lite' | 'balanced' | 'accurate';
