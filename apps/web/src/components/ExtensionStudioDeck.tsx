'use client';

import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Code2,
  FolderOpen
} from 'lucide-react';
import { ExtensionConnectionStatus } from '@/hooks/useExtension';
import { ExtensionPingResult } from '@/lib/extension-client';

interface ExtensionStudioDeckProps {
  extensionId: string;
  onUpdateExtensionId: (id: string) => void;
  status: ExtensionConnectionStatus;
  version: string | null;
  isPinging: boolean;
  lastPingResult: ExtensionPingResult | null;
  pingHistory: Array<ExtensionPingResult & { timestamp: number }>;
  onSendPing: (id?: string) => Promise<any>;
  autoDetected: boolean;
}

export function ExtensionStudioDeck({
  extensionId,
  onUpdateExtensionId,
  status,
  version,
  isPinging,
  lastPingResult,
  pingHistory,
  onSendPing,
  autoDetected,
}: ExtensionStudioDeckProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'history' | 'guide'>('response');
  const [customIdInput, setCustomIdInput] = useState(extensionId);

  const handleCopyId = () => {
    if (extensionId) {
      navigator.clipboard.writeText(extensionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const extensionDistPath = `c:\\Users\\Trade\\OneDrive\\Desktop\\Antigravity Projects\\Saas content Studio\\apps\\extension\\.output\\chrome-mv3`;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionDistPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="extension-runner-deck" className="glass-panel rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl relative">
      {/* Decorative top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-rose-400" />

      {/* Console Header */}
      <div className="p-6 sm:p-8 border-b border-white/[0.06] bg-slate-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Extension Runner Console
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                    Step 1 Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time bidirectional messaging via Chrome's <code className="text-sky-300">externally_connectable</code> &amp; Content Bridge
                </p>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSendPing()}
              disabled={isPinging}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-sky-500/25 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isPinging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Transmitting Ping...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Execute Round-Trip Ping</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Runner State */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
              Service Worker State
            </span>
            <div className="flex items-center gap-2">
              {status === 'connected' ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Connected {version ? `(v${version})` : ''}</span>
                </div>
              ) : status === 'checking' ? (
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Detecting Extension...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span>Unpacked Extension Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Round Trip Latency Gauge */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
              Round-Trip Latency
            </span>
            <div className="flex items-baseline gap-2">
              {lastPingResult ? (
                <>
                  <span className={`text-2xl font-extrabold font-mono ${lastPingResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {lastPingResult.latencyMs} ms
                  </span>
                  <span className="text-[11px] text-slate-400">
                    via {lastPingResult.method === 'direct' ? 'chrome.runtime' : 'content bridge'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500 italic">No ping fired yet</span>
              )}
            </div>
          </div>

          {/* Card 3: Extension ID */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Extension ID
              </span>
              {autoDetected && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
                  Auto-Handshake
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customIdInput || extensionId}
                onChange={(e) => setCustomIdInput(e.target.value)}
                placeholder="Extension ID..."
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-400"
              />
              <button
                onClick={handleCopyId}
                title="Copy Extension ID"
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card 4: Target Platforms */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
              Available Site Adapters
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ChatGPT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Gemini
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Google Flow
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Console Tab Navigation */}
      <div className="px-6 sm:px-8 border-b border-white/[0.06] bg-slate-950/20 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('response')}
          className={`py-3.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'response'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Live PONG Response Payload</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Messaging Log ({pingHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`py-3.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'guide'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Chrome Extension Setup Guide</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      <div className="p-6 sm:p-8">
        {/* TAB 1: Live Response Inspector */}
        {activeTab === 'response' && (
          <div>
            {lastPingResult ? (
              <div
                className={`p-5 rounded-2xl font-mono text-xs border ${
                  lastPingResult.success
                    ? 'bg-slate-950/80 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}
              >
                {lastPingResult.success ? (
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Round-trip Verified: PONG Received</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        Latency: <strong className="text-emerald-400">{lastPingResult.latencyMs}ms</strong> &bull; Method: <strong className="text-sky-300">{lastPingResult.method}</strong>
                      </span>
                    </div>
                    <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(lastPingResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Ping Communication Error</span>
                    </div>
                    <p className="text-rose-200 text-xs mt-1">{lastPingResult.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center text-slate-500 text-xs space-y-2">
                <Terminal className="w-6 h-6 mx-auto text-slate-600" />
                <p>Click "Execute Round-Trip Ping" above to dispatch a ping to the Chrome extension service worker.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Communication History */}
        {activeTab === 'history' && (
          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs pr-2">
            {pingHistory.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No historical pings recorded this session.</div>
            ) : (
              pingHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${item.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="text-slate-400 text-[11px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className="text-sky-300 font-semibold">PING &rarr; PONG</span>
                    <span className="text-slate-500 text-[10px] hidden sm:inline">
                      ID: {item.data?.extensionId || 'unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">via {item.method}</span>
                    <span className="font-bold text-emerald-400">{item.latencyMs} ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Unpacked Extension Guide */}
        {activeTab === 'guide' && (
          <div className="rounded-2xl bg-slate-950/60 border border-white/[0.06] p-6 text-xs text-slate-300 space-y-4 leading-relaxed">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-400" />
              Quick Steps to Load Unpacked in Google Chrome
            </h4>
            <ol className="list-decimal list-inside space-y-2.5">
              <li>
                Open Google Chrome and navigate to <code className="text-sky-300 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">chrome://extensions</code>
              </li>
              <li>
                Enable the <strong className="text-white">Developer mode</strong> toggle located at the top-right corner.
              </li>
              <li>
                Click <strong className="text-white">Load unpacked</strong> at the top-left corner.
              </li>
              <li>
                Select this local build directory:
                <div className="mt-2 flex items-center gap-2 bg-black/60 p-3 rounded-xl border border-white/[0.08] font-mono text-[11px] text-amber-300">
                  <span className="truncate flex-1 select-all">{extensionDistPath}</span>
                  <button
                    onClick={handleCopyPath}
                    className="px-2.5 py-1 rounded bg-white/[0.1] hover:bg-white/[0.15] text-white text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? 'Copied!' : 'Copy Path'}
                  </button>
                </div>
              </li>
              <li>
                Return to this dashboard. The extension will automatically handshake and announce itself!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
