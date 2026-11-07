/**
 * Audio cue manager using Web Speech API with debouncing and rate limiting.
 */
class AudioCueManager {
  private enabled: boolean = true;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 2500; // Do not repeat speech faster than 2.5s

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  speak(text: string, force = false): void {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 4000) {
      return;
    }
    if (!force && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior queue
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;
      window.speechSynthesis.speak(utterance);
      this.lastSpokenText = text;
      this.lastSpokenTime = now;
    } catch {
      // Audio speech synthesis not supported or blocked by user gesture
    }
  }

  playBeep(freq = 440, duration = 0.08): void {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext could be suspended or blocked
    }
  }
}

export const audioCues = new AudioCueManager();
