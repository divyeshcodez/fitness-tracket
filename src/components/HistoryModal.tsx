import React, { useEffect, useState } from 'react';
import { SessionRecord } from '../types';
import { getAllSessions, exportAllSessionsAsJson, deleteAllSessions } from '../utils/storage';
import { strings } from '../i18n/en';
import { X, Download, Trash2, Calendar, Flame, Dumbbell } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const jsonStr = await exportAllSessionsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motionlens-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = async () => {
    if (window.confirm(strings.history.confirmDelete)) {
      await deleteAllSessions();
      setSessions([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131A22] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {strings.history.title}
            </h2>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {sessions.length} sessions
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close history modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading history...</div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Dumbbell className="w-10 h-10 mx-auto text-slate-600 mb-3 stroke-1" />
              <p>{strings.history.empty}</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const dateStr = new Date(sess.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const mins = Math.floor(sess.durationSeconds / 60);
              const secs = Math.floor(sess.durationSeconds % 60);

              return (
                <div
                  key={sess.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {sess.exerciseName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span>{mins}:{secs < 10 ? '0' : ''}{secs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-right self-end sm:self-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Reps</span>
                      <span className="text-base font-bold text-white tabular-nums">
                        {sess.totalReps}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Calories</span>
                      <span className="text-base font-bold text-orange-400 tabular-nums flex items-center gap-1 justify-end">
                        <Flame className="w-3.5 h-3.5" />
                        {sess.caloriesBurned.toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Score</span>
                      <span className="text-base font-bold text-cyan-300 tabular-nums">
                        {sess.avgFormScore}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={sessions.length === 0}
            onClick={handleDeleteAll}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{strings.history.deleteAll}</span>
          </button>

          <button
            type="button"
            disabled={sessions.length === 0}
            onClick={handleExport}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{strings.history.exportAll}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
