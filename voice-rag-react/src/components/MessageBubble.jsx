/**
 * MessageBubble.jsx
 * -----------------
 * Renders a single chat message row.
 * Props:
 *   role:    'user' | 'bot'
 *   text:    string
 *   sources: string[]   — filenames shown as chips (bot only)
 */

import React from 'react';

export default function MessageBubble({ role, text, sources = [] }) {
  const isUser = role === 'user';

  return (
    <div style={{ ...styles.row, ...(isUser ? styles.rowUser : styles.rowBot) }}>
      {/* Avatar */}
      <div style={{ ...styles.avatar, background: isUser ? '#3d2fa0' : '#003d2a' }}>
        {isUser ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#a090f7"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a090f7" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="12" rx="3" fill="#00d49a" opacity="0.3"/>
            <rect x="3" y="6" width="18" height="12" rx="3" stroke="#00d49a" strokeWidth="1.5"/>
            <circle cx="9"  cy="12" r="1.5" fill="#00d49a"/>
            <circle cx="15" cy="12" r="1.5" fill="#00d49a"/>
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        ...styles.bubble,
        ...(isUser ? styles.bubbleUser : styles.bubbleBot),
      }}>
        <p style={styles.text}>{text}</p>

        {/* Source chips — shown below bot messages */}
        {!isUser && sources.length > 0 && (
          <div style={styles.sources}>
            {sources.map((src, i) => (
              <span key={i} style={styles.chip}>📄 {src}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Thinking indicator (separate export) ────────────────────────────────── */
export function ThinkingBubble() {
  return (
    <div style={{ ...styles.row, ...styles.rowBot }}>
      <div style={{ ...styles.avatar, background: '#003d2a' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="3" fill="#00d49a" opacity="0.3"/>
          <rect x="3" y="6" width="18" height="12" rx="3" stroke="#00d49a" strokeWidth="1.5"/>
          <circle cx="9"  cy="12" r="1.5" fill="#00d49a"/>
          <circle cx="15" cy="12" r="1.5" fill="#00d49a"/>
        </svg>
      </div>
      <div style={{ ...styles.bubble, ...styles.bubbleBot, ...styles.thinkingBubble }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            ...styles.dot,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    gap: 10,
    maxWidth: '80%',
    animation: 'fadeUp 0.18s ease',
  },
  rowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  rowBot: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 3,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.65,
    fontFamily: 'var(--font-ui)',
    wordBreak: 'break-word',
  },
  bubbleUser: {
    background: '#1a1640',
    border: '1px solid rgba(123,104,247,0.2)',
    borderBottomRightRadius: 4,
    color: 'var(--text-primary)',
  },
  bubbleBot: {
    background: '#0e1a14',
    border: '1px solid rgba(0,212,154,0.15)',
    borderBottomLeftRadius: 4,
    color: 'var(--text-primary)',
  },
  thinkingBubble: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    padding: '12px 16px',
  },
  text: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  sources: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  chip: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 'var(--r-full)',
    background: 'rgba(0,212,154,0.08)',
    border: '1px solid rgba(0,212,154,0.2)',
    color: '#00d49a',
    fontFamily: 'var(--font-mono)',
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#00d49a',
    animation: 'bounce3 1.3s ease-in-out infinite',
  },
};
