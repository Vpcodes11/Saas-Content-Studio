'use client';

import React, { useState } from 'react';
import { PinterestHeader } from '@/components/PinterestHeader';
import { PinterestHero } from '@/components/PinterestHero';
import { PinterestBentoPins } from '@/components/PinterestBentoPins';
import { ChatGPTLiveRunner } from '@/components/ChatGPTLiveRunner';
import { ExtensionStudioDeck } from '@/components/ExtensionStudioDeck';
import { DatabaseStudioCard } from '@/components/DatabaseStudioCard';
import { AestheticRoadmap } from '@/components/AestheticRoadmap';
import { useExtension } from '@/hooks/useExtension';
import { Sparkles, Heart, Terminal, Compass, Layers } from 'lucide-react';

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
  const [activeFilter, setActiveFilter] = useState('all');

  const scrollToRunner = () => {
    const el = document.getElementById('extension-runner-deck');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilterSelect = (filterId: string) => {
    setActiveFilter(filterId);
    if (filterId === 'runner') {
      scrollToRunner();
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Pinterest Navigation */}
      <PinterestHeader
        extensionStatus={extensionStatus}
        extensionVersion={extensionVersion}
        dbOk={dbOk}
        activeFilter={activeFilter}
        onSelectFilter={handleFilterSelect}
        onSendPing={() => sendPing()}
        isPinging={isPinging}
        latencyMs={lastPingResult?.latencyMs}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
        {/* Pinterest Hero Section */}
        <PinterestHero
          onScrollToRunner={scrollToRunner}
          onSendPing={() => sendPing()}
          isPinging={isPinging}
          latencyMs={lastPingResult?.latencyMs}
        />

        {/* Bento / Masonry Inspiration Pins (Flow, ChatGPT, Gemini, Engine) */}
        <PinterestBentoPins
          filter={activeFilter}
          onSendPing={() => sendPing()}
        />

        {/* Step 2: ChatGPT Adapter End-to-End Runner */}
        <section className="space-y-4 pt-2">
          <ChatGPTLiveRunner
            extensionId={extensionId}
            extensionStatus={extensionStatus}
          />
        </section>

        {/* Core Step 1 Engine Deck (Hardware/Console Styled) */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
                <Terminal className="w-3.5 h-3.5" /> Extension Control &bull; Step 1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                Live Extension Runner &amp; Messaging Lab
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              bidirectional <code className="text-sky-300">externally_connectable</code> round trip
            </span>
          </div>

          <ExtensionStudioDeck
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
        </section>

        {/* Database Health & Phased Roadmap Deck */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <DatabaseStudioCard onStatusChange={setDbOk} />
          <AestheticRoadmap />
        </section>
      </main>

      {/* Aesthetic Studio Footer */}
      <footer className="border-t border-white/[0.06] bg-[#05070c]/80 backdrop-blur-2xl py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500" />
            <span className="font-semibold text-slate-400">SaaS Content Studio</span>
            <span>&bull;</span>
            <span>Human-Session AI Automation</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>ChatGPT (chatgpt.com)</span>
            <span>&bull;</span>
            <span>Gemini (gemini.google.com)</span>
            <span>&bull;</span>
            <span>Flow (labs.google/flow)</span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Step 1 Verified &bull; Chrome Manifest V3 &bull; Next.js 15
          </div>
        </div>
      </footer>
    </div>
  );
}
