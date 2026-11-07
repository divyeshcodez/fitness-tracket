import React, { useRef, useEffect } from 'react';
import { PoseLandmarks } from '../types';
import { POSE_LANDMARKS } from '../utils/geometry';

interface SkeletonCanvasProps {
  landmarks: PoseLandmarks | null;
  problemJoints?: number[];
  isOutOfFrame: boolean;
  trackingQualityWarning: boolean;
  mirrored: boolean;
  videoWidth: number;
  videoHeight: number;
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    ctx.save();
    // Handle horizontal mirroring if user requested mirrored view
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
        ctx.strokeStyle = '#22D3EE'; // Electric Cyan
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
    }

    // 2. Draw Joints (Nodes)
    // Key joints to render (skip facial noise except nose)
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
  }, [landmarks, problemJoints, mirrored, videoWidth, videoHeight]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={videoWidth || 640}
        height={videoHeight || 480}
        className="w-full h-full object-cover"
      />

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
