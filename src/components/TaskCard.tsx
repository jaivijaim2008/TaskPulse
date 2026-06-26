import React from 'react';
import { Task } from '../types';
import { getUrgencyDetails, getCategoryTheme } from '../utils/helpers';
import {
  Clock,
  Pencil,
  Save,
  CheckCircle2,
  Circle,
  RotateCcw,
  Check,
  Bot,
  Trash2
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  selectTaskDirectly: (id: string) => void;
  inlineEditingTaskId: string | null;
  quickEditTitle: string;
  setQuickEditTitle: (val: string) => void;
  quickEditPriority: 'low' | 'medium' | 'high';
  setQuickEditPriority: (val: 'low' | 'medium' | 'high') => void;
  handleStartQuickEdit: (e: React.MouseEvent, task: Task) => void;
  handleSaveQuickEdit: (e: React.FormEvent, taskId: string) => void;
  handleCancelQuickEdit: (e: React.MouseEvent) => void;
  handleToggleTask: (id: string, e: React.MouseEvent) => void;
  handleBreakdownTask: (task: Task, e: React.MouseEvent) => void;
  handleDeleteTask: (id: string, e: React.MouseEvent) => void;
  handleToggleSubtask: (taskId: string, subtaskId: string, e: React.MouseEvent) => void;
  
  // Drag-and-Drop Order Support
  draggingTaskId: string | null;
  dragOverTaskId: string | null;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
  handleDragEnd: () => void;
}

export const TaskCard = React.memo<TaskCardProps>(({
  task,
  isSelected,
  selectTaskDirectly,
  inlineEditingTaskId,
  quickEditTitle,
  setQuickEditTitle,
  quickEditPriority,
  setQuickEditPriority,
  handleStartQuickEdit,
  handleSaveQuickEdit,
  handleCancelQuickEdit,
  handleToggleTask,
  handleBreakdownTask,
  handleDeleteTask,
  handleToggleSubtask,
  
  draggingTaskId,
  dragOverTaskId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd
}) => {
  const urg = getUrgencyDetails(task.deadline);
  const catTheme = getCategoryTheme(task.category);
  const isEditing = inlineEditingTaskId === task.id;

  const dObj = new Date(task.deadline);
  const formatTime = isNaN(dObj.getTime())
    ? 'No deadline'
    : dObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

  // Calculate if urgent (due within 2 hours)
  const isWithinTwoHours = !task.completed && (() => {
    const deadlineTime = new Date(task.deadline).getTime();
    const nowTime = new Date().getTime();
    const diffMs = deadlineTime - nowTime;
    return diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
  })();

  // Calculate day completion progress comparison
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const remainingMs = endOfDay.getTime() - now.getTime();
  const remainingMinutes = Math.max(1, Math.round(remainingMs / (1000 * 60)));
  const durationPercent = Math.min(100, Math.max(1, Math.round((task.estimatedDuration / remainingMinutes) * 100)));

  const remHours = Math.floor(remainingMinutes / 60);
  const remMins = remainingMinutes % 60;
  const formattedRemaining = remHours > 0 ? `${remHours}h ${remMins}m` : `${remMins}m`;

  // Circular gauge calculations
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (urg.pct / 100) * circ;

  return (
    <div
      onClick={() => !isEditing && selectTaskDirectly(task.id)}
      draggable={!isEditing}
      onDragStart={(e) => handleDragStart(e, task.id)}
      onDragOver={(e) => handleDragOver(e, task.id)}
      onDrop={(e) => handleDrop(e, task.id)}
      onDragEnd={handleDragEnd}
      className={`relative bg-slate-900/40 backdrop-blur-md border rounded-xl p-4 transition-all duration-200 group flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/45 select-none ${
        isEditing ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${
        task.completed
          ? 'border-slate-800/40 opacity-55 bg-slate-950/10'
          : isSelected
          ? 'border-emerald-500/60 bg-slate-900/85 shadow-md shadow-emerald-950/5'
          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
      } ${
        draggingTaskId === task.id ? 'opacity-30 border-dashed border-emerald-500/40 scale-95' : ''
      } ${
        dragOverTaskId === task.id ? 'border-t-2 border-t-emerald-400 bg-slate-900/80' : ''
      }`}
    >
      {/* Dynamic urgency left border bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-colors duration-350"
        style={{ backgroundColor: task.completed ? '#4B5563' : urg.color }}
      />

      {/* Quick Edit icon trigger revealed on card hover */}
      {!task.completed && !isEditing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStartQuickEdit(e, task);
          }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-800/80 hover:bg-emerald-400 hover:text-slate-950 text-slate-300 p-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 shadow-md cursor-pointer z-10"
          title="Quick Edit Task"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSaveQuickEdit(e, task.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-3 py-1 pl-1.5"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Edit Title
            </label>
            <input
              type="text"
              value={quickEditTitle}
              onChange={(e) => setQuickEditTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
              placeholder="Task title..."
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'medium', 'high'] as const).map((pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setQuickEditPriority(pri)}
                  className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-all cursor-pointer ${
                    quickEditPriority === pri
                      ? pri === 'high'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-extrabold'
                        : pri === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-extrabold'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-extrabold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800/40 hover:border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-1 pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={handleCancelQuickEdit}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-950/20 cursor-pointer transition-colors"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Header layout */}
          <div className="flex items-start justify-between gap-3 pl-1.5">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <h3 className={`text-sm font-bold tracking-tight leading-snug group-hover:text-emerald-400 transition-colors duration-150 flex items-center flex-wrap gap-1.5 ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                {isWithinTwoHours && (
                  <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-rose-500/30 animate-pulse" title="Due in less than 2 hours!">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                    URGENT
                  </span>
                )}
                <span className="truncate max-w-full block">{task.title}</span>
              </h3>

              {/* Progress dynamic timeline representation */}
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800 relative" title={`${task.estimatedDuration}m is ${durationPercent}% of remaining day (${formattedRemaining} left)`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${task.completed ? 'bg-slate-600/50' : 'bg-gradient-to-r from-emerald-400 to-indigo-400'}`}
                    style={{ width: `${durationPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono leading-none">
                  <span>Est: <strong className={task.completed ? 'text-slate-500 font-medium' : 'text-emerald-400 font-bold'}>{task.estimatedDuration}m</strong></span>
                  <span>{formattedRemaining} left today ({durationPercent}%)</span>
                </div>
              </div>

              {task.description && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-0.5 font-medium">
                  {task.description}
                </p>
              )}
            </div>

            {/* Circular Gauge */}
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle className="fill-none stroke-slate-850 stroke-[3.5]" cx="22" cy="22" r={r} />
                <circle
                  className="fill-none stroke-[3.5] stroke-linecap-round transition-all duration-1000"
                  cx="22"
                  cy="22"
                  r={r}
                  stroke={task.completed ? '#4B5563' : urg.color}
                  strokeDasharray={circ}
                  strokeDashoffset={task.completed ? 0 : offset}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-center leading-none uppercase tracking-wider font-mono"
                style={{ color: task.completed ? '#6B7280' : urg.color }}
              >
                {task.completed ? <Check className="w-3.5 h-3.5 text-slate-400 stroke-[3]" /> : urg.label.replace(' left', '')}
              </span>
            </div>
          </div>

          {/* Checklist Step List Block */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="pl-1.5 ml-2 py-1.5 flex flex-col gap-2 bg-slate-950/30 border border-slate-850/60 p-2.5 rounded-xl">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Checklist ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
                <span className="text-emerald-400 font-mono">{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {task.subtasks.map(s => (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSubtask(task.id, s.id, e);
                    }}
                    className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-emerald-400 transition-colors py-0.5 cursor-pointer"
                  >
                    {s.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 flex-shrink-0" />
                    )}
                    <span className={`truncate ${s.completed ? 'line-through text-slate-500 font-medium' : 'font-medium'}`}>
                      {s.title} <span className="text-slate-500 font-mono text-[9px]">({s.duration || 15}m)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata information line */}
          <div className="flex items-center justify-between gap-2 pl-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: catTheme.bg, color: catTheme.text }}
              >
                <span>{catTheme.emoji}</span>
                <span>{catTheme.label}</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                task.priority === 'high'
                  ? 'bg-rose-500/15 text-rose-400'
                  : task.priority === 'medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime}
            </span>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-850 pl-1.5 mt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTask(task.id, e);
              }}
              className="text-xs text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg cursor-pointer font-semibold"
            >
              {task.completed ? <RotateCcw className="w-3 h-3" /> : <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
              {task.completed ? 'Re-open' : 'Done'}
            </button>

            <div className="flex items-center gap-1.5">
              {!task.completed && (!task.subtasks || task.subtasks.length === 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBreakdownTask(task, e);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all duration-150 font-bold"
                  title="Use TaskPulse's local cognitive engine to break this task down into bite-sized actionable checklists"
                >
                  <Bot className="w-3 h-3" /> Breakdown
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id, e);
                }}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
