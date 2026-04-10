/**
 * Banner.jsx
 * ----------
 * Displays warning strips below the header.
 * Props:
 *   type: 'warn' | 'error'
 *   message: string | JSX
 *   visible: boolean
 */

import React from 'react';

export default function Banner({ type = 'warn', message, visible }) {
  if (!visible) return null;

  const isWarn = type === 'warn';
  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 20px',
      fontSize: 12,
      fontFamily: 'var(--font-ui)',
      lineHeight: 1.5,
      background: isWarn ? 'var(--warn-bg)'  : 'var(--err-bg)',
      borderBottom: `1px solid ${isWarn ? 'var(--warn-border)' : 'var(--err-border)'}`,
      color: isWarn ? 'var(--warn-text)' : 'var(--err-text)',
    }}>
      {isWarn ? '⚠ ' : '✕ '}{message}
    </div>
  );
}
