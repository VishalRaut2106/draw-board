import { useState, useEffect } from 'react';
import { canvasClient } from '../bridge/canvas-client';

export function BridgeStatus() {
  const [state, setState] = useState({
    status: canvasClient.status,
    sessionId: canvasClient.sessionId,
    lastOperation: canvasClient.lastOperation,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = canvasClient.subscribe((newState) => {
      setState({
        status: newState.status,
        sessionId: newState.sessionId,
        lastOperation: newState.lastOperation,
      });
    });
    return () => unsubscribe();
  }, []);

  const isConnected = state.status === 'connected';
  const isConnecting = state.status === 'connecting';

  const dotColor = isConnected
    ? '#10b981' // green
    : isConnecting
    ? '#f59e0b' // amber
    : '#ef4444'; // red

  const statusLabel = isConnected
    ? 'MCP Bridge: Active'
    : isConnecting
    ? 'MCP Bridge: Connecting...'
    : 'MCP Bridge: Offline';

  return (
    <aside
      aria-label="MCP Bridge Status"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 50,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#e2e8f0',
        userSelect: 'none',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(24, 24, 27, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '9999px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Click to view MCP Bridge details"
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>{statusLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.6,
          }}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </div>

      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '0',
            width: '260px',
            padding: '12px 14px',
            background: 'rgba(20, 20, 24, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
              Antigravity Bridge
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: dotColor,
                fontWeight: 600,
              }}
            >
              {state.status}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            <div>
              <span style={{ color: '#64748b' }}>Session: </span>
              <code style={{ background: '#27272a', padding: '1px 4px', borderRadius: '3px' }}>
                {state.sessionId}
              </code>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ color: '#64748b' }}>Endpoint: </span>
              <span style={{ color: '#93c5fd' }}>ws://127.0.0.1:4444</span>
            </div>
          </div>

          {state.lastOperation && (
            <div
              style={{
                marginTop: '4px',
                padding: '6px 8px',
                background: state.lastOperation.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${state.lastOperation.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ color: state.lastOperation.success ? '#34d399' : '#f87171', fontWeight: 500 }}>
                {state.lastOperation.operation}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                {new Date(state.lastOperation.timestamp).toLocaleTimeString()}
                {state.lastOperation.error && ` — ${state.lastOperation.error}`}
              </div>
            </div>
          )}

          {!isConnected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                canvasClient.connect();
              }}
              style={{
                marginTop: '4px',
                padding: '6px 10px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Connect to MCP Server
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
