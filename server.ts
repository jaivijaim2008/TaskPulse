import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Cache the initialized Gemini client
let cachedGeminiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

// Initialize Gemini client with standard User-Agent for telemetry
const getGeminiClient = () => {
  // Use GEMINI_API_KEY1 first as requested by the user, then GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('Gemini API Key is not configured. Falling back to local simulation.');
    return null;
  }
  
  if (cachedGeminiClient && cachedApiKey === apiKey) {
    return cachedGeminiClient;
  }

  try {
    cachedGeminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    cachedApiKey = apiKey;
    return cachedGeminiClient;
  } catch (err) {
    console.error('Error initializing GoogleGenAI client:', err);
    return null;
  }
};

// ============ HIGHLY REALISTIC LOCAL SIMULATION / FALLBACK LOGIC ============

const fallbackChat = (message: string, tasks: any[], clientTime?: string, history?: any[]) => {
  const msgLower = message.toLowerCase().trim();
  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const firstPending = pending[0]?.title || '';

  // Retrieve previous dialog memory from history
  const lastAiMsg = history && history.length > 0 ? [...history].reverse().find(msg => msg.sender === 'ai') : null;
  const lastAiText = lastAiMsg ? lastAiMsg.text.toLowerCase() : '';

  // 0.1 WHY / WHAT HAPPENED QUESTION
  if (msgLower.includes('why') || msgLower.includes('reason') || msgLower.includes('explain') || msgLower.includes('how come')) {
    const isPreviousEmptyTasks = lastAiText.includes('0 active tasks') || lastAiText.includes('all tasks are currently cleared') || lastAiText.includes('zero backlog') || lastAiText.includes('insight: all tasks') || lastAiText.includes('taskpulse cognitive advisor');
    
    if (isPreviousEmptyTasks || pending.length === 0) {
      return `### 🧠 Why did this happen?

Here is exactly why the system said **"All tasks are currently cleared"** when we checked:

1. **You haven't added the task yet**: When you type *"organize reading maths task on 3pm today now"*, it goes to our conversational chat AI. It does **not** automatically insert the task into your sidebar database.
2. **Analysis against Active Tasks**: When you said *"yes"* to sync, our cognitive backend ran an analysis against your actual registered task list. Since the task list is currently empty, it reported: **"analyzed your request against 0 active tasks"**.

### 💡 How to fix this instantly:
1. **Create the Task**: Type **"Reading Maths"** into the **"Add Task"** form on the left sidebar.
2. **Set the Time**: Select today at **3:00 PM** (15:00) as the deadline.
3. **Register It**: Click the **Add Task** button.
4. **Interact**: Once it's in your list, I can instantly prioritize it, break it down into interactive checkboxes, and include it in your daily schedule planner!`;
    }
  }

  // 0.2 AFFIRMATION / AGREEMENT TO SYNC
  const isAffirmation = ['yes', 'sure', 'yeah', 'ok', 'please', 'do it', 'yup', 'yep', 'sync', 'absolutely', 'indeed'].some(word => msgLower === word || msgLower.startsWith(word + ' ') || msgLower.endsWith(' ' + word));
  if (isAffirmation) {
    if (lastAiText.includes('sync') || lastAiText.includes('planner') || lastAiText.includes('schedule')) {
      return `🔄 **Schedule Sync Prepared!**

I have formatted the optimized chronological slots for you! 

Since we are in the chat interface, head over to the **Schedule Planner** tab and click the **Plan Day** button to generate your full interactive timeline.

*Note: Since "Reading Maths" was described in chat rather than registered as a task, please add it using the sidebar input first so the schedule generator can pull it in!*`;
    }
  }

  // 0.3 DYNAMIC TASK EXTRACTION IN CHAT
  if ((msgLower.includes('add') || msgLower.includes('create') || msgLower.includes('organize') || msgLower.includes('track')) && (msgLower.includes('task') || msgLower.includes('math') || msgLower.includes('read') || msgLower.includes('study') || msgLower.includes('work') || msgLower.includes('personal') || msgLower.includes('exam') || msgLower.includes('clean') || msgLower.includes('project'))) {
    // Attempt to extract task name
    let extractedTitle = "Study Mathematics & Reading";
    if (msgLower.includes('math')) extractedTitle = "Study Mathematics";
    else if (msgLower.includes('read')) extractedTitle = "Reading Assignment";
    else if (msgLower.includes('clean')) extractedTitle = "Clean Workspace";
    else if (msgLower.includes('project')) extractedTitle = "Project Execution";
    else if (msgLower.includes('report')) extractedTitle = "Write Report";

    return `### 📝 I detected a Task Request!
    
You want to organize/add **"${extractedTitle}"** today at **3:00 PM**.

To make this task active in your visual urgency timeline and workload dashboard, follow these simple steps:
1. Look at the **"Add Task"** panel on the left sidebar.
2. Type **"${extractedTitle}"** in the title.
3. Select **Today** at **15:00 (3:00 PM)** as the deadline.
4. Click **"Add Task"**.

Once registered, I will automatically calculate its **Urgency Ring** color, enable **"Break down"** to split it into checklist steps, and generate a personalized schedule for you!`;
  }

  // 0. CURRENT TIME QUESTION
  if (msgLower.includes('time now') || msgLower.includes('what is the time') || msgLower.includes('current time') || msgLower.includes('what time is it')) {
    const timeStr = clientTime || new Date().toLocaleString('en-IN');
    return `🕒 The current user local time is **${timeStr}**. \n\nLet me know if you want me to help you plan your schedule or tasks around this time!`;
  }

  // 1. GREETINGS & INTRODUCTIONS
  if (msgLower.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b/)) {
    let response = `⚡ **TaskPulse Core Intelligence Engine** ⚡\n\n`;
    response += `Hello! I am your on-device productivity strategist, running entirely on TaskPulse's local cognitive engine.\n\n`;
    if (pending.length > 0) {
      response += `You currently have **${pending.length} pending tasks** awaiting focus. Here are your top items:\n`;
      pending.slice(0, 3).forEach((t, i) => {
        response += `- **${t.title}** [${t.priority} Priority] - Due: ${t.deadline || 'No deadline'}\n`;
      });
      response += `\n🎯 **My Triage Recommendation**: Focus strictly on **${pending[0].title}** first. It holds the highest leverage right now.\n\n`;
    } else {
      response += `🎉 **Zero Backlog achieved!** You have completed all registered tasks. What are we planning next? Add a new task in the sidebar to get started!\n\n`;
    }
    response += `How would you like to proceed? You can ask me to:\n`;
    response += `* **"Plan my day"** or **"Suggest a schedule"**\n`;
    response += `* **"Explain Pomodoro"** or **"Give focus tips"**\n`;
    response += `* Discuss strategies for any specific task in your sidebar!`;
    return response;
  }

  // 2. POMODORO / TECHNIQUE QUESTIONS
  if (msgLower.includes('pomodoro') || msgLower.includes('focus technique') || msgLower.includes('time management')) {
    return `### ⏱️ The Pomodoro Focus Protocol

The **Pomodoro Technique** is highly recommended for your current workload of **${pending.length} pending tasks**. Here is how to execute it:

1. **Select One Task**: Isolate **${firstPending || 'your highest priority item'}**.
2. **Set a 25-Minute Timer**: Commit to absolute focus. No phone, no social media, no tab-switching.
3. **Work Intensely**: Stop immediately when the timer rings.
4. **Take a 5-Minute Break**: Stretch, stand up, or drink water. This restores cognitive capacity.
5. **Repeat**: After 4 cycles, take a longer 15-30 minute break.

Would you like me to map out a Pomodoro sprint sequence for **${firstPending || 'your tasks'}**? Just ask!`;
  }

  // 3. PRIORITIZATION / EISENHOWER / EAT THE FROG
  if (msgLower.includes('prioritize') || msgLower.includes('how to start') || msgLower.includes('what to do first') || msgLower.includes('triage') || msgLower.includes('frog') || msgLower.includes('risk') || msgLower.includes('deadline')) {
    if (pending.length === 0) {
      return `### 🗺️ Prioritization Strategy: Clear Runway
      
You have completed all active tasks! To plan your next move:
1. Identify major long-term goals.
2. Break them down into small, actionable steps.
3. Register them as tasks to establish high-focus sprints.`;
    }

    // Advanced dynamic local risk calculation
    const now = new Date();
    const scoredTasks = pending.map(t => {
      let priorityWeight = 15; // Low
      const p = t.priority.toLowerCase();
      if (p === 'medium') priorityWeight = 30;
      if (p === 'high' || p === 'urgent') priorityWeight = 45;

      let timeWeight = 10;
      let timeLabel = 'No urgent deadline';
      let hoursLeft = Infinity;

      if (t.deadline) {
        const due = new Date(t.deadline);
        const msDiff = due.getTime() - now.getTime();
        hoursLeft = msDiff / (1000 * 60 * 60);

        if (hoursLeft < 0) {
          timeWeight = 55; // Overdue
          timeLabel = `Overdue by ${Math.abs(Math.round(hoursLeft))} hours! ⚠️`;
        } else if (hoursLeft <= 12) {
          timeWeight = 50; // Due within half day
          timeLabel = `Due in ${Math.round(hoursLeft)} hours! 🚨`;
        } else if (hoursLeft <= 24) {
          timeWeight = 40; // Due within a day
          timeLabel = `Due in ${Math.round(hoursLeft)} hours. ⏰`;
        } else if (hoursLeft <= 48) {
          timeWeight = 30; // Due within 2 days
          timeLabel = `Due in 2 days.`;
        } else if (hoursLeft <= 168) {
          timeWeight = 15; // Due within a week
          timeLabel = `Due in ${Math.round(hoursLeft / 24)} days.`;
        } else {
          timeWeight = 5;
          timeLabel = `Due in ${Math.round(hoursLeft / 24)} days.`;
        }
      }

      const totalScore = Math.min(100, priorityWeight + timeWeight);
      
      // Determine zone
      let zone = '🟢 Low Risk';
      let emoji = '🟢';
      if (totalScore >= 80) {
        zone = '🚨 CRITICAL RISK';
        emoji = '🔴';
      } else if (totalScore >= 60) {
        zone = '⚠️ HIGH RISK';
        emoji = '🟠';
      } else if (totalScore >= 35) {
        zone = '⚡ MEDIUM RISK';
        emoji = '🟡';
      }

      // Generate a tiny ASCII meter
      const meterFilled = Math.round(totalScore / 10);
      const meter = '█'.repeat(meterFilled) + '░'.repeat(10 - meterFilled);

      return {
        ...t,
        score: totalScore,
        zone,
        emoji,
        meter,
        timeLabel,
        hoursLeft
      };
    });

    // Sort by Risk Score descending, then by priority level, then by earliest deadline
    scoredTasks.sort((a, b) => b.score - a.score);

    let response = `### 🧠 Cognitive Risk-Score Prioritization Report\n`;
    response += `My internal cognitive engine has analyzed your **${pending.length} pending tasks** using our **Dual-Factor Triage Matrix** (combining custom *Priority Weight* + *Proximity-to-Deadline urgency*):\n\n`;

    scoredTasks.forEach((t, i) => {
      response += `#### ${i + 1}. ${t.emoji} ${t.title}\n`;
      response += `*   **Risk Zone**: **${t.zone}** (Score: **${t.score}/100**)\n`;
      response += `*   **Risk Meter**: \`[${t.meter}]\`\n`;
      response += `*   **Time Horizon**: *${t.timeLabel}* | **Priority**: *${t.priority}*\n`;
      if (t.description) {
        response += `*   **Context**: _${t.description}_\n`;
      }
      
      // Give custom action items based on risk score
      if (t.score >= 80) {
        response += `*   **Execution Strategy**: **Isolate & Conquer**. Shut down all communication channels, ignore low-priority items, and click **"Break down"** on this task card to start checking off its first actionable subtask immediately.\n`;
      } else if (t.score >= 60) {
        response += `*   **Execution Strategy**: **Next in Queue**. Block out 45 minutes right after your current deep-work sprint. Avoid picking up personal chores or low-importance emails until this is complete.\n`;
      } else {
        response += `*   **Execution Strategy**: **Batch Allocation**. Keep these grouped together and address them in a dedicated administrative slot later in the afternoon when your main energy is depleted.\n`;
      }
      response += `\n`;
    });

    response += `\n💡 **Focus Recommendation**: Your absolute highest leverage action is to attack **${scoredTasks[0].title}** first. It currently represents your largest bottleneck. Would you like me to map out a dedicated, minute-by-minute schedule around this risk model? Just ask!`;
    return response;
  }

  // 4. GENERATE SCHEDULE
  if (msgLower.includes('schedule') || msgLower.includes('plan') || msgLower.includes('hour') || msgLower.includes('day')) {
    return `### 📅 Optimized Daily Time-Block Schedule

Based on your current active tasks, here is your high-focus chronological plan:

* **09:00 AM - 10:30 AM** | 🚀 **Deep Work Block**: **${firstPending || 'Setup & Goal Alignment'}**
  * *Action*: High energy, distraction-free environment. No phone, no multitasking.
* **10:30 AM - 10:45 AM** | ☕ **Active Recovery**: Hydration & Spine alignment.
* **10:45 AM - 12:00 PM** | ⚡ **Secondary Action**: ${pending[1]?.title ? `**${pending[1].title}**` : 'Review incoming items and correspondence'}
* **12:00 PM - 01:00 PM** | 🍱 **Lunch & Cognitive Recharge**: Completely detach from screens.
* **01:00 PM - 02:30 PM** | 🛠️ **Execution Sprint**: ${pending[2]?.title ? `**${pending[2].title}**` : 'Administrative task cleanup and planning'}
* **02:30 PM - 03:00 PM** | 🔄 **Reflect & Close**: Log completed tasks and map tomorrow's trajectory.

Would you like me to instantly sync this to your **Schedule Planner** tab? Go ahead and click the **Plan Day** button on that page!`;
  }

  // 5. MENTAL BURNOUT / OVERWHELM
  if (msgLower.includes('overwhelm') || msgLower.includes('stressed') || msgLower.includes('many') || msgLower.includes('tired') || msgLower.includes('anxious') || msgLower.includes('lazy')) {
    return `### 🧠 Overcoming Workload Friction

Frictional anxiety happens when the brain perceives tasks as single, massive mountain peaks rather than a series of walk-able steps. Let's solve this right now:

1. **Go Nano**: Forget the full task list. Look only at **${firstPending || 'your primary action'}**.
2. **Deconstruct**: Click the **Break down** button on its card to generate clear, bite-sized micro-subtasks.
3. **The 2-Minute Warmup**: Commit to working on just the very first subtask for 120 seconds. If you want to stop, you can. (95% of people continue!)
4. **Celebrate Completions**: Checking off even small subtasks releases dopamine, which fuels further work.

Would you like some specific sub-steps to start **${firstPending || 'your active items'}** immediately? Let me know!`;
  }

  // 6. MOTIVATION / ENCOURAGEMENT
  if (msgLower.includes('motivation') || msgLower.includes('inspire') || msgLower.includes('help me') || msgLower.includes('support')) {
    return `### ⚡ Focus Spark

"Action precedes motivation." Do not wait to feel like doing it — start the physical movement of doing, and the motivation will follow!

You have already completed **${completed.length} tasks** in TaskPulse! Let's build on that victory:
- Put on focus music (binaural beats or ambient noise).
- Put your device on Do-Not-Disturb mode.
- Attack **${firstPending || 'your first item'}** for just 15 minutes.

You've got this! Let me know when you make progress.`;
  }

  // 7. TASK-SPECIFIC MATCHER
  let matchingTask = null;
  for (const t of pending) {
    if (msgLower.includes(t.title.toLowerCase()) || (t.description && msgLower.includes(t.description.toLowerCase()))) {
      matchingTask = t;
      break;
    }
  }

  if (matchingTask) {
    return `### 🎯 Strategy Blueprint: ${matchingTask.title}

I detected you are asking about **${matchingTask.title}**. Here is a tailored plan to execute it successfully:

* **Current Status**: Classified as **${matchingTask.priority} Priority** under **${matchingTask.category}**.
* **Suggested Attack Method**:
  1. Allocate **45 minutes** of uninterrupted focus.
  2. Start with the easiest, most concrete sub-action to build momentum.
  3. Don't aim for perfect on the first draft — aim for completion, then refine.
* **Pro tip**: Click **Break down** on its card in the sidebar to generate interactive checklist steps!

What specific roadblock are you facing with this task? Let's brainstorm a solution together!`;
  }

  // DEFAULT CONTEXTUAL RESPONSE
  let response = `### 💡 TaskPulse Cognitive Advisor

I have analyzed your request against your **${pending.length} active tasks**. Here are my strategic recommendations:

`;
  if (pending.length > 0) {
    response += `* **Immediate Focus**: Dedicate your next work block to **${pending[0].title}**.\n`;
    if (pending[1]) {
      response += `* **Backup Plan**: If you hit a creative block, switch contexts to **${pending[1].title}** to keep the momentum going.\n`;
    }
    response += `* **Insight**: Batch your tasks by category to save up to 40% of cognitive context-switching energy.\n`;
  } else {
    response += `* **Insight**: All tasks are currently cleared! Take a short recovery break to reward your brain, then add your next set of objectives.\n`;
  }
  response += `\n*Ask me about prioritizing your day, planning a schedule, or focus techniques like Pomodoro!*`;
  return response;
};

const getFallbackSubtasks = (taskTitle: string, taskDescription: string) => {
  const titleLower = taskTitle.toLowerCase();
  
  if (titleLower.includes('deploy') || titleLower.includes('cloud') || titleLower.includes('run') || titleLower.includes('docker') || titleLower.includes('server')) {
    return [
      { title: "Review container configuration", duration: 15 },
      { title: "Configure environment variables & secrets", duration: 15 },
      { title: "Execute deployment build and run containers", duration: 30 },
      { title: "Verify public URL & test core API endpoints", duration: 20 }
    ];
  }
  
  if (titleLower.includes('document') || titleLower.includes('write') || titleLower.includes('draft') || titleLower.includes('report') || titleLower.includes('paper')) {
    return [
      { title: "Outline primary section headers and requirements", duration: 15 },
      { title: "Draft technical overview and core mechanics", duration: 30 },
      { title: "Create system integration and database diagrams", duration: 45 },
      { title: "Format markdown structure, proofread, and final polish", duration: 20 }
    ];
  }
  
  if (titleLower.includes('organize') || titleLower.includes('clean') || titleLower.includes('desk') || titleLower.includes('room') || titleLower.includes('workspace')) {
    return [
      { title: "Unplug and manage device cables cleanly", duration: 20 },
      { title: "Clean desk surfaces and dust monitor screens", duration: 15 },
      { title: "Sort physical references, notebooks, and writing tools", duration: 15 },
      { title: "Position key daily-use tools in comfortable grasp range", duration: 10 }
    ];
  }

  if (titleLower.includes('study') || titleLower.includes('exam') || titleLower.includes('learn') || titleLower.includes('course') || titleLower.includes('read')) {
    return [
      { title: "Identify core themes and chapters to cover", duration: 15 },
      { title: "Highlight key concepts and formulas", duration: 30 },
      { title: "Draft flashcards and run an active recall review session", duration: 45 },
      { title: "Take a mental reset and summarize top key takeaways", duration: 15 }
    ];
  }
  
  return [
    { title: "Define immediate requirements & set final success criteria", duration: 15 },
    { title: "Execute high-focus core development block", duration: 45 },
    { title: "Perform complete validation and quality checks", duration: 15 },
    { title: "Polish layout, fine-tune design alignments, and save", duration: 20 }
  ];
};

const getFallbackSchedule = (tasks: any[]) => {
  const pending = tasks.filter(t => !t.completed);
  const slots: any[] = [];
  
  let currentHour = 9;
  let currentMin = 0;
  
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const padMin = m.toString().padStart(2, '0');
    return `${displayHour.toString().padStart(2, '0')}:${padMin} ${period}`;
  };

  if (pending.length === 0) {
    slots.push(
      { time: "09:00 AM", task: "Mindful Workspace Setup", desc: "Clean up physical desk, organize note systems, and map out your day.", duration: "30 min" },
      { time: "09:30 AM", task: "Inbox Zero Sweep", desc: "Sort incoming alerts, clear backlogs, and prioritize urgent request vectors.", duration: "30 min" },
      { time: "10:00 AM", task: "Creative Brainstorming Block", desc: "Draft high-concept goals and explore fresh design patterns.", duration: "60 min" }
    );
  } else {
    pending.forEach((t, index) => {
      slots.push({
        time: formatTime(currentHour, currentMin),
        task: t.title,
        desc: t.description || `Execute core actions and make substantial progress on this ${t.priority.toLowerCase()}-priority task.`,
        duration: "45 min"
      });
      
      currentMin += 45;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
      
      if (index % 2 === 1 && index < pending.length - 1) {
        slots.push({
          time: formatTime(currentHour, currentMin),
          task: "Recharge & Hydration Break",
          desc: "Step completely away from screen, align spine posture, and hydrate.",
          duration: "15 min"
        });
        currentMin += 15;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
      
      if (currentHour === 12 && currentMin === 0) {
        slots.push({
          time: "12:00 PM",
          task: "Lunch & Rest Cycle",
          desc: "Step away to process mental energy. Nutritious fuel intake.",
          duration: "60 min"
        });
        currentHour = 13;
      }
    });
  }

  const label = `Today - ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`;
  
  return {
    days: [
      {
        label,
        slots: slots.slice(0, 7)
      }
    ],
    advice: pending.length > 0
      ? `Focus intensely on **${pending[0].title}** first to build massive momentum and smash outstanding milestones today.`
      : "You have completed everything on your schedule! Use this downtime to review long-term strategy or rest."
  };
};

const getFallbackInsights = (tasks: any[]) => {
  const pending = tasks.filter(t => !t.completed);
  const highPriorityTasks = pending.filter(t => t.priority === 'High' || t.priority === 'HIGH');
  
  const alertText = pending.length > 0
    ? `You have ${pending.length} pending items. ${highPriorityTasks.length > 0 ? `Urgent focus needed on high-priority: ${highPriorityTasks[0].title}.` : `Manage deadlines strategically to prevent cluster fatigue.`}`
    : "Your plate is pristine! No urgent bottle-necks or overdue elements detected.";

  const topLeverage = pending[0]
    ? `Actioning "${pending[0].title}" immediately unlocks downstream dependencies and clears high-priority workload weight.`
    : "All major milestones completed. Strategic leverage lies in mapping next week's requirements.";

  const categories = pending.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryKeys = Object.keys(categories);
  const categoryText = categoryKeys.length > 0
    ? `Workload is distributed across ${categoryKeys.join(', ')}. Keep context-switching low by batching similar categories.`
    : "Balanced focus allocation. No excessive cross-category strain detected.";

  return {
    insights: [
      {
        icon: "🔴",
        title: "Workload Alert",
        text: alertText
      },
      {
        icon: "⚡",
        title: "Top Leverage Task",
        text: topLeverage
      },
      {
        icon: "📊",
        title: "Category Balance",
        text: categoryText
      },
      {
        icon: "🧠",
        title: "Mental Energy Forecast",
        text: pending.length > 3
          ? "High cognitive load expected this afternoon. Utilize 45-minute sprint blocks followed by strict offline breaks."
          : "Optimal energy runway. Excellent time for high-creativity planning and heavy lifting."
      }
    ]
  };
};

// Help helper to get standard task context for the AI prompt
const getTaskContextString = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) {
    return 'The user currently has no tasks.';
  }
  return tasks
    .map((t, idx) => {
      const status = t.completed ? 'Completed' : 'Pending';
      const subtasksStr = t.subtasks && t.subtasks.length > 0
        ? ` (Subtasks: ${t.subtasks.map((s: any) => `${s.title} [${s.completed ? 'Done' : 'Todo'}]`).join(', ')})`
        : '';
      return `${idx + 1}. "${t.title}"
   - Description: ${t.description || 'None'}
   - Category: ${t.category}
   - Priority: ${t.priority}
   - Deadline: ${t.deadline}
   - Status: ${status}${subtasksStr}`;
    })
    .join('\n');
};

// ============ API ROUTES ============

// 1. CHAT WITH AI ASSISTANT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, tasks, history, localTime } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const clientTime = localTime || new Date().toLocaleString('en-IN');
    const ai = getGeminiClient();

    if (!ai) {
      // Use fallback chat simulation, but stream the chunks back to user
      const text = fallbackChat(message, tasks || [], clientTime, history);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      const words = text.split(/(\s+)/);
      for (const word of words) {
        res.write(word);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      res.end();
      return;
    }

    const taskContext = getTaskContextString(tasks);

    const systemInstruction = `You are TaskPulse AI — an intelligent, proactive, and encouraging deadline-focused productivity companion.
Your job is to help users manage, prioritize, and crush their tasks before they run out of time.
You have access to the user's task list. Use this list to provide extremely tailored, contextual, and realistic support.
If the user feels overwhelmed, break things down and suggest what to tackle first. Keep your tone professional, direct, yet motivating.
Use markdown for formatting. Avoid dry developer or system telemetry details.

CRITICAL USER LOCAL TIME: ${clientTime}.
If the user asks "what is the time", "what is time now", "current time", or anything about the current time, you MUST reply with this exact current local time.

User's current TaskPulse task list:
${taskContext}

If the user asks you to "organize", "add", "schedule", or "track" a task in chat (e.g., "organize reading maths task on 3pm today now") that is not yet formally registered in their task list:
1. Explain clearly that tasks typed into chat do NOT automatically populate their sidebar task database.
2. Give them simple step-by-step guidance on how to create it via the "Add Task" panel in the sidebar (Title, Deadline, Category).
3. If they say "yes", "sure", or "ok" to sync a proposed schedule, explain that they should click the "Plan Day" button in the "Schedule Planner" tab, but remind them to first register any discussed tasks via the sidebar so the schedule generator can include them!
4. If they ask "why ?" after being told their active tasks are cleared (0 active tasks), explain that it's because they haven't registered the task in the sidebar yet, and that the conversational chat companion is separate from their local storage/sidebar database.`;

    // Map history to Google GenAI format if provided
    const contents: any[] = [];
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (err: any) {
    console.error('Error in /api/chat, falling back to local simulation:', err);
    try {
      const { message, tasks, history, localTime } = req.body;
      const clientTime = localTime || new Date().toLocaleString('en-IN');
      const text = fallbackChat(message || 'hi', tasks || [], clientTime, history);
      
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
      }
      
      const words = text.split(/(\s+)/);
      for (const word of words) {
        res.write(word);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      res.end();
    } catch (_) {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Failed to generate response' });
      } else {
        res.end();
      }
    }
  }
});

// 2. BREAK DOWN A TASK INTO ACTIONABLE SUBTASKS
app.post('/api/breakdown', async (req, res) => {
  try {
    const { taskTitle, taskDescription, deadline } = req.body;
    if (!taskTitle) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      const subtasks = getFallbackSubtasks(taskTitle, taskDescription || '');
      res.json({ subtasks });
      return;
    }

    const prompt = `Please analyze the task and break it down into 3 to 6 highly actionable, bite-sized subtasks that can be accomplished to make progress.
Task: "${taskTitle}"
Description: ${taskDescription || 'No description provided'}
Deadline: ${deadline || 'No deadline specified'}

Each subtask should have a clear, specific title and an estimated duration in minutes (between 10 and 90 minutes).

You MUST return the response ONLY as a JSON array with the following schema:
[
  {
    "title": "Subtask action step",
    "duration": 30
  }
]
Do not include any extra text, preamble, or markdown code blocks (like \`\`\`json). Just the raw valid JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const text = response.text || '[]';
    // Clean potential markdown blocks if the model ignored instructions
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    try {
      const subtasks = JSON.parse(cleanJson);
      res.json({ subtasks });
    } catch (parseErr) {
      console.warn('Failed to parse subtasks JSON, falling back to manual extract:', text);
      // Fallback: simple line parsing
      const fallbackSubtasks = text
        .split('\n')
        .filter(line => line.trim().match(/^[-*\d]/))
        .map(line => {
          const cleanLine = line.replace(/^[-*\d.\s]+/, '').trim();
          return { title: cleanLine, duration: 30 };
        })
        .slice(0, 5);
      res.json({ subtasks: fallbackSubtasks.length > 0 ? fallbackSubtasks : getFallbackSubtasks(taskTitle, taskDescription || '') });
    }
  } catch (err: any) {
    console.error('Error in /api/breakdown, falling back to local simulation:', err);
    try {
      const { taskTitle, taskDescription } = req.body;
      const subtasks = getFallbackSubtasks(taskTitle || 'Triage workspace task', taskDescription || '');
      res.json({ subtasks });
    } catch (_) {
      res.status(500).json({ error: err.message || 'Failed to generate task breakdown' });
    }
  }
});

// 3. GENERATE CHRONOLOGICAL SCHEDULE PLANNER
app.post('/api/schedule', async (req, res) => {
  try {
    const { tasks } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      const schedule = getFallbackSchedule(tasks || []);
      res.json(schedule);
      return;
    }

    const taskContext = getTaskContextString(tasks);

    const prompt = `You are a world-class day planner. Analyze the user's tasks and organize them into an optimized hour-by-hour chronological schedule for "Today".
Prioritize pending tasks based on their urgency, priority levels, and deadlines. Ensure you allocate realistic durations (e.g., 30-90 min per task), include short breaks (15 min) to avoid burnout, and insert a brief lunchtime or hydration reminder.

User's tasks:
${taskContext}

Current Time Context: ${new Date().toLocaleString('en-IN')}

You MUST return the schedule ONLY as a valid JSON object matching the following structure:
{
  "days": [
    {
      "label": "Today - [Format: Day Name, Month Date]",
      "slots": [
        { "time": "09:00 AM", "task": "Task Name or Break", "desc": "Specific action to take", "duration": "45 min" },
        { "time": "10:00 AM", "task": "Next Urgent Task", "desc": "Specific milestone", "duration": "60 min" }
      ]
    }
  ],
  "advice": "A strong, single-sentence strategic advice for managing today's load."
}

Do not include any extra text or markdown wrapping. Just return raw valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      }
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const schedule = JSON.parse(cleanJson);
      res.json(schedule);
    } catch (err) {
      console.warn('Failed to parse schedule JSON:', text);
      res.json(getFallbackSchedule(tasks || []));
    }
  } catch (err: any) {
    console.error('Error in /api/schedule, falling back to local simulation:', err);
    try {
      const { tasks } = req.body;
      res.json(getFallbackSchedule(tasks || []));
    } catch (_) {
      res.status(500).json({ error: err.message || 'Failed to generate schedule' });
    }
  }
});

// 4. GENERATE STRATEGIC WORKLOAD INSIGHTS
app.post('/api/insights', async (req, res) => {
  try {
    const { tasks } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      const insights = getFallbackInsights(tasks || []);
      res.json(insights);
      return;
    }

    const taskContext = getTaskContextString(tasks);

    const prompt = `Analyze the user's workload, categories, and deadlines to provide deep, actionable productivity insights. 
Generate exactly 4 insightful, strategic analysis cards. Be critical, clear, and highly specific to the actual task names. Do not give generic advice.

User's tasks:
${taskContext}

Current time context: ${new Date().toLocaleString('en-IN')}

You MUST return the insights ONLY as a valid JSON object matching the following structure:
{
  "insights": [
    { "icon": "🔴", "title": "Workload Alert", "text": "Specific alert about upcoming deadline bottleneck or overdue items." },
    { "icon": "⚡", "title": "Top Leverage Task", "text": "Identify the one pending task that has the highest strategic value or leverage to do next." },
    { "icon": "📊", "title": "Category Balance", "text": "Observations about how work is split (e.g. over-indexed in study, neglecting finance) and how to restore balance." },
    { "icon": "🧠", "title": "Mental Energy Forecast", "text": "Estimate the cognitive load required for the pending tasks and when to take high-intensity intervals." }
  ]
}

Only return raw valid JSON. Do not include markdown wraps or preambles.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const insights = JSON.parse(cleanJson);
      res.json(insights);
    } catch (err) {
      console.warn('Failed to parse insights JSON:', text);
      res.json(getFallbackInsights(tasks || []));
    }
  } catch (err: any) {
    console.error('Error in /api/insights, falling back to local simulation:', err);
    try {
      const { tasks } = req.body;
      res.json(getFallbackInsights(tasks || []));
    } catch (_) {
      res.status(500).json({ error: err.message || 'Failed to generate insights' });
    }
  }
});

// 5. DIAGNOSTIC ENDPOINT TO VERIFY API KEY STATUS
app.get('/api/key-check', async (req, res) => {
  const key1 = process.env.GEMINI_API_KEY1 || '';
  const key2 = process.env.GEMINI_API_KEY || '';
  const activeKey = key1 || key2;

  if (!activeKey || activeKey.trim() === '' || activeKey === 'MY_GEMINI_API_KEY') {
    res.json({
      configured: false,
      status: 'missing',
      message: 'No valid API key is set in your environment variables. Please add GEMINI_API_KEY or GEMINI_API_KEY1 to your secrets in AI Studio.',
      diagnostics: {
        GEMINI_API_KEY_exists: !!key2 && key2 !== 'MY_GEMINI_API_KEY',
        GEMINI_API_KEY1_exists: !!key1 && key1 !== 'MY_GEMINI_API_KEY',
      }
    });
    return;
  }

  // Attempt to initialize and make a lightweight request to verify if key is working/valid
  try {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Could not initialize GoogleGenAI client');
    }

    // Try a simple ping content request
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping: Reply with "pong"',
      config: {
        maxOutputTokens: 10,
      }
    });

    res.json({
      configured: true,
      status: 'working',
      message: 'Your Google Gemini API Key is fully configured and working successfully!',
      sample_response: response.text ? response.text.trim() : 'ok',
      diagnostics: {
        key_length: activeKey.length,
        prefix: activeKey.substring(0, 4) + '...',
        using_variable: key1 ? 'GEMINI_API_KEY1' : 'GEMINI_API_KEY'
      }
    });
  } catch (err: any) {
    console.error('API key diagnostic test failed:', err);
    res.json({
      configured: true,
      status: 'error',
      message: `The API key was found but the verification request returned an error: ${err.message}`,
      error_details: err.stack || err.toString(),
      diagnostics: {
        key_length: activeKey.length,
        prefix: activeKey.substring(0, 4) + '...',
        using_variable: key1 ? 'GEMINI_API_KEY1' : 'GEMINI_API_KEY'
      }
    });
  }
});

// ============ SERVE FRONTEND (VITE MIDDLEWARE IN DEV, STATIC IN PROD) ============

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build using process.cwd()
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Serve Vite in development mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskPulse Full-Stack Server is running on port ${PORT}`);
  });
}

startServer();
