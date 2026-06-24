import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini client with standard User-Agent for telemetry
const getGeminiClient = () => {
  // Try GEMINI_API_KEY1 first as requested by the user, then GEMINI_API_KEY
  let apiKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GEMINI_API_KEY1 environment variable is missing. Please add your actual Gemini API Key under "Settings > Secrets" in the Google AI Studio panel.');
  }
  
  let cleanKey = apiKey.replace(/['"]/g, '').trim();
  
  // If cleanKey is placeholder, check if the other one is valid
  if (cleanKey === 'MY_GEMINI_API_KEY' || cleanKey === '' || cleanKey.includes('PLACEHOLDER') || cleanKey.includes('MY_API_KEY')) {
    const altKey = process.env.GEMINI_API_KEY === apiKey ? process.env.GEMINI_API_KEY1 : process.env.GEMINI_API_KEY;
    if (altKey) {
      const cleanAlt = altKey.replace(/['"]/g, '').trim();
      if (cleanAlt !== 'MY_GEMINI_API_KEY' && cleanAlt !== '' && !cleanAlt.includes('PLACEHOLDER') && !cleanAlt.includes('MY_API_KEY')) {
        cleanKey = cleanAlt;
      }
    }
  }

  // Double check if we still have a placeholder
  if (cleanKey === 'MY_GEMINI_API_KEY' || cleanKey === '' || cleanKey.includes('PLACEHOLDER') || cleanKey.includes('MY_API_KEY')) {
    throw new Error('Your GEMINI_API_KEY / GEMINI_API_KEY1 is currently set to the default placeholder ("MY_GEMINI_API_KEY"). Please replace this with your actual Gemini API Key in the "Settings > Secrets" panel of Google AI Studio.');
  }
  
  // Clean key helper for debugging
  const keyLength = cleanKey.length;
  const maskedKey = keyLength > 8 
    ? `${cleanKey.substring(0, 4)}...${cleanKey.substring(keyLength - 4)}`
    : 'Too short';

  // Soft check instead of strict exception to avoid blocking enterprise or alternative valid keys,
  // but still warn/error for clear typos or invalid keys.
  if (keyLength < 15) {
    throw new Error(`The loaded API key appears to be too short (length: ${keyLength} characters, loaded: "${maskedKey}"). Standard Gemini API keys are usually around 39-40 characters. Please check your "Settings > Secrets" configuration.`);
  }

  return new GoogleGenAI({
    apiKey: cleanKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
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
    const { message, tasks, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGeminiClient();
    const taskContext = getTaskContextString(tasks);

    const systemInstruction = `You are TaskPulse AI — an intelligent, proactive, and encouraging deadline-focused productivity companion.
Your job is to help users manage, prioritize, and crush their tasks before they run out of time.
You have access to the user's task list. Use this list to provide extremely tailored, contextual, and realistic support.
If the user feels overwhelmed, break things down and suggest what to tackle first. Keep your tone professional, direct, yet motivating.
Use markdown for formatting. Avoid dry developer or system telemetry details.

Current time context: ${new Date().toLocaleString('en-IN')}

User's current TaskPulse task list:
${taskContext}`;

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
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
      res.json({ subtasks: fallbackSubtasks.length > 0 ? fallbackSubtasks : [{ title: `Prepare for ${taskTitle}`, duration: 30 }] });
    }
  } catch (err: any) {
    console.error('Error in /api/breakdown:', err);
    res.status(500).json({ error: err.message || 'Failed to generate task breakdown' });
  }
});

// 3. GENERATE CHRONOLOGICAL SCHEDULE PLANNER
app.post('/api/schedule', async (req, res) => {
  try {
    const { tasks } = req.body;
    const ai = getGeminiClient();
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
      // Fallback simple schedule
      res.json({
        days: [
          {
            label: `Today - ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`,
            slots: [
              { time: "09:00 AM", task: "Tackle your top urgent task", desc: "Focus intensely for 90 minutes on your highest priority.", duration: "90 min" },
              { time: "11:00 AM", task: "Review and respond", desc: "Process emails, messages, and administrative actions.", duration: "45 min" },
              { time: "12:00 PM", task: "Midday Break & Recharge", desc: "Step away from the screen, stay hydrated.", duration: "60 min" }
            ]
          }
        ],
        advice: "Start with your most urgent deadline first thing to build unmatched momentum today."
      });
    }
  } catch (err: any) {
    console.error('Error in /api/schedule:', err);
    res.status(500).json({ error: err.message || 'Failed to generate schedule' });
  }
});

// 4. GENERATE STRATEGIC WORKLOAD INSIGHTS
app.post('/api/insights', async (req, res) => {
  try {
    const { tasks } = req.body;
    const ai = getGeminiClient();
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
      res.json({
        insights: [
          { icon: "💡", title: "Proactive Priority", text: "Group your similar tasks together to minimize context switching costs." },
          { icon: "⚡", title: "Urgency Strategy", text: "Prioritize deadlines occurring in the next 24 hours to clear mental bandwidth." }
        ]
      });
    }
  } catch (err: any) {
    console.error('Error in /api/insights:', err);
    res.status(500).json({ error: err.message || 'Failed to generate insights' });
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
