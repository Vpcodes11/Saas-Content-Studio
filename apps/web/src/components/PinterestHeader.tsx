'use client';

import React from 'react';
import { Sparkles, Globe, Database, Bookmark, Compass, Send, Layers } from 'lucide-react';
import { ExtensionConnectionStatus } from '@/hooks/useExtension';

interface PinterestHeaderProps {
  extensionStatus: ExtensionConnectionStatus;
  extensionVersion: string | null;
  dbOk: boolean;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onSendPing: () => void;
  isPinging: boolean;
  latencyMs?: number;
}

export function PinterestHeader({
  extensionStatus,
  extensionVersion,
  dbOk,
  activeFilter,
  onSelectFilter,
  onSendPing,
  isPinging,
  latencyMs,
}: PinterestHeaderProps) {
  const filters = [
    { id: 'all', label: 'All Inspirations' },
    { id: 'brief', label: '📖 Ingestion & Brief' },
    { id: 'compare', label: '⚡ Compare Arena' },
    { id: 'chatgpt', label: 'ChatGPT Threads' },
    { id: 'gemini', label: 'Gemini Briefs' },
    { id: 'flow', label: 'Google Flow Videos' },
    { id: 'runner', label: 'Extension Runner' },
    { id: 'database', label: 'DB & Schema' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#06080e]/80 backdrop-blur-2xl transition-all">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-rose-400 p-[1px] shadow-lg shadow-sky-500/20 group cursor-pointer">
              <div className="w-full h-full bg-[#090d16] rounded-2xl flex items-center justify-center transition-all group-hover:bg-opacity-80">
                <Sparkles className="w-5 h-5 text-sky-400 transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 font-sans">
                  SaaS Content Studio
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 via-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Step 4 &bull; Ingestion &amp; Product Brief
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Human-Session Orchestrator for ChatGPT, Gemini & Flow
              </p>
            </div>
          </div>

          {/* Pinterest-style Category Pills */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-white text-slate-950 font-semibold shadow-md shadow-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Status & Action Dock */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Ping Button */}
            <button
              onClick={onSendPing}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-medium transition-all shadow-sm shadow-sky-500/10 cursor-pointer disabled:opacity-50"
              title="Send round-trip Ping"
            >
              <Send className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Quick Ping</span>
              {latencyMs !== undefined && (
                <span className="font-mono font-bold text-sky-400 ml-1">{latencyMs}ms</span>
              )}
            </button>

            {/* Extension Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-white/[0.08] shadow-inner">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 hidden sm:inline">Extension:</span>
              {extensionStatus === 'connected' ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Ready
                </span>
              ) : extensionStatus === 'checking' ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Checking
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Offline
                </span>
              )}
            </div>

            {/* DB Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-white/[0.08]">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">SQLite:</span>
              {dbOk ? (
                <span className="text-emerald-400 font-medium">Ready</span>
              ) : (
                <span className="text-rose-400 font-medium">Error</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
