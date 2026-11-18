'use client';

import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, MapPin } from 'lucide-react';

export function AestheticRoadmap() {
  const steps = [
    {
      num: 1,
      title: 'Monorepo & Extension Messaging Round Trip',
      desc: 'pnpm monorepo, Manifest V3 Chrome Extension, Next.js web app, bidirectional externally_connectable & bridge ping/pong, SQLite DB.',
      status: 'completed',
    },
    {
      num: 2,
      title: 'ChatGPT Adapter End-to-End',
      desc: 'Send "Say hello" from web app, automate chatgpt.com session with realistic human delays & DOM extraction, persist result into DB.',
      status: 'active',
    },
    {
      num: 3,
      title: 'Gemini Adapter + Side-by-Side Compare',
      desc: 'gemini.google.com session adapter, dual generation, split-view comparison UI.',
      status: 'pending',
    },
    {
      num: 4,
      title: 'Data Ingestion & Product Brief',
      desc: 'GitHub API crawler, @mozilla/readability doc extractor, file uploads (PDF/DOCX/MD/TXT), notes, AI-generated Product Brief.',
      status: 'pending',
    },
    {
      num: 5,
      title: 'Content Templates & Library',
      desc: 'Platform templates (blog, LinkedIn, X, video script, email, SEO), editable DB entries, generation library with tags & exports.',
      status: 'pending',
    },
    {
      num: 6,
      title: 'Google Flow Video Adapter',
      desc: 'labs.google/flow project creation, scene prompt submission, status polling, MP4 video download.',
      status: 'pending',
    },
    {
      num: 7,
      title: 'Pipelines & Reliability Suite',
      desc: 'Chained jobs (Brief -> Script -> Scenes -> Video), AI-locator fallback, selector health check, rate limiting, side-panel takeover.',
      status: 'pending',
    },
    {
      num: 8,
      title: 'Documentation & Production Polish',
      desc: 'Comprehensive README, session login guides, adapter expansion guide, packaging.',
      status: 'pending',
    },
  ];

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Phased Engineering Roadmap
              </h3>
              <p className="text-xs text-slate-400">Strict phased delivery order (Steps 1 &rarr; 8)</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Step 2 Active
          </span>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 ${
                step.status === 'active'
                  ? 'bg-sky-500/10 border-sky-400/40 shadow-sm shadow-sky-500/10'
                  : 'bg-black/30 border-white/[0.04] opacity-60 hover:opacity-90'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.status === 'active' ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px] font-mono font-bold text-slate-400">0{step.num}.</span>
                    <span className={`text-xs font-semibold truncate ${step.status === 'active' ? 'text-sky-300' : 'text-slate-300'}`}>
                      {step.title}
                    </span>
                  </div>
                  {step.status === 'active' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-400 text-slate-950 uppercase tracking-wider shrink-0">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
        <span>Current Phase: <strong className="text-emerald-400">Step 2 (ChatGPT Adapter)</strong></span>
        <span>Next: <strong className="text-slate-300">Step 3 (Gemini Adapter)</strong></span>
      </div>
    </div>
  );
}
