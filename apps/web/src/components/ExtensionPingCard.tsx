'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Terminal, ExternalLink, HelpCircle } from 'lucide-react';
import { ExtensionConnectionStatus } from '@/hooks/useExtension';
import { ExtensionPingResult } from '@/lib/extension-client';

interface ExtensionPingCardProps {
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

export function ExtensionPingCard({
  extensionId,
  onUpdateExtensionId,
  status,
  version,
  isPinging,
  lastPingResult,
  pingHistory,
  onSendPing,
  autoDetected,
}: ExtensionPingCardProps) {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customIdInput, setCustomIdInput] = useState(extensionId);

  const handleCopyId = () => {
    if (extensionId) {
      navigator.clipboard.writeText(extensionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateExtensionId(customIdInput);
    onSendPing(customIdInput);
  };

  const extensionDistPath = `apps/extension/.output/chrome-mv3`;

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-white">Extension Messaging Test</h2>
              {status === 'connected' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Waiting for Extension
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Validates external communication between Web Dashboard (<code className="text-sky-400">localhost:3000</code>) and the Chrome Extension background service worker via <code className="text-sky-400">externally_connectable</code>.
            </p>
          </div>

          <button
            onClick={() => onSendPing()}
            disabled={isPinging}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isPinging ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Pinging...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Ping to Extension
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Connection Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Extension ID Tile */}
          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Extension ID</span>
              {autoDetected && (
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">
                  Auto-detected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customIdInput || extensionId}
                onChange={(e) => setCustomIdInput(e.target.value)}
                placeholder="Extension ID (e.g. jbfm...)"
                className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy ID"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {customIdInput !== extensionId && (
              <button
                onClick={handleSaveCustomId}
                className="mt-2 text-xs text-sky-400 hover:underline flex items-center gap-1 font-medium"
              >
                Apply & Test Custom ID
              </button>
            )}
          </div>

          {/* Round-trip Latency */}
          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Last Round-trip Latency</span>
            <div className="flex items-baseline gap-2 mt-2">
              {lastPingResult ? (
                <>
                  <span
                    className={`text-2xl font-bold font-mono ${
                      lastPingResult.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {lastPingResult.latencyMs} ms
                  </span>
                  <span className="text-xs text-slate-400">
                    via {lastPingResult.method === 'direct' ? 'chrome.runtime' : 'content bridge'}
                  </span>
                </>
              ) : (
                <span className="text-slate-500 text-sm italic">No ping executed yet</span>
              )}
            </div>
          </div>

          {/* Target Sites Supported */}
          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Registered Site Adapters</span>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ChatGPT
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Gemini
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Google Flow
              </span>
            </div>
          </div>
        </div>

        {/* Last Result & Payloads */}
        {lastPingResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Round-trip Response Inspector
              </span>
              <span className="text-xs text-slate-500">
                Method: <span className="font-mono text-slate-300">{lastPingResult.method}</span>
              </span>
            </div>

            <div
              className={`p-4 rounded-lg font-mono text-xs border ${
                lastPingResult.success
                  ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              {lastPingResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    PONG received successfully ({lastPingResult.latencyMs}ms)
                  </div>
                  <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                    {JSON.stringify(lastPingResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1 text-rose-400 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    Ping Failed
                  </div>
                  <p className="text-rose-200">{lastPingResult.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installation Instructions Accordion */}
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              How to load the Extension unpacked in Google Chrome
            </span>
            <span className="text-xs text-sky-400">{showInstructions ? 'Hide steps' : 'View steps'}</span>
          </button>

          {showInstructions && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-3">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  Build the extension output: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">pnpm build:extension</code>
                </li>
                <li>
                  Open Chrome and navigate to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">chrome://extensions</code>
                </li>
                <li>
                  Toggle <strong className="text-white">Developer mode</strong> in the top-right corner.
                </li>
                <li>
                  Click <strong className="text-white">Load unpacked</strong> and select the directory:
                  <div className="mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-amber-300 select-all">
                    c:\Users\Trade\OneDrive\Desktop\Antigravity Projects\Saas content Studio\apps\extension\.output\chrome-mv3
                  </div>
                </li>
                <li>
                  Refresh this page (<code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono">http://localhost:3000</code>). The extension will automatically handshake and announce itself!
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
