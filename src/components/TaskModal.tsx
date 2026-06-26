import React from 'react';
import { Task } from '../types';
import { getCategoryTheme, getUrgencyDetails } from '../utils/helpers';
import {
  X,
  CheckCircle2,
  Circle,
  RotateCcw,
  Check,
  Bot,
  Trash2
} from 'lucide-react';

interface TaskModalProps {
  focusedTask: Task;
  setFocusedTask: (t: Task | null) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  handleToggleSubtask: (taskId: string, subtaskId: string, e: React.MouseEvent) => void;
  handleBreakdownTask: (task: Task, e: React.MouseEvent) => void;
  handleToggleTask: (id: string, e: React.MouseEvent) => void;
  handleDeleteTask: (id: string, e: React.MouseEvent) => void;
  handleAnalyzeTask: (task: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  focusedTask,
  setFocusedTask,
  setTasks,
  handleToggleSubtask,
  handleBreakdownTask,
  handleToggleTask,
  handleDeleteTask,
  handleAnalyzeTask
}) => {
  const catTheme = getCategoryTheme(focusedTask.category);
  const urg = getUrgencyDetails(focusedTask.deadline);

  const dObj = new Date(focusedTask.deadline);
  const formatTime = isNaN(dObj.getTime())
    ? 'No deadline'
    : dObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

  const completedStepsCount = focusedTask.subtasks?.filter(s => s.completed).length || 0;
  const totalStepsCount = focusedTask.subtasks?.length || 0;
  const progressPct = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blur overlay */}
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        onClick={() => setFocusedTask(null)}
      />

      {/* Pop-up container */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative background spots */}
        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider"
                style={{ backgroundColor: catTheme.bg, color: catTheme.text }}
              >
                <span>{catTheme.emoji}</span>
                <span>{catTheme.label}</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                focusedTask.priority === 'high'
                  ? 'bg-rose-500/15 text-rose-400'
                  : focusedTask.priority === 'medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {focusedTask.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug truncate">
              {focusedTask.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setFocusedTask(null)}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {focusedTask.description && (
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed font-medium">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Description</h4>
              {focusedTask.description}
            </div>
          )}

          {/* Target details */}
          <div className="flex items-center justify-between bg-slate-950/20 border border-slate-850 p-3.5 rounded-xl flex-wrap gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Deadline Target</span>
              <span className="text-xs text-slate-200 font-semibold font-mono mt-0.5">
                {formatTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-3 py-1 rounded-lg">
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {urg.emoji} {urg.label}
              </span>
            </div>
          </div>

          {/* Subtasks checklist inside focus modal */}
          <div className="space-y-2 bg-slate-950/20 border border-slate-850 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
                Interactive Checklist ({completedStepsCount}/{totalStepsCount})
              </h4>
              {totalStepsCount > 0 && (
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  {progressPct}%
                </span>
              )}
            </div>

            {focusedTask.subtasks && focusedTask.subtasks.length > 0 ? (
              <div className="flex flex-col gap-2">
                {focusedTask.subtasks.map(s => (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      handleToggleSubtask(focusedTask.id, s.id, e);
                      // Update focused task's subtasks state instantly
                      setFocusedTask({
                        ...focusedTask,
                        subtasks: focusedTask.subtasks.map(sub =>
                          sub.id === s.id ? { ...sub, completed: !sub.completed } : sub
                        )
                      });
                    }}
                    className="flex items-center gap-3 text-xs text-slate-300 hover:text-emerald-400 bg-slate-950/30 hover:bg-slate-900 border border-slate-850/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer group"
                  >
                    {s.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 flex-shrink-0" />
                    )}
                    <span className={`flex-1 truncate ${s.completed ? 'line-through text-slate-500 font-medium' : 'font-medium'}`}>
                      {s.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{s.duration || 15}m</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No custom checklist steps generated yet.</p>
                {!focusedTask.completed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleBreakdownTask(focusedTask, e);
                      setFocusedTask(null); // Close to view generation details
                    }}
                    className="mt-3 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    Deconstruct Task with AI
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Modifier sliders */}
          <div className="border-t border-slate-850 pt-4 space-y-3">
            <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Quick Properties</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-0.5">Priority</label>
                <select
                  value={focusedTask.priority}
                  onChange={e => {
                    const newPri = e.target.value as any;
                    setTasks(prev => prev.map(t => t.id === focusedTask.id ? { ...t, priority: newPri } : t));
                    setFocusedTask({ ...focusedTask, priority: newPri });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-0.5">Category</label>
                <select
                  value={focusedTask.category}
                  onChange={e => {
                    const newCat = e.target.value;
                    setTasks(prev => prev.map(t => t.id === focusedTask.id ? { ...t, category: newCat } : t));
                    setFocusedTask({ ...focusedTask, category: newCat });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="work">💼 Work / Projects</option>
                  <option value="study">📚 Study / Research</option>
                  <option value="personal">🏠 Personal / Life</option>
                  <option value="health">💪 Health / Sport</option>
                  <option value="finance">💰 Finance / Bills</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-850 pt-4 relative z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                handleToggleTask(focusedTask.id, e);
                setFocusedTask({ ...focusedTask, completed: !focusedTask.completed });
              }}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              {focusedTask.completed ? <RotateCcw className="w-4 h-4 text-slate-400" /> : <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
              {focusedTask.completed ? 'Mark Pending' : 'Mark Completed'}
            </button>

            {!focusedTask.completed && (
              <button
                type="button"
                onClick={() => {
                  handleAnalyzeTask(focusedTask);
                  setFocusedTask(null);
                }}
                className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                title="Get smart strategic AI analysis on this task"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                Analyze with AI
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              handleDeleteTask(focusedTask.id, e);
              setFocusedTask(null);
            }}
            className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-bold text-rose-400 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Delete Task Plan
          </button>
        </div>
      </div>
    </div>
  );
};
