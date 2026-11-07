import React, { useState } from 'react';
import { MuscleGroup, MuscleIntensityMap } from '../types';
import { Info, HelpCircle } from 'lucide-react';

interface MuscleHeatmapProps {
  muscleIntensities: MuscleIntensityMap;
  title?: string;
  isCumulative?: boolean;
}

/**
 * Maps 0.0 -> 1.0 intensity to color:
 * 0.0: Muted neutral (#1E293B)
 * ~0.25: Electric Blue (#3B82F6)
 * ~0.6: Warm Yellow (#EAB308)
 * ~1.0: Intense Red (#EF4444)
 */
export function getHeatmapColor(intensity: number): string {
  const val = Math.max(0, Math.min(1, intensity));

  if (val <= 0.05) return '#1E293B'; // idle slate-800

  if (val < 0.35) {
    // Transition from dark slate to blue/cyan
    const t = (val - 0.05) / 0.3;
    const r = Math.round(30 + (59 - 30) * t);
    const g = Math.round(41 + (130 - 41) * t);
    const b = Math.round(59 + (246 - 59) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (val < 0.7) {
    // Transition from blue to yellow
    const t = (val - 0.35) / 0.35;
    const r = Math.round(59 + (234 - 59) * t);
    const g = Math.round(130 + (179 - 130) * t);
    const b = Math.round(246 + (8 - 246) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Transition from yellow to red
    const t = (val - 0.7) / 0.3;
    const r = Math.round(234 + (239 - 234) * t);
    const g = Math.round(179 + (68 - 179) * t);
    const b = Math.round(8 + (68 - 8) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({
  muscleIntensities,
  title = 'Estimated muscle engagement',
  isCumulative = false,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'front' | 'back'>('both');
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Helper to get color for a muscle
  const color = (m: MuscleGroup) => getHeatmapColor(muscleIntensities[m] || 0);

  // Sorted list of top engaging muscles
  const activeMuscles = Object.entries(muscleIntensities)
    .filter(([, score]) => score > 0.08)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-[#131A22] border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
      {/* Header with Title and Info Icon */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            aria-label="How muscle engagement is calculated"
            className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-0.5 bg-slate-900 rounded-lg text-xs font-medium border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'both' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'front' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('back')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'back' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Info popover */}
      {showInfo && (
        <div className="mt-2 p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed shadow-xl animate-in fade-in duration-200">
          <p className="font-semibold text-cyan-300 mb-1">Biomechanical Load Estimation</p>
          <p>
            Muscle engagement intensity dynamically maps current joint flexion angles, moment arms,
            and exercise phases. Peaks occur at maximum torque angles (e.g. 90° for squats and curls).
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Estimates only. Not medical or clinical EMG measurements.
          </p>
        </div>
      )}

      {/* Anatomical Heatmap SVG Canvases */}
      <div className="flex-1 flex items-center justify-around py-3 px-1 min-h-[220px]">
        {/* Anterior (Front) View */}
        {(activeTab === 'both' || activeTab === 'front') && (
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">Anterior (Front)</span>
            <svg
              viewBox="0 0 160 300"
              className="w-32 h-64 drop-shadow-md select-none transition-all duration-200"
              aria-label="Anterior human body diagram"
            >
              {/* Head & Neck */}
              <circle cx="80" cy="24" r="14" fill="#18222D" stroke="#334155" strokeWidth="1.2" />
              <rect x="74" y="38" width="12" height="10" rx="3" fill="#18222D" />

              {/* Chest (Pectorals) */}
              <g id="chest" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 64 56 C 70 55 76 57 78 64 L 78 78 C 70 80 62 76 60 70 Z"
                  fill={color('chest')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 96 56 C 90 55 84 57 82 64 L 82 78 C 90 80 98 76 100 70 Z"
                  fill={color('chest')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Shoulders (Deltoids - Front) */}
              <g id="shoulders-front" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 58 54 C 50 56 46 64 48 72 C 54 74 58 68 62 60 Z"
                  fill={color('shoulders')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 102 54 C 110 56 114 64 112 72 C 106 74 102 68 98 60 Z"
                  fill={color('shoulders')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Biceps */}
              <g id="biceps" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 47 74 C 43 82 43 94 48 102 C 53 100 54 88 52 76 Z"
                  fill={color('biceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 113 74 C 117 82 117 94 112 102 C 107 100 106 88 108 76 Z"
                  fill={color('biceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Forearms */}
              <g id="forearms-front" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 46 106 C 40 118 38 130 42 142 C 46 142 49 130 50 112 Z"
                  fill={color('forearms')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 114 106 C 120 118 122 130 118 142 C 114 142 111 130 110 112 Z"
                  fill={color('forearms')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Core / Abdominals */}
              <g id="core" style={{ transition: 'fill 0.2s ease-out' }}>
                {/* Upper Abs */}
                <rect x="66" y="82" width="12" height="11" rx="3" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
                <rect x="82" y="82" width="12" height="11" rx="3" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
                {/* Mid Abs */}
                <rect x="66" y="96" width="12" height="11" rx="3" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
                <rect x="82" y="96" width="12" height="11" rx="3" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
                {/* Lower Abs / Obliques */}
                <path d="M 64 110 C 68 110 74 112 78 124 C 68 126 62 120 62 114 Z" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
                <path d="M 96 110 C 92 110 86 112 82 124 C 92 126 98 120 98 114 Z" fill={color('core')} stroke="#0F172A" strokeWidth="1" />
              </g>

              {/* Quadriceps (Thighs) */}
              <g id="quadriceps" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 60 134 C 54 150 52 180 58 196 C 66 196 74 186 76 156 C 76 142 72 134 60 134 Z"
                  fill={color('quadriceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 100 134 C 106 150 108 180 102 196 C 94 196 86 186 84 156 C 84 142 88 134 100 134 Z"
                  fill={color('quadriceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Knees */}
              <circle cx="63" cy="204" r="5" fill="#18222D" stroke="#334155" strokeWidth="1" />
              <circle cx="97" cy="204" r="5" fill="#18222D" stroke="#334155" strokeWidth="1" />

              {/* Calves (Front / Shin) */}
              <g id="calves-front" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 58 212 C 54 228 56 254 60 268 C 65 268 68 250 67 226 Z"
                  fill={color('calves')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 102 212 C 106 228 104 254 100 268 C 95 268 92 250 93 226 Z"
                  fill={color('calves')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Feet */}
              <ellipse cx="58" cy="276" rx="7" ry="4" fill="#18222D" />
              <ellipse cx="102" cy="276" rx="7" ry="4" fill="#18222D" />
            </svg>
          </div>
        )}

        {/* Posterior (Back) View */}
        {(activeTab === 'both' || activeTab === 'back') && (
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">Posterior (Back)</span>
            <svg
              viewBox="0 0 160 300"
              className="w-32 h-64 drop-shadow-md select-none transition-all duration-200"
              aria-label="Posterior human body diagram"
            >
              {/* Head & Neck */}
              <circle cx="80" cy="24" r="14" fill="#18222D" stroke="#334155" strokeWidth="1.2" />
              <rect x="74" y="38" width="12" height="10" rx="3" fill="#18222D" />

              {/* Upper Back / Trapezius */}
              <g id="upper-back" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 80 46 L 62 56 L 68 84 L 80 92 L 92 84 L 98 56 Z"
                  fill={color('upper_back')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Shoulders (Rear Deltoids) */}
              <g id="shoulders-back" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 58 54 C 50 58 46 66 48 74 C 54 74 58 68 62 60 Z"
                  fill={color('shoulders')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 102 54 C 110 58 114 66 112 74 C 106 74 102 68 98 60 Z"
                  fill={color('shoulders')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Triceps */}
              <g id="triceps" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 47 74 C 42 84 42 96 48 104 C 53 100 53 86 52 76 Z"
                  fill={color('triceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 113 74 C 118 84 118 96 112 104 C 107 100 107 86 108 76 Z"
                  fill={color('triceps')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Lower Back / Lats */}
              <g id="lower-back" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 68 88 C 64 102 62 118 64 126 C 72 128 78 126 80 120 C 80 104 76 94 68 88 Z"
                  fill={color('lower_back')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 92 88 C 96 102 98 118 96 126 C 88 128 82 126 80 120 C 80 104 84 94 92 88 Z"
                  fill={color('lower_back')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Glutes (Gluteus Maximus) */}
              <g id="glutes" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 60 130 C 54 136 54 154 62 164 C 72 166 78 158 79 146 C 78 134 72 130 60 130 Z"
                  fill={color('glutes')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 100 130 C 106 136 106 154 98 164 C 88 166 82 158 81 146 C 82 134 88 130 100 130 Z"
                  fill={color('glutes')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Hamstrings */}
              <g id="hamstrings" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 59 166 C 54 178 54 192 59 200 C 67 200 74 194 76 182 C 77 172 73 166 59 166 Z"
                  fill={color('hamstrings')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 101 166 C 106 178 106 192 101 200 C 93 200 86 194 84 182 C 83 172 87 166 101 166 Z"
                  fill={color('hamstrings')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Calves (Gastrocnemius - Back) */}
              <g id="calves-back" style={{ transition: 'fill 0.2s ease-out' }}>
                <path
                  d="M 57 210 C 51 224 52 246 58 266 C 65 266 69 250 68 226 C 68 216 64 210 57 210 Z"
                  fill={color('calves')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <path
                  d="M 103 210 C 109 224 108 246 102 266 C 95 266 91 250 92 226 C 92 216 96 210 103 210 Z"
                  fill={color('calves')}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
              </g>

              {/* Heels */}
              <ellipse cx="58" cy="274" rx="6" ry="3" fill="#18222D" />
              <ellipse cx="102" cy="274" rx="6" ry="3" fill="#18222D" />
            </svg>
          </div>
        )}
      </div>

      {/* Heatmap Legend Bar (Blue -> Yellow -> Red) */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Low (0%)</span>
          <span>Moderate (50%)</span>
          <span>Max Load (100%)</span>
        </div>
        <div className="h-2 rounded-full w-full bg-gradient-to-r from-slate-800 via-blue-500 via-yellow-400 to-red-500 shadow-inner" />
      </div>

      {/* Primary active muscle engagement chips */}
      {activeMuscles.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
          {activeMuscles.slice(0, 4).map(([m, val]) => (
            <div
              key={m}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getHeatmapColor(val) }}
              />
              <span className="capitalize text-slate-300 text-[11px]">{m.replace('_', ' ')}</span>
              <span className="font-mono text-cyan-300 text-[11px] tabular-nums font-semibold">
                {Math.round(val * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
