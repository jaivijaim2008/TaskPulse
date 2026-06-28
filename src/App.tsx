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
  Download,
  LogOut
} from 'lucide-react';
import { getUrgencyDetails, getCategoryTheme } from './utils/helpers';
import { TaskForm } from './components/TaskForm';
import { TaskCard } from './components/TaskCard';
import { ChatPanel } from './components/ChatPanel';
import { SchedulePanel } from './components/SchedulePanel';
import { InsightsPanel } from './components/InsightsPanel';
import { TaskModal } from './components/TaskModal';
import { UnfinishedModal } from './components/UnfinishedModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { AuthScreen } from './components/AuthScreen';
import { 
  auth, 
  db, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  onSnapshot,
  User 
} from './lib/firebase';

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

// ============ DATE HELPERS FOR STREAK & HABITS ============
const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

export default function App() {
  // ============ STATE ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('tp_guest_mode') === 'true';
  });

  const lastSyncedRef = useRef({
    tasks: '',
    chatHistory: '',
    scheduleData: '',
    insights: ''
  });

  const isFirestoreReadyRef = useRef(false);
  const unbindRef = useRef<(() => void) | null>(null);

  const getDemoTasksList = React.useCallback((): Task[] => {
    const now = new Date();
    const yesterdayStr = getYesterdayDateString();
    const d1 = new Date(now); d1.setHours(d1.getHours() + 6);
    const d2 = new Date(now); d2.setHours(d2.getHours() + 12);
    const d3 = new Date(now); d3.setDate(d3.getDate() + 3);

    return [
      {
        id: 'demo-1',
        title: 'Launch SaaS Product MVP 🚀',
        description: 'Publish product on ProductHunt, send announcement email, and track real-time traffic analytics.',
        deadline: d1.toISOString(),
        category: 'work',
        priority: 'high',
        completed: false,
        estimatedDuration: 60,
        subtasks: [
          { id: 'sub-demo-1-1', title: 'Prepare high-quality screenshots & banners', completed: true, duration: 15 },
          { id: 'sub-demo-1-2', title: 'Draft launch announcement copy', completed: false, duration: 15 },
          { id: 'sub-demo-1-3', title: 'Publish ProductHunt post & share on social channels', completed: false, duration: 30 }
        ],
        createdAt: now.toISOString(),
        position: 0,
        recurring: 'none'
      },
      {
        id: 'demo-2',
        title: 'Daily Coding Habit 💻',
        description: 'Solve one coding challenge and commit to main repository.',
        deadline: d2.toISOString(),
        category: 'study',
        priority: 'medium',
        completed: false,
        estimatedDuration: 30,
        subtasks: [],
        createdAt: now.toISOString(),
        position: 1,
        recurring: 'daily',
        streak: 4,
        lastCompletedDate: yesterdayStr
      },
      {
        id: 'demo-3',
        title: 'Organize Workspace 🧹',
        description: 'Cable management, dust the desk, and arrange desk lights for better ergonomics.',
        deadline: d3.toISOString(),
        category: 'personal',
        priority: 'low',
        completed: false,
        estimatedDuration: 45,
        subtasks: [],
        createdAt: now.toISOString(),
        position: 2,
        recurring: 'none'
      }
    ];
  }, []);

  const saveTasks = React.useCallback((newTasksOrFn: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prev => {
      const resolved = typeof newTasksOrFn === 'function' ? newTasksOrFn(prev) : newTasksOrFn;
      localStorage.setItem('tp_tasks', JSON.stringify(resolved));
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { tasks: resolved }, { merge: true })
          .catch(err => console.error("Error syncing tasks to Firestore:", err));
      }
      return resolved;
    });
  }, []);

  const saveChat = React.useCallback((newChatOrFn: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatMessages(prev => {
      const resolved = typeof newChatOrFn === 'function' ? newChatOrFn(prev) : newChatOrFn;
      localStorage.setItem('tp_chat_history', JSON.stringify(resolved));
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { chatHistory: resolved }, { merge: true })
          .catch(err => console.error("Error syncing chat to Firestore:", err));
      }
      return resolved;
    });
  }, []);

  const saveSchedule = React.useCallback((newSchedule: ScheduleData | null) => {
    setScheduleData(newSchedule);
    if (newSchedule) {
      localStorage.setItem('tp_schedule', JSON.stringify(newSchedule));
    } else {
      localStorage.removeItem('tp_schedule');
    }
    
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { scheduleData: newSchedule }, { merge: true })
        .catch(err => console.error("Error syncing schedule to Firestore:", err));
    }
  }, []);

  const saveInsights = React.useCallback((newInsights: InsightItem[]) => {
    setInsights(newInsights);
    localStorage.setItem('tp_insights', JSON.stringify(newInsights));
    
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { insights: newInsights }, { merge: true })
        .catch(err => console.error("Error syncing insights to Firestore:", err));
    }
  }, []);

  const [apiKeyStatus, setApiKeyStatus] = useState<{ configured: boolean; status: string; message: string; diagnostics?: any } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskRecurring, setTaskRecurring] = useState<'none' | 'daily' | 'weekly'>('none');

  // Search & Mobile & Popup States
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [showUnfinishedModal, setShowUnfinishedModal] = useState(false);
  const [diagnosticModal, setDiagnosticModal] = useState<{ isOpen: boolean; title: string; message: string; details?: string; status: 'working' | 'quota_exceeded' | 'error' | 'info' } | null>(null);
  const [sortBy, setSortBy] = useState<'auto' | 'custom'>('auto');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [inlineEditingTaskId, setInlineEditingTaskId] = useState<string | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState('');
  const [quickEditPriority, setQuickEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // AI & Chat States
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'schedule' | 'insights'>(() => {
    return (typeof window !== 'undefined' && window.innerWidth < 768) ? 'tasks' : 'chat';
  });
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

  // Resize & Split Layout States
  const [sidebarWidth, setSidebarWidth] = useState<number>(380);
  const [sidebarHeight, setSidebarHeight] = useState<number>(300);
  const [topSidebarHeight, setTopSidebarHeight] = useState<number>(340);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragType, setDragType] = useState<'width' | 'height' | 'topSidebarHeight' | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileSplitMode, setMobileSplitMode] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragType === 'width') {
        const nextWidth = e.clientX;
        if (nextWidth >= 280 && nextWidth <= 700) {
          setSidebarWidth(nextWidth);
        }
      } else if (dragType === 'height') {
        const layoutBody = document.getElementById('layout-body');
        if (layoutBody) {
          const rect = layoutBody.getBoundingClientRect();
          const nextHeight = e.clientY - rect.top;
          if (nextHeight >= 160 && nextHeight <= window.innerHeight - 200) {
            setSidebarHeight(nextHeight);
          }
        }
      } else if (dragType === 'topSidebarHeight') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          const nextHeight = e.clientY - rect.top;
          if (nextHeight >= 100 && nextHeight <= window.innerHeight - 150) {
            setTopSidebarHeight(nextHeight);
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragType) return;
      e.preventDefault();
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (dragType === 'width') {
        const nextWidth = touch.clientX;
        if (nextWidth >= 240 && nextWidth <= window.innerWidth - 40) {
          setSidebarWidth(nextWidth);
        }
      } else if (dragType === 'height') {
        const layoutBody = document.getElementById('layout-body');
        if (layoutBody) {
          const rect = layoutBody.getBoundingClientRect();
          const nextHeight = touch.clientY - rect.top;
          if (nextHeight >= 160 && nextHeight <= window.innerHeight - 200) {
            setSidebarHeight(nextHeight);
          }
        }
      } else if (dragType === 'topSidebarHeight') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          const nextHeight = touch.clientY - rect.top;
          if (nextHeight >= 100 && nextHeight <= window.innerHeight - 150) {
            setTopSidebarHeight(nextHeight);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isDragging, dragType]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // ============ INITIALIZATION & FIREBASE AUTH ============
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Unsubscribe from any previous Firestore snapshot listener first
      if (unbindRef.current) {
        unbindRef.current();
        unbindRef.current = null;
      }

      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        setGuestMode(false);
        localStorage.removeItem('tp_guest_mode');
        
        // Bind to Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        const unbind = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            
            // Perform habit sweeping on the Firestore tasks if needed
            const incomingTasks = data.tasks || [];
            const currentDate = getLocalDateString();
            const yesterdayStr = getYesterdayDateString();
            let hasChanges = false;
            
            const sweptTasks = incomingTasks.map((t: Task) => {
              if (t.recurring === 'daily') {
                if (t.completed && t.lastCompletedDate !== currentDate) {
                  hasChanges = true;
                  let nextStreak = t.streak || 0;
                  if (t.lastCompletedDate !== yesterdayStr) {
                    nextStreak = 0;
                  }
                  return { ...t, completed: false, streak: nextStreak };
                }
                if (!t.completed && t.lastCompletedDate !== currentDate && t.lastCompletedDate !== yesterdayStr && (t.streak || 0) > 0) {
                  hasChanges = true;
                  return { ...t, streak: 0 };
                }
              }
              return t;
            });

            const sweptTasksStr = JSON.stringify(sweptTasks);
            if (sweptTasksStr !== lastSyncedRef.current.tasks) {
              lastSyncedRef.current.tasks = sweptTasksStr;
              setTasks(sweptTasks);
              localStorage.setItem('tp_tasks', sweptTasksStr);
            }

            if (hasChanges) {
              setDoc(userDocRef, { tasks: sweptTasks }, { merge: true })
                .catch(err => console.error("Error saving swept tasks to Firestore:", err));
            }

            const incomingChat = data.chatHistory || [];
            const incomingChatStr = JSON.stringify(incomingChat);
            if (incomingChatStr !== lastSyncedRef.current.chatHistory) {
              lastSyncedRef.current.chatHistory = incomingChatStr;
              setChatMessages(incomingChat);
              localStorage.setItem('tp_chat_history', incomingChatStr);
            }

            const incomingSchedule = data.scheduleData || null;
            const incomingScheduleStr = JSON.stringify(incomingSchedule);
            if (incomingScheduleStr !== lastSyncedRef.current.scheduleData) {
              lastSyncedRef.current.scheduleData = incomingScheduleStr;
              setScheduleData(incomingSchedule);
              if (incomingSchedule) {
                localStorage.setItem('tp_schedule', incomingScheduleStr);
              } else {
                localStorage.removeItem('tp_schedule');
              }
            }

            const incomingInsights = data.insights || [];
            const incomingInsightsStr = JSON.stringify(incomingInsights);
            if (incomingInsightsStr !== lastSyncedRef.current.insights) {
              lastSyncedRef.current.insights = incomingInsightsStr;
              setInsights(incomingInsights);
              localStorage.setItem('tp_insights', incomingInsightsStr);
            }

            // Flag that we have fully loaded this user's data from Firestore
            isFirestoreReadyRef.current = true;
          } else {
            // First time registered/logged-in user, seed with fresh default demo tasks only to keep account isolated and clean
            const initialTasks = getDemoTasksList();
            const initialChat = [
              {
                id: 'welcome',
                sender: 'ai',
                text: `### Welcome to **TaskPulse AI**! ⚡\n\nI'm your intelligent productivity agent. I keep track of your deadlines, automatically calculate urgencies, and use our custom on-device Cognitive Engine to help you plan your workload.\n\n**What I can do for you:**\n*   **Deconstruct complex tasks**: Click **"Breakdown"** on any task card to generate interactive subtasks.\n*   **Build optimized schedules**: Click **"Plan Day"** or the button below to generate an hour-by-hour planner.\n*   **Analyze workload bottlenecks**: Get real-time productivity insights by clicking **"Full Analysis"**.\n\nWhat would you like to accomplish first?`,
                timestamp: new Date().toLocaleTimeString()
              }
            ];

            const initialTasksStr = JSON.stringify(initialTasks);
            const initialChatStr = JSON.stringify(initialChat);

            lastSyncedRef.current.tasks = initialTasksStr;
            lastSyncedRef.current.chatHistory = initialChatStr;
            lastSyncedRef.current.scheduleData = 'null';
            lastSyncedRef.current.insights = '[]';

            // Mark ready and save to firestore
            isFirestoreReadyRef.current = true;
            setTasks(initialTasks);
            setChatMessages(initialChat);
            setScheduleData(null);
            setInsights([]);

            setDoc(userDocRef, {
              tasks: initialTasks,
              chatHistory: initialChat,
              scheduleData: null,
              insights: []
            });
          }
        }, (err) => {
          console.error("Firestore snapshot error:", err);
        });
        
        unbindRef.current = unbind;
      } else {
        // User is logged out.
        isFirestoreReadyRef.current = false;
        const isGuest = localStorage.getItem('tp_guest_mode') === 'true';
        if (!isGuest) {
          // Reset states
          setTasks([]);
          setChatMessages([]);
          setScheduleData(null);
          setInsights([]);
          // Clean storage to prevent data leakage between sessions
          localStorage.removeItem('tp_tasks');
          localStorage.removeItem('tp_chat_history');
          localStorage.removeItem('tp_schedule');
          localStorage.removeItem('tp_insights');
          lastSyncedRef.current = {
            tasks: '',
            chatHistory: '',
            scheduleData: '',
            insights: ''
          };
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (unbindRef.current) {
        unbindRef.current();
        unbindRef.current = null;
      }
    };
  }, [getDemoTasksList]);

  // Bidirectional real-time state synchronization guard & effect
  useEffect(() => {
    if (!currentUser || !isFirestoreReadyRef.current) return;

    const payload: any = {};
    const tasksStr = JSON.stringify(tasks);
    const chatStr = JSON.stringify(chatMessages);
    const scheduleStr = JSON.stringify(scheduleData);
    const insightsStr = JSON.stringify(insights);

    let needsSync = false;

    if (tasksStr !== lastSyncedRef.current.tasks) {
      lastSyncedRef.current.tasks = tasksStr;
      payload.tasks = tasks;
      needsSync = true;
    }
    if (chatStr !== lastSyncedRef.current.chatHistory) {
      lastSyncedRef.current.chatHistory = chatStr;
      payload.chatHistory = chatMessages;
      needsSync = true;
    }
    if (scheduleStr !== lastSyncedRef.current.scheduleData) {
      lastSyncedRef.current.scheduleData = scheduleStr;
      payload.scheduleData = scheduleData;
      needsSync = true;
    }
    if (insightsStr !== lastSyncedRef.current.insights) {
      lastSyncedRef.current.insights = insightsStr;
      payload.insights = insights;
      needsSync = true;
    }

    if (needsSync) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, payload, { merge: true })
        .catch(err => console.error("Error syncing state to Firestore:", err));
    }
  }, [tasks, chatMessages, scheduleData, insights, currentUser]);

  // Local/Guest Initialization
  useEffect(() => {
    if (currentUser) return; // Managed by Firestore effect above

    const savedTasks = localStorage.getItem('tp_tasks');
    let loadedTasks: Task[] = [];
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          loadedTasks = parsed;
        }
      } catch (e) {
        console.error('Error parsing saved tasks:', e);
      }
    }

    const now = new Date();
    const yesterdayStr = getYesterdayDateString();
    const currentDate = getLocalDateString();

    if (loadedTasks.length > 0) {
      let hasChanges = false;
      const sweptTasks = loadedTasks.map(t => {
        if (t.recurring === 'daily') {
          if (t.completed && t.lastCompletedDate !== currentDate) {
            hasChanges = true;
            let nextStreak = t.streak || 0;
            if (t.lastCompletedDate !== yesterdayStr) {
              nextStreak = 0;
            }
            return { ...t, completed: false, streak: nextStreak };
          }
          if (!t.completed && t.lastCompletedDate !== currentDate && t.lastCompletedDate !== yesterdayStr && (t.streak || 0) > 0) {
            hasChanges = true;
            return { ...t, streak: 0 };
          }
        }
        return t;
      });

      if (hasChanges) {
        setTasks(sweptTasks);
        localStorage.setItem('tp_tasks', JSON.stringify(sweptTasks));
      } else {
        setTasks(loadedTasks);
      }
    } else {
      const defaultTasks = getDemoTasksList();
      setTasks(defaultTasks);
      localStorage.setItem('tp_tasks', JSON.stringify(defaultTasks));
    }

    // Set default deadline to tomorrow 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));

    // Restore saved chat history
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

    // Restore saved schedule for Guest
    const savedSchedule = localStorage.getItem('tp_schedule');
    if (savedSchedule) {
      try {
        setScheduleData(JSON.parse(savedSchedule));
      } catch (e) {}
    } else {
      setScheduleData(null);
    }

    // Restore saved insights for Guest
    const savedInsights = localStorage.getItem('tp_insights');
    if (savedInsights) {
      try {
        setInsights(JSON.parse(savedInsights));
      } catch (e) {}
    } else {
      setInsights([]);
    }
  }, [currentUser, getDemoTasksList]);

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
      setDiagnosticModal({
        isOpen: true,
        title: "Voice Input Not Supported",
        message: "Speech recognition is not supported in your current browser environment. Please try Chrome, Safari, or Microsoft Edge for full real-time speech-to-text integration.",
        status: "info"
      });
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
      position: 0,
      recurring: taskRecurring,
      streak: 0
    };

    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = [
      newTask,
      ...currentTasks.map((t, idx) => ({ ...t, position: t.position !== undefined ? t.position + 1 : idx + 1 }))
    ];
    saveTasks(updated);

    setTaskTitle('');
    setTaskDesc('');
    setMobileSidebarOpen(false);
    setTaskRecurring('none');
    
    // Auto-select and focus newly created task instantly
    setSelectedTaskId(newTask.id);
    setFocusedTask(newTask);
  }, [taskTitle, taskDesc, taskDeadline, taskCategory, taskPriority, taskDuration, taskRecurring, tasks]);

  const handleClearAllTasks = React.useCallback(() => {
    saveTasks([]);
    setSelectedTaskId(null);
    setFocusedTask(null);
  }, []);

  const handleLoadDemoTasks = React.useCallback(() => {
    const now = new Date();
    const yesterdayStr = getYesterdayDateString();
    const d1 = new Date(now); d1.setHours(d1.getHours() + 6);
    const d2 = new Date(now); d2.setHours(d2.getHours() + 12);
    const d3 = new Date(now); d3.setDate(d3.getDate() + 3);

    const demoTasks: Task[] = [
      {
        id: 'demo-1',
        title: 'Launch SaaS Product MVP 🚀',
        description: 'Publish product on ProductHunt, send announcement email, and track real-time traffic analytics.',
        deadline: d1.toISOString(),
        category: 'work',
        priority: 'high',
        completed: false,
        estimatedDuration: 60,
        subtasks: [
          { id: 'sub-demo-1-1', title: 'Prepare high-quality screenshots & banners', completed: true, duration: 15 },
          { id: 'sub-demo-1-2', title: 'Draft launch announcement copy', completed: false, duration: 15 },
          { id: 'sub-demo-1-3', title: 'Publish ProductHunt post & share on social channels', completed: false, duration: 30 }
        ],
        createdAt: now.toISOString(),
        position: 0,
        recurring: 'none'
      },
      {
        id: 'demo-2',
        title: 'Daily Coding Habit 💻',
        description: 'Solve one coding challenge and commit to main repository.',
        deadline: d2.toISOString(),
        category: 'study',
        priority: 'medium',
        completed: false,
        estimatedDuration: 30,
        subtasks: [],
        createdAt: now.toISOString(),
        position: 1,
        recurring: 'daily',
        streak: 4,
        lastCompletedDate: yesterdayStr
      },
      {
        id: 'demo-3',
        title: 'Organize Workspace 🧹',
        description: 'Cable management, dust the desk, and arrange desk lights for better ergonomics.',
        deadline: d3.toISOString(),
        category: 'personal',
        priority: 'low',
        completed: false,
        estimatedDuration: 45,
        subtasks: [],
        createdAt: now.toISOString(),
        position: 2,
        recurring: 'none'
      }
    ];

    saveTasks(demoTasks);
    setSelectedTaskId('demo-1');
    setFocusedTask(demoTasks[0]);
  }, []);

  const handleDeleteTask = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const updated = currentTasks.filter(t => t.id !== id);
    saveTasks(updated);
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  }, [tasks, selectedTaskId]);

  const handleToggleTask = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const currentDate = getLocalDateString();
    const yesterdayDate = getYesterdayDateString();

    const updated = currentTasks.map(t => {
      if (t.id === id) {
        const nextVal = !t.completed;
        if (nextVal) {
          playCompletionSound();
          triggerVibration();

          if (t.recurring === 'daily') {
            let nextStreak = t.streak || 0;
            if (t.lastCompletedDate === yesterdayDate) {
              nextStreak += 1;
            } else if (t.lastCompletedDate !== currentDate) {
              nextStreak = 1;
            }
            return {
              ...t,
              completed: nextVal,
              streak: nextStreak,
              lastCompletedDate: currentDate
            };
          } else if (t.recurring === 'weekly') {
            let nextStreak = t.streak || 0;
            if (t.lastCompletedDate) {
              try {
                const lastDate = new Date(t.lastCompletedDate);
                const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 10 && diffDays >= 4) {
                  nextStreak += 1;
                } else if (diffDays > 10) {
                  nextStreak = 1;
                }
              } catch (err) {
                nextStreak = 1;
              }
            } else {
              nextStreak = 1;
            }
            return {
              ...t,
              completed: nextVal,
              streak: nextStreak,
              lastCompletedDate: currentDate
            };
          }
        } else {
          if (t.recurring === 'daily' || t.recurring === 'weekly') {
            const nextStreak = Math.max(0, (t.streak || 1) - 1);
            return {
              ...t,
              completed: nextVal,
              streak: nextStreak,
              lastCompletedDate: undefined
            };
          }
        }
        return { ...t, completed: nextVal };
      }
      return t;
    });
    saveTasks(updated);
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
    saveTasks(updated);
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

    saveTasks(updated);
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

      saveTasks(updatedTasks);
      
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center border border-white/10 shadow-lg mb-4 animate-bounce">
          <span className="text-xl">⚡</span>
        </div>
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Initializing Pulse Engine...</p>
      </div>
    );
  }

  if (!currentUser && !guestMode) {
    return (
      <AuthScreen 
        onSuccess={() => {
          setGuestMode(false);
          localStorage.removeItem('tp_guest_mode');
        }}
        onContinueAsGuest={() => {
          setGuestMode(true);
          localStorage.setItem('tp_guest_mode', 'true');
        }}
      />
    );
  }

  return (
    <div id="taskpulse-app" className="flex flex-col h-screen bg-[#070A13] text-slate-100 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* Dynamic ambient glass lighting spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none animate-pulse duration-[12s]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none animate-pulse duration-[18s]" />

      {/* HEADER */}
      <header id="header" className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-850 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
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
              className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/35 text-rose-400 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              title="You have unfinished tasks requiring your attention!"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">{pendingCount} Pending</span>
              <span className="sm:hidden">{pendingCount}</span>
            </button>
          )}

          {apiKeyStatus === null ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400 font-bold hidden sm:inline">Connecting Engine...</span>
              <span className="text-slate-400 font-bold sm:hidden">Connecting</span>
            </div>
          ) : apiKeyStatus.status === 'working' ? (
            <div 
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-emerald-500/15 transition-all" 
              title={`${apiKeyStatus.message}. Click for diagnostic details.`}
              onClick={() => setDiagnosticModal({
                isOpen: true,
                title: "Gemini AI Connection Active",
                message: apiKeyStatus.message,
                details: apiKeyStatus.sample_response ? `Sample response verification:\n"${apiKeyStatus.sample_response}"\n\nActive Key Location: ${apiKeyStatus.diagnostics?.using_variable || 'GEMINI_API_KEY'}\nPrefix: ${apiKeyStatus.diagnostics?.prefix || 'unknown'}` : "API verification ping successful.",
                status: "working"
              })}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold hidden sm:inline">Gemini AI Online</span>
              <span className="text-emerald-400 font-bold sm:hidden">AI Online</span>
            </div>
          ) : apiKeyStatus.status === 'quota_exceeded' ? (
            <div 
              className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-rose-500/15 transition-all animate-pulse" 
              title={`${apiKeyStatus.message}. Click for diagnostic details.`} 
              onClick={() => setDiagnosticModal({
                isOpen: true,
                title: "Gemini API Quota Exceeded",
                message: apiKeyStatus.message,
                details: apiKeyStatus.error_details || "HTTP 429 - RESOURCE_EXHAUSTED",
                status: "quota_exceeded"
              })}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-bold flex items-center gap-1 hidden sm:inline">Quota Exceeded ⏳</span>
              <span className="text-rose-400 font-bold flex items-center gap-1 sm:hidden">Quota ⏳</span>
            </div>
          ) : apiKeyStatus.status === 'error' ? (
            <div 
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-amber-500/15 transition-all" 
              title={`${apiKeyStatus.message}. Click for diagnostic details.`} 
              onClick={() => setDiagnosticModal({
                isOpen: true,
                title: "Gemini Key Diagnostic Error",
                message: apiKeyStatus.message,
                details: apiKeyStatus.error_details || "Initialization or authentication with Google GenAI endpoint failed.",
                status: "error"
              })}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 font-bold flex items-center gap-1 hidden sm:inline">Gemini Error ⚠️</span>
              <span className="text-amber-400 font-bold flex items-center gap-1 sm:hidden">Error ⚠️</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs" title={`${apiKeyStatus.message}. Running in high-performance local simulation mode.`}>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-400 font-bold hidden sm:inline">Local Cognitive Engine</span>
              <span className="text-slate-400 font-bold sm:hidden">Local</span>
            </div>
          )}

          {/* User Sign In / Sign Out Section */}
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-800 pl-2 sm:pl-3">
              <div className="hidden md:flex flex-col items-end text-[10px]">
                <span className="text-slate-300 font-bold max-w-[120px] truncate">{currentUser.email}</span>
                <span className="text-emerald-400 font-medium tracking-wide">Cloud Sync Active</span>
              </div>
              <button
                onClick={async () => {
                  try {
                     await signOut(auth);
                     setGuestMode(false);
                     localStorage.removeItem('tp_guest_mode');
                  } catch (e) {
                     console.error("Sign out failed", e);
                  }
                }}
                className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-800 pl-2 sm:pl-3">
              <span className="hidden md:inline text-[10px] text-slate-500 font-bold uppercase tracking-wider">Guest</span>
              <button
                onClick={() => {
                  setGuestMode(false);
                  localStorage.removeItem('tp_guest_mode');
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-md hover:shadow-emerald-500/10"
                title="Sign in with your email to sync data across all devices"
              >
                🔑 <span className="hidden sm:inline">Sign In / Sync</span>
                <span className="sm:hidden">Sync</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MASTER VIEW SWITCHER (Mobile-friendly toggle for switching between Task List and Chat/Plan views) */}
      <div className="bg-slate-950/20 border-b border-slate-850/60 p-2.5 flex items-center justify-center gap-2 flex-shrink-0 z-30">
        <div className="flex bg-slate-950/80 border border-slate-850 p-1 rounded-xl shadow-inner max-w-md w-full relative">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            📋 Tasks Checklist
          </button>
          <button
            type="button"
            onClick={() => {
              // Switch to 'chat' tab as default when selecting AI Workspace
              if (activeTab === 'tasks') {
                setActiveTab('chat');
              }
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab !== 'tasks'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            ✨ AI Companion & Plan
          </button>
        </div>
      </div>

      {/* BODY LAYOUT */}
      <div 
        id="layout-body" 
        className="flex flex-col flex-1 overflow-hidden relative z-10 bg-transparent"
        style={{ userSelect: isDragging ? 'none' : 'auto' }}
      >
        {activeTab === 'tasks' ? (
          /* LEFT PANEL: Task Sidebar (now fluid and full-width in single column layout) */
          <aside 
            id="sidebar" 
            className="bg-[#070A13]/95 flex flex-col overflow-hidden h-full flex-1 w-full"
          >
            {/* Top Resizable Section */}
            <div 
              className="flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar border-b border-slate-850/40"
              style={{ height: `${topSidebarHeight}px`, minHeight: '120px', maxHeight: '75vh' }}
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
                taskRecurring={taskRecurring}
                setTaskRecurring={setTaskRecurring}
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
              <div className="px-5 py-2.5 bg-slate-900/20 flex items-center justify-between text-xs flex-shrink-0">
                <span className="text-slate-200 font-extrabold uppercase tracking-widest text-[10px]">Priority Layout</span>
                <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSortBy('auto')}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      sortBy === 'auto'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-950/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`}
                    title="Sort automatically by status and deadline urgency"
                  >
                    ⚡ Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('custom')}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      sortBy === 'custom'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-950/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`}
                    title="Custom order. Drag and drop tasks in any sequence"
                  >
                    ↕️ Custom
                  </button>
                </div>
              </div>
            </div>

            {/* VERTICAL DIVIDER INSIDE SIDEBAR (↕ Arrows) with touch-none for perfect drag responsiveness */}
            <div
              className="h-1.5 hover:h-2 bg-slate-950/45 hover:bg-emerald-500/10 active:bg-emerald-500/25 border-y border-slate-850/50 cursor-row-resize select-none transition-all relative z-20 flex-shrink-0 flex items-center justify-center group/v touch-none"
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setDragType('topSidebarHeight'); }}
              onTouchStart={() => { setIsDragging(true); setDragType('topSidebarHeight'); }}
            >
              <div className="absolute flex items-center justify-center bg-slate-900 border border-slate-800 h-5 px-4 rounded-full shadow-md shadow-black/40 group-hover:border-emerald-500/30 transition-colors pointer-events-none">
                <span className="text-emerald-400 font-black text-[10px] select-none flex items-center gap-1.5 leading-none">
                  <span>↕</span>
                  <span className="text-[8px] text-slate-300 font-extrabold uppercase tracking-widest pl-0.5">Adjust Split</span>
                </span>
              </div>
            </div>

            {/* Scrollable Task List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {currentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl mb-4 shadow-sm animate-bounce duration-1000">
                    🎯
                  </div>
                  <p className="text-xs font-bold text-slate-200">No tasks planned yet</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium max-w-[210px] mx-auto">
                    Add tasks above to organize your goals, or load our pre-made onboarding workspace.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoTasks}
                    className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    📥 Load Demo Tasks
                  </button>
                </div>
              ) : currentTasks.filter(t => 
                  t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <span className="text-2xl mb-2">🔍</span>
                  <p className="text-xs font-bold text-slate-400">No matching task plans</p>
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

            {/* Quick onboarding demo/reset actions */}
            <div className="p-2.5 bg-slate-950/40 border-t border-slate-850/60 flex items-center justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleLoadDemoTasks}
                className="flex-1 bg-slate-900/60 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-850/60 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                title="Load onboarding sample tasks to help you explore"
              >
                📥 Load Demo
              </button>
              <button
                type="button"
                onClick={handleClearAllTasks}
                className="flex-1 bg-slate-900/60 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-slate-850/60 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1"
                title="Clear all tasks in the workspace to start perfectly fresh"
              >
                🗑️ Clear All
              </button>
            </div>

            {/* Footer Stats summary info */}
            <div id="stats-summary" className="p-4 border-t border-slate-850 bg-slate-950/20 flex-shrink-0 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-rose-400 font-mono">{overdueCount}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">🚨 Overdue</span>
              </div>
              <div className="flex flex-col border-x border-slate-850/60">
                <span className="text-sm font-extrabold text-emerald-400 font-mono">{pendingCount}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">⏳ Pending</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-400 font-mono">{completedCount}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">✅ Done</span>
              </div>
            </div>
          </aside>
        ) : (
          /* RIGHT PANEL: Main Tab Area (renders Chat, Planner, and Insights with clean unified selection tabs) */
          <main 
            id="main-content" 
            className="flex flex-col overflow-hidden bg-transparent flex-1 w-full h-full min-w-0"
          >
            {/* Main Panel Header Banner */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-850 bg-slate-900/10 flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
              <div>
                <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> TaskPulse Workspace
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {selectedTaskId
                    ? `Active Focus Context: "${currentTasks.find(t => t.id === selectedTaskId)?.title}"`
                    : 'Select any task checklist in the tasks view to load analytical checking'}
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

            {/* Navigation Tabs (Fully responsive selection bar) */}
            <div className="flex overflow-x-auto custom-scrollbar border-b border-slate-850/60 bg-slate-900/5 gap-1 py-1 px-4 sm:px-6 flex-shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2.5 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                💬 Companion Chat
              </button>
              <button
                onClick={() => { setActiveTab('schedule'); if (!scheduleData) handlePlanDay(); }}
                className={`py-2.5 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                📅 Schedule Planner
              </button>
              <button
                onClick={() => { setActiveTab('insights'); if (insights.length === 0) handleFullAnalysis(); }}
                className={`py-2.5 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'insights'
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
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
                  tasks={tasks}
                />
              </div>

            </div>
          </main>
        )}
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

      {/* Custom System Diagnostic Modal */}
      {diagnosticModal?.isOpen && (
        <DiagnosticModal
          isOpen={diagnosticModal.isOpen}
          title={diagnosticModal.title}
          message={diagnosticModal.message}
          details={diagnosticModal.details}
          status={diagnosticModal.status}
          onClose={() => setDiagnosticModal(null)}
        />
      )}
    </div>
  );
}
