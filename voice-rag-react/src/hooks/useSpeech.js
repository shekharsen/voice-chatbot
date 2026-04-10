/**
 * useSpeech.js
 * ------------
 * Custom React hook that wraps both:
 *   - SpeechRecognition  (mic → text,  STT)
 *   - SpeechSynthesis    (text → voice, TTS)
 *
 * Returns an object the App component uses to:
 *   - startListening / stopListening
 *   - speak(text) / stopSpeaking
 *   - isListening, isSpeaking, transcript, speechSupported
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useSpeech({ onFinalTranscript }) {
  const recognitionRef  = useRef(null);
  const [isListening,   setIsListening]   = useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [transcript,    setTranscript]    = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  /* ── Detect browser support on mount ──────────────────────────────────── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SR();
    rec.lang             = 'en-US';
    rec.interimResults   = true;
    rec.continuous       = false;
    rec.maxAlternatives  = 1;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = final || interim;
      setTranscript(current);

      // Fire callback when a complete sentence is detected
      if (final.trim()) {
        onFinalTranscript(final.trim());
      }
    };

    rec.onerror = (e) => {
      const msg =
        e.error === 'no-speech'    ? 'No speech detected — try again.' :
        e.error === 'not-allowed'  ? 'Mic blocked. Check Chrome permissions.' :
        `Speech error: ${e.error}`;
      setTranscript(msg);
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;

    // Warm up voices list (Chrome loads it async)
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, [onFinalTranscript]);


  /* ── Start mic ─────────────────────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setTranscript('');
    } catch {
      // Already running — stop and restart
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current.start(), 250);
    }
  }, []);


  /* ── Stop mic ──────────────────────────────────────────────────────────── */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);


  /* ── Speak text ────────────────────────────────────────────────────────── */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel anything currently playing
    window.speechSynthesis.cancel();

    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = 'en-US';
    utt.rate    = 0.93;
    utt.pitch   = 1.0;

    // Prefer a natural-sounding Google voice if available
    const voices  = window.speechSynthesis.getVoices();
    const pick    = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
                 || voices.find(v => v.lang.startsWith('en'));
    if (pick) utt.voice = pick;

    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    // Small delay — Chrome needs a tick after cancel()
    setTimeout(() => window.speechSynthesis.speak(utt), 80);
  }, []);


  /* ── Stop speaking ─────────────────────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);


  return {
    isListening,
    isSpeaking,
    transcript,
    speechSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript,
  };
}
