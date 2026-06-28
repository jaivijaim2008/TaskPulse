import React, { useState, useEffect } from 'react';
import { ScheduleData } from '../types';
import { Calendar, RefreshCw, Brain, Check, Loader2, Plus, CalendarDays, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getCachedAccessToken, connectGoogleCalendar } from '../lib/firebase';

interface SchedulePanelProps {
  scheduleData: ScheduleData | null;
  handlePlanDay: () => void;
}

// Google Calendar Event Formatters
function formatEventTime(event: any): string {
  if (event.start?.date) {
    return 'All Day';
  }
  const startStr = event.start?.dateTime;
  const endStr = event.end?.dateTime;
  if (!startStr) return '';
  const startDate = new Date(startStr);
  const endDate = endStr ? new Date(endStr) : null;
  
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const startFormatted = startDate.toLocaleTimeString([], options);
  const endFormatted = endDate ? endDate.toLocaleTimeString([], options) : '';
  
  return endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;
}

function formatEventDay(event: any): string {
  const dateStr = event.start?.dateTime || event.start?.date;
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

// Robust date-time parser for standard hour-by-hour task schedules
function parseSlotDateTime(dayLabel: string, timeStr: string, durationStr: string): { start: Date; end: Date } {
  const now = new Date();
  let targetDate = new Date();
  const label = dayLabel.toLowerCase();
  
  if (label.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
  } else if (label.includes('today')) {
    // Keep today's date
  } else {
    const parsed = Date.parse(dayLabel);
    if (!isNaN(parsed)) {
      targetDate = new Date(parsed);
    } else {
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const foundIdx = weekdays.findIndex(w => label.includes(w));
      if (foundIdx !== -1) {
        const currentDay = now.getDay();
        let diff = foundIdx - currentDay;
        if (diff < 0) diff += 7; // Sync for upcoming weekday
        targetDate.setDate(now.getDate() + diff);
      }
    }
  }

  let hours = 9;
  let minutes = 0;
  const timeRegex = /(\d+):(\d+)\s*(AM|PM)?/i;
  const match = timeStr.match(timeRegex);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  }

  const start = new Date(targetDate);
  start.setHours(hours, minutes, 0, 0);

  let durationMinutes = 60; // default to 1 hour
  const durStr = durationStr.toLowerCase();
  if (durStr.includes('h') || durStr.includes('hour')) {
    const hoursMatch = durStr.match(/(\d+(\.\d+)?)\s*(h|hour)/);
    if (hoursMatch) {
      durationMinutes = Math.round(parseFloat(hoursMatch[1]) * 60);
    }
  } else if (durStr.includes('m') || durStr.includes('min')) {
    const minsMatch = durStr.match(/(\d+)\s*(m|min)/);
    if (minsMatch) {
      durationMinutes = parseInt(minsMatch[1], 10);
    }
  }

  const end = new Date(start);
  end.setMinutes(start.getMinutes() + durationMinutes);

  return { start, end };
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  scheduleData,
  handlePlanDay
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [syncingSlotKey, setSyncingSlotKey] = useState<string | null>(null);
  const [syncedSlots, setSyncedSlots] = useState<Record<string, boolean>>({});
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Google Calendar live agenda states
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [showAgenda, setShowAgenda] = useState<boolean>(true);

  useEffect(() => {
    const token = getCachedAccessToken();
    setIsConnected(!!token);
    if (token) {
      autoFetchEvents(token);
    }
  }, []);

  const autoFetchEvents = async (token: string) => {
    setLoadingEvents(true);
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfToday.toISOString()}&timeMax=${endOfTomorrow.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarEvents(data.items || []);
      }
    } catch (err) {
      console.error("Auto-fetch Google Calendar events failed:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleFetchCalendarEvents = async () => {
    let token = getCachedAccessToken();
    if (!token) {
      token = await connectGoogleCalendar();
      if (!token) {
        setSyncError("Please connect your Google Calendar first.");
        setTimeout(() => setSyncError(null), 3500);
        return;
      }
      setIsConnected(true);
    }

    setLoadingEvents(true);
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfToday.toISOString()}&timeMax=${endOfTomorrow.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setCalendarEvents(data.items || []);
      setSyncSuccess("Loaded Google Calendar events!");
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setSyncError("Failed to fetch calendar events.");
      setTimeout(() => setSyncError(null), 3500);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleConnect = async () => {
    const token = await connectGoogleCalendar();
    if (token) {
      setIsConnected(true);
      setSyncSuccess("Connected to Google Calendar!");
      setTimeout(() => setSyncSuccess(null), 3000);
      autoFetchEvents(token);
    } else {
      setSyncError("Google Calendar authorization failed.");
      setTimeout(() => setSyncError(null), 3500);
    }
  };

  const handleSyncSlot = async (dayLabel: string, slot: any, key: string) => {
    let token = getCachedAccessToken();
    if (!token) {
      token = await connectGoogleCalendar();
      if (!token) {
        setSyncError("Please connect your Google Calendar first.");
        setTimeout(() => setSyncError(null), 3500);
        return;
      }
      setIsConnected(true);
    }

    setSyncingSlotKey(key);
    const { start, end } = parseSlotDateTime(dayLabel, slot.time, slot.duration);

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: slot.task,
          description: slot.desc || "Scheduled via AI TaskPulse Companion",
          start: {
            dateTime: start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (!response.ok) {
        throw new Error("Calendar sync API error");
      }

      setSyncedSlots(prev => ({ ...prev, [key]: true }));
      setSyncSuccess(`"${slot.task}" added to Google Calendar!`);
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setSyncError(`Could not sync "${slot.task}".`);
      setTimeout(() => setSyncError(null), 3500);
    } finally {
      setSyncingSlotKey(null);
    }
  };

  const handleSyncAllDay = async (dayLabel: string, slots: any[], dayIdx: number) => {
    let token = getCachedAccessToken();
    if (!token) {
      token = await connectGoogleCalendar();
      if (!token) {
        setSyncError("Please connect your Google Calendar first.");
        setTimeout(() => setSyncError(null), 3500);
        return;
      }
      setIsConnected(true);
    }

    setSyncingAll(true);
    let successCount = 0;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const key = `${dayIdx}-${i}`;
      if (syncedSlots[key]) {
        successCount++;
        continue;
      }

      const { start, end } = parseSlotDateTime(dayLabel, slot.time, slot.duration);
      try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: slot.task,
            description: slot.desc || "Scheduled via AI TaskPulse Companion",
            start: {
              dateTime: start.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: end.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          })
        });

        if (response.ok) {
          setSyncedSlots(prev => ({ ...prev, [key]: true }));
          successCount++;
        }
      } catch (err) {
        console.error("Bulk sync error for slot: " + slot.task, err);
      }
    }

    setSyncingAll(false);
    if (successCount > 0) {
      setSyncSuccess(`Synced ${successCount} events to Google Calendar!`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } else {
      setSyncError("Failed to sync schedule slots.");
      setTimeout(() => setSyncError(null), 3500);
    }
  };

  return (
    <div id="schedule-panel" className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar font-sans bg-transparent">
      {/* Toast Alert System */}
      {syncSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce border border-emerald-400 text-xs">
          <Check className="w-4 h-4" />
          <span>{syncSuccess}</span>
        </div>
      )}
      {syncError && (
        <div className="fixed bottom-5 right-5 z-50 bg-rose-500 text-white font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse border border-rose-400 text-xs">
          <span>⚠️</span>
          <span>{syncError}</span>
        </div>
      )}

      {/* Main Header Row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-slate-850/40 pb-5">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Chronological Daily Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Hour-by-hour optimized plan generated dynamically by AI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Google Calendar Connection Control */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFetchCalendarEvents}
                disabled={loadingEvents}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white border border-indigo-500/40 text-[11px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[44px] sm:min-h-0"
                title="Fetch today's calendar events"
              >
                {loadingEvents ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CalendarDays className="w-3.5 h-3.5" />
                )}
                {loadingEvents ? 'Loading...' : 'Fetch Agenda'}
              </button>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-400 shadow-sm shadow-emerald-500/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Calendar Active
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[44px] sm:min-h-0"
              title="Authenticate and connect to Google Calendar"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              Connect Calendar
            </button>
          )}

          <button
            onClick={handlePlanDay}
            className="bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Plan
          </button>
        </div>
      </div>

      {scheduleData ? (
        <div className="flex flex-col gap-6">
          {scheduleData.advice && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 p-4 rounded-xl flex gap-3 items-start leading-relaxed text-xs font-medium shadow-sm">
              <Brain className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">AI Advisor Strategic Brief</strong>
                <p className="text-slate-200/90 leading-relaxed">{scheduleData.advice}</p>
              </div>
            </div>
          )}

          {/* LIVE GOOGLE CALENDAR AGENDA FEED */}
          {isConnected && (
            <div className="bg-slate-900/15 backdrop-blur-md border border-slate-850 rounded-xl overflow-hidden shadow-sm transition-all">
              <button
                onClick={() => setShowAgenda(!showAgenda)}
                className="w-full bg-slate-900/40 hover:bg-slate-900/60 px-4 py-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-400" />
                  Your Google Calendar Agenda ({calendarEvents.length} events loaded)
                </span>
                <span className="text-slate-500 font-bold">
                  {showAgenda ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showAgenda && (
                <div className="p-4 border-t border-slate-850/50">
                  {loadingEvents ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      Loading live calendar events...
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs font-medium">
                      No Google Calendar events found for today or tomorrow. Click <span className="text-indigo-400 font-bold hover:underline cursor-pointer" onClick={handleFetchCalendarEvents}>Fetch Agenda</span> to refresh.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {calendarEvents.map((event, idx) => {
                        const dayLabel = formatEventDay(event);
                        const timeRange = formatEventTime(event);
                        return (
                          <div
                            key={event.id || idx}
                            className="p-3 bg-[#0a0d17] border border-slate-850/60 rounded-xl hover:border-indigo-500/25 transition-all flex flex-col justify-between gap-1 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-100 line-clamp-1 flex-1">{event.summary || '(No Title)'}</h5>
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                                {dayLabel}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[10px] font-mono text-emerald-400">{timeRange}</span>
                              {event.htmlLink && (
                                <a
                                  href={event.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold tracking-wide"
                                >
                                  Open
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scheduleData.days?.map((day, dIdx) => (
            <div key={dIdx} className="bg-slate-900/20 backdrop-blur-md border border-slate-850 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-900/60 border-b border-slate-850 px-4 py-3 flex items-center justify-between font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                <span>{day.label}</span>
                
                {day.slots && day.slots.length > 0 && (
                  <button
                    onClick={() => handleSyncAllDay(day.label, day.slots, dIdx)}
                    disabled={syncingAll}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-0"
                  >
                    {syncingAll ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CalendarDays className="w-3 h-3" />
                    )}
                    Sync Entire Day
                  </button>
                )}
              </div>
              
              <div className="divide-y divide-slate-850/60">
                {day.slots && day.slots.length > 0 ? (
                  day.slots.map((slot, sIdx) => {
                    const isBreak =
                      slot.task.toLowerCase().includes('break') ||
                      slot.task.toLowerCase().includes('lunch') ||
                      slot.task.toLowerCase().includes('recharge') ||
                      slot.task.toLowerCase().includes('coffee') ||
                      slot.task.toLowerCase().includes('rest');

                    const slotKey = `${dIdx}-${sIdx}`;
                    const isSynced = syncedSlots[slotKey];
                    const isSlotSyncing = syncingSlotKey === slotKey;

                    return (
                      <div key={sIdx} className="p-4 flex items-center gap-4 transition-colors hover:bg-slate-900/10">
                        <div className="w-20 flex-shrink-0">
                          <span className="text-xs font-bold text-emerald-400 font-mono block">{slot.time}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-mono font-medium">{slot.duration}</span>
                        </div>
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isBreak ? 'bg-slate-700/60' : 'bg-gradient-to-b from-indigo-500 to-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate ${isBreak ? 'text-slate-400' : 'text-slate-100'}`}>{slot.task}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">{slot.desc}</p>
                        </div>

                        {/* Event sync control button */}
                        {!isBreak && (
                          <div className="flex-shrink-0 ml-2">
                            {isSynced ? (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                                <span>Synced</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSyncSlot(day.label, slot, slotKey)}
                                disabled={isSlotSyncing}
                                className="bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-white border border-slate-800 hover:border-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-0"
                                title="Add this slot as an event to your Google Calendar"
                              >
                                {isSlotSyncing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                <span>Add to Calendar</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">No slots generated for this day.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-4 shadow-sm">
            📅
          </div>
          <p className="text-sm font-bold text-slate-200">No Schedule Prepared Yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
            Click &quot;Build My Plan&quot; to parse your active task stack and configure an optimized hour-by-hour timeline.
          </p>
          <button
            onClick={handlePlanDay}
            className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black py-2.5 px-6 rounded-xl transition-all cursor-pointer active:scale-98 shadow-md shadow-emerald-500/10"
          >
            Build My Plan
          </button>
        </div>
      )}
    </div>
  );
};
