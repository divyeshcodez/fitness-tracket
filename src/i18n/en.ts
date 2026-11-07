/**
 * All user-facing UI text strings for MotionLens.
 * Centralized for localization and clean copy management.
 */
export const strings = {
  appName: 'MotionLens',
  tagline: 'Real-time movement and muscle load tracker',
  privacyNote: 'Video never leaves your device. All computer vision runs 100% locally in your browser.',
  disclaimer: 'Estimates only. Not medical advice.',
  
  start: {
    title: 'Enter your weight to begin',
    subtitle: 'Calorie calculations use your weight and active biomechanical MET load.',
    weightLabel: 'Your Weight',
    startBtn: 'Start Movement Tracker',
    demoModeBtn: 'Try Demo Mode (No camera needed)',
    viewHistory: 'Past Sessions',
    cameraPermissionNote: 'You will be prompted for camera access to track your movement live.',
  },

  countdown: {
    guideTitle: 'Make sure your full body is visible',
    guideSubtitle: 'Step back 2-3 meters so your head, hips, and ankles are in frame.',
    skip: 'Start Immediately',
  },

  hud: {
    reps: 'REPS',
    calories: 'ESTIMATED CALORIES',
    calorieTooltip: 'Calculated using exercise MET value × body weight × active movement time, adjusted for range of motion and tempo.',
    muscleTooltip: 'Estimated muscle engagement calculated from joint angle position relative to biomechanical resistance curves.',
    formScore: 'FORM SCORE',
    tempo: 'TEMPO',
    secPerRep: 's/rep',
    exercise: 'EXERCISE',
    autoDetected: 'Auto-detected',
    override: 'Manual override',
    endSession: 'End Session',
    pause: 'Pause',
    resume: 'Resume',
    flipCamera: 'Switch Camera',
    mirrorToggle: 'Mirror Feed',
    voiceCuesOn: 'Voice Cues On',
    voiceCuesOff: 'Voice Cues Muted',
    outOfFrame: 'Step back so your full body is visible',
    lowQuality: 'Low lighting or tracking jitter detected',
    frontView: 'Anterior (Front)',
    backView: 'Posterior (Back)',
    demoBadge: 'DEMO MODE ACTIVE',
    switchExercise: 'Switch Exercise',
  },

  summary: {
    title: 'Workout Session Complete',
    subtitle: 'Great work! Here is your biomechanical breakdown.',
    totalReps: 'Total Reps',
    goodReps: 'Good Form Reps',
    badReps: 'Form Corrections Needed',
    avgScore: 'Average Form Score',
    activeDuration: 'Active Time',
    caloriesBurned: 'Calories Burned',
    muscleDistribution: 'Cumulative Muscle Engagement',
    saveSuccess: 'Session saved to local history.',
    doneBtn: 'Start New Session',
    historyBtn: 'View All History',
    exportSession: 'Export Session JSON',
  },

  history: {
    title: 'Session History',
    empty: 'No saved workout sessions yet. Start your first session!',
    exportAll: 'Export All Data',
    deleteAll: 'Delete All Data',
    confirmDelete: 'Are you sure you want to permanently erase all saved sessions?',
    close: 'Close',
    tableDate: 'Date & Time',
    tableExercise: 'Exercise',
    tableReps: 'Reps',
    tableCalories: 'Calories',
    tableDuration: 'Duration',
    tableScore: 'Form Score',
  },

  errors: {
    cameraDeniedTitle: 'Camera Access Needed',
    cameraDeniedBody: 'MotionLens needs camera permission to track your body movements. Please allow camera access in your browser site settings.',
    cameraTryAgain: 'Retry Camera Access',
    cameraUseDemo: 'Continue in Demo Simulation Mode',
  }
} as const;
