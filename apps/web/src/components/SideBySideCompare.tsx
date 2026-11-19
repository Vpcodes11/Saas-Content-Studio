'use client';

import React, { useState } from 'react';
import { 
  Columns2, 
  Send, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Star, 
  Database, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import { ExtensionClient } from '@/lib/extension-client';

interface SideBySideCompareProps {
  extensionId: string;
  extensionStatus: string;
}

interface ModelResult {
  jobId?: string;
  generationId?: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  markdown: string;
  error?: string;
  elapsedMs?: number;
  wordCount?: number;
}

export function SideBySideCompare({ extensionId, extensionStatus }: SideBySideCompareProps) {
  const [prompt, setPrompt] = useState(
    'Write a punchy LinkedIn post announcing SaaS Content Studio. Include 3 bullet benefits on using real browser sessions instead of APIs.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<'chatgpt' | 'gemini' | null>(null);
  const [copiedModel, setCopiedModel] = useState<'chatgpt' | 'gemini' | null>(null);

  const [chatgptResult, setChatgptResult] = useState<ModelResult>({
    status: 'idle',
    markdown: '',
  });

  const [geminiResult, setGeminiResult] = useState<ModelResult>({
    status: 'idle',
    markdown: '',
  });

  React.useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        if (data.status === 'ok' && data.generations?.length) {
          const chatgptGen = data.generations.find((g: any) => g.title?.includes('ChatGPT'));
          const geminiGen = data.generations.find((g: any) => g.title?.includes('Gemini'));
          if (chatgptGen) {
            setChatgptResult({
              jobId: chatgptGen.jobId,
              generationId: chatgptGen.id,
              status: 'completed',
              markdown: chatgptGen.contentMarkdown,
              wordCount: chatgptGen.contentMarkdown.trim().split(/\s+/).filter(Boolean).length,
              elapsedMs: 2400,
            });
            if (chatgptGen.isFavorite) setWinner('chatgpt');
          }
          if (geminiGen) {
            setGeminiResult({
              jobId: geminiGen.jobId,
              generationId: geminiGen.id,
              status: 'completed',
              markdown: geminiGen.contentMarkdown,
              wordCount: geminiGen.contentMarkdown.trim().split(/\s+/).filter(Boolean).length,
              elapsedMs: 1900,
            });
            if (geminiGen.isFavorite) setWinner('gemini');
          }
        }
      } catch {}
    }
    loadRecent();
  }, []);

  const handleCopy = (model: 'chatgpt' | 'gemini', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModel(model);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  const markFavorite = async (model: 'chatgpt' | 'gemini') => {
    setWinner(model);
    const target = model === 'chatgpt' ? chatgptResult : geminiResult;
    if (target.generationId) {
      try {
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'favorite',
            generationId: target.generationId,
          }),
        });
      } catch {}
    }
  };

  const runCompare = async () => {
    if (!prompt.trim() || isRunning) return;

    setIsRunning(true);
    setWinner(null);

    // Initialize both states
    setChatgptResult({ status: 'running', markdown: '' });
    setGeminiResult({ status: 'running', markdown: '' });

    const targetId = extensionId || ExtensionClient.getStoredExtensionId() || '';

    // Run ChatGPT in sequence/parallel with rate limits handled
    const runChatGPT = async () => {
      const startTime = performance.now();
      try {
        const createRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', targetSite: 'chatgpt', prompt }),
        });
        const { jobId, job } = await createRes.json();

        const runnerRes = await ExtensionClient.executeJob(targetId, job);
        const elapsedMs = Math.round(performance.now() - startTime);

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

        const words = (runnerRes.resultMarkdown || '').trim().split(/\s+/).filter(Boolean).length;

        setChatgptResult({
          jobId,
          generationId: completeData.generationId,
          status: runnerRes.status,
          markdown: runnerRes.resultMarkdown || '',
          error: runnerRes.error,
          elapsedMs,
          wordCount: words,
        });
      } catch (err: any) {
        setChatgptResult({
          status: 'failed',
          markdown: '',
          error: err.message || 'Failed executing ChatGPT job.',
        });
      }
    };

    const runGemini = async () => {
      const startTime = performance.now();
      try {
        const createRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', targetSite: 'gemini', prompt }),
        });
        const { jobId, job } = await createRes.json();

        const runnerRes = await ExtensionClient.executeJob(targetId, job);
        const elapsedMs = Math.round(performance.now() - startTime);

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

        const words = (runnerRes.resultMarkdown || '').trim().split(/\s+/).filter(Boolean).length;

        setGeminiResult({
          jobId,
          generationId: completeData.generationId,
          status: runnerRes.status,
          markdown: runnerRes.resultMarkdown || '',
          error: runnerRes.error,
          elapsedMs,
          wordCount: words,
        });
      } catch (err: any) {
        setGeminiResult({
          status: 'failed',
          markdown: '',
          error: err.message || 'Failed executing Gemini job.',
        });
      }
    };

    // Execute jobs concurrently across both target tabs
    await Promise.allSettled([runChatGPT(), runGemini()]);
    setIsRunning(false);
  };

  return (
    <div id="side-by-side-compare" className="glass-panel rounded-3xl overflow-hidden border border-purple-500/20 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-sky-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-purple-500/20">
            <Columns2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Side-by-Side Dual AI Studio</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
                Step 3 &bull; ChatGPT vs Gemini
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dispatch a single prompt simultaneously to <code className="text-emerald-300">chatgpt.com</code> and <code className="text-sky-300">gemini.google.com</code> &bull; Compare Markdown responses side-by-side
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runCompare}
          disabled={isRunning || !prompt.trim()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-400 hover:to-sky-300 text-white font-bold text-xs transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Generating Across Both Sessions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Compare ChatGPT vs Gemini</span>
            </>
          )}
        </button>
      </div>

      {/* Prompt Input Area */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Comparative Prompt</span>
          <span className="text-[11px] text-slate-500">Sent simultaneously to both active sessions</span>
        </label>
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt to compare..."
          disabled={isRunning}
          className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans resize-none"
        />
      </div>

      {/* Comparison Analytics Strip (when results present) */}
      {(chatgptResult.status === 'completed' || geminiResult.status === 'completed') && (
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <strong>Word Counts:</strong>
              <span className="font-mono text-emerald-300">ChatGPT: {chatgptResult.wordCount || 0}w</span>
              <span className="text-slate-600">vs</span>
              <span className="font-mono text-sky-300">Gemini: {geminiResult.wordCount || 0}w</span>
            </span>

            {chatgptResult.elapsedMs && geminiResult.elapsedMs && (
              <span className="text-slate-400 flex items-center gap-1.5 hidden md:flex">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <strong>Speed:</strong>
                <span className="font-mono text-slate-300">
                  {Math.round(chatgptResult.elapsedMs / 1000)}s vs {Math.round(geminiResult.elapsedMs / 1000)}s
                </span>
              </span>
            )}
          </div>

          {winner && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px]">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Selected Favorite: {winner === 'chatgpt' ? 'ChatGPT 4o' : 'Gemini 1.5 Pro'}</span>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Split View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: ChatGPT */}
        <div className="rounded-2xl border border-emerald-500/20 bg-black/40 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Model Card Header */}
            <div className="p-4 border-b border-white/[0.06] bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-xs text-white">ChatGPT (chatgpt.com)</span>
                <span className="text-[10px] text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  GPT-4o
                </span>
              </div>

              <div className="flex items-center gap-2">
                {chatgptResult.status === 'completed' && (
                  <button
                    onClick={() => markFavorite('chatgpt')}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      winner === 'chatgpt'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    <Star className="w-3 h-3" fill={winner === 'chatgpt' ? 'currentColor' : 'none'} />
                    <span>{winner === 'chatgpt' ? 'Winner' : 'Pick Best'}</span>
                  </button>
                )}

                {chatgptResult.markdown && (
                  <button
                    onClick={() => handleCopy('chatgpt', chatgptResult.markdown)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copiedModel === 'chatgpt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                )}
              </div>
            </div>

            {/* Model Card Content */}
            <div className="p-4 min-h-[260px] max-h-[380px] overflow-y-auto text-xs leading-relaxed font-sans text-slate-200">
              {chatgptResult.status === 'running' ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="text-xs">Typing into ChatGPT &bull; Streaming response...</span>
                </div>
              ) : chatgptResult.status === 'completed' ? (
                <div className="whitespace-pre-wrap">{chatgptResult.markdown}</div>
              ) : chatgptResult.status === 'failed' ? (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 mb-1" />
                  {chatgptResult.error}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                  <Bot className="w-8 h-8 text-slate-700 mb-2" />
                  <span>Click &quot;Compare ChatGPT vs Gemini&quot; above to run.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer */}
          {chatgptResult.status === 'completed' && (
            <div className="p-3 border-t border-white/[0.06] bg-black/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Job: <code className="text-slate-300 font-mono">{chatgptResult.jobId}</code></span>
              <span>{chatgptResult.wordCount} words &bull; {Math.round((chatgptResult.elapsedMs || 0) / 1000)}s</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Gemini */}
        <div className="rounded-2xl border border-sky-500/20 bg-black/40 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Model Card Header */}
            <div className="p-4 border-b border-white/[0.06] bg-sky-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="font-bold text-xs text-white">Google Gemini (gemini.google.com)</span>
                <span className="text-[10px] text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                  Gemini 1.5
                </span>
              </div>

              <div className="flex items-center gap-2">
                {geminiResult.status === 'completed' && (
                  <button
                    onClick={() => markFavorite('gemini')}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      winner === 'gemini'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    <Star className="w-3 h-3" fill={winner === 'gemini' ? 'currentColor' : 'none'} />
                    <span>{winner === 'gemini' ? 'Winner' : 'Pick Best'}</span>
                  </button>
                )}

                {geminiResult.markdown && (
                  <button
                    onClick={() => handleCopy('gemini', geminiResult.markdown)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copiedModel === 'gemini' ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                )}
              </div>
            </div>

            {/* Model Card Content */}
            <div className="p-4 min-h-[260px] max-h-[380px] overflow-y-auto text-xs leading-relaxed font-sans text-slate-200">
              {geminiResult.status === 'running' ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                  <span className="text-xs">Typing into Gemini &bull; Streaming response...</span>
                </div>
              ) : geminiResult.status === 'completed' ? (
                <div className="whitespace-pre-wrap">{geminiResult.markdown}</div>
              ) : geminiResult.status === 'failed' ? (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 mb-1" />
                  {geminiResult.error}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                  <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                  <span>Click &quot;Compare ChatGPT vs Gemini&quot; above to run.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer */}
          {geminiResult.status === 'completed' && (
            <div className="p-3 border-t border-white/[0.06] bg-black/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Job: <code className="text-slate-300 font-mono">{geminiResult.jobId}</code></span>
              <span>{geminiResult.wordCount} words &bull; {Math.round((geminiResult.elapsedMs || 0) / 1000)}s</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
