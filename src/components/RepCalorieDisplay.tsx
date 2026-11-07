import React, { useState } from 'react';
import { ExerciseId, FormFeedback, RepPhase } from '../types';
import { EXERCISES } from '../exercises/definitions';
import { Info, Volume2, VolumeX, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface RepCalorieDisplayProps {
  totalReps: number;
  goodReps: number;
  badReps: number;
  caloriesBurned: number;
  formScore: number;
  tempoSeconds: number;
  currentAngle: number;
  targetAngleName: string;
  repPhase: RepPhase;
  repProgress: number;
  formFeedback: FormFeedback;
  currentExerciseId: ExerciseId;
  isAutoDetected: boolean;
  onSelectExercise: (id: ExerciseId) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const RepCalorieDisplay: React.FC<RepCalorieDisplayProps> = ({
  totalReps,
  goodReps,
  badReps,
  caloriesBurned,
  formScore,
  tempoSeconds,
  currentAngle,
  targetAngleName,
  repPhase,
  repProgress,
  formFeedback,
  currentExerciseId,
  isAutoDetected,
  onSelectExercise,
  voiceEnabled,
  onToggleVoice,
}) => {
  const [showCalorieInfo, setShowCalorieInfo] = useState(false);

  // Form feedback styling
  const feedbackStyles = {
    good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    warning: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    error: 'border-red-500/40 bg-red-950/30 text-red-300',
  }[formFeedback.severity];

  const currentExercise = EXERCISES[currentExerciseId];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Exercise Selector Bar */}
      <div className="bg-[#131A22] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Active Movement
              </span>
              {isAutoDetected && (
                <span className="text-[10px] text-cyan-400 font-mono tracking-tight bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Auto-detected
                </span>
              )}
            </div>
            {/* Custom styled select dropdown */}
            <select
              value={currentExerciseId}
              onChange={(e) => onSelectExercise(e.target.value as ExerciseId)}
              className="mt-0.5 bg-slate-900 border border-slate-700 text-white font-semibold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[210px] truncate"
              aria-label="Select exercise"
            >
              {Object.values(EXERCISES).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} (MET {ex.metValue})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Cue Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Voice cues active (tap to mute)' : 'Voice cues muted (tap to enable)'}
          className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium ${
            voiceEnabled
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
          aria-label={voiceEnabled ? 'Mute voice cues' : 'Enable voice cues'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
        </button>
      </div>

      {/* Main Large Counters: Reps & Calories (Huge and readable from 2-3 meters) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Rep Counter Card */}
        <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          {/* Subtle background glow on rep movement */}
          <div
            className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none transition-opacity duration-300"
            style={{ opacity: repPhase !== 'idle' ? 0.8 : 0.2 }}
          />

          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <span>Reps</span>
            <span className="font-mono text-[11px] text-cyan-400 capitalize">
              {repPhase !== 'idle' ? repPhase : 'Ready'}
            </span>
          </div>

          {/* Giant Number */}
          <div className="my-1">
            <span className="font-mono font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white tracking-tighter tabular-nums drop-shadow-md">
              {totalReps}
            </span>
          </div>

          {/* Sub stats: Good vs Bad */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800 text-xs font-mono tabular-nums text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{goodReps} good</span>
            </span>
            {badReps > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{badReps} fix</span>
              </span>
            )}
          </div>
        </div>

        {/* Calorie Burned Card */}
        <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Calories</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCalorieInfo(!showCalorieInfo)}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-0.5"
              aria-label="Calorie calculation info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Giant Calorie Number */}
          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-extrabold text-5xl sm:text-6xl lg:text-7xl text-orange-400 tracking-tighter tabular-nums drop-shadow-md">
                {caloriesBurned.toFixed(1)}
              </span>
              <span className="text-xs sm:text-sm font-mono text-slate-400 uppercase">kcal</span>
            </div>
          </div>

          {/* Sub note: MET rate */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>MET {currentExercise.metValue} · Active only</span>
            {repPhase !== 'idle' ? (
              <span className="text-emerald-400 font-mono font-medium">Burning</span>
            ) : (
              <span className="text-slate-500 font-mono">Resting</span>
            )}
          </div>
        </div>
      </div>

      {/* Calorie Info Popover */}
      {showCalorieInfo && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed shadow-xl animate-in fade-in">
          <p className="font-semibold text-orange-300 mb-1">MET Energy Expenditure Formula</p>
          <p>
            Calories = MET ({currentExercise.metValue}) × Weight (kg) × Active Movement Time (hours),
            dynamically modulated by rep tempo and joint range-of-motion completion.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Calories pause when resting. Estimates only; not clinical indirect calorimetry.
          </p>
        </div>
      )}

      {/* Live Form Feedback Card */}
      <div className={`border rounded-xl p-3 shadow-md flex items-center justify-between gap-3 ${feedbackStyles}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {formFeedback.severity === 'good' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          )}
          <span className="text-sm font-semibold truncate">{formFeedback.message}</span>
        </div>

        {/* Rep Depth / Inflection Progress Bar */}
        <div className="w-24 shrink-0 flex flex-col items-end">
          <span className="text-[10px] font-mono text-slate-400">Depth</span>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-0.5 border border-slate-700">
            <div
              className={`h-full transition-all duration-100 ${
                repProgress > 0.85 ? 'bg-cyan-400' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.round(repProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Telemetry Bar: Joint Angle, Tempo, Form Score */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Joint Angle */}
        <div className="bg-[#131A22] border border-slate-800 rounded-xl p-2.5 shadow">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
            {targetAngleName}
          </span>
          <span className="font-mono text-lg font-bold text-cyan-300 tabular-nums">
            {currentAngle}°
          </span>
        </div>

        {/* Tempo */}
        <div className="bg-[#131A22] border border-slate-800 rounded-xl p-2.5 shadow">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Tempo
          </span>
          <span className="font-mono text-lg font-bold text-slate-200 tabular-nums">
            {tempoSeconds}s
          </span>
        </div>

        {/* Form Score */}
        <div className="bg-[#131A22] border border-slate-800 rounded-xl p-2.5 shadow">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Form Score
          </span>
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              formScore >= 90
                ? 'text-emerald-400'
                : formScore >= 75
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {formScore}
          </span>
        </div>
      </div>
    </div>
  );
};
