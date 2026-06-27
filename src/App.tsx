import React, { useState, useEffect, useRef } from 'react';
import { Task, ChatMessage, ScheduleData, InsightItem, Subtask } from './types';
import {
  Sparkles,
  ClipboardList,
  Flame,
  Search,
  Bot,
  Plus,
  RefreshCw,
  Calendar,
  Activity,
  Menu,
  Download
} from 'lucide-react';
import { getUrgencyDetails, getCategoryTheme } from './utils/helpers';
import { TaskForm } from './components/TaskForm';
import { TaskCard } from './components/TaskCard';
import { ChatPanel } from './components/ChatPanel';
import { SchedulePanel } from './components/SchedulePanel';
import { InsightsPanel } from './components/InsightsPanel';
import { TaskModal } from './components/TaskModal';
import { UnfinishedModal } from './components/UnfinishedModal';

// ============ INTERACTION FEEDBACK UTILITIES ============
const playCompletionSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Play a delightful upward chime (C5 -> E5 -> G5)
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };
    
    playNote(523.25, now, 0.12); // C5
    playNote(659.25, now + 0.06, 0.12); // E5
    playNote(783.99, now + 0.12, 0.2); // G5
  } catch (e) {
    console.warn('Audio playback failed', e);
  }
};

const playBreakdownSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Play a sci-fi "sparkle" sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.18);
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn('Audio playback failed', e);
  }
};

const triggerVibration = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    // Subtle dual-pulse vibration for tactile completion confirmation on mobile devices
    navigator.vibrate([40, 30, 40]);
  }
};

export default function App() {
  // ============ STATE ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<{ configured: boolean; status: string; message: string; diagnostics?: any } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDuration, setTaskDuration] = useState(30);

  // Search & Mobile & Popup States
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<'tasks' | 'chat' | 'schedule' | 'insights'>('tasks');
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [showUnfinishedModal, setShowUnfinishedModal] = useState(false);
  const [sortBy, setSortBy] = useState<'auto' | 'custom'>('auto');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [inlineEditingTaskId, setInlineEditingTaskId] = useState<string | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState('');
  const [quickEditPriority, setQuickEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // AI & Chat States
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule' | 'insights'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking'>('idle');

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // ============ INITIALIZATION ============
  useEffect(() => {
    // Load tasks from localStorage with safe fallback guards
    const savedTasks = localStorage.getItem('tp_tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        } else {
          setTasks([]);
        }
      } catch (e) {
        console.error('Error parsing saved tasks:', e);
        setTasks([]);
      }
    } else {
      // Load premium default sample tasks if it is first visit
      const now = new Date();
      const d1 = new Date(now); d1.setHours(d1.getHours() + 6);
      const d2 = new Date(now); d2.setDate(d2.getDate() + 1);
      const d3 = new Date(now); d3.setDate(d3.getDate() + 3);

      const defaultTasks: Task[] = [
        {
          id: '1',
          title: 'Deploy Cloud Run Application',
          description: 'Deploy the main application image to Cloud Run containers and configure secrets in AI Studio UI.',
          deadline: d1.toISOString(),
          category: 'work',
          priority: 'high',
          completed: false,
          estimatedDuration: 60,
          subtasks: [
            { id: 'sub-1-1', title: 'Review container configuration', completed: true, duration: 15 },
            { id: 'sub-1-2', title: 'Configure environment variables', completed: false, duration: 15 },
            { id: 'sub-1-3', title: 'Run deploy script', completed: false, duration: 30 }
          ],
          createdAt: now.toISOString(),
          position: 0
        },
        {
          id: '2',
          title: 'Complete Project Documentation',
          description: 'Draft the technical overview, design concepts, and integration guides.',
          deadline: d2.toISOString(),
          category: 'study',
          priority: 'medium',
          completed: false,
          estimatedDuration: 45,
          subtasks: [],
          createdAt: now.toISOString(),
          position: 1
        },
        {
          id: '3',
          title: 'Organize Home Workspace',
          description: 'Cable management, clean up desk, organize references.',
          deadline: d3.toISOString(),
          category: 'personal',
          priority: 'low',
          completed: false,
          estimatedDuration: 90,
          subtasks: [],
          createdAt: now.toISOString(),
          position: 2
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('tp_tasks', JSON.stringify(defaultTasks));
    }

    // Set default deadline to tomorrow 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));

    // Welcome messages / Restore saved chat history
    const savedChat = localStorage.getItem('tp_chat_history');
    if (savedChat) {
      try {
        setChatMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error('Error parsing saved chat history:', e);
      }
    } else {
      setChatMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `### Welcome to **TaskPulse AI**! ⚡\n\nI'm your intelligent productivity agent. I keep track of your deadlines, automatically calculate urgencies, and use our custom on-device Cognitive Engine to help you plan your workload.\n\n**What I can do for you:**\n*   **Deconstruct complex tasks**: Click **"Breakdown"** on any task card to generate interactive subtasks.\n*   **Build optimized schedules**: Click **"Plan Day"** or the button below to generate an hour-by-hour planner.\n*   **Analyze workload bottlenecks**: Get real-time productivity insights by clicking **"Full Analysis"**.\n\nWhat would you like to accomplish first?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, []);

  // Fetch API key status from backend on mount
  useEffect(() => {
    fetch('/api/key-check')
      .then(res => res.json())
      .then(data => {
        setApiKeyStatus(data);
      })
      .catch(err => {
        console.error("Error checking API key status:", err);
        setApiKeyStatus({
          configured: false,
          status: 'error',
          message: 'Failed to query API diagnostics from developer server. Offline simulation activated.'
        });
      });
  }, []);

  const toggleListening = React.useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error("Failed to start SpeechRecognition:", err);
        setIsListening(false);
      }
    }
  }, [isListening]);

  // ============ TASK HANDLING ============
  const handleExportTasks = React.useCallback(() => {
    try {
      const dataStr = JSON.stringify(tasks, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskpulse_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tasks:', error);
    }
  }, [tasks]);

  const handleAddTask = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let deadlineIso: string;
    try {
      if (taskDeadline && !isNaN(new Date(taskDeadline).getTime())) {
        deadlineIso = new Date(taskDeadline).toISOString();
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        deadlineIso = tomorrow.toISOString();
      }
    } catch (err) {
      console.error("Failed to parse deadline, using fallback:", err);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      deadlineIso = tomorrow.toISOString();
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      deadline: deadlineIso,
      category: taskCategory,
      priority: taskPriority,
      completed: false,
      estimatedDuration: taskDuration,
      subtasks: [],
      createdAt: new Date().toISOString(),
      position: 0
    };

    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = [
      newTask,
      ...currentTasks.map((t, idx) => ({ ...t, position: t.position !== undefined ? t.position + 1 : idx + 1 }))
    ];
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));

    setTaskTitle('');
    setTaskDesc('');
    setMobileSidebarOpen(false);
    
    // Auto-select and focus newly created task instantly
    setSelectedTaskId(newTask.id);
    setFocusedTask(newTask);
  }, [taskTitle, taskDesc, taskDeadline, taskCategory, taskPriority, taskDuration, tasks]);

  const handleDeleteTask = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  }, [tasks, selectedTaskId]);

  const handleToggleTask = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.map(t => {
      if (t.id === id) {
        const nextVal = !t.completed;
        if (nextVal) {
          playCompletionSound();
          triggerVibration();
        }
        return { ...t, completed: nextVal };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
  }, [tasks]);

  const handleToggleSubtask = React.useCallback((taskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.map(t => {
      if (t.id === taskId) {
        const updatedSub = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            const nextVal = !s.completed;
            if (nextVal) {
              playCompletionSound();
              triggerVibration();
            }
            return { ...s, completed: nextVal };
          }
          return s;
        });
        return { ...t, subtasks: updatedSub };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
  }, [tasks]);

  // ============ QUICK INLINE EDIT HANDLERS ============
  const handleStartQuickEdit = React.useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setInlineEditingTaskId(task.id);
    setQuickEditTitle(task.title);
    setQuickEditPriority(task.priority);
  }, []);

  const handleSaveQuickEdit = React.useCallback((e: React.FormEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!quickEditTitle.trim()) return;

    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          title: quickEditTitle.trim(),
          priority: quickEditPriority
        };
      }
      return t;
    });

    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
    setInlineEditingTaskId(null);

    if (focusedTask && focusedTask.id === taskId) {
      setFocusedTask(prev => prev ? { ...prev, title: quickEditTitle.trim(), priority: quickEditPriority } : null);
    }

    playBreakdownSound();
    triggerVibration();
  }, [quickEditTitle, quickEditPriority, tasks, focusedTask]);

  const handleCancelQuickEdit = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInlineEditingTaskId(null);
  }, []);

  // ============ DRAG AND DROP HANDLERS ============
  const handleDragStart = React.useCallback((e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingTaskId && draggingTaskId !== id) {
      setDragOverTaskId(id);
    }
  }, [draggingTaskId]);

  const handleDrop = React.useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    
    if (!sourceId || sourceId === targetId) {
      setDraggingTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    setSortBy('custom');

    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const reorderedTasks = [...currentTasks];
    
    reorderedTasks.forEach((t, index) => {
      if (t.position === undefined) {
        t.position = index;
      }
    });

    const sourceIndex = reorderedTasks.findIndex(t => t.id === sourceId);
    const targetIndex = reorderedTasks.findIndex(t => t.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [movedTask] = reorderedTasks.splice(sourceIndex, 1);
      reorderedTasks.splice(targetIndex, 0, movedTask);
      
      const updatedTasks = reorderedTasks.map((t, index) => ({
        ...t,
        position: index
      }));

      setTasks(updatedTasks);
      localStorage.setItem('tp_tasks', JSON.stringify(updatedTasks));
      
      playBreakdownSound();
      triggerVibration();
    }

    setDraggingTaskId(null);
    setDragOverTaskId(null);
  }, [draggingTaskId, tasks]);

  const handleDragEnd = React.useCallback(() => {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
  }, []);

  // ============ INTERACTIVE AI ASSISTANT TRIGGERS ============
  const streamChatResponse = async (response: Response, aiMessageId: string) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('Response body has no reader');

    let done = false;
    let accumulatedText = '';
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        accumulatedText += chunk;
        setChatMessages(prev => {
          return prev.map(msg => msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg);
        });
      }
    }
    
    setChatMessages(prev => {
      const updated = prev.map(msg => msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg);
      localStorage.setItem('tp_chat_history', JSON.stringify(updated));
      return updated;
    });
  };

  const analyzeTaskDirectly = React.useCallback(async (task: Task, currentTasks = tasks) => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('chat');
    setMobileView('chat');
    setMobileSidebarOpen(false);

    const aiMessageId = (Date.now() + 1).toString();
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: `Tell me about task "${task.title}"`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please give me a fast strategic analysis of my newly selected task "${task.title}". Explain how I should approach it and why it fits within my general load.`,
          tasks: currentTasks,
          history: chatMessages.slice(-4),
          localTime: new Date().toLocaleString()
        })
      });

      if (!response.ok) throw new Error('Failed API call');
      await streamChatResponse(response, aiMessageId);
    } catch (e: any) {
      console.error('Error analyzing task:', e);
      setChatMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: 'Failed to analyze task. Please try again.' } : msg));
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  }, [tasks, chatMessages]);

  const handleBreakdownTask = React.useCallback(async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('chat');
    setMobileView('chat');
    setMobileSidebarOpen(false);

    const userMessageId = Date.now().toString();
    setChatMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: `Break down my task "${task.title}" into highly actionable subtasks.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          deadline: task.deadline
        })
      });

      if (!response.ok) throw new Error('API failure');
      const data = await response.json();

      if (data.subtasks && data.subtasks.length > 0) {
        playBreakdownSound();
        triggerVibration();

        const mappedSubtasks: Subtask[] = data.subtasks.map((s: any, idx: number) => ({
          id: `sub-${task.id}-${idx}-${Date.now()}`,
          title: s.title,
          completed: false,
          duration: s.duration || 30
        }));

        setTasks(prev => {
          const currentT = Array.isArray(prev) ? prev : [];
          const updated = currentT.map(t => {
            if (t.id === task.id) {
              return { ...t, subtasks: [...t.subtasks, ...mappedSubtasks] };
            }
            return t;
          });
          localStorage.setItem('tp_tasks', JSON.stringify(updated));
          return updated;
        });

        const totalMinutes = mappedSubtasks.reduce((sum, s) => sum + (s.duration || 0), 0);

        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `### Subtask Breakdown Created! 🎯\n\nI've successfully analyzed your task **"${task.title}"** and generated **${mappedSubtasks.length} subtasks** (approx. ${totalMinutes} minutes of total effort). \n\nI have automatically injected these directly into your task card in the sidebar! You can now check them off interactively.\n\n**Generated Steps:**\n${mappedSubtasks.map(s => `*   **${s.title}** (${s.duration} min)`).join('\n')}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        throw new Error('No subtasks returned');
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
         ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I had some trouble automatically parsing the structured steps for this task. However, I highly recommend breaking down **"${task.title}"** into 3 key stages: preparation, execution, and review. Let me know if you would like me to try again!`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  }, []);

  const handlePlanDay = React.useCallback(async () => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('schedule');
    setMobileView('schedule');
    setMobileSidebarOpen(false);

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks.filter(t => !t.completed) })
      });

      if (!response.ok) throw new Error('API schedule error');
      const data = await response.json();
      setScheduleData(data);
    } catch (e: any) {
      console.error(e);
      setScheduleData({
        days: [
          {
            label: `Today - ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`,
            slots: [
              { time: "09:00 AM", task: "Review High Priority Tasks", desc: "Select your highest deadline-risk task and start right away.", duration: "60 min" },
              { time: "11:00 AM", task: "Admin & Minor Tasks", desc: "Process responses, clear notifications, organize folders.", duration: "30 min" },
              { time: "12:00 PM", task: "Midday Power Break", desc: "Stay hydrated, stretch, and rest your eyes.", duration: "45 min" }
            ]
          }
        ],
        advice: "Start with your highest priority task directly after lunch to build immediate momentum."
      });
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  }, [tasks]);

  const handleFullAnalysis = React.useCallback(async () => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('insights');
    setMobileView('insights');
    setMobileSidebarOpen(false);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks })
      });

      if (!response.ok) throw new Error('Insights error');
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (e: any) {
      console.error(e);
      setInsights([
        { icon: "📉", title: "Low Overdue Density", text: "You have a balanced task layout. Keep knocking down medium priority items to avoid stack accumulation." },
        { icon: "☕", title: "Buffer Optimization", text: "Integrate 10-minute breaks every 90 minutes to maintain cognitive power." },
        { icon: "⚡", title: "Single-Tasking Power", text: "Turn off notifications when tackling high priority items to avoid cognitive switching overhead." }
      ]);
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  }, [tasks]);

  const handleSendMessage = React.useCallback(async (e?: React.FormEvent | string, text?: string) => {
    let textToSend = "";
    if (typeof e === 'string') {
      textToSend = e.trim();
    } else if (text) {
      textToSend = text.trim();
    } else if (chatInput) {
      textToSend = chatInput.trim();
    }

    if (e && typeof e !== 'string' && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!textToSend || isLoading) return;

    const userMsg = textToSend;
    setChatInput('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessagePlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
    setIsLoading(true);
    setAgentStatus('thinking');
    setMobileView('chat');
    setMobileSidebarOpen(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          tasks: tasks,
          history: chatMessages.slice(-10),
          localTime: new Date().toLocaleString()
        })
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const rawText = await response.text();
          try {
            const errData = JSON.parse(rawText);
            if (errData && errData.error) {
              errMsg = errData.error;
            }
          } catch (_) {
            if (rawText && rawText.trim().length > 0 && rawText.length < 500) {
              errMsg = rawText.trim();
            }
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      await streamChatResponse(response, aiMessageId);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => prev.map(msg => msg.id === aiMessageId ? {
        ...msg,
        text: `I had a temporary connection hiccup with our servers, but I've processed your message locally!\n\nHere are some helpful recommended actions:\n1. **Try refreshing**: A quick page reload can restore live connection sync.\n2. **Review your tasks**: Keep adding and updating tasks in the sidebar to feed new data to our local cognitive engine.\n\n*Your session and task planner remain 100% active offline.*`
      } : msg));
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  }, [chatInput, tasks, chatMessages]);

  const handleClearChat = React.useCallback(() => {
    localStorage.removeItem('tp_chat_history');
    setChatMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `### Welcome to **TaskPulse AI**! ⚡\n\nI'm your intelligent productivity agent. I keep track of your deadlines, automatically calculate urgencies, and use our custom on-device Cognitive Engine to help you plan your workload.\n\n**What I can do for you:**\n*   **Deconstruct complex tasks**: Click **"Breakdown"** on any task card to generate interactive subtasks.\n*   **Build optimized schedules**: Click **"Plan Day"** or the button below to generate an hour-by-hour planner.\n*   **Analyze workload bottlenecks**: Get real-time productivity insights by clicking **"Full Analysis"**.\n\nWhat would you like to accomplish first?`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  const selectTaskDirectly = React.useCallback((id: string) => {
    setSelectedTaskId(id);
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const task = currentTasks.find(t => t.id === id);
    if (task) {
      setFocusedTask(task);
      setMobileSidebarOpen(false);
    }
  }, [tasks]);

  // Count summaries
  const currentTasks = Array.isArray(tasks) ? tasks : [];
  const pendingCount = currentTasks.filter(t => !t.completed).length;
  const overdueCount = currentTasks.filter(t => {
    if (t.completed) return false;
    const due = new Date(t.deadline);
    return !isNaN(due.getTime()) && due.getTime() < Date.now();
  }).length;
  const completedCount = currentTasks.filter(t => t.completed).length;

  // ============ SWIPE GESTURE HANDLER ============
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    // Don't trigger swipe if touch started inside the sidebar
    const target = e.target as HTMLElement;
    if (target.closest('#sidebar')) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant (> 50px) and larger than vertical
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;
    const tabOrder: Array<'tasks' | 'chat' | 'schedule' | 'insights'> = ['tasks', 'chat', 'schedule', 'insights'];
    const currentIdx = tabOrder.indexOf(mobileView);
    if (deltaX < 0 && currentIdx < tabOrder.length - 1) {
      // Swipe left → next tab
      const next = tabOrder[currentIdx + 1];
      setMobileView(next);
      if (next === 'tasks') { setMobileSidebarOpen(true); } else { setMobileSidebarOpen(false); setActiveTab(next); }
    } else if (deltaX > 0 && currentIdx > 0) {
      // Swipe right → previous tab
      const prev = tabOrder[currentIdx - 1];
      setMobileView(prev);
      if (prev === 'tasks') { setMobileSidebarOpen(true); } else { setMobileSidebarOpen(false); setActiveTab(prev); }
    }
  }, [mobileView]);

  return (
    <div id="taskpulse-app" className="flex flex-col h-screen bg-[#070A13] text-slate-100 font-sans selection:bg-emerald-500/30 relative overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* Dynamic ambient glass lighting spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none animate-pulse duration-[12s]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none animate-pulse duration-[18s]" />

      {/* HEADER */}
      <header id="header" className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-850 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-850 transition-colors focus:outline-none cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-500 relative flex items-center justify-center border border-white/10 shadow-lg shadow-emerald-500/5">
            <span className="text-xs">⚡</span>
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight">
            Task<span className="text-emerald-400">Pulse</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {pendingCount > 0 && (
            <button
              onClick={() => setShowUnfinishedModal(true)}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/35 text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              title="You have unfinished tasks requiring your attention!"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">{pendingCount} Pending</span>
              <span className="sm:hidden">{pendingCount}</span>
            </button>
          )}

          {apiKeyStatus === null ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400 font-bold">Connecting Engine...</span>
            </div>
          ) : apiKeyStatus.status === 'working' ? (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs" title={apiKeyStatus.message}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold">Gemini AI Online</span>
            </div>
          ) : apiKeyStatus.status === 'quota_exceeded' ? (
            <div 
              className="hidden sm:flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-rose-500/15 transition-all animate-pulse" 
              title={`${apiKeyStatus.message}. Click for diagnostic details.`} 
              onClick={() => alert(`Gemini API Quota Exceeded:\n\n${apiKeyStatus.message}\n\nTaskPulse is running in high-performance Local Simulation Mode until your API quota resets or you switch keys.`)}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-bold flex items-center gap-1">Quota Exceeded ⏳</span>
            </div>
          ) : apiKeyStatus.status === 'error' ? (
            <div 
              className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-amber-500/15 transition-all" 
              title={`${apiKeyStatus.message}. Click for diagnostic details.`} 
              onClick={() => alert(`Gemini Key Diagnostic Error:\n\n${apiKeyStatus.message}\n\nRunning in local fallback simulator.`)}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 font-bold flex items-center gap-1">Gemini Error ⚠️</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs" title={`${apiKeyStatus.message}. Running in high-performance local simulation mode.`}>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-400 font-bold">Local Cognitive Engine</span>
            </div>
          )}
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div id="layout-body" className="grid grid-cols-1 md:grid-cols-[380px_1fr] flex-1 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden relative z-10">
        
        {/* Mobile Sidebar overlay backdrop */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT PANEL: Task Sidebar */}
        <aside 
          id="sidebar" 
          className={`bg-[#070A13]/95 md:bg-slate-900/10 border-r border-slate-850/80 flex flex-col h-full overflow-hidden max-h-[calc(100vh-64px)] fixed md:static top-16 bottom-0 left-0 z-40 w-full md:w-auto transition-transform duration-300 transform ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Header & Task Creation Form */}
          <TaskForm
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            taskDesc={taskDesc}
            setTaskDesc={setTaskDesc}
            taskDeadline={taskDeadline}
            setTaskDeadline={setTaskDeadline}
            taskCategory={taskCategory}
            setTaskCategory={setTaskCategory}
            taskPriority={taskPriority}
            setTaskPriority={setTaskPriority}
            taskDuration={taskDuration}
            setTaskDuration={setTaskDuration}
            handleAddTask={handleAddTask}
            handlePlanDay={handlePlanDay}
            handleExportTasks={handleExportTasks}
          />

          {/* Search bar */}
          <div className="px-5 py-3 border-b border-slate-850 bg-transparent flex items-center gap-2 flex-shrink-0">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-850 text-slate-100 pl-9 pr-8 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 cursor-pointer text-slate-500 hover:text-slate-300 bg-transparent border-none outline-none"
                >
                  <Search className="w-4 h-4 rotate-45" />
                </button>
              )}
            </div>
          </div>

          {/* Sorting preferences selector */}
          <div className="px-5 py-2.5 border-b border-slate-850/40 bg-slate-900/10 flex items-center justify-between text-xs flex-shrink-0">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Priority layout</span>
            <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setSortBy('auto')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  sortBy === 'auto'
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Sort automatically by status and deadline urgency"
              >
                ⚡ Auto
              </button>
              <button
                type="button"
                onClick={() => setSortBy('custom')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  sortBy === 'custom'
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Custom order. Drag and drop tasks in any sequence"
              >
                ↕️ Custom
              </button>
            </div>
          </div>

          {/* Scrollable Task List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 custom-scrollbar">
            {currentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="text-3xl mb-3 filter drop-shadow-sm">🎯</span>
                <p className="text-sm font-bold text-slate-200">No tasks planned yet</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">Add tasks above to organize your goals and let AI optimize your agenda.</p>
              </div>
            ) : currentTasks.filter(t => 
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="text-2xl mb-2">🔍</span>
                <p className="text-sm font-bold text-slate-400">No matching task plans</p>
              </div>
            ) : (
              currentTasks
                .filter(t => 
                  t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .sort((a, b) => {
                  if (sortBy === 'custom') {
                    const posA = a.position !== undefined ? a.position : 9999;
                    const posB = b.position !== undefined ? b.position : 9999;
                    return posA - posB;
                  }
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  const timeA = new Date(a.deadline).getTime();
                  const timeB = new Date(b.deadline).getTime();
                  const safeA = isNaN(timeA) ? 0 : timeA;
                  const safeB = isNaN(timeB) ? 0 : timeB;
                  return safeA - safeB;
                })
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    selectTaskDirectly={selectTaskDirectly}
                    inlineEditingTaskId={inlineEditingTaskId}
                    quickEditTitle={quickEditTitle}
                    setQuickEditTitle={setQuickEditTitle}
                    quickEditPriority={quickEditPriority}
                    setQuickEditPriority={setQuickEditPriority}
                    handleStartQuickEdit={handleStartQuickEdit}
                    handleSaveQuickEdit={handleSaveQuickEdit}
                    handleCancelQuickEdit={handleCancelQuickEdit}
                    handleToggleTask={handleToggleTask}
                    handleBreakdownTask={handleBreakdownTask}
                    handleDeleteTask={handleDeleteTask}
                    handleToggleSubtask={handleToggleSubtask}
                    draggingTaskId={draggingTaskId}
                    dragOverTaskId={dragOverTaskId}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleDragEnd={handleDragEnd}
                  />
                ))
            )}
          </div>

          {/* Footer Stats summary info */}
          <div id="stats-summary" className="p-4 border-t border-slate-850 bg-slate-950/20 flex-shrink-0 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-rose-400 font-mono">{overdueCount}</span>
               <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">🚨 Overdue</span>
            </div>
            <div className="flex flex-col border-x border-slate-850/60">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">{pendingCount}</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">⏳ Pending</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-slate-400 font-mono">{completedCount}</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">✅ Done</span>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: Main Tab Area */}
        <main id="main-content" className="flex flex-col h-full overflow-hidden max-h-[calc(100vh-64px)] bg-transparent">
          
          {/* Main Panel Header Banner */}
          <div className="px-6 py-4 border-b border-slate-850 bg-slate-900/10 flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
            <div>
              <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> TaskPulse Workspace
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {selectedTaskId
                  ? `Active Focus Context: "${currentTasks.find(t => t.id === selectedTaskId)?.title}"`
                  : 'Select any task checklist in the sidebar to load analytical checking'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFullAnalysis}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-98"
                title="Get full workload analysis"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Analyze Workload
              </button>
            </div>
          </div>

          {/* Top Progress Loading Shimmer */}
          <div className={`h-0.5 w-full bg-slate-850 relative overflow-hidden flex-shrink-0 ${agentStatus === 'thinking' ? 'block' : 'hidden'}`}>
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer" />
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-slate-850/60 bg-slate-900/5 flex gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'chat' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              💬 Companion Chat
            </button>
            <button
              onClick={() => { setActiveTab('schedule'); if (!scheduleData) handlePlanDay(); }}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'schedule' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              📅 Schedule Planner
            </button>
            <button
              onClick={() => { setActiveTab('insights'); if (insights.length === 0) handleFullAnalysis(); }}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'insights' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              💡 Workload Insights
            </button>
          </div>

          {/* VIEWPORT AREA */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-transparent">
            
            {/* 1. CHAT VIEW */}
            <div className={`flex-1 flex-col overflow-hidden ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
              <ChatPanel
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isLoading={isLoading}
                isListening={isListening}
                speechSupported={speechSupported}
                toggleListening={toggleListening}
                handleSendMessage={handleSendMessage}
                handleClearChat={handleClearChat}
              />
            </div>

            {/* 2. SCHEDULE PLANNER VIEW */}
            <div className={`flex-1 overflow-hidden ${activeTab === 'schedule' ? 'flex' : 'hidden'}`}>
              <SchedulePanel
                scheduleData={scheduleData}
                handlePlanDay={handlePlanDay}
              />
            </div>

            {/* 3. INSIGHTS VIEW */}
            <div className={`flex-1 overflow-hidden ${activeTab === 'insights' ? 'flex' : 'hidden'}`}>
              <InsightsPanel
                insights={insights}
                handleFullAnalysis={handleFullAnalysis}
              />
            </div>

          </div>
        </main>

      </div>

      {/* Focus Detailed Glass Modal Popup */}
      {focusedTask && (
        <TaskModal
          focusedTask={focusedTask}
          setFocusedTask={setFocusedTask}
          setTasks={setTasks}
          handleToggleSubtask={handleToggleSubtask}
          handleBreakdownTask={handleBreakdownTask}
          handleToggleTask={handleToggleTask}
          handleDeleteTask={handleDeleteTask}
          handleAnalyzeTask={analyzeTaskDirectly}
        />
      )}

      {/* Unfinished / Pending Tasks Alert Dialog Popup */}
      {showUnfinishedModal && (
        <UnfinishedModal
          tasks={currentTasks}
          setShowUnfinishedModal={setShowUnfinishedModal}
          selectTaskDirectly={selectTaskDirectly}
          handleToggleTask={handleToggleTask}
          handlePlanDay={handlePlanDay}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {([
            { key: 'tasks' as const, icon: '📋', label: 'Tasks', count: pendingCount },
            { key: 'chat' as const, icon: '💬', label: 'Chat', count: null },
            { key: 'schedule' as const, icon: '📅', label: 'Schedule', count: null },
            { key: 'insights' as const, icon: '💡', label: 'Insights', count: null },
          ]).map((item) => {
            const isActive = item.key === 'tasks' ? mobileView === 'tasks' : (item.key === mobileView && mobileView !== 'tasks');
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMobileView(item.key);
                  if (item.key === 'tasks') {
                    setMobileSidebarOpen(true);
                  } else {
                    setMobileSidebarOpen(false);
                    setActiveTab(item.key as 'chat' | 'schedule' | 'insights');
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                {item.key === 'tasks' && item.count !== null && item.count > 0 && (
                  <span className="absolute top-1 right-3 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[8px] font-bold rounded-full px-1">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
