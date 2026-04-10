/**
 * Header.jsx
 * ----------
 * Top bar showing the app name and live backend status badge.
 * Props:
 *   status: 'connecting' | 'ready' | 'error'
 *   modelName: string  (e.g. "llama3.2:3b")
 */

import React from 'react';

const STATUS_CONFIG = {
  connecting: { dot: '#f0a832', label: 'Connecting…' },
  ready:      { dot: '#00d49a', label: null },   // label set from modelName
  error:      { dot: '#f06060', label: 'Backend offline' },
};

export default function Header({ status, modelName }) {
  const cfg   = STATUS_CONFIG[status] || STATUS_CONFIG.connecting;
  const label = status === 'ready' && modelName ? `${modelName} · Ready` : cfg.label;

  return (
    <header style={styles.header}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  fill="rgba(123,104,247,0.25)" stroke="#7b68f7" strokeWidth="1.5"/>
            <path d="M8 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"
                  fill="#00d49a"/>
            <path d="M12 8v2M12 14v2M8 12H6M18 12h-2"
                  stroke="#7b68f7" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={styles.logoName}>Voice RAG Assistant</div>
          <div style={styles.logoSub}>Ollama · ChromaDB · 100% Free</div>
        </div>
      </div>

      {/* Status badge */}
      <div style={styles.badge}>
        <span style={{ ...styles.dot, background: cfg.dot }} />
        <span style={styles.badgeText}>{label}</span>
      </div>
    </header>
  );
}

const styles = {
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-dim)',
    gap: 12,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoName: {
    fontFamily: 'var(--font-ui)',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.2px',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-tertiary)',
    marginTop: 1,
    letterSpacing: '0.4px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--r-full)',
    padding: '5px 12px',
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s',
  },
  badgeText: {
    fontSize: 11,
  },
};
