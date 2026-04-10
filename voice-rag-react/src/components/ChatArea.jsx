/**
 * ChatArea.jsx
 * ------------
 * Scrollable container that renders all message bubbles.
 * Auto-scrolls to the latest message.
 *
 * Props:
 *   messages:   Array<{ id, role, text, sources }>
 *   isThinking: boolean — show animated thinking dots
 */

import React, { useEffect, useRef } from 'react';
import MessageBubble, { ThinkingBubble } from './MessageBubble';

const HINTS = [
  'What is the return policy?',
  'How long does delivery take?',
  'What payment methods do you accept?',
  'How do I contact customer support?',
];

export default function ChatArea({ messages, isThinking, onHint }) {
  const bottomRef = useRef(null);

  // Auto-scroll whenever a new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const showHints = messages.length <= 1;

  return (
    <div style={styles.area}>
      {/* Message list */}
      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          text={msg.text}
          sources={msg.sources || []}
        />
      ))}

      {/* Thinking indicator */}
      {isThinking && <ThinkingBubble />}

      {/* Hint chips — shown only at start of conversation */}
      {showHints && !isThinking && (
        <div style={styles.hintWrap}>
          {HINTS.map((h, i) => (
            <button key={i} style={styles.hint} onClick={() => onHint(h)}>
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  area: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    scrollBehavior: 'smooth',
  },
  hintWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginTop: 8,
    animation: 'fadeUp 0.3s ease',
  },
  hint: {
    fontSize: 12,
    padding: '5px 14px',
    borderRadius: 'var(--r-full)',
    border: '1px solid var(--border-mid)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.15s, color 0.15s',
  },
};
