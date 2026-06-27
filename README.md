# ⚡ TaskPulse – AI Deadline Agent

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Google%20Cloud%20Run-4285F4?style=for-the-badge)](https://taskpulse-478025274381.asia-southeast1.run.app)
[![Hackathon](https://img.shields.io/badge/Vibe2Ship-Coding%20Ninjas%20×%20Google-FF6B35?style=for-the-badge)](https://blockseblock.com)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-8E75B2?style=for-the-badge&logo=google)](https://aistudio.google.com)

**An AI-powered productivity companion that proactively helps you plan, prioritize, and complete tasks before deadlines are missed.**

🌐 Live App: https://taskpulse-478025274381.asia-southeast1.run.app

## 🎯 Problem Statement
The Last-Minute Life Saver — Vibe2Ship Hackathon (Coding Ninjas × Google for Developers). Students and professionals frequently miss deadlines. Existing tools rely on passive reminders that are easy to ignore.

## 💡 Solution
TaskPulse is an AI-powered deadline agent built on Gemini 2.0 Flash. It autonomously prioritizes workload, generates personalized schedules, breaks down complex tasks, and provides real-time productivity coaching through a conversational AI interface.

## ✨ Key Features
- 🔴 Visual Urgency Rings — live circular countdown rings that shift green → yellow → red as deadline approaches
- 🤖 Conversational AI Agent — chat naturally about tasks, get proactive personalized advice
- ⚡ Intelligent Task Prioritization — AI ranks all tasks by urgency, importance and workload
- 📅 Hourly Schedule Planner — one click generates full day schedule via Gemini
- 🧠 Workload Insights Dashboard — deep analysis of bottlenecks and risks
- 📋 Interactive Task Breakdown — Gemini decomposes any task into 5-7 timed subtasks
- 🏷️ Smart Categories — Work, Study, Personal, Health, Finance with priority levels

## ⚙️ How It Works — Smart Quota Management

TaskPulse implements a multi-layered AI quota protection system that ensures the app stays available even when individual API keys hit rate limits — a critical engineering challenge for any Gemini-powered product.

### 🔑 Multi-Key Rotation
- Supports up to **10 Gemini API keys** (`GEMINI_API_KEY` through `GEMINI_API_KEY9`)
- When one key hits the free-tier quota (15 RPM / 1,500 RPD), the server **automatically rotates** to the next available key
- Exhausted keys are tracked with a cooldown timer and retried after 60 seconds
- Effectively **multiplies your daily quota** by the number of keys configured

### 🛡️ Rate Limiter
- Caps requests at **10 RPM** (safe margin under Gemini's 15 RPM limit) and **1,200 RPD** (under 1,500 limit)
- Enforces a **2-second cooldown** between consecutive API calls to prevent burst exhaustion
- Returns a `Retry-After` HTTP header so clients can intelligently wait

### 📦 Response Cache
- In-memory cache with **5-minute TTL** serves cached results for repeated/similar queries
- Cache keys include task state to prevent stale responses
- Prevents redundant API calls when users ask the same question twice

### 📊 Quota Dashboard
- Live **progress bar** in the header shows daily quota consumption
- Color-coded warnings (green → amber → red) as usage approaches limits
- Clickable tooltip shows detailed stats: minute/daily usage, key availability, cache size

```
Request Flow:
User Chat → Cache Hit? → Return cached (no API call)
           → Cache Miss → Rate Limit OK? → Gemini API → Cache + Return
                                  → Rate Limited → Fallback simulation
                                  → All Keys Exhausted → Local Engine
```

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| AI Engine | Google Gemini 1.5 Flash API |
| Backend | Node.js, Express, TypeScript |
| Deployment | Google Cloud Run |
| Dev Platform | Google AI Studio |

## 🌐 Google Technologies Used
| Technology | Usage |
|---|---|
| Google Gemini 1.5 Flash | Core AI for prioritization, scheduling, breakdown, agent chat |
| Google AI Studio | Development environment and deployment pipeline |
| Google Cloud Run | Serverless container deployment |

## 🚀 Local Setup
git clone https://github.com/jaivijaim2008/TaskPulse.git
cd TaskPulse
npm install
cp .env.example .env
Add GEMINI_API_KEY to .env
npm run dev

## 👨💻 Built By
Jai Vijai — Vibe2Ship Hackathon 2026 | Coding Ninjas × Google for Developers
