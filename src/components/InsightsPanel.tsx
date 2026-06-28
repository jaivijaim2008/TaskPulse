import React from 'react';
import { InsightItem, Task } from '../types';
import { Activity, RefreshCw, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface InsightsPanelProps {
  insights: InsightItem[];
  handleFullAnalysis: () => void;
  tasks: Task[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl flex flex-col gap-1.5 min-w-[140px]">
        <p className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1 font-sans">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-[11px] leading-none">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-slate-400 font-medium">{entry.name}:</span>
            </div>
            <span className="font-extrabold font-mono text-slate-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  handleFullAnalysis,
  tasks
}) => {
  // Generate data for the last 7 days
  const chartData = React.useMemo(() => {
    const data = [];
    const currentTasks = Array.isArray(tasks) ? tasks : [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      // Count tasks completed on this day
      const completedCount = currentTasks.filter(t => {
        if (!t.completed) return false;
        if (t.lastCompletedDate) {
          return t.lastCompletedDate === dateStr;
        }
        // Fallback to deadline matching
        const targetDateObj = new Date(t.deadline);
        return !isNaN(targetDateObj.getTime()) && 
          targetDateObj.getFullYear() === d.getFullYear() &&
          targetDateObj.getMonth() === d.getMonth() &&
          targetDateObj.getDate() === d.getDate();
      }).length;

      // Count tasks overdue on this day (not completed, due on this day, and deadline has passed)
      const overdueCount = currentTasks.filter(t => {
        if (t.completed) return false;
        if (!t.deadline) return false;
        
        const targetDateObj = new Date(t.deadline);
        const isSameDate = !isNaN(targetDateObj.getTime()) && 
          targetDateObj.getFullYear() === d.getFullYear() &&
          targetDateObj.getMonth() === d.getMonth() &&
          targetDateObj.getDate() === d.getDate();
          
        return isSameDate && targetDateObj.getTime() < Date.now();
      }).length;

      data.push({
        label: `${dayName} ${dayNum}`,
        Completed: completedCount,
        Overdue: overdueCount,
      });
    }
    return data;
  }, [tasks]);

  // Aggregate stats
  const totalCompleted7Days = chartData.reduce((acc, curr) => acc + curr.Completed, 0);
  const totalOverdue7Days = chartData.reduce((acc, curr) => acc + curr.Overdue, 0);
  const totalOutput = totalCompleted7Days + totalOverdue7Days;
  const efficiencyRate = totalOutput > 0 ? Math.round((totalCompleted7Days / totalOutput) * 100) : 100;

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      {/* HEADER */}
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

      {/* 7-DAY VISUALIZATION CARD */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-850 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Performance Velocity</h3>
              <p className="text-[11px] text-slate-400 font-medium">Completed vs. Overdue tasks over the last 7 days</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-mono w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-850/50 px-2.5 py-1.5 sm:px-3 rounded-xl flex-1 sm:flex-initial justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Completed:</span>
              <span className="font-extrabold text-slate-100">{totalCompleted7Days}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-850/50 px-2.5 py-1.5 sm:px-3 rounded-xl flex-1 sm:flex-initial justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-400">Overdue:</span>
              <span className="font-extrabold text-slate-100">{totalOverdue7Days}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-850/50 px-2.5 py-1.5 sm:px-3 rounded-xl flex-1 sm:flex-initial justify-center sm:justify-start">
              <span className="text-slate-400">Efficiency:</span>
              <span className={`font-extrabold ${efficiencyRate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{efficiencyRate}%</span>
            </div>
          </div>
        </div>

        {/* RECHARTS COMPONENT */}
        <div className="h-64 w-full" id="performance-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs font-bold text-slate-300 font-sans ml-1 mr-4">{value}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="Completed" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
              />
              <Area 
                type="monotone" 
                dataKey="Overdue" 
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOverdue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RE-ANALYZE / COGNITIVE INSIGHTS */}
      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
        <span>●</span> AI Workload Diagnosis
      </h3>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className="bg-slate-900/30 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-sm transition-all hover:border-emerald-500/30 flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-250">{ins.icon}</span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Insight #{idx + 1}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-150 mb-1">{ins.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-850 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl mb-4 shadow-sm animate-pulse">
            💡
          </div>
          <p className="text-sm font-bold text-slate-200">Workload Diagnostics Stale</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium leading-relaxed">
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
