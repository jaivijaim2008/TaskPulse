# ⚡ TaskPulse – AI Deadline Agent

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Google%20Cloud%20Run-4285F4?style=for-the-badge)](https://taskpulse-478025274381.asia-southeast1.run.app)
[![Hackathon](https://img.shields.io/badge/Vibe2Ship-Coding%20Ninjas%20×%20Google-FF6B35?style=for-the-badge)](https://blockseblock.com)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.0%20Flash-8E75B2?style=for-the-badge&logo=google)](https://aistudio.google.com)

**An AI-powered productivity companion that proactively helps you plan, prioritize, and complete tasks before deadlines are missed.**

🌐 Live App: https://taskpulse-478025274381.asia-southeast1.run.app

## 🎯 Problem Statement
The Last-Minute Life Saver — Vibe2Ship Hackathon (Coding Ninjas × Google for Developers). Students and professionals frequently miss deadlines. Existing tools rely on passive reminders that are easy to ignore.

## 💡 Solution
TaskPulse is an AI-powered deadline agent built on Gemini 1.5 Flash. It autonomously prioritizes workload, generates personalized schedules, breaks down complex tasks, and provides real-time productivity coaching through a conversational AI interface.

## ✨ Key Features
- 🔴 Visual Urgency Rings — live circular countdown rings that shift green → yellow → red as deadline approaches
- 🤖 Conversational AI Agent — chat naturally about tasks, get proactive personalized advice
- ⚡ Intelligent Task Prioritization — AI ranks all tasks by urgency, importance and workload
- 📅 Hourly Schedule Planner — one click generates full day schedule via Gemini
- 🧠 Workload Insights Dashboard — deep analysis of bottlenecks and risks
- 📋 Interactive Task Breakdown — Gemini decomposes any task into 5-7 timed subtasks
- 🏷️ Smart Categories — Work, Study, Personal, Health, Finance with priority levels

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| AI Engine | Google Gemini 2.0 Flash API |
| Backend | Node.js, Express, TypeScript |
| Deployment | Google Cloud Run |
| Dev Platform | Google AI Studio |

## 🌐 Google Technologies Used
| Technology | Usage |
|---|---|
| Google Gemini 2.0 Flash | Core AI for prioritization, scheduling, breakdown, agent chat |
| Google AI Studio | Development environment and deployment pipeline |
| Google Cloud Run | Serverless container deployment |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React 19 Frontend                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ TaskCard │  │  ChatPanel   │  │ Schedule │  │  Insights  │  │
│  │  (Urgency│  │  (Streaming  │  │  Panel   │  │   Panel    │  │
│  │  Rings)  │  │   Chat UI)   │  │          │  │            │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └─────┬──────┘  │
│       │               │               │              │          │
│  ┌────┴───────────────┴───────────────┴──────────────┴──────┐   │
│  │              localStorage (Tasks + Chat History)         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │              Quota Indicator UI (Polls /api/quota-status)│   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP (fetch + streaming)
┌─────────────────────────────┼───────────────────────────────────┐
│                     Express.js Server                            │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                  Rate Limiter (10 RPM)                    │   │
│  │              Response Cache (5-min TTL)                    │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │            Multi-Key Rotation Engine                      │   │
│  │    ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │   │
│  │    │Key #0│  │Key #1│  │Key #2│  │Key #3│  │Key #N│    │   │
│  │    └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘    │   │
│  │       └─────────┴─────────┴─────────┴─────────┘         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │              Fallback: Local Cognitive Engine              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              Google Gemini 1.5 Flash API                         │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│         │  /chat   │  │/breakdown│  │/schedule │  + /insights  │
│         └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User interacts with React components (Chat, Tasks, Schedule, Insights)
2. Frontend sends HTTP requests to Express server endpoints
3. Server checks **rate limiter** → **response cache** → selects an available **Gemini key**
4. If Gemini returns quota error, server **rotates to next key** automatically
5. If all keys exhausted, server falls back to **local cognitive engine** (scripted responses)
6. Responses stream back to the frontend via chunked transfer encoding
7. **Quota dashboard** polls `/api/quota-status` every 15s to show real-time usage

## 🚀 Local Setup
git clone https://github.com/jaivijaim2008/TaskPulse.git
cd TaskPulse
npm install
cp .env.example .env
Add GEMINI_API_KEY to .env
npm run dev

## 👨💻 Built By
Jai Vijai — Vibe2Ship Hackathon 2026 | Coding Ninjas × Google for Developers
