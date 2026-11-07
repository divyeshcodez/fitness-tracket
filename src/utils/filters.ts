import { NormalizedLandmark } from '../types';

/**
 * Low-pass filter for a single numeric signal.
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
    } else {
      this.s = alpha * value + (1.0 - alpha) * this.s!;
    }
    this.y = value;
    return this.s!;
  }

  lastValue(): number | null {
    return this.s;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

/**
 * 1€ (One Euro) Filter for low-latency jitter reduction on real-time landmarks.
 * Adapts cutoff frequency dynamically: low speed = heavy smoothing (eliminates jitter);
 * high speed = low latency (eliminates lag).
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestampMs - this.lastTime) / 1000.0, 0.001);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // Estimate velocity
    const prevX = this.xFilter.lastValue() ?? value;
    const dx = (value - prevX) * rate;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    // Dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(rate, cutoff));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * Landmark set smoother for 33 MediaPipe pose landmarks.
 */
export class PoseLandmarksSmoother {
  private filtersX: Map<number, OneEuroFilter> = new Map();
  private filtersY: Map<number, OneEuroFilter> = new Map();

  smooth(landmarks: NormalizedLandmark[], timestampMs: number): NormalizedLandmark[] {
    return landmarks.map((lm, idx) => {
      if (!this.filtersX.has(idx)) {
        this.filtersX.set(idx, new OneEuroFilter(1.2, 0.005, 1.0));
        this.filtersY.set(idx, new OneEuroFilter(1.2, 0.005, 1.0));
      }

      const fx = this.filtersX.get(idx)!;
      const fy = this.filtersY.get(idx)!;

      return {
        x: fx.filter(lm.x, timestampMs),
        y: fy.filter(lm.y, timestampMs),
        z: lm.z,
        visibility: lm.visibility,
      };
    });
  }

  reset(): void {
    this.filtersX.clear();
    this.filtersY.clear();
  }
}
