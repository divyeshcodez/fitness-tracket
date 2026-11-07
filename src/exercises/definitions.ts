import { ExerciseDefinition, ExerciseId, MuscleIntensityMap, PoseLandmarks, RepPhase } from '../types';
import { calculateAngle, POSE_LANDMARKS } from '../utils/geometry';

const EMPTY_MUSCLES: MuscleIntensityMap = {
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

export const EXERCISES: Record<ExerciseId, ExerciseDefinition> = {
  squat: {
    id: 'squat',
    name: 'Bodyweight Squat',
    category: 'lower',
    metValue: 5.5,
    description: 'Bilateral knee and hip flexion targeting quadriceps and glutes.',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves', 'core'],
    keyJoints: [
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    targetAngleName: 'Knee Flexion',
    getJointAngle: (lms: PoseLandmarks) => {
      const leftKnee = calculateAngle(
        lms[POSE_LANDMARKS.LEFT_HIP],
        lms[POSE_LANDMARKS.LEFT_KNEE],
        lms[POSE_LANDMARKS.LEFT_ANKLE]
      );
      const rightKnee = calculateAngle(
        lms[POSE_LANDMARKS.RIGHT_HIP],
        lms[POSE_LANDMARKS.RIGHT_KNEE],
        lms[POSE_LANDMARKS.RIGHT_ANKLE]
      );
      // Use active side or average
      if (leftKnee > 0 && rightKnee > 0) return Math.min(leftKnee, rightKnee);
      return leftKnee || rightKnee || 170;
    },
    repConfig: {
      startAngle: 155, // Extended standing
      inflectionAngle: 95, // Parallel or below
      isMinInflection: true,
      hysteresis: 15,
    },
    evaluateForm: (lms: PoseLandmarks, currentAngle: number, phase: RepPhase) => {
      // Check knee valgus (knees caving inward)
      const leftKnee = lms[POSE_LANDMARKS.LEFT_KNEE];
      const rightKnee = lms[POSE_LANDMARKS.RIGHT_KNEE];
      const leftAnkle = lms[POSE_LANDMARKS.LEFT_ANKLE];
      const rightAnkle = lms[POSE_LANDMARKS.RIGHT_ANKLE];

      if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
        const kneeDist = Math.abs(leftKnee.x - rightKnee.x);
        const ankleDist = Math.abs(leftAnkle.x - rightAnkle.x);
        if (ankleDist > 0.1 && kneeDist < ankleDist * 0.7 && currentAngle < 120) {
          return {
            severity: 'error',
            message: 'Push knees outward',
            problemJoints: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE],
          };
        }
      }

      // Depth check at bottom
      if (phase === 'inflection' && currentAngle > 105) {
        return {
          severity: 'warning',
          message: 'Squat deeper for full range',
          problemJoints: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE],
        };
      }

      // Torso tilt check
      const leftShoulder = lms[POSE_LANDMARKS.LEFT_SHOULDER];
      const leftHip = lms[POSE_LANDMARKS.LEFT_HIP];
      if (leftShoulder && leftHip) {
        const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
        if (hipAngle > 0 && hipAngle < 55 && currentAngle < 120) {
          return {
            severity: 'warning',
            message: 'Keep chest upright',
            problemJoints: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
          };
        }
      }

      return { severity: 'good', message: 'Solid squat form' };
    },
    calculateMuscleLoad: (currentAngle: number, phase: RepPhase) => {
      const load: MuscleIntensityMap = { ...EMPTY_MUSCLES };
      // Standing lock-out = ~170°. Bottom = ~80°-90°.
      // Peak mechanical torque occurs around 90-100 degrees of knee flexion
      const normalizedFlexion = Math.max(0, Math.min(1, (165 - currentAngle) / (165 - 85)));

      if (phase === 'idle') {
        load.quadriceps = 0.1;
        load.glutes = 0.08;
        return load;
      }

      // Quads peak at bottom (highest moment arm)
      load.quadriceps = Math.min(1.0, 0.15 + normalizedFlexion * 0.85);
      // Glutes strongly engaged in the bottom half and ascending drive
      load.glutes = Math.min(1.0, 0.1 + Math.pow(normalizedFlexion, 1.2) * 0.85);
      // Hamstrings provide knee stabilization
      load.hamstrings = 0.1 + normalizedFlexion * 0.35;
      // Calves stabilize ankles
      load.calves = 0.1 + normalizedFlexion * 0.25;
      // Core braces the spine
      load.core = 0.15 + normalizedFlexion * 0.3;
      load.lower_back = 0.1 + normalizedFlexion * 0.25;

      return load;
    },
  },

  bicep_curl: {
    id: 'bicep_curl',
    name: 'Bicep Curl',
    category: 'upper',
    metValue: 3.8,
    description: 'Elbow flexion isolating the biceps brachii and brachioradialis.',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    keyJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
    ],
    targetAngleName: 'Elbow Flexion',
    getJointAngle: (lms: PoseLandmarks) => {
      const leftElbow = calculateAngle(
        lms[POSE_LANDMARKS.LEFT_SHOULDER],
        lms[POSE_LANDMARKS.LEFT_ELBOW],
        lms[POSE_LANDMARKS.LEFT_WRIST]
      );
      const rightElbow = calculateAngle(
        lms[POSE_LANDMARKS.RIGHT_SHOULDER],
        lms[POSE_LANDMARKS.RIGHT_ELBOW],
        lms[POSE_LANDMARKS.RIGHT_WRIST]
      );
      if (leftElbow > 0 && rightElbow > 0) return Math.min(leftElbow, rightElbow);
      return leftElbow || rightElbow || 160;
    },
    repConfig: {
      startAngle: 150, // Arms extended
      inflectionAngle: 55, // Full curl squeeze
      isMinInflection: true,
      hysteresis: 15,
    },
    evaluateForm: (lms: PoseLandmarks, currentAngle: number) => {
      // Check elbow swaying
      const leftShoulder = lms[POSE_LANDMARKS.LEFT_SHOULDER];
      const leftElbow = lms[POSE_LANDMARKS.LEFT_ELBOW];
      const leftHip = lms[POSE_LANDMARKS.LEFT_HIP];

      if (leftShoulder && leftElbow && leftHip) {
        const shoulderElbowAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
        if (shoulderElbowAngle > 35) {
          return {
            severity: 'warning',
            message: 'Keep elbows pinned to sides',
            problemJoints: [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW],
          };
        }
      }

      if (currentAngle > 75 && currentAngle < 120) {
        return { severity: 'good', message: 'Squeeze biceps at the top' };
      }

      return { severity: 'good', message: 'Controlled bicep tension' };
    },
    calculateMuscleLoad: (currentAngle: number, phase: RepPhase) => {
      const load: MuscleIntensityMap = { ...EMPTY_MUSCLES };
      // Arms hanging: ~160°. Max contraction: ~45°. Peak torque angle: ~90°.
      const normalizedFlex = Math.max(0, Math.min(1, (160 - currentAngle) / (160 - 45)));

      if (phase === 'idle') {
        load.biceps = 0.08;
        return load;
      }

      // Peak torque happens around 80°-90°
      const torquePeakFactor = 1.0 - Math.min(1.0, Math.abs(currentAngle - 85) / 70) * 0.3;
      load.biceps = Math.min(1.0, (0.2 + normalizedFlex * 0.8) * torquePeakFactor);
      load.forearms = Math.min(1.0, 0.15 + normalizedFlex * 0.4);
      load.shoulders = 0.1; // Anterior deltoid stabilization

      return load;
    },
  },

  push_up: {
    id: 'push_up',
    name: 'Push-Up',
    category: 'upper',
    metValue: 6.0,
    description: 'Horizontal press targeting pectorals, anterior deltoids, and triceps.',
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    secondaryMuscles: ['core'],
    keyJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.LEFT_ANKLE,
    ],
    targetAngleName: 'Elbow Depth',
    getJointAngle: (lms: PoseLandmarks) => {
      const leftElbow = calculateAngle(
        lms[POSE_LANDMARKS.LEFT_SHOULDER],
        lms[POSE_LANDMARKS.LEFT_ELBOW],
        lms[POSE_LANDMARKS.LEFT_WRIST]
      );
      const rightElbow = calculateAngle(
        lms[POSE_LANDMARKS.RIGHT_SHOULDER],
        lms[POSE_LANDMARKS.RIGHT_ELBOW],
        lms[POSE_LANDMARKS.RIGHT_WRIST]
      );
      if (leftElbow > 0 && rightElbow > 0) return Math.min(leftElbow, rightElbow);
      return leftElbow || rightElbow || 165;
    },
    repConfig: {
      startAngle: 155, // Planking top lockout
      inflectionAngle: 90, // Chest near floor
      isMinInflection: true,
      hysteresis: 15,
    },
    evaluateForm: (lms: PoseLandmarks, currentAngle: number) => {
      // Check plank line (shoulder - hip - ankle)
      const shoulder = lms[POSE_LANDMARKS.LEFT_SHOULDER] || lms[POSE_LANDMARKS.RIGHT_SHOULDER];
      const hip = lms[POSE_LANDMARKS.LEFT_HIP] || lms[POSE_LANDMARKS.RIGHT_HIP];
      const ankle = lms[POSE_LANDMARKS.LEFT_ANKLE] || lms[POSE_LANDMARKS.RIGHT_ANKLE];

      if (shoulder && hip && ankle) {
        const bodyLine = calculateAngle(shoulder, hip, ankle);
        if (bodyLine < 155) {
          return {
            severity: 'error',
            message: 'Keep your body in a straight plank',
            problemJoints: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
          };
        }
      }

      if (currentAngle > 105) {
        return {
          severity: 'warning',
          message: 'Lower chest closer to ground',
          problemJoints: [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW],
        };
      }

      return { severity: 'good', message: 'Strong push-up form' };
    },
    calculateMuscleLoad: (currentAngle: number, phase: RepPhase) => {
      const load: MuscleIntensityMap = { ...EMPTY_MUSCLES };
      // Top lockout: 165°. Bottom: 80°.
      const depth = Math.max(0, Math.min(1, (165 - currentAngle) / (165 - 80)));

      if (phase === 'idle') {
        load.core = 0.2;
        load.chest = 0.1;
        return load;
      }

      load.chest = Math.min(1.0, 0.25 + depth * 0.75); // Peak at bottom stretch
      load.triceps = Math.min(1.0, 0.2 + depth * 0.7); // High during push drive
      load.shoulders = Math.min(1.0, 0.2 + depth * 0.55); // Anterior delts
      load.core = 0.35 + depth * 0.25; // Isometric core bracing
      return load;
    },
  },

  lunge: {
    id: 'lunge',
    name: 'Bodyweight Lunge',
    category: 'lower',
    metValue: 5.0,
    description: 'Unilateral split squat targeting lead quadricep and rear glute.',
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves', 'core'],
    keyJoints: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_HIP],
    targetAngleName: 'Lead Knee Angle',
    getJointAngle: (lms: PoseLandmarks) => {
      const l = calculateAngle(lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_KNEE], lms[POSE_LANDMARKS.LEFT_ANKLE]);
      const r = calculateAngle(lms[POSE_LANDMARKS.RIGHT_HIP], lms[POSE_LANDMARKS.RIGHT_KNEE], lms[POSE_LANDMARKS.RIGHT_ANKLE]);
      return Math.min(l || 170, r || 170);
    },
    repConfig: { startAngle: 155, inflectionAngle: 95, isMinInflection: true, hysteresis: 15 },
    evaluateForm: (_lms: PoseLandmarks, currentAngle: number) => {
      if (currentAngle > 105) {
        return { severity: 'warning', message: 'Lower back knee closer to floor' };
      }
      return { severity: 'good', message: 'Balanced lunge drive' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const depth = Math.max(0, Math.min(1, (160 - currentAngle) / 70));
      load.quadriceps = 0.2 + depth * 0.8;
      load.glutes = 0.2 + depth * 0.75;
      load.calves = 0.2 + depth * 0.3;
      load.core = 0.25;
      return load;
    },
  },

  shoulder_press: {
    id: 'shoulder_press',
    name: 'Overhead Shoulder Press',
    category: 'upper',
    metValue: 4.5,
    description: 'Vertical push loading deltoids and triceps.',
    primaryMuscles: ['shoulders', 'triceps'],
    secondaryMuscles: ['upper_back', 'core'],
    keyJoints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
    targetAngleName: 'Elbow Overhead Angle',
    getJointAngle: (lms: PoseLandmarks) => {
      const l = calculateAngle(lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_ELBOW], lms[POSE_LANDMARKS.LEFT_WRIST]);
      const r = calculateAngle(lms[POSE_LANDMARKS.RIGHT_SHOULDER], lms[POSE_LANDMARKS.RIGHT_ELBOW], lms[POSE_LANDMARKS.RIGHT_WRIST]);
      return Math.max(l || 90, r || 90);
    },
    repConfig: { startAngle: 85, inflectionAngle: 160, isMinInflection: false, hysteresis: 15 },
    evaluateForm: (_lms: PoseLandmarks, currentAngle: number) => {
      if (currentAngle < 145) {
        return { severity: 'warning', message: 'Extend fully overhead' };
      }
      return { severity: 'good', message: 'Clean overhead lockout' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const press = Math.max(0, Math.min(1, (currentAngle - 80) / 80));
      load.shoulders = 0.3 + press * 0.7;
      load.triceps = 0.2 + press * 0.8;
      load.upper_back = 0.25;
      load.core = 0.2;
      return load;
    },
  },

  lateral_raise: {
    id: 'lateral_raise',
    name: 'Lateral Raise',
    category: 'upper',
    metValue: 4.0,
    description: 'Shoulder abduction isolating lateral deltoids.',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['upper_back', 'forearms'],
    keyJoints: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
    targetAngleName: 'Abduction Angle',
    getJointAngle: (lms: PoseLandmarks) => {
      const l = calculateAngle(lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_ELBOW]);
      const r = calculateAngle(lms[POSE_LANDMARKS.RIGHT_HIP], lms[POSE_LANDMARKS.RIGHT_SHOULDER], lms[POSE_LANDMARKS.RIGHT_ELBOW]);
      return Math.max(l || 20, r || 20);
    },
    repConfig: { startAngle: 30, inflectionAngle: 80, isMinInflection: false, hysteresis: 10 },
    evaluateForm: (_lms: PoseLandmarks, currentAngle: number) => {
      if (currentAngle > 95) return { severity: 'warning', message: 'Do not raise past shoulder level' };
      return { severity: 'good', message: 'Great lateral control' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const raise = Math.max(0, Math.min(1, (currentAngle - 25) / 60));
      load.shoulders = 0.15 + raise * 0.85;
      load.upper_back = 0.1 + raise * 0.3;
      return load;
    },
  },

  plank: {
    id: 'plank',
    name: 'Plank Hold',
    category: 'core',
    metValue: 3.5,
    description: 'Isometric core hold maintaining neutral spine alignment.',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'glutes'],
    keyJoints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
    targetAngleName: 'Spine Neutrality',
    getJointAngle: (lms: PoseLandmarks) => {
      return calculateAngle(lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_ANKLE]) || 180;
    },
    repConfig: { startAngle: 180, inflectionAngle: 180, isMinInflection: true, hysteresis: 20 },
    evaluateForm: (lms: PoseLandmarks) => {
      const angle = calculateAngle(lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_ANKLE]);
      if (angle < 160) return { severity: 'error', message: 'Do not sag or pike hips' };
      return { severity: 'good', message: 'Perfect plank line' };
    },
    calculateMuscleLoad: () => {
      const load = { ...EMPTY_MUSCLES };
      load.core = 0.9;
      load.shoulders = 0.5;
      load.glutes = 0.4;
      return load;
    },
  },

  deadlift: {
    id: 'deadlift',
    name: 'Romanian Deadlift',
    category: 'lower',
    metValue: 6.0,
    description: 'Hip hinge loading the posterior chain (hamstrings, glutes, lower back).',
    primaryMuscles: ['hamstrings', 'glutes', 'lower_back'],
    secondaryMuscles: ['upper_back', 'forearms'],
    keyJoints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    targetAngleName: 'Hip Hinge Angle',
    getJointAngle: (lms: PoseLandmarks) => {
      return calculateAngle(lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_KNEE]) || 170;
    },
    repConfig: { startAngle: 165, inflectionAngle: 95, isMinInflection: true, hysteresis: 15 },
    evaluateForm: (lms: PoseLandmarks, currentAngle: number) => {
      const kneeAngle = calculateAngle(lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_KNEE], lms[POSE_LANDMARKS.LEFT_ANKLE]);
      if (kneeAngle < 135 && currentAngle < 120) return { severity: 'warning', message: 'Hinge hips, do not squat the deadlift' };
      return { severity: 'good', message: 'Tense posterior chain' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const hinge = Math.max(0, Math.min(1, (170 - currentAngle) / 80));
      load.hamstrings = 0.2 + hinge * 0.8;
      load.glutes = 0.2 + hinge * 0.75;
      load.lower_back = 0.2 + hinge * 0.7;
      load.upper_back = 0.3;
      return load;
    },
  },

  jumping_jack: {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    category: 'full',
    metValue: 7.0,
    description: 'Dynamic cardio conditioning loading calves, shoulders, and core.',
    primaryMuscles: ['calves', 'shoulders'],
    secondaryMuscles: ['core', 'quadriceps'],
    keyJoints: [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST],
    targetAngleName: 'Arm Span',
    getJointAngle: (lms: PoseLandmarks) => {
      const l = calculateAngle(lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_WRIST]);
      return l || 30;
    },
    repConfig: { startAngle: 30, inflectionAngle: 130, isMinInflection: false, hysteresis: 15 },
    evaluateForm: (_lms: PoseLandmarks, currentAngle: number) => {
      if (currentAngle < 110) return { severity: 'warning', message: 'Clap hands higher overhead' };
      return { severity: 'good', message: 'Light and bouncy pace' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const open = Math.max(0, Math.min(1, currentAngle / 140));
      load.calves = 0.4 + open * 0.5;
      load.shoulders = 0.2 + open * 0.7;
      load.core = 0.3;
      return load;
    },
  },

  sit_up: {
    id: 'sit_up',
    name: 'Sit-Up',
    category: 'core',
    metValue: 4.0,
    description: 'Trunk flexion targeting rectus abdominis.',
    primaryMuscles: ['core'],
    secondaryMuscles: ['quadriceps'],
    keyJoints: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    targetAngleName: 'Trunk Flexion',
    getJointAngle: (lms: PoseLandmarks) => {
      return calculateAngle(lms[POSE_LANDMARKS.LEFT_SHOULDER], lms[POSE_LANDMARKS.LEFT_HIP], lms[POSE_LANDMARKS.LEFT_KNEE]) || 130;
    },
    repConfig: { startAngle: 125, inflectionAngle: 60, isMinInflection: true, hysteresis: 15 },
    evaluateForm: (_lms: PoseLandmarks, currentAngle: number) => {
      if (currentAngle > 75) return { severity: 'warning', message: 'Sit all the way up' };
      return { severity: 'good', message: 'Controlled ab crunch' };
    },
    calculateMuscleLoad: (currentAngle: number) => {
      const load = { ...EMPTY_MUSCLES };
      const crunch = Math.max(0, Math.min(1, (130 - currentAngle) / 70));
      load.core = 0.25 + crunch * 0.75;
      return load;
    },
  },
};
