import React, { useState, useEffect } from 'react';
import { Play, Pause, ExternalLink, RefreshCw, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface LogItem {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  details?: any;
}

interface ExtensionState {
  isPaused: boolean;
  activeJob: any;
  queueLength: number;
  logs: LogItem[];
  extensionId: string;
  version: string;
}

export default function App() {
  const [state, setState] = useState<ExtensionState>({
    isPaused: false,
    activeJob: null,
    queueLength: 0,
    logs: [],
    extensionId: '',
    version: '0.1.0',
  });
  const [loading, setLoading] = useState(true);

  const fetchState = () => {
    chrome.runtime.sendMessage({ type: 'GET_INTERNAL_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(chrome.runtime.lastError);
        return;
      }
      if (response) {
        setState((prev) => ({ ...prev, ...response }));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);

    const messageListener = (msg: any) => {
      if (msg.type === 'SCS_INTERNAL_EVENT_LOG' && msg.log) {
        setState((prev) => ({
          ...prev,
          logs: [msg.log, ...prev.logs.slice(0, 99)],
        }));
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      clearInterval(interval);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const togglePause = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_PAUSE' }, (res) => {
      if (res) {
        setState((prev) => ({ ...prev, isPaused: res.isPaused }));
      }
    });
  };

  const clearLogs = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' }, () => {
      setState((prev) => ({ ...prev, logs: [] }));
    });
  };

  const openWebDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  };

  return (
    <div style={{ padding: '16px', maxWidth: '420px', margin: '0 auto', fontSize: '13px', lineHeight: '1.4' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={18} /> SaaS Content Studio
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Browser Automation Extension v{state.version}</div>
        </div>
        <button
          onClick={openWebDashboard}
          title="Open Web Dashboard"
          style={{
            background: '#1e293b',
            border: '1px solid #475569',
            color: '#f8fafc',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
        >
          <ExternalLink size={12} /> Dashboard
        </button>
      </div>

      {/* Runner Status Banner */}
      <div
        style={{
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: state.isPaused ? '#451a03' : state.activeJob ? '#1e3a8a' : '#064e3b',
          border: `1px solid ${state.isPaused ? '#d97706' : state.activeJob ? '#3b82f6' : '#10b981'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            {state.isPaused ? (
              <>
                <AlertTriangle size={16} color="#fbbf24" />
                <span style={{ color: '#fbbf24' }}>MANUAL TAKEOVER ACTIVE</span>
              </>
            ) : state.activeJob ? (
              <>
                <RefreshCw size={16} color="#60a5fa" className="spin" />
                <span style={{ color: '#93c5fd' }}>JOB IN PROGRESS</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ color: '#6ee7b7' }}>RUNNER READY & LISTENING</span>
              </>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#cbd5e1', padding: '2px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
            {state.isPaused ? 'Paused' : 'Active'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
          {state.isPaused
            ? 'Execution is paused. You can log in, solve challenges, or inspect pages. Click Resume to re-enable automation.'
            : 'Ready to receive prompt jobs from the local web dashboard.'}
        </p>
      </div>

      {/* Manual Takeover Controls */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={togglePause}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            backgroundColor: state.isPaused ? '#10b981' : '#f59e0b',
            color: '#0f172a',
          }}
        >
          {state.isPaused ? (
            <>
              <Play size={16} /> Resume Control
            </>
          ) : (
            <>
              <Pause size={16} /> Pause / Take Over Control
            </>
          )}
        </button>
      </div>

      {/* Quick Info & Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Queue</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{state.queueLength}</div>
        </div>
        <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Job</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: state.activeJob ? '#38bdf8' : '#64748b', marginTop: '4px' }}>
            {state.activeJob ? state.activeJob.targetSite : 'None'}
          </div>
        </div>
      </div>

      {/* Extension Info */}
      <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#38bdf8', fontWeight: 600, fontSize: '12px' }}>
          <ShieldCheck size={14} /> Extension ID
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            background: '#0f172a',
            padding: '6px 8px',
            borderRadius: '4px',
            color: '#cbd5e1',
            wordBreak: 'break-all',
            border: '1px solid #334155',
            userSelect: 'all',
          }}
        >
          {state.extensionId || 'Loading...'}
        </div>
      </div>

      {/* Live Log Stream */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live Event Stream
          </div>
          <button
            onClick={clearLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
            }}
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
        <div
          style={{
            background: '#090d16',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          {state.logs.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: '16px 0' }}>No events recorded yet. Send a Ping from the Web App.</div>
          ) : (
            state.logs.map((log) => (
              <div key={log.id} style={{ marginBottom: '6px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '10px' }}>
                  <span style={{ color: log.type === 'ping' ? '#38bdf8' : log.type === 'user' ? '#f59e0b' : '#a855f7' }}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ color: '#e2e8f0', marginTop: '2px' }}>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
