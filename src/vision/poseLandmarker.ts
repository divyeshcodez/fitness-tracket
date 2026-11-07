import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { ModelQuality, PoseLandmarks } from '../types';
import { PoseLandmarksSmoother } from '../utils/filters';
import { POSE_LANDMARKS } from '../utils/geometry';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

const MODEL_PATHS: Record<ModelQuality, string> = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  balanced: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
  accurate: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
};

export interface PoseProcessResult {
  landmarks: PoseLandmarks | null;
  rawLandmarks: PoseLandmarks | null;
  isOutOfFrame: boolean;
  confidence: number;
  fps: number;
}

export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private smoother = new PoseLandmarksSmoother();
  private quality: ModelQuality = 'lite';
  private isInitializing: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 30;
  private lowFpsCounter: number = 0;
  private onAutoSwitchToLite?: () => void;

  constructor(initialQuality: ModelQuality = 'lite', onAutoSwitchToLite?: () => void) {
    this.quality = initialQuality;
    this.onAutoSwitchToLite = onAutoSwitchToLite;
  }

  async initialize(quality?: ModelQuality): Promise<void> {
    if (quality) this.quality = quality;
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (this.landmarker) {
        this.landmarker.close();
        this.landmarker = null;
      }

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      try {
        // Try GPU delegate first for maximum real-time performance
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[this.quality],
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1, // Focus on most prominent person
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed, falling back to CPU delegate:', gpuError);
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[this.quality],
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }
    } catch (err) {
      console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  isReady(): boolean {
    return this.landmarker !== null;
  }

  getQuality(): ModelQuality {
    return this.quality;
  }

  async switchQuality(quality: ModelQuality): Promise<void> {
    if (this.quality === quality && this.landmarker) return;
    this.quality = quality;
    await this.initialize(quality);
  }

  processVideoFrame(
    videoElement: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): PoseProcessResult {
    // Calculate FPS
    if (this.lastFrameTime > 0) {
      const delta = timestampMs - this.lastFrameTime;
      if (delta > 0) {
        const instantFps = 1000 / delta;
        this.currentFps = Math.round(this.currentFps * 0.9 + instantFps * 0.1);
      }
    }
    this.lastFrameTime = timestampMs;
    this.frameCount++;

    // Check FPS auto-downgrade (if FPS < 15 for 3 sec)
    if (this.frameCount % 30 === 0) {
      if (this.currentFps < 15 && this.quality !== 'lite') {
        this.lowFpsCounter++;
        if (this.lowFpsCounter >= 3) {
          this.lowFpsCounter = 0;
          if (this.onAutoSwitchToLite) {
            this.onAutoSwitchToLite();
          }
        }
      } else {
        this.lowFpsCounter = 0;
      }
    }

    if (!this.landmarker) {
      return {
        landmarks: null,
        rawLandmarks: null,
        isOutOfFrame: true,
        confidence: 0,
        fps: this.currentFps,
      };
    }

    try {
      const results = this.landmarker.detectForVideo(videoElement, timestampMs);

      if (!results.landmarks || results.landmarks.length === 0) {
        return {
          landmarks: null,
          rawLandmarks: null,
          isOutOfFrame: true,
          confidence: 0,
          fps: this.currentFps,
        };
      }

      const raw = results.landmarks[0];

      // Confidence & Out-of-Frame checks:
      // Verify key posture anchors (shoulders, hips, knees) are in frame and high confidence
      const leftShoulder = raw[POSE_LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = raw[POSE_LANDMARKS.RIGHT_SHOULDER];
      const leftHip = raw[POSE_LANDMARKS.LEFT_HIP];
      const rightHip = raw[POSE_LANDMARKS.RIGHT_HIP];
      const leftKnee = raw[POSE_LANDMARKS.LEFT_KNEE];
      const rightKnee = raw[POSE_LANDMARKS.RIGHT_KNEE];

      const keyAnchors = [leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee];
      let totalVis = 0;
      let validCount = 0;

      for (const pt of keyAnchors) {
        if (pt) {
          const vis = pt.visibility ?? 0.8;
          totalVis += vis;
          validCount++;
        }
      }

      const avgConfidence = validCount > 0 ? totalVis / validCount : 0;

      // Check if boundaries are exceeded (landmarks close to 0 or 1 edge)
      const isPartlyOutOfFrame =
        avgConfidence < 0.45 ||
        keyAnchors.some(
          (pt) => !pt || pt.y < 0.02 || pt.y > 0.98 || pt.x < 0.02 || pt.x > 0.98
        );

      // Smooth landmarks with One Euro filter to eliminate jitter
      const smoothed = this.smoother.smooth(raw, timestampMs);

      return {
        landmarks: smoothed,
        rawLandmarks: raw,
        isOutOfFrame: isPartlyOutOfFrame,
        confidence: Math.round(avgConfidence * 100) / 100,
        fps: this.currentFps,
      };
    } catch (err) {
      console.warn('Frame detection error:', err);
      return {
        landmarks: null,
        rawLandmarks: null,
        isOutOfFrame: true,
        confidence: 0,
        fps: this.currentFps,
      };
    }
  }

  destroy(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // ignore
      }
      this.landmarker = null;
    }
    this.smoother.reset();
  }
}
