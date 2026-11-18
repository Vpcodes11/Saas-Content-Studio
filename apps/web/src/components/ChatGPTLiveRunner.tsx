'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  Sparkles, 
  Database, 
  Clock, 
  ExternalLink,
  Layers,
  Copy,
  Check,
  PauseCircle,
  Play
} from 'lucide-react';
import { ExtensionClient } from '@/lib/extension-client';

interface ChatGPTLiveRunnerProps {
  extensionId: string;
  extensionStatus: string;
}

export function ChatGPTLiveRunner({ extensionId, extensionStatus }: ChatGPTLiveRunnerProps) {
  const [prompt, setPrompt] = useState('Say hello');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    jobId: string;
    generationId?: string;
    markdown: string;
    error?: string;
    status: 'completed' | 'failed' | 'paused';
    timeMs?: number;
  } | null>(null);

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  const fetchRecentJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const json = await res.json();
        setRecentJobs(json.jobs || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const handleCopy = () => {
    if (lastResult?.markdown) {
      navigator.clipboard.writeText(lastResult.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunChatGPT = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    setIsRunning(true);
    setLastResult(null);
    setCurrentStep('1/6: Registering Job in SQLite database...');
    const startTime = performance.now();

    try {
      // 1. Create job in SQLite DB
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          targetSite: 'chatgpt',
          prompt: textToSend,
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to register job in local SQLite database.');
      }

      const { jobId, job } = await createRes.json();

      // 2. Dispatch to Extension Runner
      setCurrentStep('2/6: Activating visible chatgpt.com tab in Chrome...');
      const targetId = extensionId || ExtensionClient.getStoredExtensionId() || '';

      const runnerRes = await ExtensionClient.executeJob(targetId, job);

      // 3. Complete and store in SQLite DB
      setCurrentStep('5/6: Persisting Turndown Markdown into SQLite...');
      const completeRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          jobId,
          status: runnerRes.status,
          resultMarkdown: runnerRes.resultMarkdown || null,
          error: runnerRes.error || null,
        }),
      });

      const completeData = await completeRes.json();
      const elapsed = Math.round(performance.now() - startTime);

      setLastResult({
        jobId,
        generationId: completeData.generationId,
        markdown: runnerRes.resultMarkdown || '',
        error: runnerRes.error,
        status: runnerRes.status,
        timeMs: elapsed,
      });

      setCurrentStep(null);
      fetchRecentJobs();
    } catch (err: any) {
      setLastResult({
        jobId: 'error',
        markdown: '',
        error: err.message || 'Execution error during ChatGPT job run.',
        status: 'failed',
      });
      setCurrentStep(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="chatgpt-runner" className="glass-panel rounded-3xl overflow-hidden border border-sky-500/20 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">ChatGPT Session Adapter</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Step 2 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dispatches prompts to your real <code className="text-sky-300">chatgpt.com</code> tab &bull; Extracts clean Markdown via Turndown &bull; Stores into SQLite
            </p>
          </div>
        </div>

        {/* Quick 'Say hello' CTA */}
        <button
          onClick={() => {
            setPrompt('Say hello');
            handleRunChatGPT('Say hello');
          }}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition-all shadow-md shadow-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>Send &quot;Say hello&quot; (Step 2 Goal)</span>
        </button>
      </div>

      {/* Interactive Input Form */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Prompt for ChatGPT</span>
          <span className="text-[11px] text-slate-500">Human typing emulation (jitter 15-45ms)</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt for ChatGPT..."
            disabled={isRunning}
            className="flex-1 bg-black/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunChatGPT();
            }}
          />
          <button
            onClick={() => handleRunChatGPT()}
            disabled={isRunning || !prompt.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-sky-500/20"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running in Chrome Tab...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Send to ChatGPT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Step Progress Indicator */}
      {isRunning && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-200 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Automating Real Browser Session...</div>
            <div className="text-[11px] text-sky-300">{currentStep}</div>
          </div>
        </div>
      )}

      {/* Execution Result Area */}
      {lastResult && (
        <div
          className={`rounded-2xl border p-5 space-y-3 font-sans transition-all ${
            lastResult.status === 'completed'
              ? 'bg-slate-950/70 border-emerald-500/30'
              : lastResult.status === 'paused'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}
        >
          {/* Result Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              {lastResult.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400">ChatGPT Response Received &amp; Saved to DB</span>
                </>
              ) : lastResult.status === 'paused' ? (
                <>
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400">Manual Intervention Needed in Tab</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-rose-400">Generation Failed</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {lastResult.timeMs && (
                <span className="text-[11px] text-slate-400">
                  Total Time: <strong className="text-white">{Math.round(lastResult.timeMs / 1000)}s</strong>
                </span>
              )}
              {lastResult.markdown && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-white/[0.06] px-2 py-1 rounded cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy MD'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Database Persistence Proof */}
          {lastResult.status === 'completed' && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Database className="w-3 h-3" /> Job ID: <strong className="font-mono text-white">{lastResult.jobId}</strong>
              </span>
              {lastResult.generationId && (
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gen ID: <strong className="font-mono text-white">{lastResult.generationId}</strong>
                </span>
              )}
              <span className="text-slate-500">
                Extracted via Turndown DOM Parser &bull; {lastResult.markdown.length} characters
              </span>
            </div>
          )}

          {/* Result Content Body */}
          {lastResult.status === 'completed' ? (
            <div className="bg-black/60 p-4 rounded-xl border border-white/[0.04] text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto">
              {lastResult.markdown}
            </div>
          ) : (
            <div className="text-xs p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              {lastResult.error}
            </div>
          )}
        </div>
      )}

      {/* Database Records History */}
      {recentJobs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> SQLite Database Jobs Log ({recentJobs.length})
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {recentJobs.map((j) => (
              <div
                key={j.id}
                className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      j.status === 'completed'
                        ? 'bg-emerald-400'
                        : j.status === 'running'
                        ? 'bg-sky-400 animate-pulse'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-mono text-slate-400 text-[10px] shrink-0">{j.id}</span>
                  <span className="text-white font-medium truncate">&quot;{j.prompt}&quot;</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-500">{new Date(j.createdAt).toLocaleTimeString()}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      j.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
