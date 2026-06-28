import React from 'react';
import { X, Cpu, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  status: 'working' | 'quota_exceeded' | 'error' | 'info';
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  title,
  message,
  details,
  status,
  onClose
}) => {
  if (!isOpen) return null;

  let iconElement = <Info className="w-5 h-5 text-indigo-400" />;
  let badgeBg = 'bg-indigo-500/10 border-indigo-500/20';
  let bannerColor = 'bg-indigo-500/10';

  if (status === 'working') {
    iconElement = <CheckCircle className="w-5 h-5 text-emerald-400" />;
    badgeBg = 'bg-emerald-500/10 border-emerald-500/20';
    bannerColor = 'bg-emerald-500/5';
  } else if (status === 'quota_exceeded') {
    iconElement = <AlertTriangle className="w-5 h-5 text-amber-400" />;
    badgeBg = 'bg-amber-500/10 border-amber-500/20';
    bannerColor = 'bg-amber-500/5';
  } else if (status === 'error') {
    iconElement = <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />;
    badgeBg = 'bg-rose-500/10 border-rose-500/20';
    bannerColor = 'bg-rose-500/5';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#0d1222] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle Ambient Glow */}
        <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full ${status === 'working' ? 'bg-emerald-500/10' : status === 'quota_exceeded' ? 'bg-amber-500/10' : status === 'error' ? 'bg-rose-500/10' : 'bg-indigo-500/10'} blur-2xl pointer-events-none`} />
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center border shadow-inner`}>
              {iconElement}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                System Diagnostics & Status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 space-y-3.5 mt-1">
          <div className={`p-4 rounded-xl border border-slate-800/40 ${bannerColor} text-xs leading-relaxed text-slate-200 font-medium`}>
            {message}
          </div>

          {details && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Raw Error Payload / Details
              </span>
              <pre className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto custom-scrollbar select-all whitespace-pre-wrap leading-relaxed">
                {details}
              </pre>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 font-medium border-t border-slate-900">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>TaskPulse Local Hybrid Engine is active. Local overrides are fully supported.</span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex justify-end gap-2.5 relative z-10 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-xs font-bold text-slate-200 rounded-xl transition-colors cursor-pointer active:scale-98"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
