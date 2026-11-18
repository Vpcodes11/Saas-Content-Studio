'use client';

import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Table2, Layers } from 'lucide-react';

interface DbHealthData {
  status: string;
  database: string;
  workspaceCount: number;
  defaultWorkspace: { id: string; name: string; created_at: number } | null;
  timestamp: number;
}

export function DatabaseStudioCard({ onStatusChange }: { onStatusChange?: (ok: boolean) => void }) {
  const [data, setData] = useState<DbHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/db-health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to reach database health endpoint`);
      }
      const json = await res.json();
      setData(json);
      onStatusChange?.(true);
    } catch (err: any) {
      setError(err.message || 'Database connection error');
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const tables = [
    { name: 'workspaces', desc: 'Team & tenant boundary isolation', icon: '🏢' },
    { name: 'products', desc: 'Tracked SaaS products & repos', icon: '📦' },
    { name: 'sources', desc: 'GitHub, Readability URLs, PDFs, Notes', icon: '📄' },
    { name: 'product_briefs', desc: 'Synthesized positioning & feature facts', icon: '✨' },
    { name: 'content_templates', desc: 'Pre-engineered multi-platform prompts', icon: '📝' },
    { name: 'jobs', desc: 'Real-session browser execution queue', icon: '⚡' },
    { name: 'generations', desc: 'Curated library of scripts & videos', icon: '🎬' },
  ];

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                SQLite &bull; Drizzle ORM Engine
              </h3>
              <p className="text-xs text-slate-400">Postgres-compatible schema with multi-workspace support</p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            title="Refresh database health"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Database Status */}
        {loading ? (
          <div className="text-slate-400 text-xs flex items-center gap-2 py-4">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Validating SQLite tables and connection...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-400 mb-1">
              <AlertCircle className="w-4 h-4" /> SQLite Connection Error
            </div>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Local SQLite Database Synchronized</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                Workspace: <strong className="text-white">{data?.defaultWorkspace?.name || 'default'}</strong>
              </span>
            </div>

            {/* Tables Grid */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Table2 className="w-3.5 h-3.5 text-sky-400" /> Initialized Drizzle Tables ({tables.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tables.map((t) => (
                  <div
                    key={t.name}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.1] transition-all flex items-start gap-2.5"
                  >
                    <span className="text-sm shrink-0">{t.icon}</span>
                    <div className="overflow-hidden">
                      <div className="font-mono text-xs font-semibold text-slate-200 truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
        <span>File: <code className="text-slate-400">scs_content_studio.db</code></span>
        <span className="text-emerald-400 font-medium">Postgres-Ready Schema</span>
      </div>
    </div>
  );
}
