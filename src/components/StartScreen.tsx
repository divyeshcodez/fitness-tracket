import React, { useState } from 'react';
import { ShieldCheck, Play, Video, History, Sparkles } from 'lucide-react';
import { lbToKg, kgToLb } from '../utils/calories';
import { strings } from '../i18n/en';

interface StartScreenProps {
  initialWeightKg: number;
  initialUnit: 'kg' | 'lb';
  onStartTracking: (weightKg: number, unit: 'kg' | 'lb', isDemo: boolean) => void;
  onOpenHistory: () => void;
  onUploadVideo: (file: File) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  initialWeightKg,
  initialUnit,
  onStartTracking,
  onOpenHistory,
  onUploadVideo,
}) => {
  const [unit, setUnit] = useState<'kg' | 'lb'>(initialUnit);
  const [weightValue, setWeightValue] = useState<number>(() => {
    return initialUnit === 'lb' ? kgToLb(initialWeightKg) : initialWeightKg;
  });

  const handleUnitToggle = (newUnit: 'kg' | 'lb') => {
    if (newUnit === unit) return;
    if (newUnit === 'lb') {
      setWeightValue(kgToLb(weightValue));
    } else {
      setWeightValue(lbToKg(weightValue));
    }
    setUnit(newUnit);
  };

  const currentWeightKg = unit === 'lb' ? lbToKg(weightValue) : weightValue;

  const handleStart = (isDemo = false) => {
    onStartTracking(currentWeightKg, unit, isDemo);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-[#0B0F14] text-slate-100">
      {/* Top Header */}
      <header className="w-full max-w-xl flex items-center justify-between pt-2 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-mono font-black text-slate-950 text-base">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>{strings.appName}</span>
              <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                Movement HUD
              </span>
            </h1>
            <p className="text-xs text-slate-400">Real-time movement and muscle load tracker</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131A22] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          aria-label="View past workout sessions"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>Past Sessions</span>
        </button>
      </header>

      {/* Main Single Action Card */}
      <main className="w-full max-w-md my-auto py-8">
        <div className="bg-[#131A22] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle cyan accent glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {strings.start.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {strings.start.subtitle}
            </p>
          </div>

          {/* Weight Input with Unit Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="weightInput" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                {strings.start.weightLabel}
              </label>

              {/* Segmented Unit Selector */}
              <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('kg')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                    unit === 'kg'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('lb')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                    unit === 'lb'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  lb
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <input
                id="weightInput"
                type="number"
                min={20}
                max={300}
                step={0.5}
                value={weightValue}
                onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
                className="font-mono text-4xl sm:text-5xl font-extrabold text-white text-center w-36 bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 focus:outline-none tabular-nums pb-1"
                aria-label="Body weight in selected units"
              />
              <span className="font-mono text-xl text-slate-400 font-bold self-end pb-2">
                {unit}
              </span>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            type="button"
            onClick={() => handleStart(false)}
            className="w-full min-h-[56px] py-4 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Start Live Movement Tracker"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{strings.start.startBtn}</span>
          </button>

          {/* Privacy Note */}
          <div className="mt-5 flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[12px]">{strings.privacyNote}</p>
          </div>

          {/* Alternative Demo Mode & Upload Section */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleStart(true)}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{strings.start.demoModeBtn}</span>
            </button>

            <label className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
              <Video className="w-4 h-4 text-slate-400" />
              <span>Test with Local Exercise Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload pre-recorded exercise video"
              />
            </label>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-xl text-center py-4 border-t border-slate-800/80 text-xs text-slate-400">
        <p>{strings.disclaimer}</p>
      </footer>
    </div>
  );
};
