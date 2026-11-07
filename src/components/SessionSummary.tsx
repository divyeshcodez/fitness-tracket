import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SessionRecord } from '../types';
import { MuscleHeatmap } from './MuscleHeatmap';
import { strings } from '../i18n/en';
import {
  CheckCircle2,
  Flame,
  Award,
  Clock,
  RotateCcw,
  History,
  Download,
  Dumbbell,
  Layers,
  Scale,
} from 'lucide-react';

interface SessionSummaryProps {
  session: SessionRecord;
  onNewSession: () => void;
  onOpenHistory: () => void;
  onExportSession: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  onNewSession,
  onOpenHistory,
  onExportSession,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#22D3EE', '#3B82F6', '#10B981', '#EAB308'],
      });
    } catch {
      // ignore
    }
  }, []);

  const minutes = Math.floor(session.durationSeconds / 60);
  const seconds = Math.floor(session.durationSeconds % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const exercises = session.exercises && session.exercises.length > 0 ? session.exercises : [];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-between">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {strings.summary.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {exercises.length > 1
              ? `${exercises.length} Exercises Performed · Complete Breakdown Below`
              : `${session.exerciseName || 'Exercise'} · ${strings.summary.saveSuccess}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportSession}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#131A22] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Download JSON record"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#131A22] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>History</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Overall Metrics Left, Cumulative Muscle Heatmap Right */}
      <main className="w-full max-w-5xl my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Big Overall Stats Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Top 2x2 Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Reps Card */}
            <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                {strings.summary.totalReps}
              </span>
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-white mt-1 tabular-nums">
                {session.totalReps}
              </div>
              <div className="mt-2 text-xs font-mono tabular-nums text-slate-400 flex items-center gap-2">
                <span className="text-emerald-400">{session.goodReps} good</span>
                {session.badReps > 0 && (
                  <span className="text-amber-400">· {session.badReps} fix</span>
                )}
              </div>
            </div>

            {/* Total Calories Card */}
            <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow">
              <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{strings.summary.caloriesBurned}</span>
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-orange-400 mt-1 tabular-nums">
                {session.caloriesBurned.toFixed(1)}
              </div>
              <div className="mt-2 text-xs font-mono text-slate-400">
                Combined active MET load
              </div>
            </div>

            {/* Average Form Score */}
            <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow">
              <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>{strings.summary.avgScore}</span>
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-cyan-300 mt-1 tabular-nums">
                {session.avgFormScore}
                <span className="text-lg font-normal text-slate-500">/100</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Overall biomechanical accuracy
              </div>
            </div>

            {/* Active Time */}
            <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow">
              <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{strings.summary.activeDuration}</span>
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-slate-100 mt-1 tabular-nums">
                {timeFormatted}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Active exercise movement
              </div>
            </div>
          </div>

          {/* Form & Symmetry Quality Callout */}
          <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-white">Movement Analysis: </span>
              {session.goodReps >= session.totalReps * 0.8
                ? 'High biomechanical consistency! Symmetrical drive and clean range of motion maintained.'
                : 'Great workout! Focus on locking out target depth on every rep for maximal muscle stimulation.'}
            </div>
          </div>

          {/* Per-Exercise Breakdown List (if multiple exercises or 1) */}
          <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Exercise-by-Exercise Breakdown ({exercises.length > 0 ? exercises.length : 1})
              </h2>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {exercises.length > 0 ? (
                exercises.map((item) => (
                  <div
                    key={item.exerciseId}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-white text-sm block truncate">
                          {item.exerciseName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.goodReps} good reps · {Math.round(item.activeSeconds)}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Reps</span>
                        <span className="text-sm font-bold text-white tabular-nums">
                          {item.reps}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Calories</span>
                        <span className="text-sm font-bold text-orange-400 tabular-nums">
                          {item.caloriesBurned.toFixed(1)} kcal
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Score</span>
                        <span className="text-sm font-bold text-cyan-300 tabular-nums">
                          {item.avgFormScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{session.exerciseName || 'Squats'}</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {session.totalReps} reps · {session.caloriesBurned.toFixed(1)} kcal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button: Start New Session */}
          <button
            type="button"
            onClick={onNewSession}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer mt-1"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{strings.summary.doneBtn}</span>
          </button>
        </div>

        {/* Right Column: Full-Session Cumulative Muscle Heatmap (5 cols) */}
        <div className="lg:col-span-5 h-full">
          <MuscleHeatmap
            muscleIntensities={session.muscleEngagement}
            title={strings.summary.muscleDistribution}
            isCumulative={true}
          />
        </div>
      </main>

      {/* Bottom Privacy / Disclaimer */}
      <footer className="w-full max-w-5xl text-center py-3 border-t border-slate-800 text-xs text-slate-400">
        <p>{strings.disclaimer}</p>
      </footer>
    </div>
  );
};
