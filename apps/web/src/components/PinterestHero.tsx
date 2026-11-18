'use client';

import React from 'react';
import { Sparkles, ArrowUpRight, Zap, Play, ShieldCheck, Heart, Share2, Layers } from 'lucide-react';

interface PinterestHeroProps {
  onScrollToRunner: () => void;
  onSendPing: () => void;
  isPinging: boolean;
  latencyMs?: number;
}

export function PinterestHero({
  onScrollToRunner,
  onSendPing,
  isPinging,
  latencyMs,
}: PinterestHeroProps) {
  return (
    <section className="relative pt-10 pb-8 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-500/15 via-indigo-500/10 to-rose-500/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          {/* Aesthetic Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] backdrop-blur-xl shadow-lg shadow-black/20 group hover:border-sky-400/30 transition-all cursor-default">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-sky-400 to-rose-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">
              Curate, Script &amp; Direct SaaS Content with Your Own Real AI Logins
            </span>
            <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
              No API Fees
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Craft studio-grade SaaS content using{' '}
            <span className="bg-gradient-to-r from-sky-300 via-indigo-200 to-rose-300 bg-clip-text text-transparent">
              your own real AI sessions.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
            No API limits. No synthetic bot bans. SaaS Content Studio turns your logged-in sessions of{' '}
            <span className="text-slate-200 font-medium">ChatGPT</span>,{' '}
            <span className="text-slate-200 font-medium">Gemini</span>, and{' '}
            <span className="text-slate-200 font-medium">Google Flow</span> into an autonomous content production line — with human-in-the-loop control.
          </p>

          {/* Floating Pill Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="pin-badge flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Human Typing Jitter (85ms)
            </span>
            <span className="pin-badge flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-purple-400" /> Google Flow Video Storyboarding
            </span>
            <span className="pin-badge flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Credential Storage
            </span>
            <span className="pin-badge flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> GitHub &amp; Docs Auto-Ingest
            </span>
          </div>

          {/* Main Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              onClick={onSendPing}
              disabled={isPinging}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-sm transition-all duration-200 shadow-xl shadow-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-sky-600 ${isPinging ? 'animate-bounce' : ''}`} />
              <span>{isPinging ? 'Testing Round Trip...' : 'Test Extension Ping (Step 1)'}</span>
              {latencyMs !== undefined && (
                <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                  {latencyMs}ms
                </span>
              )}
            </button>

            <button
              onClick={onScrollToRunner}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <span>Explore Studio Controls &amp; Roadmap</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
