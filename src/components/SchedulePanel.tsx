import React from 'react';
import { ScheduleData } from '../types';
import { Calendar, RefreshCw, Brain } from 'lucide-react';

interface SchedulePanelProps {
  scheduleData: ScheduleData | null;
  handlePlanDay: () => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  scheduleData,
  handlePlanDay
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Chronological Daily Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Custom hour-by-hour planner generated dynamically by AI based on your active tasks</p>
        </div>
        <button
          onClick={handlePlanDay}
          className="bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Plan
        </button>
      </div>

      {scheduleData ? (
        <div className="flex flex-col gap-6">
          {scheduleData.advice && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 p-4 rounded-xl flex gap-3 items-start leading-relaxed text-xs font-medium shadow-sm">
              <Brain className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">AI Strategist Advisory</strong>
                <p className="text-slate-200/90 leading-relaxed">{scheduleData.advice}</p>
              </div>
            </div>
          )}

          {scheduleData.days?.map((day, dIdx) => (
            <div key={dIdx} className="bg-slate-900/20 backdrop-blur-md border border-slate-850 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-900/60 border-b border-slate-850 px-4 py-3 font-bold text-xs uppercase tracking-widest text-emerald-400">
                {day.label}
              </div>
              
              <div className="divide-y divide-slate-850/60">
                {day.slots && day.slots.length > 0 ? (
                  day.slots.map((slot, sIdx) => {
                    const isBreak =
                      slot.task.toLowerCase().includes('break') ||
                      slot.task.toLowerCase().includes('lunch') ||
                      slot.task.toLowerCase().includes('recharge') ||
                      slot.task.toLowerCase().includes('coffee') ||
                      slot.task.toLowerCase().includes('rest');

                    return (
                      <div key={sIdx} className="p-4 flex items-start gap-4 transition-colors hover:bg-slate-900/10">
                        <div className="w-20 flex-shrink-0">
                          <span className="text-xs font-bold text-emerald-400 font-mono block">{slot.time}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-mono font-medium">{slot.duration}</span>
                        </div>
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isBreak ? 'bg-slate-700/60' : 'bg-gradient-to-b from-indigo-500 to-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate ${isBreak ? 'text-slate-400' : 'text-slate-100'}`}>{slot.task}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">{slot.desc}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">No slots generated for this day.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-4 shadow-sm">
            📅
          </div>
          <p className="text-sm font-bold text-slate-200">No Schedule Prepared Yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
            Click &quot;Build My Plan&quot; to parse your active task stack and configure an optimized hour-by-hour timeline.
          </p>
          <button
            onClick={handlePlanDay}
            className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer active:scale-98 shadow-md shadow-emerald-500/10"
          >
            Build My Plan
          </button>
        </div>
      )}
    </div>
  );
};
