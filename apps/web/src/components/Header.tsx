'use client';

import React from 'react';
import { Layers, ShieldCheck, Database, Globe } from 'lucide-react';
import { ExtensionConnectionStatus } from '@/hooks/useExtension';

interface HeaderProps {
  extensionStatus: ExtensionConnectionStatus;
  extensionVersion: string | null;
  dbOk: boolean;
}

export function Header({ extensionStatus, extensionVersion, dbOk }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              SaaS Content Studio
              <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Step 1: Core Foundation
              </span>
            </h1>
            <p className="text-xs text-slate-400">Human-session browser orchestration</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Extension Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Extension:</span>
            {extensionStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected {extensionVersion ? `v${extensionVersion}` : ''}
              </span>
            ) : extensionStatus === 'checking' ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Checking...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Not Connected
              </span>
            )}
          </div>

          {/* Database Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">SQLite:</span>
            {dbOk ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Error
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
