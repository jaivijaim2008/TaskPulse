import React, { useState, useEffect, useRef } from 'react';
import { Task, ChatMessage, ScheduleData, InsightItem, Subtask } from './types';
import {
  Bot,
  Sparkles,
  Calendar,
  ClipboardList,
  Trash2,
  CheckCircle2,
  Circle,
  Send,
  RefreshCw,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Home,
  Activity,
  DollarSign,
  Brain,
  Plus,
  Compass,
  Check,
  RotateCcw,
  Clock,
  Flame,
  FileText,
  Mic,
  MicOff,
  Search,
  X,
  Menu,
  Download
} from 'lucide-react';

export default function App() {
  // ============ STATE ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDuration, setTaskDuration] = useState(30);

  // Search & Mobile & Popup States
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);

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

  const toggleListening = () => {
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
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============ INITIALIZATION ============
  useEffect(() => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('tp_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Error parsing saved tasks:', e);
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
          createdAt: now.toISOString()
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
          createdAt: now.toISOString()
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
          createdAt: now.toISOString()
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

    // Welcome messages
    setChatMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `### Welcome to **TaskPulse AI**! ⚡

I'm your intelligent productivity agent. I keep track of your deadlines, automatically calculate urgencies, and use our custom on-device Cognitive Engine to help you plan your workload.

**What I can do for you:**
*   **Deconstruct complex tasks**: Click **"Break down"** on any task card to generate interactive subtasks.
*   **Build optimized schedules**: Click **"Plan Day"** or the button below to generate an hour-by-hour planner.
*   **Analyze workload bottlenecks**: Get real-time productivity insights by clicking **"Full Analysis"**.

What would you like to accomplish first?`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  // Save tasks on changes
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tp_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  // ============ TASK HANDLING ============
  const handleExportTasks = () => {
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
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      deadline: new Date(taskDeadline).toISOString(),
      category: taskCategory,
      priority: taskPriority,
      completed: false,
      estimatedDuration: taskDuration,
      subtasks: [],
      createdAt: new Date().toISOString()
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));

    setTaskTitle('');
    setTaskDesc('');
    setMobileSidebarOpen(false);
    
    // Auto-select and trigger dynamic AI assessment
    setSelectedTaskId(newTask.id);
    analyzeTaskDirectly(newTask, updated);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  };

  const handleToggleTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSub = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...t, subtasks: updatedSub };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem('tp_tasks', JSON.stringify(updated));
  };

  // ============ DYNAMIC URGENCY CALCULATION ============
  const getUrgencyDetails = (deadlineStr: string) => {
    const now = new Date();
    const due = new Date(deadlineStr);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        level: 'urgent' as const,
        label: 'OVERDUE',
        pct: 100,
        color: '#FF5F5F',
        emoji: '🚨'
      };
    }
    if (diffHours < 24) {
      return {
        level: 'urgent' as const,
        label: `${Math.round(diffHours)}h left`,
        pct: 95,
        color: '#FF5F5F',
        emoji: '🔴'
      };
    }
    if (diffHours < 72) {
      const days = Math.round(diffHours / 24);
      return {
        level: 'soon' as const,
        label: `${days}d left`,
        pct: 65,
        color: '#FFD166',
        emoji: '🟡'
      };
    }
    const days = Math.round(diffHours / 24);
    const pct = Math.max(15, 50 - days * 2);
    return {
      level: 'ok' as const,
      label: `${days}d left`,
      pct: pct,
      color: '#4FFFB0',
      emoji: '🟢'
    };
  };

  const renderUrgencyCircle = (pct: number, color: string, label: string, completed: boolean) => {
    const r = 18;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg className="w-full h-full -rotate-90">
          <circle className="fill-none stroke-[#1E3355] stroke-[3]" cx="22" cy="22" r={r} />
          <circle
            className="fill-none stroke-[3] stroke-linecap-round transition-all duration-1000"
            cx="22"
            cy="22"
            r={r}
            stroke={completed ? '#6B8CAE' : color}
            strokeDasharray={circ}
            strokeDashoffset={completed ? 0 : offset}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-center leading-none"
          style={{ color: completed ? '#6B8CAE' : color }}
        >
          {completed ? <Check className="w-4 h-4" /> : label}
        </span>
      </div>
    );
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'work': return { icon: <Briefcase className="w-3.5 h-3.5" />, emoji: '💼', label: 'Work', bg: 'rgba(123,97,255,0.15)', text: '#7B61FF' };
      case 'study': return { icon: <GraduationCap className="w-3.5 h-3.5" />, emoji: '📚', label: 'Study', bg: 'rgba(255,209,102,0.15)', text: '#FFD166' };
      case 'personal': return { icon: <Home className="w-3.5 h-3.5" />, emoji: '🏠', label: 'Personal', bg: 'rgba(79,255,176,0.15)', text: '#4FFFB0' };
      case 'health': return { icon: <Activity className="w-3.5 h-3.5" />, emoji: '💪', label: 'Health', bg: 'rgba(255,95,95,0.15)', text: '#FF5F5F' };
      case 'finance': return { icon: <DollarSign className="w-3.5 h-3.5" />, emoji: '💰', label: 'Finance', bg: 'rgba(236,72,153,0.15)', text: '#EC4899' };
      default: return { icon: <ClipboardList className="w-3.5 h-3.5" />, emoji: '📌', label: 'General', bg: 'rgba(107,140,174,0.15)', text: '#6B8CAE' };
    }
  };

  // ============ INTERACTIVE AI ASSISTANT TRIGGERS ============

  // Analyze a task as soon as it's selected or added
  const analyzeTaskDirectly = async (task: Task, currentTasks = tasks) => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('chat');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please give me a fast strategic analysis of my newly selected task "${task.title}". Explain how I should approach it and why it fits within my general load.`,
          tasks: currentTasks,
          history: chatMessages.slice(-4)
        })
      });

      if (!response.ok) throw new Error('Failed API call');
      const data = await response.json();

      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (e: any) {
      console.error('Error analyzing task:', e);
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  };

  // Breakdown a task into interactive subtasks
  const handleBreakdownTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('chat');

    // Add user request visually
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
        // Map response array to our Subtask schema
        const mappedSubtasks: Subtask[] = data.subtasks.map((s: any, idx: number) => ({
          id: `sub-${task.id}-${idx}-${Date.now()}`,
          title: s.title,
          completed: false,
          duration: s.duration || 30
        }));

        // Update the tasks state with these new interactive subtasks
        setTasks(prev => prev.map(t => {
          if (t.id === task.id) {
            return { ...t, subtasks: [...t.subtasks, ...mappedSubtasks] };
          }
          return t;
        }));

        const totalMinutes = mappedSubtasks.reduce((sum, s) => sum + (s.duration || 0), 0);

        setChatMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `### Subtask Breakdown Created! 🎯

I've successfully analyzed your task **"${task.title}"** and generated **${mappedSubtasks.length} subtasks** (approx. ${totalMinutes} minutes of total effort). 

I have automatically injected these directly into your task card in the sidebar! You can now check them off interactively.

**Generated Steps:**
${mappedSubtasks.map(s => `*   **${s.title}** (${s.duration} min)`).join('\n')}`,
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
  };

  // Generate Daily Schedule
  const handlePlanDay = async () => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('schedule');

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
      // Fallback
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
  };

  // Generate strategic insights
  const handleFullAnalysis = async () => {
    setIsLoading(true);
    setAgentStatus('thinking');
    setActiveTab('insights');

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks })
      });

      if (!response.ok) throw new Error('API insights error');
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (e: any) {
      console.error(e);
      setInsights([
        { icon: "💡", title: "Tackle bottlenecks first", text: "Identify the task with the tightest deadline and block out 45 minutes of absolute focus." },
        { icon: "⚡", title: "Single-Tasking Power", text: "Turn off notifications when tackling high priority items to avoid cognitive switching overhead." }
      ]);
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  };

  // Send conversational chat message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');

    // Render User Message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setAgentStatus('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          tasks: tasks,
          history: chatMessages.slice(-10) // Send recent context history
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
      const data = await response.json();

      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I had a temporary connection hiccup with our servers, but I've processed your message locally!

Here are some helpful recommended actions:
1. **Try refreshing**: A quick page reload can restore live connection sync.
2. **Review your tasks**: Keep adding and updating tasks in the sidebar to feed new data to our local cognitive engine.

*Your session and task planner remain 100% active offline.*`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setAgentStatus('idle');
    }
  };

  // Quick prompt buttons
  const triggerQuickAction = (text: string) => {
    setChatInput(text);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      // Triggers send with current input
    });
  };

  // Helper to format AI replies nicely (converts simple markdown heading or bullet styles)
  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      // Match headings
      if (content.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-[#4FFFB0] mt-3 mb-1 font-syne">{content.replace('### ', '')}</h3>;
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-extrabold text-[#7B61FF] mt-4 mb-2 font-syne">{content.replace('## ', '')}</h2>;
      }
      if (content.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-black text-[#7B61FF] mt-5 mb-3 font-syne">{content.replace('# ', '')}</h1>;
      }
      // Bold text formatting
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIdx = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIdx) {
          parts.push(content.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="text-[#4FFFB0] font-semibold">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < content.length) {
        parts.push(content.substring(lastIdx));
      }

      const finalLine = parts.length > 0 ? parts : content;

      // Match bullets
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="list-disc ml-5 my-1 text-[#E8F4FD] opacity-95 text-sm">
            {bulletText.includes('**') ? finalLine : bulletText}
          </li>
        );
      }

      // Standard paragraph
      return <p key={idx} className="my-1.5 text-sm leading-relaxed text-[#E8F4FD]/90">{finalLine}</p>;
    });
  };

  // Stats Counters
  const pendingCount = tasks.filter(t => !t.completed).length;
  const overdueCount = tasks.filter(t => {
    if (t.completed) return false;
    const due = new Date(t.deadline);
    return due.getTime() < Date.now();
  }).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div id="taskpulse-app" className="flex flex-col min-h-screen bg-[#030712] text-[#E8F4FD] font-sans selection:bg-[#4FFFB0]/30 relative overflow-hidden">
      
      {/* Liquid Glass vibrant ambient background refractions */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4FFFB0]/15 blur-[120px] pointer-events-none animate-pulse duration-[10s]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#7B61FF]/12 blur-[150px] pointer-events-none animate-pulse duration-[15s]" />
      <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#3B82F6]/8 blur-[130px] pointer-events-none animate-pulse duration-[12s]" />
      <div className="absolute bottom-[40%] right-[30%] w-[35vw] h-[35vw] rounded-full bg-[#FF5F5F]/6 blur-[110px] pointer-events-none animate-pulse duration-[8s]" />

      {/* HEADER */}
      <header id="header" className="bg-white/[0.02] backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="md:hidden p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#4FFFB0] hover:text-[#3DEBA0] transition-colors focus:outline-none cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4FFFB0] to-[#3B82F6] relative flex items-center justify-center shadow-[0_0_20px_rgba(79,255,176,0.4)] animate-pulse">
            <span className="text-xs">⚡</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight font-syne">
            Task<span className="text-[#4FFFB0]">Pulse</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-[#4FFFB0] animate-ping" />
            <span className="text-[#4FFFB0] font-semibold font-syne">Server Agent Ready</span>
          </div>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div id="layout-body" className="grid grid-cols-1 md:grid-cols-[380px_1fr] flex-1 min-h-[calc(100vh-64px)] relative z-10">
        
        {/* Mobile Sidebar overlay backdrop */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT PANEL: Task Sidebar */}
        <aside 
          id="sidebar" 
          className={`bg-[#030712]/95 md:bg-white/[0.02] md:backdrop-blur-xl border-r border-white/10 flex flex-col h-full overflow-hidden max-h-[calc(100vh-64px)] fixed md:static top-16 bottom-0 left-0 z-40 w-[320px] md:w-auto transition-transform duration-300 transform ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          
          {/* Header & Task Creation Form */}
          <div className="p-5 border-b border-white/10 flex-shrink-0 bg-transparent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B8CAE] flex items-center gap-2 font-syne">
                <ClipboardList className="w-4 h-4 text-[#7B61FF]" /> My Tasks
              </h2>
              <button
                type="button"
                onClick={handleExportTasks}
                className="text-[10px] font-bold uppercase tracking-wide text-[#4FFFB0] hover:text-[#3DEBA0] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(79,255,176,0.05)] hover:shadow-[0_0_15px_rgba(79,255,176,0.15)] focus:outline-none"
                title="Export tasks to JSON file backup"
              >
                <Download className="w-3 h-3 text-[#4FFFB0]" /> Backup JSON
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="What needs to get done?"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] px-4 py-2.5 rounded-lg text-sm outline-none placeholder:text-[#6B8CAE] focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all"
              />
              
              <textarea
                placeholder="Brief description (optional)..."
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                maxLength={300}
                className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] px-4 py-2 rounded-lg text-xs outline-none placeholder:text-[#6B8CAE] focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all resize-none h-14"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">Deadline</label>
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                    className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] p-2 rounded-lg text-xs outline-none focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">Category</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] p-2 rounded-lg text-xs outline-none focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all cursor-pointer"
                  >
                    <option value="work" className="bg-[#0D1B2E] text-[#E8F4FD]">💼 Work</option>
                    <option value="study" className="bg-[#0D1B2E] text-[#E8F4FD]">📚 Study</option>
                    <option value="personal" className="bg-[#0D1B2E] text-[#E8F4FD]">🏠 Personal</option>
                    <option value="health" className="bg-[#0D1B2E] text-[#E8F4FD]">💪 Health</option>
                    <option value="finance" className="bg-[#0D1B2E] text-[#E8F4FD]">💰 Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] p-2 rounded-lg text-xs outline-none focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all cursor-pointer"
                  >
                    <option value="low" className="bg-[#0D1B2E] text-[#E8F4FD]">🟢 Low</option>
                    <option value="medium" className="bg-[#0D1B2E] text-[#E8F4FD]">🟡 Medium</option>
                    <option value="high" className="bg-[#0D1B2E] text-[#E8F4FD]">🔴 High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">Est. Duration</label>
                  <select
                    value={taskDuration}
                    onChange={e => setTaskDuration(Number(e.target.value))}
                    className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] p-2 rounded-lg text-xs outline-none focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all cursor-pointer"
                  >
                    <option value={15} className="bg-[#0D1B2E] text-[#E8F4FD]">15 min</option>
                    <option value={30} className="bg-[#0D1B2E] text-[#E8F4FD]">30 min</option>
                    <option value={45} className="bg-[#0D1B2E] text-[#E8F4FD]">45 min</option>
                    <option value={60} className="bg-[#0D1B2E] text-[#E8F4FD]">60 min</option>
                    <option value={90} className="bg-[#0D1B2E] text-[#E8F4FD]">90 min</option>
                    <option value={120} className="bg-[#0D1B2E] text-[#E8F4FD]">120 min</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#4FFFB0] hover:bg-[#3DEBA0] text-[#050B1A] font-semibold text-xs py-2 px-4 rounded-lg transition-all duration-150 shadow-md shadow-[#4FFFB0]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
                <button
                  type="button"
                  onClick={handlePlanDay}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#4FFFB0] hover:text-[#3DEBA0] text-xs py-2 px-3 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 font-medium cursor-pointer"
                  title="Generate a smart daily planner schedule with AI"
                >
                  <Calendar className="w-3.5 h-3.5" /> Plan Day
                </button>
              </div>
            </form>
          </div>

          {/* Search bar */}
          <div className="px-5 py-3 border-b border-white/10 bg-transparent flex items-center gap-2 flex-shrink-0">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#6B8CAE] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks by title or details..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] pl-9 pr-8 py-1.5 rounded-lg text-xs outline-none focus:border-[#4FFFB0] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all placeholder:text-[#6B8CAE]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 cursor-pointer text-[#6B8CAE] hover:text-[#E8F4FD] bg-transparent border-none outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Task List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <span className="text-3xl mb-3">🎯</span>
                <p className="text-sm font-semibold text-[#E8F4FD] font-syne">No tasks planned yet</p>
                <p className="text-xs text-[#6B8CAE] mt-1">Add tasks above to organize your time and let AI optimize your agenda.</p>
              </div>
            ) : tasks.filter(t => 
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="text-2xl mb-2">🔍</span>
                <p className="text-xs font-semibold text-[#6B8CAE]">No tasks match your search</p>
              </div>
            ) : (
              tasks
                .filter(t => 
                  t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                })
                .map(task => {
                  const urg = getUrgencyDetails(task.deadline);
                  const isSelected = selectedTaskId === task.id;
                  const catTheme = getCategoryTheme(task.category);
                  const formatTime = new Date(task.deadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Calculate remaining time in the day
                  const now = new Date();
                  const endOfDay = new Date(now);
                  endOfDay.setHours(23, 59, 59, 999);
                  const remainingMs = endOfDay.getTime() - now.getTime();
                  const remainingMinutes = Math.max(1, Math.round(remainingMs / (1000 * 60)));
                  const durationPercent = Math.min(100, Math.max(1, Math.round((task.estimatedDuration / remainingMinutes) * 100)));

                  const remHours = Math.floor(remainingMinutes / 60);
                  const remMins = remainingMinutes % 60;
                  const formattedRemaining = remHours > 0 ? `${remHours}h ${remMins}m` : `${remMins}m`;

                  return (
                    <div
                      key={task.id}
                      onClick={() => selectTaskDirectly(task.id)}
                      className={`relative bg-white/[0.02] backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all duration-200 group flex flex-col gap-3 hover:translate-x-0.5 ${
                        task.completed ? 'border-white/5 opacity-50 bg-white/[0.005]' : isSelected ? 'border-[#4FFFB0]/80 bg-white/[0.06] shadow-[0_0_25px_rgba(79,255,176,0.12)]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Accent strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                        style={{ backgroundColor: task.completed ? '#6B8CAE' : urg.color }}
                      />

                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 pl-1.5">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <h3 className={`text-sm font-bold tracking-tight leading-snug group-hover:text-[#4FFFB0] transition-colors ${task.completed ? 'line-through text-[#6B8CAE]' : 'text-[#E8F4FD]'}`}>
                            {task.title}
                          </h3>

                          {/* Est. Duration vs Day Remaining Progress Bar */}
                          <div className="flex flex-col gap-1 mt-0.5">
                            <div className="w-full bg-white/[0.08] rounded-full h-1 overflow-hidden border border-white/5 relative" title={`${task.estimatedDuration}m is ${durationPercent}% of remaining day (${formattedRemaining} left)`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${task.completed ? 'bg-[#6B8CAE]/50' : 'bg-gradient-to-r from-[#4FFFB0] to-[#3B82F6]'}`}
                                style={{ width: `${durationPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#6B8CAE] font-mono leading-none">
                              <span>Est: <strong className={task.completed ? 'text-[#6B8CAE]' : 'text-[#4FFFB0]'}>{task.estimatedDuration}m</strong></span>
                              <span>{formattedRemaining} left today ({durationPercent}%)</span>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-[#6B8CAE] line-clamp-2 leading-relaxed mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {renderUrgencyCircle(urg.pct, urg.color, urg.label, task.completed)}
                      </div>

                      {/* Interactive Subtasks list (Rich feature block) */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="pl-1.5 border-l border-white/10 ml-2 py-1 flex flex-col gap-2 bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                          <div className="text-[10px] font-bold text-[#6B8CAE] uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Steps ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
                            <span className="text-xs text-[#4FFFB0] font-mono">{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
                          </div>
                          {task.subtasks.map(s => (
                            <div
                              key={s.id}
                              onClick={(e) => handleToggleSubtask(task.id, s.id, e)}
                              className="flex items-center gap-2 text-[11px] text-[#E8F4FD] hover:text-[#4FFFB0] transition-colors py-0.5 cursor-pointer"
                            >
                              {s.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#4FFFB0] flex-shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-[#6B8CAE] group-hover:text-[#4FFFB0] flex-shrink-0" />
                              )}
                              <span className={s.completed ? 'line-through text-[#6B8CAE]' : ''}>
                                {s.title} <span className="text-[#6B8CAE] font-mono text-[9px]">({s.duration}m)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center justify-between gap-1 pl-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-syne"
                            style={{ backgroundColor: catTheme.bg, color: catTheme.text }}
                          >
                            {catTheme.icon}
                            {catTheme.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            task.priority === 'high' ? 'bg-[#FF5F5F]/15 text-[#FF5F5F]' : task.priority === 'medium' ? 'bg-[#FFD166]/15 text-[#FFD166]' : 'bg-[#4FFFB0]/15 text-[#4FFFB0]'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6B8CAE] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 pl-1.5 mt-1">
                        <button
                          onClick={(e) => handleToggleTask(task.id, e)}
                          className="text-xs text-[#6B8CAE] hover:text-[#4FFFB0] transition-colors flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          {task.completed ? <RotateCcw className="w-3 h-3" /> : <Check className="w-3 h-3 text-[#4FFFB0]" />}
                          {task.completed ? 'Undo' : 'Complete'}
                        </button>

                        <div className="flex items-center gap-2">
                          {!task.completed && task.subtasks.length === 0 && (
                            <button
                              onClick={(e) => handleBreakdownTask(task, e)}
                              className="text-[11px] text-[#4FFFB0] hover:text-[#3DEBA0] transition-colors flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-2 py-1 rounded-md cursor-pointer"
                              title="Use TaskPulse's local cognitive engine to break this task down into bite-sized actionable checklists"
                            >
                              <Bot className="w-3 h-3" /> Break down
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="text-xs text-[#6B8CAE] hover:text-[#FF5F5F] transition-colors p-1 hover:bg-[#FF5F5F]/10 rounded-md cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Footer Stats summary info */}
          <div id="stats-summary" className="p-4 border-t border-white/10 bg-transparent flex-shrink-0 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-[#FF5F5F] font-syne">{overdueCount}</span>
               <span className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">🚨 Overdue</span>
            </div>
            <div className="flex flex-col border-x border-white/10">
              <span className="text-base font-extrabold text-[#4FFFB0] font-syne">{pendingCount}</span>
              <span className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">⏳ Pending</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-[#6B8CAE] font-syne">{completedCount}</span>
              <span className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">✅ Done</span>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: Main Tab Area */}
        <main id="main-content" className="flex flex-col h-full overflow-hidden max-h-[calc(100vh-64px)] bg-transparent">
          
          {/* Main Panel Header Banner */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold text-[#E8F4FD] font-syne flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4FFFB0]" /> TaskPulse AI Agent
              </h1>
              <p className="text-xs text-[#6B8CAE] mt-0.5">
                {selectedTaskId
                  ? `Active Focus: "${tasks.find(t => t.id === selectedTaskId)?.title}"`
                  : 'Select any task in the sidebar to run personalized AI assessments'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFullAnalysis}
                className="bg-gradient-to-r from-[#7B61FF] to-[#5B41FF] hover:from-[#6B51EF] hover:to-[#4B31EF] text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg shadow-[#7B61FF]/10 transition-all flex items-center gap-1 cursor-pointer"
                title="Get full workload analysis"
              >
                <Flame className="w-3.5 h-3.5 text-[#4FFFB0]" /> Workload Analysis
              </button>
            </div>
          </div>

          {/* Top Progress Loading Shimmer */}
          <div className={`h-0.5 w-full bg-white/10 relative overflow-hidden flex-shrink-0 ${agentStatus === 'thinking' ? 'block' : 'hidden'}`}>
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#4FFFB0] to-transparent animate-shimmer" />
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-white/10 bg-white/[0.01] backdrop-blur-md flex gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer font-syne ${
                activeTab === 'chat' ? 'text-[#4FFFB0] border-[#4FFFB0]' : 'text-[#6B8CAE] border-transparent hover:text-[#E8F4FD]'
              }`}
            >
              💬 AI Assistant Chat
            </button>
            <button
              onClick={() => { setActiveTab('schedule'); if (!scheduleData) handlePlanDay(); }}
              className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer font-syne ${
                activeTab === 'schedule' ? 'text-[#4FFFB0] border-[#4FFFB0]' : 'text-[#6B8CAE] border-transparent hover:text-[#E8F4FD]'
              }`}
            >
              📅 Schedule Planner
            </button>
            <button
              onClick={() => { setActiveTab('insights'); if (insights.length === 0) handleFullAnalysis(); }}
              className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer font-syne ${
                activeTab === 'insights' ? 'text-[#4FFFB0] border-[#4FFFB0]' : 'text-[#6B8CAE] border-transparent hover:text-[#E8F4FD]'
              }`}
            >
              💡 Workload Insights
            </button>
          </div>

          {/* VIEWPORT AREA */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-transparent backdrop-blur-xl">
            
            {/* 1. CHAT VIEW */}
            <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 custom-scrollbar">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold border ${
                      msg.sender === 'user'
                        ? 'bg-white/[0.05] border-white/10 text-[#E8F4FD]'
                        : 'bg-gradient-to-tr from-[#7B61FF] to-[#4FFFB0] border-transparent text-[#050B1A]'
                    }`}>
                      {msg.sender === 'user' ? '👤' : '⚡'}
                    </div>
                    
                    <div className={`rounded-xl p-4 text-sm shadow-md border leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-white/[0.08] border-white/15 text-[#E8F4FD]'
                        : 'bg-white/[0.03] border-white/10 text-[#E8F4FD]'
                    }`}>
                      {msg.sender === 'ai' ? formatText(msg.text) : <p className="text-sm">{msg.text}</p>}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 self-start max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gradient-to-tr from-[#7B61FF] to-[#4FFFB0] text-[#050B1A] font-bold">
                      ⚡
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center gap-1.5 shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4FFFB0] animate-bounce" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4FFFB0] animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4FFFB0] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Form Footer */}
              <div className="p-5 border-t border-white/10 bg-transparent flex flex-col gap-3">
                {/* Prompt suggestion buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar scrollbar-none flex-wrap">
                  <button
                    onClick={() => { setChatInput('Prioritize all my tasks by deadline and risk'); }}
                    className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#4FFFB0]/30 text-[#6B8CAE] hover:text-[#E8F4FD] text-[11px] font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                  >
                    🎯 Prioritize workload
                  </button>
                  <button
                    onClick={() => { setChatInput('What should I work on right now?'); }}
                    className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#4FFFB0]/30 text-[#6B8CAE] hover:text-[#E8F4FD] text-[11px] font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                  >
                    ⚡ What now?
                  </button>
                  <button
                    onClick={() => { setChatInput('I feel overwhelmed. Help me focus and build a calm action plan.'); }}
                    className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#4FFFB0]/30 text-[#6B8CAE] hover:text-[#E8F4FD] text-[11px] font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                  >
                    😰 Help, I'm overwhelmed
                  </button>
                  <button
                    onClick={() => { setChatInput('Draft an hour-by-hour planner with rest stops for today.'); }}
                    className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#4FFFB0]/30 text-[#6B8CAE] hover:text-[#E8F4FD] text-[11px] font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
                  >
                    📅 Build schedule
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Ask your AI agent to organize, breakdown, or plan your tasks..."
                    className="flex-1 bg-white/[0.03] backdrop-blur-md border border-white/10 text-[#E8F4FD] px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#6B8CAE] focus:border-[#4FFFB0] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#4FFFB0]/30 transition-all resize-none max-h-24"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!speechSupported}
                    title={
                      !speechSupported 
                        ? "Web Speech API is not supported in your browser" 
                        : isListening 
                          ? "Listening... Click to stop" 
                          : "Dictate with voice input"
                    }
                    className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all border flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      isListening
                        ? 'bg-[#FF4F4F] hover:bg-[#E03D3D] border-[#FF4F4F] text-[#E8F4FD] animate-pulse shadow-[0_0_15px_rgba(255,79,79,0.4)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-[#4FFFB0]/30 text-[#6B8CAE] hover:text-[#4FFFB0]'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isLoading}
                    className="w-11 h-11 rounded-lg bg-[#4FFFB0] hover:bg-[#3DEBA0] text-[#050B1A] flex items-center justify-center font-bold transition-all shadow-md shadow-[#4FFFB0]/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* 2. SCHEDULE PLANNER VIEW */}
            <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'schedule' ? 'block' : 'hidden'} custom-scrollbar`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#E8F4FD] font-syne flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#7B61FF]" /> Chronological Daily Schedule
                  </h2>
                  <p className="text-xs text-[#6B8CAE] mt-0.5">Custom hour-by-hour pipeline generated dynamically by AI based on your tasks</p>
                </div>
                <button
                  onClick={handlePlanDay}
                  className="bg-white/[0.04] hover:bg-white/[0.08] text-[#4FFFB0] hover:text-[#3DEBA0] border border-white/10 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Regenerate Schedule
                </button>
              </div>

              {scheduleData ? (
                <div className="flex flex-col gap-6">
                  {scheduleData.advice && (
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-xl flex gap-3 items-start leading-relaxed text-sm">
                      <Brain className="w-5 h-5 text-[#4FFFB0] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#4FFFB0] block mb-0.5 font-syne text-xs uppercase tracking-wider">AI Strategist Advice</strong>
                        <p className="text-xs text-[#E8F4FD]/90">{scheduleData.advice}</p>
                      </div>
                    </div>
                  )}

                  {scheduleData.days?.map((day, dIdx) => (
                    <div key={dIdx} className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-md">
                      <div className="bg-white/[0.04] border-b border-white/10 px-4 py-3 font-syne font-bold text-xs uppercase tracking-wider text-[#4FFFB0]">
                        {day.label}
                      </div>
                      
                      <div className="divide-y divide-white/5">
                        {day.slots?.map((slot, sIdx) => {
                          const isBreak = slot.task.toLowerCase().includes('break') || slot.task.toLowerCase().includes('lunch') || slot.task.toLowerCase().includes('recharge');
                          return (
                            <div key={sIdx} className="p-4 flex items-start gap-4 transition-colors hover:bg-white/[0.03]">
                              <div className="w-20 flex-shrink-0">
                                <span className="text-xs font-semibold text-[#4FFFB0] font-mono">{slot.time}</span>
                                <span className="block text-[10px] text-[#6B8CAE] mt-0.5 font-mono">{slot.duration}</span>
                              </div>
                              <div className={`w-1 self-stretch rounded-full ${isBreak ? 'bg-[#6B8CAE]/40' : 'bg-[#7B61FF]'}`} />
                              <div className="flex-1">
                                <h4 className={`text-sm font-bold ${isBreak ? 'text-[#6B8CAE]' : 'text-[#E8F4FD]'}`}>{slot.task}</h4>
                                <p className="text-xs text-[#6B8CAE] mt-0.5 leading-relaxed">{slot.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <span className="text-4xl mb-4">📅</span>
                  <p className="text-sm font-semibold text-[#E8F4FD] font-syne">No Schedule Prepared Yet</p>
                  <p className="text-xs text-[#6B8CAE] mt-1 max-w-sm">
                    Click \"Plan Day\" to parse your custom task stack and construct an optimized, high-performance hourly schedule.
                  </p>
                  <button
                    onClick={handlePlanDay}
                    className="mt-4 bg-[#4FFFB0] hover:bg-[#3DEBA0] text-[#050B1A] text-xs font-bold py-2 px-5 rounded-lg transition-all cursor-pointer"
                  >
                    Build My Plan
                  </button>
                </div>
              )}
            </div>

            {/* 3. INSIGHTS VIEW */}
            <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'insights' ? 'block' : 'hidden'} custom-scrollbar`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#E8F4FD] font-syne flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#FF5F5F]" /> Deep Workload Insights
                  </h2>
                  <p className="text-xs text-[#6B8CAE] mt-0.5">Strategic analytics, cognitive load forecasts, and priority suggestions</p>
                </div>
                <button
                  onClick={handleFullAnalysis}
                  className="bg-white/[0.04] hover:bg-white/[0.08] text-[#4FFFB0] hover:text-[#3DEBA0] border border-white/10 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze Workload
                </button>
              </div>

              {insights.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insights.map((ins, idx) => (
                    <div key={idx} className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-sm transition-all hover:border-[#4FFFB0]/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{ins.icon}</span>
                        <span className="text-[10px] font-bold text-[#6B8CAE] uppercase tracking-wider font-mono">Insight #{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#E8F4FD] font-syne mb-1">{ins.title}</h3>
                        <p className="text-xs text-[#6B8CAE] leading-relaxed">{ins.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <span className="text-4xl mb-4">💡</span>
                  <p className="text-sm font-semibold text-[#E8F4FD] font-syne">Workload Analysis Unprepared</p>
                  <p className="text-xs text-[#6B8CAE] mt-1 max-w-sm">
                    Click below to trigger a full analytical check on your tasks and deadlines. Let the AI diagnose bottlenecks.
                  </p>
                  <button
                    onClick={handleFullAnalysis}
                    className="mt-4 bg-[#4FFFB0] hover:bg-[#3DEBA0] text-[#050B1A] text-xs font-bold py-2 px-5 rounded-lg transition-all cursor-pointer"
                  >
                    Run Full Diagnostics
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>

      </div>

      {/* Fully Interactive Liquid Glass Pop-Up for Task Focus */}
      {focusedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Liquid backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setFocusedTask(null)}
          />
          
          {/* Glass popup card */}
          <div className="relative w-full max-w-lg bg-[#0D1B2E]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(79,255,176,0.15)] flex flex-col gap-4 overflow-hidden animate-zoom-in">
            {/* Liquid aesthetic lighting decoration */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-[#4FFFB0]/20 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-[#7B61FF]/20 blur-xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: getCategoryTheme(focusedTask.category).bg, color: getCategoryTheme(focusedTask.category).text }}>
                    {getCategoryTheme(focusedTask.category).icon} {getCategoryTheme(focusedTask.category).label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    focusedTask.priority === 'high' ? 'bg-[#FF5F5F]/15 text-[#FF5F5F]' : focusedTask.priority === 'medium' ? 'bg-[#FFD166]/15 text-[#FFD166]' : 'bg-[#4FFFB0]/15 text-[#4FFFB0]'
                  }`}>
                    {focusedTask.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#E8F4FD] font-syne tracking-tight leading-snug">
                  {focusedTask.title}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setFocusedTask(null)}
                className="text-[#6B8CAE] hover:text-[#E8F4FD] p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {focusedTask.description && (
                <div className="bg-[#112236]/40 border border-white/5 p-3 rounded-xl text-xs text-[#A0C0E0] leading-relaxed">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B8CAE] mb-1">Description</h4>
                  {focusedTask.description}
                </div>
              )}

              {/* Dynamic Urgency / Deadline detail */}
              <div className="flex items-center justify-between bg-[#112236]/30 border border-white/5 p-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#6B8CAE] font-medium uppercase tracking-wider">Deadline Target</span>
                  <span className="text-xs text-[#E8F4FD] font-semibold font-mono mt-0.5">
                    {new Date(focusedTask.deadline).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-right text-[#4FFFB0]">
                    {getUrgencyDetails(focusedTask.deadline).emoji} {getUrgencyDetails(focusedTask.deadline).label}
                  </span>
                </div>
              </div>

              {/* Subtasks checklist inside popup */}
              <div className="space-y-2 bg-[#112236]/20 border border-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B8CAE]">
                    Interactive Steps ({focusedTask.subtasks?.filter(s => s.completed).length || 0}/{focusedTask.subtasks?.length || 0})
                  </h4>
                  {focusedTask.subtasks?.length > 0 && (
                    <span className="text-xs text-[#4FFFB0] font-mono font-bold">
                      {Math.round(((focusedTask.subtasks?.filter(s => s.completed).length || 0) / focusedTask.subtasks?.length) * 100)}%
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
                          // Update focused task subtask state instantly
                          setFocusedTask(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              subtasks: prev.subtasks.map(sub => sub.id === s.id ? { ...sub, completed: !sub.completed } : sub)
                            };
                          });
                        }}
                        className="flex items-center gap-3 text-xs text-[#E8F4FD] hover:text-[#4FFFB0] bg-white/[0.02] hover:bg-[#1E3355]/30 border border-white/5 px-3 py-2 rounded-lg transition-all cursor-pointer group"
                      >
                        {s.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4FFFB0] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#6B8CAE] group-hover:text-[#4FFFB0] flex-shrink-0" />
                        )}
                        <span className={`flex-1 ${s.completed ? 'line-through text-[#6B8CAE]' : ''}`}>
                          {s.title}
                        </span>
                        <span className="text-[10px] text-[#6B8CAE] font-mono">{s.duration}m</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-xs text-[#6B8CAE]">No checklist steps generated yet.</p>
                    {!focusedTask.completed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          handleBreakdownTask(focusedTask, e);
                          setFocusedTask(null); // Close to show chat breakdown progress
                        }}
                        className="mt-2 bg-[#4FFFB0]/15 hover:bg-[#4FFFB0]/30 text-[#4FFFB0] border border-[#4FFFB0]/30 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" /> Deconstruct Task with AI
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Task Properties Editor Form within the focus pop up */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B8CAE]">Quick Modifiers</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#6B8CAE] uppercase font-bold">Priority</label>
                    <select
                      value={focusedTask.priority}
                      onChange={e => {
                        const newPri = e.target.value as any;
                        setTasks(prev => prev.map(t => t.id === focusedTask.id ? { ...t, priority: newPri } : t));
                        setFocusedTask(prev => prev ? { ...prev, priority: newPri } : null);
                      }}
                      className="w-full bg-[#112236] border border-white/10 text-xs text-[#E8F4FD] p-2 rounded-lg outline-none focus:border-[#4FFFB0] transition-colors"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#6B8CAE] uppercase font-bold">Category</label>
                    <select
                      value={focusedTask.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        setTasks(prev => prev.map(t => t.id === focusedTask.id ? { ...t, category: newCat } : t));
                        setFocusedTask(prev => prev ? { ...prev, category: newCat } : null);
                      }}
                      className="w-full bg-[#112236] border border-white/10 text-xs text-[#E8F4FD] p-2 rounded-lg outline-none focus:border-[#4FFFB0] transition-colors"
                    >
                      <option value="work">💼 Work</option>
                      <option value="study">📚 Study</option>
                      <option value="personal">🏠 Personal</option>
                      <option value="health">💪 Health</option>
                      <option value="finance">💰 Finance</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer row */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 relative z-10 flex-wrap gap-2">
              <button
                type="button"
                onClick={(e) => {
                  handleToggleTask(focusedTask.id, e);
                  setFocusedTask(prev => prev ? { ...prev, completed: !prev.completed } : null);
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#E8F4FD] px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {focusedTask.completed ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-[#4FFFB0]" />}
                {focusedTask.completed ? 'Mark Pending' : 'Mark Completed'}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  handleDeleteTask(focusedTask.id, e);
                  setFocusedTask(null);
                }}
                className="bg-[#FF5F5F]/10 hover:bg-[#FF5F5F]/20 border border-[#FF5F5F]/20 text-xs text-[#FF5F5F] px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to select a task card and view/request direct agent updates
  function selectTaskDirectly(id: string) {
    setSelectedTaskId(id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      setFocusedTask(task);
      setMobileSidebarOpen(false);
      analyzeTaskDirectly(task);
    }
  }
}
