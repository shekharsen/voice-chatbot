/**
 * App.jsx
 * -------
 * Root component. Owns all application state:
 *   - messages[]      — chat history rendered in ChatArea
 *   - sessionId       — backend conversation session
 *   - backendStatus   — 'connecting' | 'ready' | 'error'
 *   - modelName       — shown in header badge
 *   - isThinking      — controls thinking dots
 *   - isLoading       — disables inputs during API call
 *   - statusText      — bottom status line
 *
 * Component tree:
 *   App
 *   ├── Header
 *   ├── Banner (KB warning)
 *   ├── Banner (no-speech warning)
 *   ├── ChatArea
 *   └── InputBar
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header       from './components/Header';
import Banner       from './components/Banner';
import ChatArea     from './components/ChatArea';
import InputBar     from './components/InputBar';
import useSpeech    from './hooks/useSpeech';
import { fetchHealth, sendChat, clearSession } from './api';

let msgCounter = 0;
const makeId = () => `msg-${++msgCounter}`;

const WELCOME_MESSAGE = {
  id:      makeId(),
  role:    'bot',
  text:    'Hi! I\'m your Voice RAG Assistant, powered by free local AI.\n\nClick the mic 🎤 to speak, or type below. I\'ll search your company documents and speak the answer back to you.',
  sources: [],
};

export default function App() {
  /* ── State ──────────────────────────────────────────────────────────────── */
  const [messages,       setMessages]       = useState([WELCOME_MESSAGE]);
  const [sessionId,      setSessionId]      = useState(null);
  const [backendStatus,  setBackendStatus]  = useState('connecting');
  const [modelName,      setModelName]      = useState('');
  const [kbReady,        setKbReady]        = useState(true);
  const [isThinking,     setIsThinking]     = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [statusText,     setStatusText]     = useState('Click the mic to start speaking…');

  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  /* ── Health check on mount ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHealth();
        setBackendStatus('ready');
        setModelName(data.llm_model || 'ollama');
        setKbReady(data.kb_ready !== false);
      } catch {
        setBackendStatus('error');
        addBotMessage(
          '⚠️ Cannot reach the backend.\n\n' +
          'Make sure these are running:\n' +
          '  1. ollama serve\n' +
          '  2. uvicorn main:app --reload --port 8000\n\n' +
          'Then refresh the page.',
          []
        );
      }
    })();
  }, []);

  /* ── Speech hook ────────────────────────────────────────────────────────── */
  const handleFinalTranscript = useCallback((text) => {
    handleSend(text);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speech = useSpeech({ onFinalTranscript: handleFinalTranscript });

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function addBotMessage(text, sources = []) {
    setMessages(prev => [...prev, { id: makeId(), role: 'bot', text, sources }]);
  }

  /* ── Core send logic ────────────────────────────────────────────────────── */
  async function handleSend(text) {
    if (!text.trim() || isLoading) return;

    // Stop any active voice
    speech.stopListening();
    speech.stopSpeaking();

    // Add user message
    setMessages(prev => [...prev, { id: makeId(), role: 'user', text, sources: [] }]);
    setIsThinking(true);
    setIsLoading(true);
    setStatusText('Thinking…');

    try {
      const data = await sendChat(text, sessionRef.current);

      setSessionId(data.session_id);
      sessionRef.current = data.session_id;

      setIsThinking(false);
      addBotMessage(data.reply, data.sources || []);

      // Speak the response
      speech.speak(data.reply);
      setStatusText('Click mic for a follow-up…');

    } catch (err) {
      setIsThinking(false);
      addBotMessage(`⚠️ Error: ${err.message}`, []);
      setStatusText('Error — check the backend is running.');
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Mic button click ───────────────────────────────────────────────────── */
  function handleMicClick() {
    if (speech.isSpeaking) {
      speech.stopSpeaking();
      return;
    }
    if (speech.isListening) {
      speech.stopListening();
      return;
    }
    speech.startListening();
  }

  /* ── New conversation ───────────────────────────────────────────────────── */
  async function handleNewChat() {
    speech.stopSpeaking();
    speech.stopListening();

    if (sessionRef.current) {
      await clearSession(sessionRef.current);
    }

    setSessionId(null);
    sessionRef.current = null;
    setMessages([WELCOME_MESSAGE]);
    setStatusText('Click the mic to start speaking…');
  }

  /* ── Hint chip clicked ──────────────────────────────────────────────────── */
  function handleHint(text) {
    handleSend(text);
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={styles.app}>
      <Header status={backendStatus} modelName={modelName} />

      <Banner
        type="warn"
        visible={!kbReady && backendStatus === 'ready'}
        message={
          <>
            Knowledge base not found. Run <strong>python ingest.py</strong> first,
            then restart the backend. Answering from general LLM knowledge for now.
          </>
        }
      />

      <Banner
        type="error"
        visible={!speech.speechSupported}
        message="Voice input requires Google Chrome or Microsoft Edge. Text input still works."
      />

      <ChatArea
        messages={messages}
        isThinking={isThinking}
        onHint={handleHint}
      />

      <InputBar
        isListening={speech.isListening}
        isSpeaking={speech.isSpeaking}
        speechSupported={speech.speechSupported}
        transcript={speech.transcript}
        statusText={statusText}
        isLoading={isLoading}
        onMicClick={handleMicClick}
        onSend={handleSend}
        onNewChat={handleNewChat}
      />
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg-base)',
  },
};
