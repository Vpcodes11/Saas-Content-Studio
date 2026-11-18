'use client';

import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Table2 } from 'lucide-react';

interface DbHealthData {
  status: string;
  database: string;
  workspaceCount: number;
  defaultWorkspace: { id: string; name: string; created_at: number } | null;
  timestamp: number;
}

export function DatabaseHealthCard({ onStatusChange }: { onStatusChange?: (ok: boolean) => void }) {
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
    { name: 'workspaces', desc: 'User & team boundary isolation' },
    { name: 'products', desc: 'Tracked SaaS applications' },
    { name: 'sources', desc: 'GitHub repos, URLs, uploads, notes' },
    { name: 'product_briefs', desc: 'Synthesized facts & positioning' },
    { name: 'content_templates', desc: 'Prompts, formats & tone configs' },
    { name: 'jobs', desc: 'Extension execution queue & logs' },
    { name: 'generations', desc: 'Generated content library' },
  ];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Database & Drizzle Schema</h2>
            <p className="text-sm text-slate-400">Postgres-compatible SQLite schema ready for local & cloud production</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh database status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            Validating SQLite database connection...
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
              <AlertCircle className="w-4 h-4" /> Database error
            </div>
            {error}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 mb-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> SQLite database active & schema synchronized
              </div>
              <div className="text-slate-400">
                Workspace: <span className="font-mono text-slate-200">{data?.defaultWorkspace?.name || 'default'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Table2 className="w-3.5 h-3.5" /> Initialized Schema Tables ({tables.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {tables.map((t) => (
                  <div key={t.name} className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-mono font-semibold text-slate-200">{t.name}</div>
                      <div className="text-slate-500 text-[11px]">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
