/**
 * InputBar.jsx
 * ------------
 * Bottom bar containing:
 *   - MicButton (voice input)
 *   - Text input field
 *   - Send button
 *   - Status line (transcript / status text)
 *   - New conversation button
 *
 * Props:
 *   isListening, isSpeaking, speechSupported: from useSpeech
 *   transcript:  string — live transcript shown under input
 *   statusText:  string — status shown under input
 *   isLoading:   boolean — disable inputs while waiting for response
 *   onMicClick:  function
 *   onSend:      function(text: string)
 *   onNewChat:   function
 */

import React, { useState } from 'react';
import MicButton from './MicButton';

export default function InputBar({
  isListening,
  isSpeaking,
  speechSupported,
  transcript,
  statusText,
  isLoading,
  onMicClick,
  onSend,
  onNewChat,
}) {
  const [inputVal, setInputVal] = useState('');

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || isLoading) return;
    setInputVal('');
    onSend(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show live transcript in the input box while listening
  React.useEffect(() => {
    if (isListening && transcript) {
      setInputVal(transcript);
    }
  }, [isListening, transcript]);

  const subLine = isListening  ? `🎙 ${transcript || 'Listening…'}` :
                  isSpeaking   ? 'Assistant is speaking… click mic to stop.' :
                  statusText;

  return (
    <div style={styles.wrap}>
      {/* Main input row */}
      <div style={styles.row}>
        <MicButton
          isListening={isListening}
          isSpeaking={isSpeaking}
          disabled={!speechSupported}
          onClick={onMicClick}
        />

        <input
          style={styles.input}
          type="text"
          placeholder="Type a message or click the mic…"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
        />

        <button
          style={{
            ...styles.sendBtn,
            ...((!inputVal.trim() || isLoading) ? styles.sendBtnDisabled : {}),
          }}
          onClick={handleSend}
          disabled={!inputVal.trim() || isLoading}
          title="Send"
        >
          {isLoading ? (
            <span style={styles.spinner} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2"
                    strokeLinejoin="round" fill="none"/>
            </svg>
          )}
        </button>
      </div>

      {/* Status / transcript line */}
      <div style={styles.subLine}>{subLine}</div>

      {/* New conversation */}
      <button style={styles.newChatBtn} onClick={onNewChat}>
        + New conversation
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    flexShrink: 0,
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border-dim)',
    padding: '14px 20px 16px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    maxWidth: 820,
    margin: '0 auto',
  },
  input: {
    flex: 1,
    height: 46,
    background: 'var(--bg-input)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--r-full)',
    padding: '0 18px',
    fontSize: 14,
    fontFamily: 'var(--font-ui)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    flexShrink: 0,
    width: 46,
    height: 46,
    borderRadius: '50%',
    border: '1px solid var(--border-mid)',
    background: 'var(--bg-elevated)',
    color: 'var(--accent-teal)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
  },
  sendBtnDisabled: {
    color: 'var(--text-tertiary)',
    cursor: 'not-allowed',
    opacity: 0.45,
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid var(--border-mid)',
    borderTopColor: 'var(--accent-teal)',
    animation: 'spin 0.7s linear infinite',
  },
  subLine: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
    marginTop: 8,
    minHeight: 18,
    maxWidth: 820,
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  newChatBtn: {
    display: 'block',
    margin: '8px auto 0',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    padding: '4px 14px',
    borderRadius: 'var(--r-full)',
    border: '1px solid var(--border-dim)',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    letterSpacing: '0.3px',
  },
};
