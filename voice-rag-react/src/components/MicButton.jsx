/**
 * MicButton.jsx
 * -------------
 * The central voice interaction button.
 * States:
 *   idle       — glowing gradient ring, mic icon
 *   listening  — pulsing animation, stop icon
 *   speaking   — wave animation, stop icon
 *   disabled   — greyed out (non-Chrome browser)
 *
 * Props:
 *   isListening:  boolean
 *   isSpeaking:   boolean
 *   disabled:     boolean
 *   onClick:      function
 */

import React from 'react';

export default function MicButton({ isListening, isSpeaking, disabled, onClick }) {
  const active = isListening || isSpeaking;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled    ? 'Use Chrome or Edge for voice' :
        isSpeaking  ? 'Click to stop speaking' :
        isListening ? 'Click to stop listening' :
        'Click to speak'
      }
      style={{
        ...styles.btn,
        ...(disabled ? styles.btnDisabled : {}),
        ...(active   ? styles.btnActive   : {}),
      }}
    >
      {/* Pulse ring — shows only when listening */}
      {isListening && <span style={styles.ring} />}

      {/* Icon */}
      {isSpeaking ? (
        /* Speaking — wave bars */
        <div style={styles.waveWrap}>
          {[0.0, 0.1, 0.2, 0.15, 0.05].map((delay, i) => (
            <span key={i} style={{ ...styles.wavebar, animationDelay: `${delay}s` }} />
          ))}
        </div>
      ) : isListening ? (
        /* Listening — stop square */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
          <rect x="4" y="4" width="16" height="16" rx="3"/>
        </svg>
      ) : (
        /* Idle — mic icon */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3"
                fill={disabled ? '#555' : '#fff'}/>
          <path d="M5 10a7 7 0 0 0 14 0" stroke={disabled ? '#555' : '#fff'}
                strokeWidth="2" strokeLinecap="round" fill="none"/>
          <line x1="12" y1="20" x2="12" y2="23"
                stroke={disabled ? '#555' : '#fff'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="8"  y1="23" x2="16" y2="23"
                stroke={disabled ? '#555' : '#fff'} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

const styles = {
  btn: {
    position: 'relative',
    flexShrink: 0,
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7b68f7, #00d49a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, opacity 0.15s',
    outline: 'none',
  },
  btnActive: {
    animation: 'pulse-ring 1.2s ease-out infinite',
  },
  btnDisabled: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    cursor: 'not-allowed',
    opacity: 0.45,
  },
  ring: {
    position: 'absolute',
    inset: -4,
    borderRadius: '50%',
    border: '2px solid rgba(123,104,247,0.5)',
    animation: 'pulse-ring 1s ease-out infinite',
    pointerEvents: 'none',
  },
  waveWrap: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
    height: 20,
  },
  wavebar: {
    display: 'inline-block',
    width: 3,
    height: 14,
    borderRadius: 2,
    background: '#fff',
    animation: 'wave5 0.8s ease-in-out infinite',
    transformOrigin: 'center',
  },
};
