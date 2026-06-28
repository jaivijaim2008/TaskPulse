import React from 'react';
import { Plus, Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskFormProps {
  taskTitle: string;
  setTaskTitle: (val: string) => void;
  taskDesc: string;
  setTaskDesc: (val: string) => void;
  taskDeadline: string;
  setTaskDeadline: (val: string) => void;
  taskCategory: string;
  setTaskCategory: (val: string) => void;
  taskPriority: 'low' | 'medium' | 'high';
  setTaskPriority: (val: 'low' | 'medium' | 'high') => void;
  taskDuration: number;
  setTaskDuration: (val: number) => void;
  taskRecurring: 'none' | 'daily' | 'weekly';
  setTaskRecurring: (val: 'none' | 'daily' | 'weekly') => void;
  handleAddTask: (e: React.FormEvent) => void;
  handlePlanDay: () => void;
  handleExportTasks: () => void;
}

export const TaskForm = React.memo<TaskFormProps>(({
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskDeadline,
  setTaskDeadline,
  taskCategory,
  setTaskCategory,
  taskPriority,
  setTaskPriority,
  taskDuration,
  setTaskDuration,
  taskRecurring,
  setTaskRecurring,
  handleAddTask,
  handlePlanDay,
  handleExportTasks
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="p-4 border-b border-slate-800/60 bg-slate-950/25 transition-all duration-300">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
          title={isExpanded ? "Collapse Task Form" : "Expand Task Form"}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
          <span>Create Task Plan</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
        <button
          type="button"
          onClick={handleExportTasks}
          className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
          title="Backup your tasks to a JSON file"
        >
          <Download className="w-2.5 h-2.5" />
          Backup
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleAddTask} className="flex flex-col gap-2.5 mt-3 animate-fadeIn">
          <div className="relative">
            <input
              type="text"
              placeholder="What needs to get done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              maxLength={100}
              required
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl text-xs outline-none placeholder:text-slate-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>

          <textarea
            placeholder="Brief description (optional)..."
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            maxLength={300}
            className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl text-xs outline-none placeholder:text-slate-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none h-14"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Deadline</label>
              <input
                type="datetime-local"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Category</label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer h-[42px]"
              >
                <option value="work">💼 Work / Projects</option>
                <option value="study">📚 Study / Research</option>
                <option value="personal">🏠 Personal / Life</option>
                <option value="health">💪 Health / Sport</option>
                <option value="finance">💰 Finance / Bills</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer h-[42px]"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Est. Duration</label>
              <select
                value={taskDuration}
                onChange={(e) => setTaskDuration(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer h-[42px]"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
                <option value={120}>120 mins</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Recurring / Habit</label>
              <select
                value={taskRecurring}
                onChange={(e) => setTaskRecurring(e.target.value as any)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer font-medium h-[42px]"
              >
                <option value="none">🔁 One-time</option>
                <option value="daily">🔥 Daily Habit</option>
                <option value="weekly">📅 Weekly Habit</option>
              </select>
            </div>
            <div className="flex flex-col justify-center pb-1 pl-1 text-[10px] font-semibold uppercase tracking-wider min-h-[40px]">
              {taskRecurring === 'daily' && <span className="text-amber-400 flex items-center gap-1 select-none animate-pulse">🔥 Streak Active</span>}
              {taskRecurring === 'weekly' && <span className="text-indigo-400 flex items-center gap-1 select-none animate-pulse">📅 Weekly Goal</span>}
              {taskRecurring === 'none' && <span className="text-slate-500 select-none">Standard task</span>}
            </div>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Task
            </button>
            <button
              type="button"
              onClick={handlePlanDay}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-800"
              title="Optimize today's plan with AI sequencing"
            >
              <Calendar className="w-3.5 h-3.5" /> Plan Day
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

TaskForm.displayName = 'TaskForm';
