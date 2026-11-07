import React, { useEffect, useState } from 'react';
import { UserCheck, Zap } from 'lucide-react';
import { strings } from '../i18n/en';
import { audioCues } from '../utils/audio';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    // Initial sound
    audioCues.playBeep(440, 0.08);

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          audioCues.playBeep(880, 0.15);
          onComplete();
          return 0;
        }
        audioCues.playBeep(440 + (3 - prev + 1) * 110, 0.08);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-30 bg-[#0B0F14]/75 backdrop-blur-sm flex flex-col items-center justify-between p-6">
      {/* Top Guide Banner */}
      <div className="bg-[#131A22] border border-cyan-500/30 rounded-2xl p-4 max-w-md w-full text-center shadow-xl animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <span>{strings.countdown.guideTitle}</span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          {strings.countdown.guideSubtitle}
        </p>
      </div>

      {/* Silhouette Guide Box in center */}
      <div className="relative w-64 h-96 border-2 border-dashed border-cyan-400/50 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
        {/* Giant Countdown Number */}
        <div className="font-mono font-black text-8xl text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)] animate-scale-in">
          {count > 0 ? count : 'GO!'}
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-3">
          Get into position
        </span>
      </div>

      {/* Skip Button */}
      <div className="w-full max-w-xs flex justify-center pb-4">
        <button
          type="button"
          onClick={onComplete}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>{strings.countdown.skip}</span>
        </button>
      </div>
    </div>
  );
};
