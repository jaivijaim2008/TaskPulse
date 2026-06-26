/**
 * Types for the TaskPulse application
 */

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  duration?: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO timestamp string (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  subtasks: Subtask[];
  estimatedDuration: number; // in minutes
  aiPriorityScore?: number; // 0 to 100
  aiUrgencyReason?: string; // AI explanation for priority
  createdAt: string;
  position?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ScheduleSlot {
  time: string; // e.g. "09:00 AM" or "14:00"
  task: string;
  desc: string;
  duration: string; // e.g. "45 min"
}

export interface ScheduleDay {
  label: string; // e.g. "Today - Monday, Jun 24"
  slots: ScheduleSlot[];
}

export interface ScheduleData {
  days: ScheduleDay[];
  advice?: string;
}

export interface InsightItem {
  icon: string;
  title: string;
  text: string;
}

export interface InsightData {
  insights: InsightItem[];
}
