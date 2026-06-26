import React from 'react';
import { Plus, Calendar, Download } from 'lucide-react';

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
  handleAddTask,
  handlePlanDay,
  handleExportTasks
}) => {
  return (
    <div className="p-5 border-b border-slate-800/60 bg-slate-950/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
          Create Task Plan
        </h2>
        <button
          type="button"
          onClick={handleExportTasks}
          className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          title="Backup your tasks to a JSON file"
        >
          <Download className="w-3 h-3" />
          Backup JSON
        </button>
      </div>

      <form onSubmit={handleAddTask} className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="What needs to get done?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            maxLength={100}
            required
            className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>

        <textarea
          placeholder="Brief description (optional)..."
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
          maxLength={300}
          className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 px-4 py-2 rounded-xl text-xs outline-none placeholder:text-slate-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none h-14"
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Deadline</label>
            <input
              type="datetime-local"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Category</label>
            <select
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="work">💼 Work / Projects</option>
              <option value="study">📚 Study / Research</option>
              <option value="personal">🏠 Personal / Life</option>
              <option value="health">💪 Health / Sport</option>
              <option value="finance">💰 Finance / Bills</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-0.5">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as any)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
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
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 p-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
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

        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" /> Add Task
          </button>
          <button
            type="button"
            onClick={handlePlanDay}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-xs py-2.5 px-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 font-bold cursor-pointer active:scale-98"
            title="Generate a smart chronological daily schedule with AI"
          >
            <Calendar className="w-4 h-4 text-emerald-400" /> Plan Day
          </button>
        </div>
      </form>
    </div>
  );
});

TaskForm.displayName = 'TaskForm';
