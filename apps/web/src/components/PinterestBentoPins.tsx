'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  Heart, 
  Bookmark, 
  Share2, 
  ExternalLink, 
  Layers, 
  Cpu, 
  Video, 
  FileText, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight,
  Eye,
  GitBranch
} from 'lucide-react';

interface PinterestBentoPinsProps {
  filter: string;
  onSendPing: () => void;
}

export function PinterestBentoPins({ filter, onSendPing }: PinterestBentoPinsProps) {
  const [savedPins, setSavedPins] = useState<Record<string, boolean>>({
    'pin-1': true,
    'pin-2': false,
    'pin-3': true,
    'pin-4': false,
  });

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    'pin-1': 342,
    'pin-2': 519,
    'pin-3': 288,
    'pin-4': 764,
    'pin-5': 195,
  });

  const toggleSave = (pinId: string) => {
    setSavedPins((prev) => ({ ...prev, [pinId]: !prev[pinId] }));
  };

  const toggleLike = (pinId: string) => {
    setLikeCounts((prev) => ({
      ...prev,
      [pinId]: (prev[pinId] || 0) + 1,
    }));
  };

  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <Sparkles className="w-3.5 h-3.5" /> Curated Studio Inspirations &amp; Outputs
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              What SaaS Content Studio Orchestrates
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Pins generated from real browser sessions of ChatGPT, Gemini, and Google Flow — with zero API costs.
          </p>
        </div>

        {/* Pinterest Masonry / Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* PIN 1: Google Flow Video Storyboard (Tall Visual Pin) */}
          {(filter === 'all' || filter === 'flow') && (
            <div className="glass-card rounded-3xl overflow-hidden flex flex-col group relative border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300">
              {/* Visual Cover simulating Video Storyboard */}
              <div className="relative aspect-[9/12] w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 p-5 flex flex-col justify-between">
                {/* Background visual graphics */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.4),transparent_60%)]" />
                
                {/* Floating Top Bar */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-purple-300 backdrop-blur-md border border-purple-500/30">
                    <Video className="w-3.5 h-3.5" /> Google Flow Video (9:16)
                  </span>
                  <button
                    onClick={() => toggleSave('pin-1')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      savedPins['pin-1'] ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={savedPins['pin-1'] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Simulated 4-Scene Flow Storyboard */}
                <div className="relative z-10 space-y-2.5 my-auto">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Pipeline: Brief &rarr; Script &rarr; 4 Flow Scenes
                  </div>
                  
                  {/* Scene 1 */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-purple-400 font-bold uppercase">Scene 01 &bull; 0:00 - 0:06</div>
                      <div className="text-xs text-white font-medium line-clamp-1">Neon terminal code typing with human jitter</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Rendered</span>
                  </div>

                  {/* Scene 2 */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-purple-400 font-bold uppercase">Scene 02 &bull; 0:06 - 0:14</div>
                      <div className="text-xs text-white font-medium line-clamp-1">API bill dropping from $1,200 to $0.00</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Rendered</span>
                  </div>

                  {/* Scene 3 */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-purple-400 font-bold uppercase">Scene 03 &bull; 0:14 - 0:22</div>
                      <div className="text-xs text-white font-medium line-clamp-1">Side-by-side ChatGPT &amp; Gemini response comparison</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">Ready</span>
                  </div>

                  {/* Scene 4 */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-purple-400 font-bold uppercase">Scene 04 &bull; 0:22 - 0:30</div>
                      <div className="text-xs text-white font-medium line-clamp-1">SaaS Content Studio logo reveal &amp; Call to Action</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Queued</span>
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>30-sec Short Video</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">1080p MP4</span>
                </div>
              </div>

              {/* Pin Details */}
              <div className="p-5 space-y-3 bg-[#0a0f1d]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    SaaS Launch Teaser &bull; Flow AI Video
                  </h3>
                  <button
                    onClick={() => toggleLike('pin-1')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{likeCounts['pin-1']}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generated via <span className="text-purple-300 font-medium">labs.google/flow</span> using the extension's human-session adapter. Automatically polled and downloaded as MP4.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="pin-badge text-[10px]">#GoogleFlow</span>
                  <span className="pin-badge text-[10px]">#VideoScript</span>
                  <span className="pin-badge text-[10px]">#Step6Adapter</span>
                </div>
              </div>
            </div>
          )}

          {/* PIN 2: ChatGPT Launch Thread (Editorial Code Pin) */}
          {(filter === 'all' || filter === 'chatgpt') && (
            <div className="glass-card rounded-3xl overflow-hidden flex flex-col group relative border border-sky-500/20 hover:border-sky-400/50 transition-all duration-300">
              <div className="p-5 bg-gradient-to-br from-slate-900 to-[#080d1a] border-b border-white/[0.06] flex flex-col justify-between h-[360px]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    <Terminal className="w-3.5 h-3.5" /> ChatGPT 4o &bull; Launch Thread
                  </span>
                  <button
                    onClick={() => toggleSave('pin-2')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      savedPins['pin-2'] ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={savedPins['pin-2'] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Realistic Markdown Snippet */}
                <div className="my-auto font-mono text-[11px] bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-slate-300 space-y-2 overflow-hidden leading-relaxed shadow-inner">
                  <div className="text-sky-400 font-bold"># 🚀 We stopped paying $1.2k/mo for LLM APIs.</div>
                  <div className="text-slate-400">
                    Instead, we built an engine that runs our own ChatGPT Plus session like a senior copywriter:
                  </div>
                  <div className="text-emerald-400">
                    &bull; 100% realistic human keystroke jitter<br />
                    &bull; Auto-attaches product manuals and repo docs<br />
                    &bull; Clean Markdown extracted with Turndown
                  </div>
                  <div className="text-purple-400 font-medium">
                    &gt; Zero rate limits. Zero degraded models.
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Realistic Typing Delays
                  </span>
                  <span className="font-mono text-slate-500">1,420 words</span>
                </div>
              </div>

              {/* Pin Details */}
              <div className="p-5 space-y-3 bg-[#0a0f1d]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                    Viral X/Twitter Launch Thread
                  </h3>
                  <button
                    onClick={() => toggleLike('pin-2')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{likeCounts['pin-2']}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generated via <span className="text-sky-300 font-medium">chatgpt.com</span> session. Turndown DOM parsing converts rich responses to GitHub-flavored markdown.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="pin-badge text-[10px]">#ChatGPT</span>
                  <span className="pin-badge text-[10px]">#XThread</span>
                  <span className="pin-badge text-[10px]">#TurndownMD</span>
                </div>
              </div>
            </div>
          )}

          {/* PIN 3: Gemini Deep Product Brief (Multi-source Synthesis Pin) */}
          {(filter === 'all' || filter === 'gemini') && (
            <div className="glass-card rounded-3xl overflow-hidden flex flex-col group relative border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300">
              <div className="p-5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-[#080d1a] border-b border-white/[0.06] flex flex-col justify-between h-[360px]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <FileText className="w-3.5 h-3.5" /> Gemini 1.5 &bull; Product Brief
                  </span>
                  <button
                    onClick={() => toggleSave('pin-3')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      savedPins['pin-3'] ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={savedPins['pin-3'] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Ingested Source Badges */}
                <div className="my-auto space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Auto-Ingested Sources (4 streams)
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] flex items-center justify-between">
                      <span className="text-slate-300 font-mono truncate max-w-[180px]">github.com/saas-repo/README.md</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">GitHub API</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] flex items-center justify-between">
                      <span className="text-slate-300 font-mono truncate max-w-[180px]">https://docs.saas.io/pricing</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Readability</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] flex items-center justify-between">
                      <span className="text-slate-300 font-mono truncate max-w-[180px]">User_Onboarding_Manual.pdf</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">PDF Upload</span>
                    </div>
                  </div>

                  {/* Synthesized One-Liner */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200">
                    <span className="font-bold text-white">Synthesized USP:</span> The only content suite operating natively through your existing browser seats.
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span className="text-emerald-400 font-medium">9 Product Dimensions</span>
                  <span className="text-slate-500 font-mono">gemini.google.com</span>
                </div>
              </div>

              {/* Pin Details */}
              <div className="p-5 space-y-3 bg-[#0a0f1d]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    Multi-Source Product Brief
                  </h3>
                  <button
                    onClick={() => toggleLike('pin-3')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{likeCounts['pin-3']}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesizes GitHub repos, documentation websites, PDFs, and manual notes into an authoritative Product Brief with provenance tracking.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="pin-badge text-[10px]">#GeminiPro</span>
                  <span className="pin-badge text-[10px]">#ProductBrief</span>
                  <span className="pin-badge text-[10px]">#Step4Ingestion</span>
                </div>
              </div>
            </div>
          )}

          {/* PIN 4: Human-Session Architecture (Tech Pin) */}
          {(filter === 'all' || filter === 'runner') && (
            <div className="glass-card rounded-3xl overflow-hidden flex flex-col group relative border border-sky-500/20 hover:border-sky-400/50 transition-all duration-300">
              <div className="p-5 bg-gradient-to-br from-slate-900 to-[#070b14] border-b border-white/[0.06] flex flex-col justify-between h-[360px]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    <Cpu className="w-3.5 h-3.5" /> Manifest V3 Engine
                  </span>
                  <button
                    onClick={() => toggleSave('pin-4')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      savedPins['pin-4'] ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={savedPins['pin-4'] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Visual Architecture Diagram */}
                <div className="my-auto space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Target Session</span>
                      <span className="text-emerald-400 font-bold font-mono">Real Chrome Tab (Visible)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Service Worker</span>
                      <span className="text-sky-300 font-mono">Job Runner &bull; MV3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Manual Takeover</span>
                      <span className="text-amber-400 font-bold font-mono">1-Click Pause</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Fallback Strategy</span>
                      <span className="text-purple-300 font-mono">AI DOM Locator</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-xs text-sky-300">
                    <span>Round-trip Ping (Step 1):</span>
                    <button
                      onClick={onSendPing}
                      className="px-2 py-0.5 rounded bg-sky-400 text-slate-950 font-bold text-[10px] hover:bg-sky-300 transition-colors cursor-pointer"
                    >
                      Fire Ping
                    </button>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span className="text-sky-400 font-medium">Zero Headless Flags</span>
                  <span className="text-slate-500 font-mono">externally_connectable</span>
                </div>
              </div>

              {/* Pin Details */}
              <div className="p-5 space-y-3 bg-[#0a0f1d]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                    Human Session Orchestrator
                  </h3>
                  <button
                    onClick={() => toggleLike('pin-4')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{likeCounts['pin-4']}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controls web ChatGPT, Gemini and Flow tabs in your existing browser profile without ever exposing or saving credentials.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="pin-badge text-[10px]">#ManifestV3</span>
                  <span className="pin-badge text-[10px]">#HumanDelays</span>
                  <span className="pin-badge text-[10px]">#ZeroAPICost</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
