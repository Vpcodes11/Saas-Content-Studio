'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ExtensionPingCard } from '@/components/ExtensionPingCard';
import { DatabaseHealthCard } from '@/components/DatabaseHealthCard';
import { BuildRoadmapCard } from '@/components/BuildRoadmapCard';
import { useExtension } from '@/hooks/useExtension';
import { Activity, ShieldCheck, Zap, Terminal } from 'lucide-react';

export default function HomePage() {
  const {
    extensionId,
    updateExtensionId,
    status: extensionStatus,
    version: extensionVersion,
    isPinging,
    lastPingResult,
    pingHistory,
    sendPing,
    autoDetected,
  } = useExtension();

  const [dbOk, setDbOk] = useState(true);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Header
        extensionStatus={extensionStatus}
        extensionVersion={extensionVersion}
        dbOk={dbOk}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Banner / Welcome */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" /> Step 1: Monorepo & Extension Bridge Ready
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SaaS Content Studio
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Automate content creation using your <strong className="text-white">real logged-in browser sessions</strong> of ChatGPT, Gemini, and Google Flow. No API fees, no headless blocks, full human-in-the-loop control.
            </p>
          </div>
        </div>

        {/* Core Step 1 Test: Extension Messaging Ping / Pong */}
        <ExtensionPingCard
          extensionId={extensionId}
          onUpdateExtensionId={updateExtensionId}
          status={extensionStatus}
          version={extensionVersion}
          isPinging={isPinging}
          lastPingResult={lastPingResult}
          pingHistory={pingHistory}
          onSendPing={sendPing}
          autoDetected={autoDetected}
        />

        {/* Database & Roadmap Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DatabaseHealthCard onStatusChange={setDbOk} />
          <BuildRoadmapCard />
        </div>

        {/* Live Traffic Log (Pings & Responses) */}
        {pingHistory.length > 0 && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Session Messaging Event Log ({pingHistory.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Live Client &harr; Extension Log</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
              {pingHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded bg-slate-950/70 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.success ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className="text-sky-300 font-semibold">PING &rarr; PONG</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-xs">
                      ID: {item.data?.extensionId || 'unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">via {item.method}</span>
                    <span className="font-bold text-emerald-400">{item.latencyMs} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        SaaS Content Studio &bull; Monorepo TypeScript &bull; Chrome Manifest V3 & Next.js App Router
      </footer>
    </div>
  );
}
