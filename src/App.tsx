import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExerciseId,
  ModelQuality,
  PoseLandmarks,
  SessionRecord,
} from './types';
import { EXERCISES } from './exercises/definitions';
import { detectExercise } from './exercises/detector';
import { ExerciseTracker } from './exercises/tracker';
import { PoseEngine } from './vision/poseLandmarker';
import { generateSyntheticPose } from './vision/syntheticGenerator';
import { calculateCaloriesBurned } from './utils/calories';
import { audioCues } from './utils/audio';
import {
  getUserWeightPref,
  saveUserWeightPref,
  saveSession,
} from './utils/storage';
import { StartScreen } from './components/StartScreen';
import { CountdownOverlay } from './components/CountdownOverlay';
import { SkeletonCanvas } from './components/SkeletonCanvas';
import { MuscleHeatmap } from './components/MuscleHeatmap';
import { RepCalorieDisplay } from './components/RepCalorieDisplay';
import { SessionSummary } from './components/SessionSummary';
import { HistoryModal } from './components/HistoryModal';
import {
  Camera,
  RefreshCw,
  Play,
  Pause,
  Square,
  Sparkles,
  Sliders,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function App() {
  // App screen navigation
  const [screen, setScreen] = useState<'start' | 'countdown' | 'live' | 'summary'>('start');
  const [userWeightKg, setUserWeightKg] = useState<number>(() => getUserWeightPref().weight);
  const [userWeightUnit, setUserWeightUnit] = useState<'kg' | 'lb'>(() => getUserWeightPref().unit);

  // Live session state
  const [exerciseId, setExerciseId] = useState<ExerciseId>('squat');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Camera & Tracking
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraDenied, setCameraDenied] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Live metrics
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isOutOfFrame, setIsOutOfFrame] = useState<boolean>(false);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(1);
  const [fps, setFps] = useState<number>(30);
  const [modelQuality, setModelQuality] = useState<ModelQuality>('lite');
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Tracker state outputs
  const [totalReps, setTotalReps] = useState<number>(0);
  const [goodReps, setGoodReps] = useState<number>(0);
  const [badReps, setBadReps] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [formScore, setFormScore] = useState<number>(95);
  const [tempoSeconds, setTempoSeconds] = useState<number>(2.5);
  const [currentAngle, setCurrentAngle] = useState<number>(170);
  const [targetAngleName, setTargetAngleName] = useState<string>('Knee Flexion');
  const [repPhase, setRepPhase] = useState<'idle' | 'eccentric' | 'inflection' | 'concentric'>('idle');
  const [repProgress, setRepProgress] = useState<number>(0);
  const [formFeedback, setFormFeedback] = useState<{
    severity: 'good' | 'warning' | 'error';
    message: string;
    problemJoints?: number[];
  }>({ severity: 'good', message: 'Ready to track' });
  const [muscleIntensities, setMuscleIntensities] = useState(
    EXERCISES.squat.calculateMuscleLoad(170, 'idle', [])
  );
  const [cumulativeMuscles, setCumulativeMuscles] = useState(
    EXERCISES.squat.calculateMuscleLoad(170, 'idle', [])
  );

  // Summary & Modals
  const [completedSession, setCompletedSession] = useState<SessionRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseEngineRef = useRef<PoseEngine | null>(null);
  const trackerRef = useRef<ExerciseTracker>(new ExerciseTracker(EXERCISES.squat));
  const animFrameIdRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const activeExerciseSecondsRef = useRef<number>(0);

  // Handle URL query parameters for Ultra Mode automation testing (?autostart=1 or ?demo=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('demo') === '1') {
        const testEx = (params.get('exercise') as ExerciseId) || 'squat';
        setExerciseId(testEx);
        trackerRef.current.setExercise(EXERCISES[testEx]);
        setIsDemoMode(true);
        setScreen('live');
        sessionStartTimeRef.current = Date.now();
      }
    }
  }, []);

  // Background tab auto-pause listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && screen === 'live') {
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen]);

  // Voice cues audio sync
  useEffect(() => {
    audioCues.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Auto-switch to lite callback
  const handleAutoSwitchToLite = useCallback(() => {
    setModelQuality('lite');
    if (poseEngineRef.current) {
      poseEngineRef.current.switchQuality('lite');
    }
  }, []);

  // Initialize PoseEngine
  useEffect(() => {
    const engine = new PoseEngine(modelQuality, handleAutoSwitchToLite);
    poseEngineRef.current = engine;
    engine.initialize(modelQuality).catch((err) => {
      console.warn('Pose engine init error:', err);
    });

    return () => {
      engine.destroy();
    };
  }, [handleAutoSwitchToLite, modelQuality]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraDenied(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraDenied(true);
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Switch camera between front and back
  const handleSwitchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setMirrored(nextFacing === 'user');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      // fallback
    }
  };

  // Main real-time computer vision render loop
  useEffect(() => {
    if (screen !== 'live') {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    let isRunning = true;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (!isPaused) {
        let currentLms: PoseLandmarks | null = null;
        let outOfFrameStatus = false;
        let conf = 1.0;
        let currentFps = 30;

        if (isDemoMode) {
          // Synthetic demo pose generator
          const synth = generateSyntheticPose(exerciseId, timestamp);
          currentLms = synth.landmarks;
          outOfFrameStatus = synth.isOutOfFrame;
          currentFps = 30;
          conf = 0.98;
        } else if (uploadedVideoRef.current && uploadedVideoUrl) {
          // Process uploaded video
          const vid = uploadedVideoRef.current;
          if (vid.readyState >= 2 && poseEngineRef.current?.isReady()) {
            const res = poseEngineRef.current.processVideoFrame(vid, timestamp);
            currentLms = res.landmarks;
            outOfFrameStatus = res.isOutOfFrame;
            conf = res.confidence;
            currentFps = res.fps;
          }
        } else if (videoRef.current && cameraActive) {
          // Process live camera stream
          const vid = videoRef.current;
          if (vid.readyState >= 2 && poseEngineRef.current?.isReady()) {
            const res = poseEngineRef.current.processVideoFrame(vid, timestamp);
            currentLms = res.landmarks;
            outOfFrameStatus = res.isOutOfFrame;
            conf = res.confidence;
            currentFps = res.fps;
          }
        }

        setLandmarks(currentLms);
        setIsOutOfFrame(outOfFrameStatus);
        setTrackingConfidence(conf);
        setFps(currentFps);

        // Update Tracker if landmarks detected and user is in frame
        if (currentLms && !outOfFrameStatus && conf >= 0.45) {
          // Auto-detect exercise if enabled
          if (isAutoDetected && !isDemoMode) {
            const detected = detectExercise(currentLms);
            if (detected.confidence > 0.8 && detected.detectedExercise !== exerciseId) {
              setExerciseId(detected.detectedExercise);
              trackerRef.current.setExercise(EXERCISES[detected.detectedExercise]);
            }
          }

          const trackerUpdate = trackerRef.current.update(currentLms, timestamp);

          setTotalReps(trackerUpdate.totalReps);
          setGoodReps(trackerUpdate.goodReps);
          setBadReps(trackerUpdate.badReps);
          setFormScore(trackerUpdate.formScore);
          setTempoSeconds(trackerUpdate.tempoSeconds);
          setCurrentAngle(trackerUpdate.currentAngle);
          setTargetAngleName(trackerUpdate.targetAngleName);
          setRepPhase(trackerUpdate.phase);
          setRepProgress(trackerUpdate.repProgress);
          setFormFeedback(trackerUpdate.formFeedback);
          setMuscleIntensities(trackerUpdate.muscleIntensities);
          setCumulativeMuscles(trackerUpdate.cumulativeMuscleLoad);

          activeExerciseSecondsRef.current = trackerUpdate.activeExerciseSeconds;

          // Calculate live calories based on formula
          const exDef = EXERCISES[exerciseId];
          const calculatedKcal = calculateCaloriesBurned({
            metValue: exDef.metValue,
            weightKg: userWeightKg,
            activeSeconds: trackerUpdate.activeExerciseSeconds,
            tempoMultiplier: 1.0,
            romMultiplier: trackerUpdate.formScore / 95,
          });
          setCaloriesBurned(calculatedKcal);

          // Audio spoken feedback on form cue change or rep finish
          if (trackerUpdate.lastRepEvent) {
            audioCues.playBeep(880, 0.12);
            if (voiceEnabled) {
              audioCues.speak(`Rep ${trackerUpdate.totalReps}`);
            }
          } else if (trackerUpdate.formFeedback.severity !== 'good' && voiceEnabled) {
            audioCues.speak(trackerUpdate.formFeedback.message);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    screen,
    isPaused,
    isDemoMode,
    cameraActive,
    uploadedVideoUrl,
    exerciseId,
    isAutoDetected,
    userWeightKg,
    voiceEnabled,
  ]);

  // Handle Start Tracking
  const handleStartTracking = async (weightKg: number, unit: 'kg' | 'lb', demo = false) => {
    setUserWeightKg(weightKg);
    setUserWeightUnit(unit);
    saveUserWeightPref(weightKg, unit);
    setIsDemoMode(demo);

    // Reset tracker
    trackerRef.current.reset();
    setTotalReps(0);
    setGoodReps(0);
    setBadReps(0);
    setCaloriesBurned(0);
    setFormScore(95);

    if (demo) {
      setScreen('live');
      sessionStartTimeRef.current = Date.now();
    } else {
      setScreen('countdown');
      await startCamera();
    }
  };

  // Complete countdown
  const handleCountdownComplete = () => {
    setScreen('live');
    sessionStartTimeRef.current = Date.now();
  };

  // Handle Exercise Selection Override
  const handleSelectExercise = (id: ExerciseId) => {
    setExerciseId(id);
    setIsAutoDetected(false); // Manual override locks user preference
    trackerRef.current.setExercise(EXERCISES[id]);
  };

  // Handle End Workout Session
  const handleEndSession = async () => {
    const sessionDuration = Math.max(
      1,
      Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
    );

    const record: SessionRecord = {
      id: `session_${Date.now()}`,
      timestamp: Date.now(),
      exerciseId,
      exerciseName: EXERCISES[exerciseId].name,
      userWeightKg,
      totalReps,
      goodReps,
      badReps,
      avgFormScore: formScore,
      durationSeconds: sessionDuration,
      caloriesBurned,
      muscleEngagement: cumulativeMuscles,
    };

    setCompletedSession(record);
    await saveSession(record);
    stopCamera();
    setScreen('summary');
  };

  // Handle local video upload
  const handleUploadVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setIsDemoMode(false);
    handleStartTracking(userWeightKg, userWeightUnit, false);
  };

  // Handle Export Session
  const handleExportSession = () => {
    if (!completedSession) return;
    const blob = new Blob([JSON.stringify(completedSession, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motionlens-workout-${completedSession.exerciseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. START SCREEN */}
      {screen === 'start' && (
        <StartScreen
          initialWeightKg={userWeightKg}
          initialUnit={userWeightUnit}
          onStartTracking={handleStartTracking}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onUploadVideo={handleUploadVideo}
        />
      )}

      {/* 2. COUNTDOWN SCREEN */}
      {screen === 'countdown' && (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B0F14] overflow-hidden">
          {/* Background Video Preview */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover absolute inset-0 opacity-40 ${
              mirrored ? 'scale-x-[-1]' : ''
            }`}
          />
          <CountdownOverlay onComplete={handleCountdownComplete} />
        </div>
      )}

      {/* 3. LIVE HUD SCREEN */}
      {screen === 'live' && (
        <div className="min-h-screen flex flex-col p-3 sm:p-5 max-w-[1700px] mx-auto w-full">
          {/* Top HUD Bar */}
          <header className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-800 shrink-0">
            {/* Brand Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-400 flex items-center justify-center font-mono font-black text-slate-950 text-sm">
                M
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                  MotionLens
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400 ml-2">
                  Live Biomechanical HUD
                </span>
              </div>
            </div>

            {/* Status / Model / Debug Toggles */}
            <div className="flex items-center gap-2">
              {isDemoMode && (
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-semibold flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DEMO MODE</span>
                </span>
              )}

              {/* Model Quality Selector */}
              <div className="hidden md:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                {(['lite', 'balanced', 'accurate'] as ModelQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setModelQuality(q);
                      poseEngineRef.current?.switchQuality(q);
                    }}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      modelQuality === q
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Debug Toggle */}
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className={`p-2 rounded-xl border transition-colors ${
                  showDebug
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle debug metrics"
                aria-label="Toggle debug metrics"
              >
                {showDebug ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* End Session Button */}
              <button
                type="button"
                onClick={handleEndSession}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                <span>End</span>
              </button>
            </div>
          </header>

          {/* Debug Telemetry Panel */}
          {showDebug && (
            <div className="mb-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 font-mono text-xs text-slate-300 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2">
              <span className="text-cyan-400 font-bold">DEBUG TELEMETRY:</span>
              <span>FPS: <strong className="text-white">{fps}</strong></span>
              <span>Confidence: <strong className="text-white">{Math.round(trackingConfidence * 100)}%</strong></span>
              <span>Angle: <strong className="text-white">{currentAngle}°</strong></span>
              <span>Phase: <strong className="text-cyan-300 uppercase">{repPhase}</strong></span>
              <span>Active Time: <strong className="text-white">{activeExerciseSecondsRef.current.toFixed(1)}s</strong></span>
              <span>Model: <strong className="text-white uppercase">{modelQuality}</strong></span>
            </div>
          )}

          {/* Main 2-Column Responsive Layout:
              Desktop: Camera Left ~60%, Muscle Map + Stats Right ~40%
              Mobile: Camera Top, Muscle Map + Stats Below */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-0">
            {/* LEFT / TOP: Camera Stream & Skeleton Overlay (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-[380px] lg:min-h-0">
              <div className="relative flex-1 w-full bg-[#131A22] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
                {/* 1. Camera Feed Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    mirrored ? 'scale-x-[-1]' : ''
                  }`}
                  style={{ display: !isDemoMode && !uploadedVideoUrl ? 'block' : 'none' }}
                />

                {/* 2. Uploaded Video Element (if testing with local file) */}
                {uploadedVideoUrl && (
                  <video
                    ref={uploadedVideoRef}
                    src={uploadedVideoUrl}
                    playsInline
                    loop
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* 3. Demo Mode Animated Canvas Canvas / Placeholder */}
                {isDemoMode && (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0E1520] to-[#0B0F14] flex flex-col items-center justify-center">
                    {/* Stylized background grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
                    <div className="text-center z-10 p-4">
                      <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold block mb-1">
                        Biomechanical Demo Simulation
                      </span>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Generating real-time oscillating kinematics for {EXERCISES[exerciseId].name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Camera Permission Denied Fallback */}
                {cameraDenied && !isDemoMode && !uploadedVideoUrl && (
                  <div className="absolute inset-0 bg-[#0B0F14]/90 p-6 flex flex-col items-center justify-center text-center z-30">
                    <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                    <h3 className="text-base font-bold text-white">Camera Access Needed</h3>
                    <p className="text-xs text-slate-300 max-w-sm mt-1 mb-5">
                      MotionLens tracks your movements locally using your camera. Please allow camera permissions, or switch to Demo Mode.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
                      >
                        Retry Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDemoMode(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 border border-slate-700 font-medium text-xs"
                      >
                        Use Demo Mode
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Real-time Skeleton Overlay */}
                <SkeletonCanvas
                  landmarks={landmarks}
                  problemJoints={formFeedback.problemJoints}
                  isOutOfFrame={isOutOfFrame}
                  trackingQualityWarning={trackingConfidence < 0.6 && !isOutOfFrame}
                  mirrored={mirrored && !isDemoMode && !uploadedVideoUrl}
                  videoWidth={640}
                  videoHeight={480}
                />

                {/* Floating Bottom Camera Controls (Pause, Switch Camera, Mirror) */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                  {/* Pause / Resume Button */}
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/80 text-xs font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    aria-label={isPaused ? 'Resume tracking' : 'Pause tracking'}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-cyan-400" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  {/* Switch Camera & Mirror Buttons (Only visible with live camera) */}
                  {!isDemoMode && !uploadedVideoUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMirrored(!mirrored)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border backdrop-blur-md text-xs font-medium transition-colors ${
                          mirrored
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'
                        }`}
                        title="Mirror camera feed"
                      >
                        Mirror
                      </button>

                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="min-h-[44px] p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-transform active:scale-95"
                        title="Switch front/back camera"
                        aria-label="Switch camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT / BOTTOM: Muscle Heatmap & Live Telemetry (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Reps, Calories & Form Panel */}
              <div className="shrink-0">
                <RepCalorieDisplay
                  totalReps={totalReps}
                  goodReps={goodReps}
                  badReps={badReps}
                  caloriesBurned={caloriesBurned}
                  formScore={formScore}
                  tempoSeconds={tempoSeconds}
                  currentAngle={currentAngle}
                  targetAngleName={targetAngleName}
                  repPhase={repPhase}
                  repProgress={repProgress}
                  formFeedback={formFeedback}
                  currentExerciseId={exerciseId}
                  isAutoDetected={isAutoDetected}
                  onSelectExercise={handleSelectExercise}
                  voiceEnabled={voiceEnabled}
                  onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                />
              </div>

              {/* Dynamic Muscle Pressure Heatmap */}
              <div className="flex-1 min-h-[300px]">
                <MuscleHeatmap
                  muscleIntensities={muscleIntensities}
                  title="Estimated muscle engagement"
                  isCumulative={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SESSION SUMMARY SCREEN */}
      {screen === 'summary' && completedSession && (
        <SessionSummary
          session={completedSession}
          onNewSession={() => setScreen('start')}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onExportSession={handleExportSession}
        />
      )}

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
