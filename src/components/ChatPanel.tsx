import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isLoading: boolean;
  isListening: boolean;
  speechSupported: boolean;
  toggleListening: () => void;
  handleSendMessage: (e?: React.FormEvent | string, text?: string) => void;
  handleClearChat: () => void;
  chatInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatPanel = React.memo<ChatPanelProps>(({
  chatMessages,
  chatInput,
  setChatInput,
  isLoading,
  isListening,
  speechSupported,
  toggleListening,
  handleSendMessage,
  handleClearChat,
  chatInputRef
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = React.useState(chatInput);

  useEffect(() => {
    setLocalInput(chatInput);
  }, [chatInput]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      // Match headings
      if (content.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-emerald-400 mt-4 mb-1.5">{content.replace('### ', '')}</h3>;
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-extrabold text-indigo-400 mt-5 mb-2">{content.replace('## ', '')}</h2>;
      }
      if (content.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-black text-indigo-400 mt-6 mb-3">{content.replace('# ', '')}</h1>;
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
        parts.push(<strong key={match.index} className="text-emerald-400 font-bold">{match[1]}</strong>);
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
          <li key={idx} className="list-disc ml-5 my-1 text-slate-100/90 text-xs">
            {bulletText.includes('**') ? finalLine : bulletText}
          </li>
        );
      }

      // Standard paragraph
      return <p key={idx} className="my-1.5 text-xs leading-relaxed text-slate-200/95 font-medium">{finalLine}</p>;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/10">
      {/* Active Session info bar */}
      <div className="px-6 py-2.5 border-b border-slate-800/50 bg-slate-950/20 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          TaskPulse AI Assistant Chat
        </span>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear the chat history?")) {
              handleClearChat();
            }
          }}
          className="text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-98"
        >
          Clear History
        </button>
      </div>

      {/* Messages timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 custom-scrollbar">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 font-bold border transition-colors ${
              msg.sender === 'user'
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-gradient-to-tr from-indigo-500 to-emerald-400 border-transparent text-slate-950'
            }`}>
              {msg.sender === 'user' ? '👤' : '⚡'}
            </div>
            
            <div className={`rounded-2xl p-4 text-xs shadow-md border leading-relaxed transition-all ${
              msg.sender === 'user'
                ? 'bg-slate-900/80 border-slate-800 text-slate-100'
                : 'bg-slate-900/30 border-slate-900 text-slate-100/90'
            }`}>
              {msg.sender === 'ai' ? formatText(msg.text) : <p className="text-xs font-medium">{msg.text}</p>}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 self-start max-w-[80%]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs bg-gradient-to-tr from-indigo-500 to-emerald-400 text-slate-950 font-bold animate-pulse">
              ⚡
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex items-center gap-1.5 shadow-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Inputs */}
      <div className="p-5 border-t border-slate-850/80 bg-slate-950/20 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar scrollbar-none flex-wrap">
          {[
            { label: '🎯 Prioritize workload', text: 'Prioritize all my tasks by deadline and risk' },
            { label: '⚡ What should I do now?', text: 'What should I work on right now?' },
            { label: '😰 I feel overwhelmed', text: 'I feel overwhelmed. Help me focus and build a calm action plan.' },
            { label: '📅 Build hourly plan', text: 'Draft an hour-by-hour planner with rest stops for today.' }
          ].map((action, aIdx) => (
            <button
              key={aIdx}
              onClick={() => {
                setChatInput(action.text);
                setLocalInput(action.text);
              }}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (localInput.trim() && !isLoading) {
              handleSendMessage(undefined, localInput);
              setLocalInput('');
              setChatInput('');
            }
          }}
          className="flex gap-2.5 items-center"
        >
          <textarea
            ref={chatInputRef}
            rows={1}
            value={localInput}
            onChange={e => setLocalInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (localInput.trim() && !isLoading) {
                  handleSendMessage(undefined, localInput);
                  setLocalInput('');
                  setChatInput('');
                }
              }
            }}
            placeholder="Ask AI companion to prioritize, suggest checklists, or design plans..."
            className="flex-1 bg-slate-900/60 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl text-xs outline-none placeholder:text-slate-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none max-h-24 h-11"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechSupported}
            title={
              !speechSupported 
                ? "Voice recognition is not supported in this browser" 
                : isListening 
                  ? "Listening... Click to stop" 
                  : "Dictate with your voice"
            }
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 border-rose-500 text-white animate-pulse shadow-md shadow-rose-950/20'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400'
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            type="submit"
            disabled={!localInput.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4 text-slate-950 stroke-[3]" />
          </button>
        </form>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
