'use client';

import React from 'react';
import { CheckCircle2, Circle, ArrowRight, PlayCircle } from 'lucide-react';

export function BuildRoadmapCard() {
  const steps = [
    {
      num: 1,
      title: 'Monorepo Scaffold & Messaging Round Trip',
      desc: 'pnpm monorepo, Manifest V3 Chrome Extension, Next.js web app, bidirectional externally_connectable & bridge ping/pong, SQLite DB.',
      status: 'active', // completed in this step
    },
    {
      num: 2,
      title: 'ChatGPT Adapter End-to-End',
      desc: 'Send "Say hello" from web app, automate chatgpt.com session with realistic human delays & DOM extraction, persist result into DB.',
      status: 'pending',
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
      desc: 'Chained jobs (Brief -> Script -> Scenes -> Video), AI-locator fallback, selector health check, rate limiting, side panel takeover.',
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
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/40">
        <h2 className="text-lg font-semibold text-white">System Build Roadmap</h2>
        <p className="text-sm text-slate-400 mt-1">
          Strict phased development order. Step 1 is active and testable right now.
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`p-3.5 rounded-lg border transition-all flex items-start gap-3.5 ${
                step.status === 'active'
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-70'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.status === 'active' ? (
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Step {step.num}:</span>
                  <span className={`text-sm font-semibold ${step.status === 'active' ? 'text-sky-300' : 'text-slate-300'}`}>
                    {step.title}
                  </span>
                  {step.status === 'active' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 uppercase tracking-wider ml-auto">
                      Step 1 Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
