import React from 'react';
import { InsightItem } from '../types';
import { Activity, RefreshCw } from 'lucide-react';

interface InsightsPanelProps {
  insights: InsightItem[];
  handleFullAnalysis: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  handleFullAnalysis
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            Deep Workload Insights
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Strategic analytics, cognitive load thresholds, and personalized bottleneck forecasts</p>
        </div>
        <button
          onClick={handleFullAnalysis}
          className="bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Analyze Workload
        </button>
      </div>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className="bg-slate-900/30 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-250">{ins.icon}</span>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Insight #{idx + 1}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-150 mb-1">{ins.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl mb-4 shadow-sm animate-pulse">
            💡
          </div>
          <p className="text-sm font-bold text-slate-200">Workload Diagnostics Stale</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
            Click below to execute an analytical diagnostic check on your task list. Let AI optimize your pacing.
          </p>
          <button
            onClick={handleFullAnalysis}
            className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer active:scale-98 shadow-md shadow-emerald-500/10"
          >
            Run Full Diagnostics
          </button>
        </div>
      )}
    </div>
  );
};
