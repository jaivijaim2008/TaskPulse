import React from 'react';
import { Task } from '../types';
import { getUrgencyDetails } from '../utils/helpers';
import { Flame, X, Check, Calendar } from 'lucide-react';

interface UnfinishedModalProps {
  tasks: Task[];
  setShowUnfinishedModal: (val: boolean) => void;
  selectTaskDirectly: (id: string) => void;
  handleToggleTask: (id: string, e: React.MouseEvent) => void;
  handlePlanDay: () => void;
}

export const UnfinishedModal: React.FC<UnfinishedModalProps> = ({
  tasks,
  setShowUnfinishedModal,
  selectTaskDirectly,
  handleToggleTask,
  handlePlanDay
}) => {
  const pendingTasks = tasks.filter(t => !t.completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        onClick={() => setShowUnfinishedModal(false)}
      />

      {/* Main alert dialogue box */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Unfinished Tasks Warning
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                You currently have <span className="font-extrabold text-rose-400">{pendingTasks.length} pending tasks</span> requiring action!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUnfinishedModal(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of unfinished tasks */}
        <div className="space-y-2 relative z-10 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
          {pendingTasks.map(task => {
            const urg = getUrgencyDetails(task.deadline);
            return (
              <div
                key={task.id}
                onClick={() => {
                  setShowUnfinishedModal(false);
                  selectTaskDirectly(task.id);
                }}
                className="group bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 truncate transition-colors">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="font-bold font-mono" style={{ color: urg.color }}>
                      {urg.emoji} {urg.label}
                    </span>
                    <span>•</span>
                    <span>{task.estimatedDuration} mins</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(task.id, e);
                  }}
                  className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 transition-all cursor-pointer active:scale-90"
                  title="Mark Complete"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex gap-2.5 relative z-10 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowUnfinishedModal(false);
              handlePlanDay();
            }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-md"
          >
            <Calendar className="w-4 h-4 text-slate-950" /> Organize My Day
          </button>
          <button
            type="button"
            onClick={() => setShowUnfinishedModal(false)}
            className="px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-colors cursor-pointer active:scale-98"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
