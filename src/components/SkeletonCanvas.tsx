import React, { useRef, useEffect } from 'react';
import { CameraPerspective, ExerciseId, PoseLandmarks, SymmetryData } from '../types';
import { POSE_LANDMARKS } from '../utils/geometry';

interface SkeletonCanvasProps {
  landmarks: PoseLandmarks | null;
  problemJoints?: number[];
  isOutOfFrame: boolean;
  trackingQualityWarning: boolean;
  mirrored: boolean;
  videoWidth: number;
  videoHeight: number;
  currentAngle?: number;
  targetAngleThreshold?: number;
  perspective?: CameraPerspective;
  symmetry?: SymmetryData;
  exerciseId?: ExerciseId;
}

// MediaPipe Pose connection pairs for rendering bones
const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  landmarks,
  problemJoints = [],
  isOutOfFrame,
  trackingQualityWarning,
  mirrored,
  videoWidth,
  videoHeight,
  currentAngle = 170,
  targetAngleThreshold = 90,
  perspective = 'front',
  symmetry,
  exerciseId = 'squat',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    ctx.save();
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const problemSet = new Set(problemJoints);

    // 1. Draw Bones (Connections)
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [p1, p2] of POSE_CONNECTIONS) {
      const pt1 = landmarks[p1];
      const pt2 = landmarks[p2];

      if (!pt1 || !pt2) continue;
      if ((pt1.visibility ?? 1) < 0.4 || (pt2.visibility ?? 1) < 0.4) continue;

      const x1 = pt1.x * canvas.width;
      const y1 = pt1.y * canvas.height;
      const x2 = pt2.x * canvas.width;
      const y2 = pt2.y * canvas.height;

      const isProblemBone = problemSet.has(p1) || problemSet.has(p2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (isProblemBone) {
        ctx.strokeStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = '#22D3EE';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
    }

    // 2. Draw Live On-Body Joint Angle Arc on Primary Moving Joint
    let targetJointIdx: number = POSE_LANDMARKS.LEFT_KNEE;
    if (
      exerciseId === 'bicep_curl' ||
      exerciseId === 'push_up' ||
      exerciseId === 'shoulder_press'
    ) {
      targetJointIdx = POSE_LANDMARKS.LEFT_ELBOW;
    }

    const angleJoint = landmarks[targetJointIdx];
    if (angleJoint && (angleJoint.visibility ?? 1) > 0.4) {
      const ax = angleJoint.x * canvas.width;
      const ay = angleJoint.y * canvas.height;

      const isTargetReached = Math.abs(currentAngle - targetAngleThreshold) <= 15;
      const arcRadius = 26;

      // Draw Arc
      ctx.beginPath();
      ctx.arc(ax, ay, arcRadius, 0, (Math.PI * 2 * (180 - currentAngle)) / 180);
      ctx.strokeStyle = isTargetReached ? '#22C55E' : '#22D3EE';
      ctx.lineWidth = 3;
      ctx.shadowColor = isTargetReached ? '#22C55E' : '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Draw Degree Badge near joint
      ctx.save();
      if (mirrored) {
        // Un-mirror text so numbers are not backwards
        ctx.translate(ax, ay);
        ctx.scale(-1, 1);
        ctx.translate(-ax, -ay);
      }

      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = isTargetReached ? '#22C55E' : '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${Math.round(currentAngle)}°`, ax + 14, ay - 10);
      ctx.restore();
    }

    // 3. Draw Joints (Nodes)
    const renderJoints = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    for (const idx of renderJoints) {
      const pt = landmarks[idx];
      if (!pt || (pt.visibility ?? 1) < 0.35) continue;

      const x = pt.x * canvas.width;
      const y = pt.y * canvas.height;
      const isProblem = problemSet.has(idx);

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(x, y, isProblem ? 9 : 6.5, 0, 2 * Math.PI);
      ctx.fillStyle = isProblem ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 211, 238, 0.35)';
      ctx.fill();

      // Inner solid node
      ctx.beginPath();
      ctx.arc(x, y, isProblem ? 5.5 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isProblem ? '#EF4444' : '#FFFFFF';
      ctx.shadowColor = isProblem ? '#EF4444' : '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    ctx.restore();
  }, [
    landmarks,
    problemJoints,
    mirrored,
    videoWidth,
    videoHeight,
    currentAngle,
    targetAngleThreshold,
    exerciseId,
  ]);

  const perspectiveLabel = {
    front: 'Frontal View',
    side_left: 'Side Profile (Left)',
    side_right: 'Side Profile (Right)',
    diagonal: '45° Diagonal Profile',
  }[perspective];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={videoWidth || 640}
        height={videoHeight || 480}
        className="w-full h-full object-cover"
      />

      {/* Top Left HUD Badges: Perspective & Bilateral Symmetry */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {/* Perspective Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-cyan-300 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{perspectiveLabel}</span>
        </div>

        {/* Bilateral Symmetry Gauge */}
        {symmetry && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-mono shadow border ${
              symmetry.isImbalanced
                ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
            }`}
          >
            <span>Balance:</span>
            <span className="font-bold text-white tabular-nums">
              L {symmetry.leftPercent}% · R {symmetry.rightPercent}%
            </span>
            {symmetry.isImbalanced && <span className="text-amber-400 font-bold">⚠</span>}
          </div>
        )}
      </div>

      {/* Out of frame warning banner */}
      {isOutOfFrame && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-center">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-lg backdrop-blur-sm animate-pulse flex items-center gap-2">
            <span>⚠</span>
            <span>Step back so your full body is visible</span>
          </div>
        </div>
      )}

      {/* Tracking quality notice */}
      {!isOutOfFrame && trackingQualityWarning && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-amber-500/85 text-slate-950 px-3 py-1 rounded-md text-xs font-semibold backdrop-blur-sm shadow">
            Tracking jitter detected — check lighting
          </div>
        </div>
      )}
    </div>
  );
};
